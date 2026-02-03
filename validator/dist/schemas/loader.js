/**
 * Schema Loader
 * Re-exports canonical onX tool schemas from the shared schemas package
 */
import { ONX_TOOLS, toolInputSchemas, getToolInputSchema } from '@onx/schemas';
export { ONX_TOOLS };
// Load all canonical tool schemas
export function loadCanonicalSchemas() {
    return toolInputSchemas;
}
// Get a specific tool's canonical schema
export function getCanonicalSchema(toolName) {
    return getToolInputSchema(toolName);
}
// List all available canonical tool names
export function listCanonicalTools() {
    return [...ONX_TOOLS];
}
//# sourceMappingURL=loader.js.map