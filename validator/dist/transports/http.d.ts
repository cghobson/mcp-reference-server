/**
 * HTTP transport for MCP servers exposing HTTP endpoints
 */
import { McpTransport, McpResponse, ServerInfo } from './base.js';
import { ToolDefinition, HttpTransportConfig } from '../types.js';
export declare class HttpTransport implements McpTransport {
    private config;
    private requestId;
    private serverInfo;
    private connected;
    constructor(config: HttpTransportConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getServerInfo(): Promise<ServerInfo>;
    listTools(): Promise<ToolDefinition[]>;
    callTool(name: string, args: Record<string, unknown>): Promise<McpResponse>;
    isConnected(): boolean;
    private sendRequest;
    private sendNotification;
}
//# sourceMappingURL=http.d.ts.map