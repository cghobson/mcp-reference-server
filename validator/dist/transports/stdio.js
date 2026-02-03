/**
 * Stdio transport for MCP servers running as child processes
 */
import { spawn } from 'node:child_process';
export class StdioTransport {
    config;
    process = null;
    requestId = 0;
    pendingRequests = new Map();
    buffer = '';
    serverInfo = null;
    constructor(config) {
        this.config = config;
    }
    async connect() {
        return new Promise((resolve, reject) => {
            this.process = spawn(this.config.command, this.config.args || [], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env, ...this.config.env },
            });
            this.process.stdout?.on('data', (data) => {
                this.handleData(data.toString());
            });
            this.process.stderr?.on('data', (data) => {
                // Log stderr but don't fail - servers may write logs here
                if (process.env.DEBUG) {
                    console.error('[server stderr]', data.toString());
                }
            });
            this.process.on('error', (error) => {
                reject(new Error(`Failed to start server: ${error.message}`));
            });
            this.process.on('close', (code) => {
                if (code !== 0 && code !== null) {
                    // Reject any pending requests
                    for (const { reject } of this.pendingRequests.values()) {
                        reject(new Error(`Server process exited with code ${code}`));
                    }
                    this.pendingRequests.clear();
                }
            });
            // Give the process a moment to start, then initialize
            setTimeout(async () => {
                try {
                    const response = await this.sendRequest('initialize', {
                        protocolVersion: '2024-11-05',
                        capabilities: {},
                        clientInfo: {
                            name: 'onx-validator',
                            version: '1.0.0',
                        },
                    });
                    if (response.error) {
                        reject(new Error(`Initialize failed: ${response.error.message}`));
                        return;
                    }
                    const result = response.result;
                    this.serverInfo = {
                        name: result.serverInfo?.name || 'unknown',
                        version: result.serverInfo?.version || 'unknown',
                        protocolVersion: result.protocolVersion || 'unknown',
                    };
                    // Send initialized notification
                    this.sendNotification('notifications/initialized', {});
                    resolve();
                }
                catch (error) {
                    reject(error);
                }
            }, 500);
        });
    }
    async disconnect() {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
    }
    async getServerInfo() {
        if (!this.serverInfo) {
            throw new Error('Not connected');
        }
        return this.serverInfo;
    }
    async listTools() {
        const response = await this.sendRequest('tools/list', {});
        if (response.error) {
            throw new Error(`Failed to list tools: ${response.error.message}`);
        }
        const result = response.result;
        return result.tools || [];
    }
    async callTool(name, args) {
        const response = await this.sendRequest('tools/call', {
            name,
            arguments: args,
        });
        if (response.error) {
            return {
                success: false,
                error: {
                    code: response.error.code,
                    message: response.error.message,
                },
            };
        }
        const result = response.result;
        if (result.isError) {
            const errorText = result.content?.find(c => c.type === 'text')?.text || 'Unknown error';
            return {
                success: false,
                error: {
                    code: -1,
                    message: errorText,
                },
            };
        }
        return {
            success: true,
            data: result,
        };
    }
    isConnected() {
        return this.process !== null && !this.process.killed;
    }
    handleData(data) {
        this.buffer += data;
        // Process complete JSON-RPC messages (newline-delimited)
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop() || '';
        for (const line of lines) {
            if (!line.trim())
                continue;
            try {
                const message = JSON.parse(line);
                if (message.id !== undefined) {
                    const pending = this.pendingRequests.get(message.id);
                    if (pending) {
                        pending.resolve(message);
                        this.pendingRequests.delete(message.id);
                    }
                }
            }
            catch {
                // Ignore non-JSON lines (might be logs)
                if (process.env.DEBUG) {
                    console.error('[parse error]', line);
                }
            }
        }
    }
    sendRequest(method, params) {
        return new Promise((resolve, reject) => {
            if (!this.process?.stdin) {
                reject(new Error('Not connected'));
                return;
            }
            const id = ++this.requestId;
            const request = {
                jsonrpc: '2.0',
                id,
                method,
                params,
            };
            this.pendingRequests.set(id, { resolve, reject });
            const message = JSON.stringify(request) + '\n';
            this.process.stdin.write(message);
            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error(`Request ${method} timed out`));
                }
            }, 30000);
        });
    }
    sendNotification(method, params) {
        if (!this.process?.stdin)
            return;
        const notification = {
            jsonrpc: '2.0',
            method,
            params,
        };
        this.process.stdin.write(JSON.stringify(notification) + '\n');
    }
}
//# sourceMappingURL=stdio.js.map