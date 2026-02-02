/**
 * Schema Loader
 * Re-exports canonical onX tool schemas from the shared schemas package
 */

import { JSONSchema } from '../types.js';
import { ONX_TOOLS, toolInputSchemas, getToolInputSchema } from '@onx/schemas';

export { ONX_TOOLS };

// Load all canonical tool schemas
export function loadCanonicalSchemas(): Map<string, JSONSchema> {
  return toolInputSchemas as Map<string, JSONSchema>;
}

// Get a specific tool's canonical schema
export function getCanonicalSchema(toolName: string): JSONSchema | null {
  return getToolInputSchema(toolName) as JSONSchema | null;
}

// List all available canonical tool names
export function listCanonicalTools(): string[] {
  return [...ONX_TOOLS];
}
