/**
 * HTTP transport for MCP servers exposing HTTP endpoints
 */
export class HttpTransport {
    config;
    requestId = 0;
    serverInfo = null;
    connected = false;
    constructor(config) {
        this.config = config;
    }
    async connect() {
        // Send initialize request
        const response = await this.sendRequest('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
                name: 'onx-validator',
                version: '1.0.0',
            },
        });
        if (response.error) {
            throw new Error(`Initialize failed: ${response.error.message}`);
        }
        const result = response.result;
        this.serverInfo = {
            name: result.serverInfo?.name || 'unknown',
            version: result.serverInfo?.version || 'unknown',
            protocolVersion: result.protocolVersion || 'unknown',
        };
        // Send initialized notification
        await this.sendNotification('notifications/initialized', {});
        this.connected = true;
    }
    async disconnect() {
        this.connected = false;
        this.serverInfo = null;
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
        return this.connected;
    }
    async sendRequest(method, params) {
        const id = ++this.requestId;
        const request = {
            jsonrpc: '2.0',
            id,
            method,
            params,
        };
        const response = await fetch(this.config.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.config.headers,
            },
            body: JSON.stringify(request),
        });
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
        }
        const json = await response.json();
        return json;
    }
    async sendNotification(method, params) {
        const notification = {
            jsonrpc: '2.0',
            method,
            params,
        };
        try {
            await fetch(this.config.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.config.headers,
                },
                body: JSON.stringify(notification),
            });
        }
        catch {
            // Notifications don't require a response, ignore errors
        }
    }
}
//# sourceMappingURL=http.js.map