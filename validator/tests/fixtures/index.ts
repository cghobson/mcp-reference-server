/**
 * Test Fixtures
 *
 * Provides reusable test data and mock factories for consistent testing
 * across all test files.
 */

import { vi } from 'vitest';
import type { ToolDefinition, ValidationResult, ToolValidationResult } from '../../src/types.js';
import type { McpTransport, McpResponse, ServerInfo } from '../../src/transports/base.js';
import { ONX_TOOLS } from '@onx/schemas';

/**
 * Creates a mock server info object
 */
export function createServerInfo(overrides: Partial<ServerInfo> = {}): ServerInfo {
  return {
    name: 'test-server',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    ...overrides,
  };
}

/**
 * Creates a minimal valid tool definition
 */
export function createToolDefinition(
  name: string,
  overrides: Partial<ToolDefinition> = {}
): ToolDefinition {
  return {
    name,
    description: `Test tool: ${name}`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
    ...overrides,
  };
}

/**
 * Fixture definitions for each tool in ONX_TOOLS.
 * When adding a new tool to ONX_TOOLS, add a corresponding definition here.
 */
const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'create-sales-order',
    description: 'Create a new sales order',
    inputSchema: {
      type: 'object',
      properties: {
        order: {
          type: 'object',
          properties: {
            externalId: { type: 'string' },
            lineItems: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sku: { type: 'string' },
                  quantity: { type: 'number' },
                },
                required: ['sku', 'quantity'],
              },
            },
          },
          required: ['lineItems'],
        },
      },
      required: ['order'],
    },
  },
  {
    name: 'update-order',
    description: 'Update an existing order',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        updates: { type: 'object' },
      },
      required: ['id', 'updates'],
    },
  },
  {
    name: 'cancel-order',
    description: 'Cancel an order',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: { type: 'string' },
        reason: { type: 'string' },
        notifyCustomer: { type: 'boolean' },
        notes: { type: 'string' },
        lineItems: { type: 'array' },
      },
      required: ['orderId'],
    },
  },
  {
    name: 'fulfill-order',
    description: 'Fulfill an order',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: { type: 'string' },
        lineItems: { type: 'array' },
        trackingNumbers: { type: 'array' },
      },
      required: ['orderId', 'lineItems', 'trackingNumbers'],
    },
  },
  {
    name: 'create-return',
    description: 'Create a return',
    inputSchema: {
      type: 'object',
      properties: {
        return: { type: 'object' },
      },
      required: ['return'],
    },
  },
  {
    name: 'get-orders',
    description: 'Get orders',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array' },
        externalIds: { type: 'array' },
        statuses: { type: 'array' },
        names: { type: 'array' },
        includeLineItems: { type: 'boolean' },
      },
    },
  },
  {
    name: 'get-customers',
    description: 'Get customers',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array' },
        emails: { type: 'array' },
      },
    },
  },
  {
    name: 'get-products',
    description: 'Get products',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array' },
        skus: { type: 'array' },
      },
    },
  },
  {
    name: 'get-product-variants',
    description: 'Get product variants',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array' },
        skus: { type: 'array' },
        productIds: { type: 'array' },
      },
    },
  },
  {
    name: 'get-inventory',
    description: 'Get inventory levels',
    inputSchema: {
      type: 'object',
      properties: {
        skus: { type: 'array' },
        locationIds: { type: 'array' },
      },
      required: ['skus'],
    },
  },
  {
    name: 'get-fulfillments',
    description: 'Get fulfillments',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array' },
        orderIds: { type: 'array' },
      },
    },
  },
  {
    name: 'get-returns',
    description: 'Get returns',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array' },
        orderIds: { type: 'array' },
        returnNumbers: { type: 'array' },
        statuses: { type: 'array' },
        outcomes: { type: 'array' },
      },
    },
  },
];

/**
 * Returns tool definitions for all ONX_TOOLS.
 * Throws if any tool in ONX_TOOLS is missing a fixture definition.
 */
export function createCompliantToolSet(): ToolDefinition[] {
  const definitionsByName = new Map(TOOL_DEFINITIONS.map(t => [t.name, t]));
  const missing = ONX_TOOLS.filter(name => !definitionsByName.has(name));

  if (missing.length > 0) {
    throw new Error(`Test fixtures missing definitions for: ${missing.join(', ')}`);
  }

  return ONX_TOOLS.map(name => definitionsByName.get(name)!);
}

/**
 * Creates a mock MCP transport for testing
 */
export function createMockTransport(config: {
  serverInfo?: ServerInfo;
  tools?: ToolDefinition[];
  callToolResponse?: McpResponse | ((name: string, args: Record<string, unknown>) => McpResponse);
} = {}): McpTransport {
  const {
    serverInfo = createServerInfo(),
    tools = createCompliantToolSet(),
    callToolResponse = { success: true, data: { content: [{ type: 'text', text: 'OK' }] } },
  } = config;

  let connected = false;

  return {
    connect: vi.fn(async () => {
      connected = true;
    }),
    disconnect: vi.fn(async () => {
      connected = false;
    }),
    getServerInfo: vi.fn(async () => {
      if (!connected) throw new Error('Not connected');
      return serverInfo;
    }),
    listTools: vi.fn(async () => {
      if (!connected) throw new Error('Not connected');
      return tools;
    }),
    callTool: vi.fn(async (name: string, args: Record<string, unknown>) => {
      if (!connected) throw new Error('Not connected');
      if (typeof callToolResponse === 'function') {
        return callToolResponse(name, args);
      }
      return callToolResponse;
    }),
    isConnected: vi.fn(() => connected),
  };
}

// Create passing, failing, and tool validation results
export function createPassingResult(
  tool: string,
  check: string,
  message?: string
): ValidationResult {
  return {
    passed: true,
    tool,
    check,
    message: message || `Check ${check} passed`,
  };
}

export function createFailingResult(
  tool: string,
  check: string,
  message?: string,
  details?: unknown
): ValidationResult {
  return {
    passed: false,
    tool,
    check,
    message: message || `Check ${check} failed`,
    details,
  };
}
export function createToolValidationResult(
  tool: string,
  config: Partial<ToolValidationResult> = {}
): ToolValidationResult {
  return {
    tool,
    exists: true,
    schemaValid: true,
    functionalValid: true,
    errors: [],
    warnings: [],
    ...config,
  };
}

/**
 * Creates a mock JSON-RPC response
 */
export function createJsonRpcResponse(result: unknown, id = 1) {
  return {
    jsonrpc: '2.0' as const,
    id,
    result,
  };
}

/**
 * Creates a mock JSON-RPC error response
 */
export function createJsonRpcError(code: number, message: string, id = 1) {
  return {
    jsonrpc: '2.0' as const,
    id,
    error: {
      code,
      message,
    },
  };
}

/**
 * Creates a mock fetch function for HTTP transport testing
 */
export function createMockFetch(responses: Array<{ result?: unknown; error?: { code: number; message: string } }>) {
  let callIndex = 0;

  return vi.fn(async (_url: string, _options: RequestInit) => {
    const response = responses[callIndex] || responses[responses.length - 1];
    callIndex++;

    const body = response.error
      ? createJsonRpcError(response.error.code, response.error.message, callIndex)
      : createJsonRpcResponse(response.result, callIndex);

    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => body,
    } as Response;
  });
}
