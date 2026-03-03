import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerDetectStackTool } from './tools/detect-stack.js';
import { registerGenerateConfigTool } from './tools/generate-config.js';
import { registerCheckConfigTool } from './tools/check-config.js';
import { registerSyncConfigTool } from './tools/sync-config.js';
import { registerListProfilesTool } from './tools/list-profiles.js';
import { registerGetProfileTool } from './tools/get-profile.js';
import { registerCleanupProjectTool } from './tools/cleanup-project.js';
import { registerEjectProjectTool } from './tools/eject-project.js';
import { registerGetMemoryTool } from './tools/get-memory.js';
import { registerRecordLearningTool } from './tools/record-learning.js';
import { registerCheckPluginHealthTool } from './tools/check-plugin-health.js';
import { registerRepairConfigTool } from './tools/repair-config.js';
import { registerExtractLearningsTool } from './tools/extract-learnings.js';

const version = process.env.DIVERGER_VERSION ?? '0.0.0';

const server = new McpServer({ name: 'diverger-claude', version });

registerDetectStackTool(server);
registerGenerateConfigTool(server);
registerCheckConfigTool(server);
registerSyncConfigTool(server);
registerListProfilesTool(server);
registerGetProfileTool(server);
registerCleanupProjectTool(server);
registerEjectProjectTool(server);
registerGetMemoryTool(server);
registerRecordLearningTool(server);
registerCheckPluginHealthTool(server);
registerRepairConfigTool(server);
registerExtractLearningsTool(server);

const transport = new StdioServerTransport();
await server.connect(transport);
