/**
 * Schema Comparator
 * Deep comparison of endpoint schemas against canonical onX schemas
 */
import { JSONSchema, ValidationResult } from '../types.js';
/**
 * Compare an endpoint's schema against the canonical schema
 * Returns validation results for all differences found
 */
export declare function compareSchemas(toolName: string, endpointSchema: JSONSchema, canonicalSchema: JSONSchema, path?: string): ValidationResult[];
/**
 * Generate a summary of schema comparison
 */
export declare function summarizeComparison(results: ValidationResult[]): {
    passed: number;
    failed: number;
    byCheck: Record<string, number>;
};
//# sourceMappingURL=comparator.d.ts.map