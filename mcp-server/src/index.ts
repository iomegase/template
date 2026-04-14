import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { generateCrudModule, generateCrudModuleSchema } from "./tools/generate-crud-module.js";
import { readFile, readFileSchema } from "./tools/read-file.js";
import { readProjectTree, readProjectTreeSchema } from "./tools/read-project-tree.js";

const server = new McpServer({
  name: "template-mcp-server",
  version: "0.1.0",
});

server.tool(
  "read_project_tree",
  "Lit l'arborescence du projet en excluant node_modules, .git, .next, dist et build.",
  readProjectTreeSchema,
  readProjectTree,
);

server.tool(
  "read_file",
  "Lit un fichier du projet avec une limite de taille et une protection contre les chemins externes.",
  readFileSchema,
  readFile,
);

server.tool(
  "generate_crud_module",
  "Prépare ou crée un module CRUD minimal selon la structure du template Next.js.",
  generateCrudModuleSchema,
  generateCrudModule,
);

const transport = new StdioServerTransport();
await server.connect(transport);
