/**
 * Stdio transport for MCP servers running as child processes
 */
import { McpTransport, McpResponse, ServerInfo } from './base.js';
import { ToolDefinition, StdioTransportConfig } from '../types.js';
export declare class StdioTransport implements McpTransport {
    private config;
    private process;
    private requestId;
    private pendingRequests;
    private buffer;
    private serverInfo;
    constructor(config: StdioTransportConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getServerInfo(): Promise<ServerInfo>;
    listTools(): Promise<ToolDefinition[]>;
    callTool(name: string, args: Record<string, unknown>): Promise<McpResponse>;
    isConnected(): boolean;
    private handleData;
    private sendRequest;
    private sendNotification;
}
//# sourceMappingURL=stdio.d.ts.map