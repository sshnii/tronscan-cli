#!/usr/bin/env node

import { loadConfig, output, err, warn, VERSION } from './api.js';
import { commands } from './commands.js';
import { printHelp, printCommandHelp } from './help.js';

// ============ Parse arguments ============

const rawArgs = process.argv.slice(2);

// --version / -V
if (rawArgs[0] === '--version' || rawArgs[0] === '-V' || rawArgs[0] === 'version') {
  console.log(`TronScan CLI v${VERSION}`);
  process.exit(0);
}

// --help / -h (no command)
if (!rawArgs[0] || rawArgs[0] === '--help' || rawArgs[0] === '-h' || rawArgs[0] === 'help') {
  printHelp();
  process.exit(0);
}

// Extract command
const cmd = rawArgs[0];
const rest = rawArgs.slice(1);

// Parse options and positional args
const opts = { start: '0', limit: '20', sort: '', raw: false };
let showHelp = false;
const positional = [];

let i = 0;
while (i < rest.length) {
  const arg = rest[i];
  switch (arg) {
    case '--raw':     opts.raw = true; i++; break;
    case '--help':
    case '-h':        showHelp = true; i++; break;
    case '--start':   opts.start = rest[++i] || '0'; i++; break;
    case '--limit':   opts.limit = rest[++i] || '20'; i++; break;
    case '--sort':    opts.sort = rest[++i] || ''; i++; break;
    case '--':        positional.push(...rest.slice(++i)); i = rest.length; break;
    default:          positional.push(arg); i++; break;
  }
}

// ============ Dispatch ============

const command = commands[cmd];

if (!command) {
  err(`未知命令: ${cmd}`);
  warn('输入 ts help 查看帮助');
  process.exit(1);
}

if (showHelp) {
  printCommandHelp(cmd, command.usage, command.desc);
  process.exit(0);
}

// Load config and run
loadConfig();

try {
  const result = await command.run(positional, opts);
  output(result, opts.raw);
} catch (e) {
  err(e.message);
  process.exit(1);
}
