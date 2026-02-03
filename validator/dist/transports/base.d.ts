/**
 * Base transport interface for MCP communication
 */
import { ToolDefinition } from '../types.js';
export interface McpResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: number;
        message: string;
    };
}
export interface ServerInfo {
    name: string;
    version: string;
    protocolVersion: string;
}
export interface McpTransport {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getServerInfo(): Promise<ServerInfo>;
    listTools(): Promise<ToolDefinition[]>;
    callTool(name: string, args: Record<string, unknown>): Promise<McpResponse>;
    isConnected(): boolean;
}
export interface JsonRpcRequest {
    jsonrpc: '2.0';
    id: number;
    method: string;
    params?: Record<string, unknown>;
}
export interface JsonRpcResponse {
    jsonrpc: '2.0';
    id: number;
    result?: unknown;
    error?: {
        code: number;
        message: string;
        data?: unknown;
    };
}
//# sourceMappingURL=base.d.ts.map