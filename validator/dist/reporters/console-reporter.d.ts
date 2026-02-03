/**
 * Console Reporter
 * Formats compliance reports for terminal output
 */
import { ComplianceReport } from '../types.js';
export declare class ConsoleReporter {
    /**
     * Print the full compliance report to console
     */
    print(report: ComplianceReport): void;
    private printHeader;
    private printSummary;
    private printToolResults;
    private printToolResult;
    private printFooter;
    private formatScore;
    private createProgressBar;
}
//# sourceMappingURL=console-reporter.d.ts.map