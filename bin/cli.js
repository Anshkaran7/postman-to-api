#!/usr/bin/env node

// This file runs the compiled JavaScript CLI
const path = require('path');

// Use the compiled JavaScript CLI
const cliPath = path.join(__dirname, 'cli.js');

// Import and run the CLI
require(cliPath); 