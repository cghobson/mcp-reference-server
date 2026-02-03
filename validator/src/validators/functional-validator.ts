/**
 * Functional Validator
 * Tests that tools actually work by calling them with test data
 * Test cases are generated automatically from JSON schemas
 */

import { McpTransport, McpResponse } from '../transports/base.js';
import { ValidationResult, JSONSchema } from '../types.js';
import { ONX_TOOLS, getToolInputSchema } from '@onx/schemas';

interface TestCase {
  tool: string;
  name: string;
  input: Record<string, unknown>;
  expectSuccess: boolean;
}

export class FunctionalValidator {
  private transport: McpTransport;

  constructor(transport: McpTransport) {
    this.transport = transport;
  }

  /**
   * Run functional tests for all tools
   */
  async runAllTests(): Promise<Map<string, ValidationResult[]>> {
    const results = new Map<string, ValidationResult[]>();

    for (const tool of ONX_TOOLS) {
      const toolResults = await this.runToolTests(tool);
      results.set(tool, toolResults);
    }

    return results;
  }

  /**
   * Run tests for a specific tool
   */
  async runToolTests(tool: string): Promise<ValidationResult[]> {
    const testCases = this.generateTestCases(tool);
    const results: ValidationResult[] = [];

    for (const testCase of testCases) {
      try {
        const response = await this.transport.callTool(testCase.tool, testCase.input);

        if (testCase.expectSuccess && !response.success) {
          results.push({
            passed: false,
            tool: testCase.tool,
            check: `functional-${testCase.name}`,
            message: `Expected success but got error: ${response.error?.message}`,
            details: { input: testCase.input, response },
          });
        } else if (!testCase.expectSuccess && response.success) {
          results.push({
            passed: false,
            tool: testCase.tool,
            check: `functional-${testCase.name}`,
            message: `Expected error but got success`,
            details: { input: testCase.input, response },
          });
        } else {
          results.push({
            passed: true,
            tool: testCase.tool,
            check: `functional-${testCase.name}`,
            message: `Test "${testCase.name}" passed`,
          });
        }
      } catch (error) {
        results.push({
          passed: false,
          tool: testCase.tool,
          check: `functional-${testCase.name}`,
          message: `Test threw exception: ${error instanceof Error ? error.message : String(error)}`,
          details: { input: testCase.input },
        });
      }
    }

    return results;
  }

  /**
   * Generate test cases automatically from the tool's JSON schema
   */
  private generateTestCases(tool: string): TestCase[] {
    const schema = getToolInputSchema(tool) as JSONSchema | null;
    if (!schema) {
      return [];
    }

    const testCases: TestCase[] = [];
    const required = schema.required || [];
    const properties = schema.properties || {};

    // Test 1: Empty input - should fail if there are required fields, succeed otherwise
    testCases.push({
      tool,
      name: 'empty-input',
      input: {},
      expectSuccess: required.length === 0,
    });

    // Test 2: For each required field, test with it missing
    for (const field of required) {
      const minimalValid = this.buildMinimalValidInput(schema);
      delete minimalValid[field];

      testCases.push({
        tool,
        name: `missing-required-${field}`,
        input: minimalValid,
        expectSuccess: false,
      });
    }

    // Test 3: For array fields with minItems, test with empty array
    for (const [field, propSchema] of Object.entries(properties)) {
      const prop = propSchema as JSONSchema;
      if (prop.type === 'array' && prop.minItems && prop.minItems > 0) {
        const input = this.buildMinimalValidInput(schema);
        input[field] = [];

        testCases.push({
          tool,
          name: `empty-array-${field}`,
          input,
          expectSuccess: false,
        });
      }
    }

    // Test 4: Minimal valid input - should succeed
    if (required.length > 0 || Object.keys(properties).length > 0) {
      testCases.push({
        tool,
        name: 'minimal-valid-input',
        input: this.buildMinimalValidInput(schema),
        expectSuccess: true,
      });
    }

    return testCases;
  }

  /**
   * Build a minimal valid input object based on schema requirements
   */
  private buildMinimalValidInput(schema: JSONSchema, path = ''): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const required = schema.required || [];
    const properties = schema.properties || {};

    for (const field of required) {
      const propSchema = properties[field] as JSONSchema | undefined;
      if (!propSchema) continue;

      result[field] = this.generateValueForSchema(propSchema, `${path}.${field}`);
    }

    return result;
  }

  /**
   * Generate a valid value for a given schema type
   */
  private generateValueForSchema(schema: JSONSchema, path: string): unknown {
    switch (schema.type) {
      case 'string':
        return `test-${path.replace(/\./g, '-')}`;

      case 'number':
      case 'integer':
        return schema.minimum ?? 1;

      case 'boolean':
        return true;

      case 'array': {
        const minItems = schema.minItems ?? 1;
        const itemSchema = schema.items as JSONSchema | undefined;
        if (itemSchema) {
          return Array(minItems).fill(null).map((_, i) =>
            this.generateValueForSchema(itemSchema, `${path}[${i}]`)
          );
        }
        return [];
      }

      case 'object': {
        return this.buildMinimalValidInput(schema, path);
      }

      default:
        return null;
    }
  }
}
