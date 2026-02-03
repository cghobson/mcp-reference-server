/**
 * Report Generator
 * Generates compliance reports from validation results
 */
import { ComplianceReport, ToolValidationResult, ValidationResult } from '../types.js';
import { ServerInfo } from '../transports/base.js';
export declare class ReportGenerator {
    /**
     * Generate a compliance report from validation results
     */
    generate(serverInfo: ServerInfo, toolResults: ToolValidationResult[], functionalResults: Map<string, ValidationResult[]>, transport: 'stdio' | 'http'): ComplianceReport;
    /**
     * Format report as JSON
     */
    toJSON(report: ComplianceReport): string;
}
//# sourceMappingURL=report-generator.d.ts.map