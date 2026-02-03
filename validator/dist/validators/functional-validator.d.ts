/**
 * Functional Validator
 * Tests that tools actually work by calling them with test data
 * Test cases are generated automatically from JSON schemas
 */
import { McpTransport } from '../transports/base.js';
import { ValidationResult } from '../types.js';
export declare class FunctionalValidator {
    private transport;
    constructor(transport: McpTransport);
    /**
     * Run functional tests for all tools
     */
    runAllTests(): Promise<Map<string, ValidationResult[]>>;
    /**
     * Run tests for a specific tool
     */
    runToolTests(tool: string): Promise<ValidationResult[]>;
    /**
     * Generate test cases automatically from the tool's JSON schema
     */
    private generateTestCases;
    /**
     * Build a minimal valid input object based on schema requirements
     */
    private buildMinimalValidInput;
    /**
     * Generate a valid value for a given schema type
     */
    private generateValueForSchema;
}
//# sourceMappingURL=functional-validator.d.ts.map