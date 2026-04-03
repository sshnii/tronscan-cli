#!/usr/bin/env node

import { resolve } from 'path';
import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'fs';
import { loadConfig, output, err, warn, VERSION, PROJECT_ROOT } from './api.js';
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

// ============ Setup (before loadConfig) ============

if (cmd === 'setup') {
  const envPath = resolve(PROJECT_ROOT, '.env');
  const examplePath = resolve(PROJECT_ROOT, '.env.example');
  const isTTY = process.stderr.isTTY ?? false;
  const green = (s) => (isTTY ? `\x1b[32m${s}\x1b[0m` : s);
  const bold = (s) => (isTTY ? `\x1b[1m${s}\x1b[0m` : s);
  const dim = (s) => (isTTY ? `\x1b[2m${s}\x1b[0m` : s);

  const inputKey = positional[0];

  if (inputKey) {
    // 校验：过滤明显无效的输入
    if (/[<>]/.test(inputKey) || inputKey === 'your-api-key' || inputKey === 'your_api_key_here') {
      err('请替换为你的真实 API Key');
      warn('API Key 申请: https://tronscan.org/#/developer/api');
      process.exit(2);
    }
    // 直接写入 API Key
    writeFileSync(envPath, `TRONSCAN_API_KEY=${inputKey}\n`);
    console.log(green('✓ API Key 已写入 .env'));
    console.log(dim(`  路径: ${envPath}`));
    console.log(`\n  现在可以使用 ${bold('ts')} 命令了，试试: ${bold('ts tps')}`);
    process.exit(0);
  }

  // 检查现有配置
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8');
    const match = content.match(/^\s*TRONSCAN_API_KEY\s*=\s*(.+?)\s*$/m);
    const key = match?.[1]?.replace(/^["']|["']$/g, '');
    if (key && key !== 'your_api_key_here') {
      console.log(green('✓ API Key 已配置'));
      console.log(dim(`  路径: ${envPath}`));
      console.log(dim(`  Key: ${key.slice(0, 8)}...${key.slice(-4)}`));
      process.exit(0);
    }
  }

  // 未配置，引导用户
  if (!existsSync(envPath) && existsSync(examplePath)) {
    copyFileSync(examplePath, envPath);
  }

  console.log(bold('TronScan CLI 配置向导\n'));
  console.log(`  1. 申请 API Key: ${bold('https://tronscan.org/#/developer/api')}`);
  console.log(`  2. 运行: ${bold('ts setup YOUR_API_KEY')}`);
  console.log(`     或手动编辑: ${dim(envPath)}`);
  console.log(`\n  也可设置环境变量: ${bold('export TRONSCAN_API_KEY=YOUR_API_KEY')}`);
  process.exit(0);
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
