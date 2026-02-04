/**
 * Main Validator Orchestrator
 * Coordinates all validation steps and generates report
 */

import { McpTransport } from './transports/base.js';
import { StdioTransport } from './transports/stdio.js';
import { HttpTransport } from './transports/http.js';
import { ToolValidator, FunctionalValidator } from './validators/index.js';
import { ReportGenerator, ConsoleReporter } from './reporters/index.js';
import { ComplianceReport, TransportConfig } from './types.js';

export interface ValidatorOptions {
  functionalTests?: boolean;
  format?: 'console' | 'json';
  verbose?: boolean;
}

const defaultOptions: ValidatorOptions = {
  functionalTests: true,
  format: 'console',
  verbose: false,
};

export class OnxValidator {
  private transport: McpTransport;
  private transportType: 'stdio' | 'http';
  private options: ValidatorOptions;

  private constructor(transport: McpTransport, transportType: 'stdio' | 'http', options: ValidatorOptions) {
    this.transport = transport;
    this.transportType = transportType;
    this.options = { ...defaultOptions, ...options };
  }

  static create(config: TransportConfig, options: ValidatorOptions = {}): OnxValidator {
    switch (config.type) {
      case 'stdio':
        return new OnxValidator(new StdioTransport(config), 'stdio', options);
      case 'http':
        return new OnxValidator(new HttpTransport(config), 'http', options);
    }
  }

  async validate(): Promise<ComplianceReport> {
    const toolValidator = new ToolValidator();
    const reportGenerator = new ReportGenerator();

    try {
      if (this.options.verbose) {
        console.log('Connecting to MCP server...');
      }
      await this.transport.connect();

      const serverInfo = await this.transport.getServerInfo();
      if (this.options.verbose) {
        console.log(`Connected to ${serverInfo.name} v${serverInfo.version}`);
      }

      if (this.options.verbose) {
        console.log('Fetching tool list...');
      }
      const tools = await this.transport.listTools();
      if (this.options.verbose) {
        console.log(`Found ${tools.length} tools`);
      }

      if (this.options.verbose) {
        console.log('Validating tool schemas...');
      }
      const toolResults = toolValidator.validateAll(tools);

      let functionalResults = new Map<string, any[]>();
      if (this.options.functionalTests) {
        if (this.options.verbose) {
          console.log('Running functional tests...');
        }
        const functionalValidator = new FunctionalValidator(this.transport);
        functionalResults = await functionalValidator.runAllTests();
      }

      const report = reportGenerator.generate(
        serverInfo,
        toolResults,
        functionalResults,
        this.transportType
      );

      return report;
    } finally {
      await this.transport.disconnect();
    }
  }

  async run(): Promise<ComplianceReport> {
    const report = await this.validate();

    if (this.options.format === 'json') {
      const generator = new ReportGenerator();
      console.log(generator.toJSON(report));
    } else {
      const consoleReporter = new ConsoleReporter();
      consoleReporter.print(report);
    }

    return report;
  }
}
