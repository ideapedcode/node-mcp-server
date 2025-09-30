#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { MongoClient } from "mongodb";

// MongoDB configuration
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.MONGODB_DB || "dbname";

let client = null;
let db = null;

// Initialize MongoDB connection
async function initMongoDB() {
    try {
        client = new MongoClient(MONGO_URI);
        await client.connect();
        db = client.db(DB_NAME);
        console.error("✅ Connected to MongoDB");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        throw error;
    }
}

// Create MCP Server
const server = new Server(
    {
        name: "mongodb-connector",
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
                name: "mongodb_find",
                description: "Get documents from MongoDB collection with optional filter and limit",
                inputSchema: {
                    type: "object",
                    properties: {
                        collection: {
                            type: "string",
                            description: "Name of the collection to query",
                        },
                        filter: {
                            type: "object",
                            description: "MongoDB filter query (optional, default: {})",
                            default: {},
                        },
                        limit: {
                            type: "number",
                            description: "Maximum number of documents to return (optional, default: 10)",
                            default: 10,
                        },
                        sort: {
                            type: "object",
                            description: "Sort specification (optional, e.g., {createdAt: -1})",
                        },
                    },
                    required: ["collection"],
                },
            },
            {
                name: "mongodb_find_one",
                description: "Get a single document from MongoDB collection",
                inputSchema: {
                    type: "object",
                    properties: {
                        collection: {
                            type: "string",
                            description: "Name of the collection to query",
                        },
                        filter: {
                            type: "object",
                            description: "MongoDB filter query to find specific document",
                            default: {},
                        },
                    },
                    required: ["collection"],
                },
            },
            {
                name: "mongodb_count",
                description: "Count documents in a collection with optional filter",
                inputSchema: {
                    type: "object",
                    properties: {
                        collection: {
                            type: "string",
                            description: "Name of the collection",
                        },
                        filter: {
                            type: "object",
                            description: "MongoDB filter query (optional, default: {})",
                            default: {},
                        },
                    },
                    required: ["collection"],
                },
            },
            {
                name: "mongodb_list_collections",
                description: "List all collections in the database",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
        ],
    };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case "mongodb_find": {
                const { collection, filter = {}, limit = 10, sort } = args;
                const coll = db.collection(collection);

                let cursor = coll.find(filter).limit(limit);

                if (sort) {
                    cursor = cursor.sort(sort);
                }

                const documents = await cursor.toArray();

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: true,
                                collection,
                                count: documents.length,
                                documents,
                            }, null, 2),
                        },
                    ],
                };
            }

            case "mongodb_find_one": {
                const { collection, filter = {} } = args;
                const coll = db.collection(collection);
                const document = await coll.findOne(filter);

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: true,
                                collection,
                                document,
                            }, null, 2),
                        },
                    ],
                };
            }

            case "mongodb_count": {
                const { collection, filter = {} } = args;
                const coll = db.collection(collection);
                const count = await coll.countDocuments(filter);

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: true,
                                collection,
                                count,
                            }, null, 2),
                        },
                    ],
                };
            }

            case "mongodb_list_collections": {
                const collections = await db.listCollections().toArray();
                const collectionNames = collections.map(c => c.name);

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: true,
                                database: DB_NAME,
                                collections: collectionNames,
                            }, null, 2),
                        },
                    ],
                };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: error.message,
                    }, null, 2),
                },
            ],
            isError: true,
        };
    }
});

// Cleanup on server shutdown
process.on("SIGINT", async () => {
    if (client) {
        await client.close();
        console.error("MongoDB connection closed");
    }
    process.exit(0);
});

// Start server
async function main() {
    await initMongoDB();

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP MongoDB Connector Server running");
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});