#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";

// Create MCP server instance
const server = new Server(
  {
    name: "file-system",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "read_file",
        description: "Read file contents from the given path",
        inputSchema: {
          type: "object",
          properties: {
            filepath: {
              type: "string",
              description: "Full path to the file to read",
            },
          },
          required: ["filepath"],
        },
      },
      {
        name: "list_files",
        description: "List files in a directory",
        inputSchema: {
          type: "object",
          properties: {
            dirpath: {
              type: "string",
              description: "Path to the directory to list",
            },
          },
          required: ["dirpath"],
        },
      },
      {
        name: "create_file",
        description: "Create a new file with the given content",
        inputSchema: {
          type: "object",
          properties: {
            filepath: {
              type: "string",
              description: "Full path to the file to create",
            },
            content: {
              type: "string",
              description: "Content to write to the file",
            },
          },
          required: ["filepath", "content"],
        },
      },
      {
        name: "create_folder",
        description: "Create a new folder",
        inputSchema: {
          type: "object",
          properties: {
            dirpath: {
              type: "string",
              description: "Path to the folder to create",
            },
          },
          required: ["dirpath"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "read_file") {
      const { filepath } = args;

      // Validate file exists
      await fs.access(filepath);

      // Read file
      const content = await fs.readFile(filepath, "utf-8");

      return {
        content: [
          {
            type: "text",
            text: `File contents of ${filepath}:\n\n${content}`,
          },
        ],
      };
    }
    else if (name === "list_files") {
      const { dirpath } = args;

      // Read directory
      const files = await fs.readdir(dirpath, { withFileTypes: true });

      // Format output
      const fileList = files.map((file) => {
        const type = file.isDirectory() ? "📁 DIR " : "📄 FILE";
        return `${type} - ${file.name}`;
      }).join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Directory contents of ${dirpath}:\n\n${fileList}`,
          },
        ],
      };
    }
    else if (name === "create_file") {
      const { filepath, content } = args;

      // Create file
      await fs.writeFile(filepath, content, "utf-8");

      return {
        content: [
          {
            type: "text",
            text: `File ${filepath} created successfully.`,
          },
        ],
      };
    }
    else if (name === "create_folder") {
      const { dirpath } = args;

      // Create folder
      await fs.mkdir(dirpath, { recursive: true });

      return {
        content: [
          {
            type: "text",
            text: `Folder ${dirpath} created successfully.`,
          },
        ],
      };
    }

    throw new Error(`Tool not found: ${name}`);
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Run server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP File System Server running");
}

main().catch((error) => {
  console.error("Error starting server:", error);
  process.exit(1);
});