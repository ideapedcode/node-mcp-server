# Node.js Model Context Protocol (MCP) Server

A Node.js server implementation for the Model Context Protocol (MCP), providing integration with file system operations and MongoDB database operations.

## Overview

This project contains two MCP servers that enable AI models and tools to interact with external systems through standardized protocols:

1. **File System Server**: Provides file system operations like reading, writing, listing files and creating directories.
2. **MongoDB Connector Server**: Enables interaction with MongoDB databases through operations such as finding, counting, and listing collections.

## Prerequisites

- Node.js (version 14 or higher)
- MongoDB (for MongoDB connector functionality)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd node-mcp-server
```

2. Install dependencies:
```bash
npm install
```

## Configuration

### MongoDB Connector

The MongoDB connector uses environment variables for configuration:

- `MONGODB_URI` - MongoDB connection URI (defaults to `mongodb://localhost:27017`)
- `MONGODB_DB` - Database name (defaults to `dbname`)

Example:
```bash
export MONGODB_URI="mongodb://localhost:27017"
export MONGODB_DB="mydatabase"
```

## Usage

### File System Server

Run the file system server:
```bash
node file-system.js
```

The server provides the following tools:

#### Available Tools

- **read_file**
  - Description: Read file contents from the given path
  - Input: `filepath` (string, required)

- **list_files**
  - Description: List files in a directory
  - Input: `dirpath` (string, required)

- **create_file**
  - Description: Create a new file with the given content
  - Input: `filepath` (string, required), `content` (string, required)

- **create_folder**
  - Description: Create a new folder
  - Input: `dirpath` (string, required)

### MongoDB Connector Server

Run the MongoDB connector server:
```bash
node mongodb-connector.js
```

The server provides the following tools:

#### Available Tools

- **mongodb_find**
  - Description: Get documents from MongoDB collection with optional filter and limit
  - Input: `collection` (string, required), `filter` (object, optional), `limit` (number, optional), `sort` (object, optional)

- **mongodb_find_one**
  - Description: Get a single document from MongoDB collection
  - Input: `collection` (string, required), `filter` (object, optional)

- **mongodb_count**
  - Description: Count documents in a collection with optional filter
  - Input: `collection` (string, required), `filter` (object, optional)

- **mongodb_list_collections**
  - Description: List all collections in the database
  - Input: none

## How it Works

This project implements the Model Context Protocol (MCP), which allows AI models to securely access external tools and data sources. Each server:

1. Implements the MCP server interface
2. Exposes tools that can be called by AI models
3. Handles requests through standard input/output transport
4. Returns responses in the expected MCP format

## Security Considerations

- The file system server has full read/write access to the file system where it runs
- The MongoDB connector has access to the configured database
- Both servers should be deployed in secure environments with appropriate access controls
- Validate all inputs when using these servers in production environments

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a pull request

## License

This project is licensed under the ISC License.