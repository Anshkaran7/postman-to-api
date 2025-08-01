#!/usr/bin/env node

// This file compiles and runs the TypeScript CLI
const path = require('path');
const { spawn } = require('child_process');

// Use ts-node to run the TypeScript CLI
const tsCliPath = path.join(__dirname, 'cli.ts');
const child = spawn('npx', ['ts-node', tsCliPath, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: path.dirname(__dirname)
});

child.on('close', (code) => {
  process.exit(code);
});

child.on('error', (error) => {
  console.error('Failed to start CLI:', error);
  process.exit(1);
}); 