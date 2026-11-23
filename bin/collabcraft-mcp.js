#!/usr/bin/env node
const mcp = require('../dist/mcp.js');
if (mcp && typeof mcp.run === 'function') {
  mcp.run();
}
