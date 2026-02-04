/**
 * Report Generator
 * Generates compliance reports from validation results
 */

import {
  ComplianceReport,
  ToolValidationResult,
  ValidationResult,
} from '../types.js';
import { ONX_TOOLS } from '@onx/schemas';
import { ServerInfo } from '../transports/base.js';

export class ReportGenerator {
  generate(
    serverInfo: ServerInfo,
    toolResults: ToolValidationResult[],
    functionalResults: Map<string, ValidationResult[]>,
    transport: 'stdio' | 'http'
  ): ComplianceReport {
    for (const toolResult of toolResults) {
      const funcResults = functionalResults.get(toolResult.tool);
      if (funcResults) {
        const funcErrors = funcResults.filter(r => !r.passed);
        toolResult.errors.push(...funcErrors);
        toolResult.functionalValid = funcErrors.length === 0;
      }
    }

    const implementedTools = toolResults.filter(t => t.exists);
    const missingTools = ONX_TOOLS.filter(
      name => !toolResults.find(t => t.tool === name && t.exists)
    );

    let passedChecks = 0;
    let failedChecks = 0;
    let warnings = 0;

    for (const toolResult of toolResults) {
      passedChecks += toolResult.errors.filter(e => e.passed).length;
      failedChecks += toolResult.errors.filter(e => !e.passed).length;
      warnings += toolResult.warnings.length;

      if (toolResult.exists) {
        passedChecks++;
      } else {
        failedChecks++;
      }
    }

    const totalChecks = passedChecks + failedChecks;
    const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

    let compliance: 'full' | 'partial' | 'non-compliant';
    if (missingTools.length === 0 && failedChecks === 0) {
      compliance = 'full';
    } else if (implementedTools.length >= 1) {
      compliance = 'partial';
    } else {
      compliance = 'non-compliant';
    }

    return {
      serverInfo,
      timestamp: new Date().toISOString(),
      transport,
      summary: {
        totalTools: ONX_TOOLS.length,
        implementedTools: implementedTools.length,
        missingTools: [...missingTools],
        passedChecks,
        failedChecks,
        warnings,
      },
      tools: toolResults,
      compliance,
      score,
    };
  }

  toJSON(report: ComplianceReport): string {
    return JSON.stringify(report, null, 2);
  }
}
