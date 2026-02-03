/**
 * Tool Validator
 * Validates that tools exist and schemas match canonical onX specifications
 */
import { ToolDefinition, ValidationResult, ToolValidationResult } from '../types.js';
export declare class ToolValidator {
    /**
     * Validate all required tools are present
     */
    validateToolPresence(tools: ToolDefinition[]): ValidationResult[];
    /**
     * Validate a single tool's schema against the canonical schema
     */
    validateToolSchema(tool: ToolDefinition): ValidationResult[];
    /**
     * Validate all tools and produce tool-by-tool results
     */
    validateAll(tools: ToolDefinition[]): ToolValidationResult[];
}
//# sourceMappingURL=tool-validator.d.ts.map