/**
 * Main Validator Orchestrator
 * Coordinates all validation steps and generates report
 */
import { ComplianceReport, StdioTransportConfig, HttpTransportConfig } from './types.js';
export interface ValidatorOptions {
    /** Run functional tests (calls tools with test data) */
    functionalTests?: boolean;
    /** Output format */
    format?: 'console' | 'json';
    /** Verbose output */
    verbose?: boolean;
}
export declare class OnxValidator {
    private transport;
    private transportType;
    private options;
    private constructor();
    /**
     * Create validator for a stdio-based MCP server
     */
    static forStdio(config: StdioTransportConfig, options?: ValidatorOptions): OnxValidator;
    /**
     * Create validator for an HTTP-based MCP server
     */
    static forHttp(config: HttpTransportConfig, options?: ValidatorOptions): OnxValidator;
    /**
     * Run the full validation suite
     */
    validate(): Promise<ComplianceReport>;
    /**
     * Run validation and print results
     */
    run(): Promise<ComplianceReport>;
}
//# sourceMappingURL=validator.d.ts.map