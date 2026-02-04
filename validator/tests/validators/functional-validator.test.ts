/**
 * Functional Validator Tests
 *
 * Tests the schema-driven functional validation that generates test cases
 * from JSON schemas and calls tools to verify they work correctly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FunctionalValidator } from '../../src/validators/functional-validator.js';
import { OnxValidator } from '../../src/validator.js';
import { createMockTransport } from '../fixtures/index.js';
import type { McpTransport } from '../../src/transports/base.js';
import { ONX_TOOLS } from '@onx/schemas';

describe('FunctionalValidator', () => {
  let mockTransport: McpTransport;
  let validator: FunctionalValidator;

  beforeEach(() => {
    mockTransport = createMockTransport();
    validator = new FunctionalValidator(mockTransport);
  });

  describe('runAllTests', () => {
    it('should run tests for all required tools', async () => {
      await mockTransport.connect();
      const results = await validator.runAllTests();

      expect(results.size).toBe(ONX_TOOLS.length);
      for (const tool of ONX_TOOLS) {
        expect(results.has(tool)).toBe(true);
      }
    });

    it('should return validation results for each tool', async () => {
      await mockTransport.connect();
      const results = await validator.runAllTests();

      for (const [tool, toolResults] of results) {
        expect(Array.isArray(toolResults)).toBe(true);
        toolResults.forEach(result => {
          expect(result).toHaveProperty('passed');
          expect(result).toHaveProperty('tool');
          expect(result).toHaveProperty('check');
          expect(result).toHaveProperty('message');
          expect(result.tool).toBe(tool);
        });
      }
    });
  });

  describe('runToolTests', () => {
    describe('schema-driven test generation', () => {
      it('should generate empty-input test for all tools', async () => {
        await mockTransport.connect();
        const results = await validator.runToolTests('get-orders');

        const emptyInputResult = results.find(r => r.check === 'functional-empty-input');
        expect(emptyInputResult).toBeDefined();
      });

      it('should pass empty-input for tools with no required fields', async () => {
        await mockTransport.connect();
        // get-orders has no required fields
        const results = await validator.runToolTests('get-orders');

        const emptyInputResult = results.find(r => r.check === 'functional-empty-input');
        expect(emptyInputResult?.passed).toBe(true);
      });

      it('should fail empty-input for tools with required fields when server returns error', async () => {
        mockTransport = createMockTransport({
          callToolResponse: (name, args) => {
            // get-inventory requires 'skus'
            if (name === 'get-inventory' && !args.skus) {
              return { success: false, error: { code: -32602, message: 'skus is required' } };
            }
            return { success: true, data: {} };
          },
        });
        validator = new FunctionalValidator(mockTransport);

        await mockTransport.connect();
        const results = await validator.runToolTests('get-inventory');

        // empty-input expects failure for get-inventory (has required fields)
        const emptyInputResult = results.find(r => r.check === 'functional-empty-input');
        expect(emptyInputResult?.passed).toBe(true); // Test passes because we expected failure and got it
      });

      it('should generate missing-required tests for each required field', async () => {
        await mockTransport.connect();
        // get-inventory has required field: skus
        const results = await validator.runToolTests('get-inventory');

        const missingSkusResult = results.find(r => r.check === 'functional-missing-required-skus');
        expect(missingSkusResult).toBeDefined();
      });

      it('should generate minimal-valid-input test', async () => {
        await mockTransport.connect();
        const results = await validator.runToolTests('get-inventory');

        const minimalValidResult = results.find(r => r.check === 'functional-minimal-valid-input');
        expect(minimalValidResult).toBeDefined();
      });

      it('should pass minimal-valid-input when server returns success', async () => {
        await mockTransport.connect();
        const results = await validator.runToolTests('get-inventory');

        const minimalValidResult = results.find(r => r.check === 'functional-minimal-valid-input');
        expect(minimalValidResult?.passed).toBe(true);
      });
    });

    describe('error handling', () => {
      it('should handle exceptions from tool calls', async () => {
        mockTransport = createMockTransport();
        vi.mocked(mockTransport.callTool).mockRejectedValue(new Error('Network error'));
        validator = new FunctionalValidator(mockTransport);

        await mockTransport.connect();
        const results = await validator.runToolTests('get-orders');

        const errorResults = results.filter(r => !r.passed);
        expect(errorResults.length).toBeGreaterThan(0);
        expect(errorResults[0].message).toContain('exception');
      });

      it('should record failure when expected success but got error', async () => {
        mockTransport = createMockTransport({
          callToolResponse: { success: false, error: { code: -1, message: 'Server error' } },
        });
        validator = new FunctionalValidator(mockTransport);

        await mockTransport.connect();
        // get-orders has no required fields, so minimal-valid-input expects success
        const results = await validator.runToolTests('get-orders');

        const minimalValidResult = results.find(r => r.check === 'functional-minimal-valid-input');
        expect(minimalValidResult?.passed).toBe(false);
      });

      it('should record failure when expected error but got success', async () => {
        // Server incorrectly accepts invalid input
        mockTransport = createMockTransport({
          callToolResponse: { success: true, data: {} },
        });
        validator = new FunctionalValidator(mockTransport);

        await mockTransport.connect();
        // create-sales-order requires 'order', so empty-input should fail
        const results = await validator.runToolTests('create-sales-order');

        // empty-input expects failure but server returned success
        const emptyInputResult = results.find(r => r.check === 'functional-empty-input');
        expect(emptyInputResult?.passed).toBe(false);
      });
    });
  });
});

describe('OnxValidator Factory Methods', () => {
  it('should have forStdio factory', () => {
    expect(typeof OnxValidator.forStdio).toBe('function');
  });

  it('should have forHttp factory', () => {
    expect(typeof OnxValidator.forHttp).toBe('function');
  });
});
