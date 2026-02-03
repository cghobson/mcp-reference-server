/**
 * Schema Loader
 * Re-exports canonical onX tool schemas from the shared schemas package
 */
import { JSONSchema } from '../types.js';
import { ONX_TOOLS } from '@onx/schemas';
export { ONX_TOOLS };
export declare function loadCanonicalSchemas(): Map<string, JSONSchema>;
export declare function getCanonicalSchema(toolName: string): JSONSchema | null;
export declare function listCanonicalTools(): string[];
//# sourceMappingURL=loader.d.ts.map