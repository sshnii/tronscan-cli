# TronScan CLI

[中文文档](README_CN.md)

A CLI tool built on [TronScan API](https://docs.tronscan.org/), providing 80+ subcommands covering tokens, search, blocks, accounts, governance, transactions, statistics, contracts, security, deep analysis, stablecoins, and more.

Two ways to use: **terminal commands** and **natural language queries in AI IDEs** ([Claude Code](https://claude.ai/code), [Cursor](https://cursor.com), VS Code Copilot, etc.).

## Install

```bash
git clone https://github.com/sshnii/tronscan-cli.git
cd tronscan-cli
npm install
npm run build
cp .env.example .env
# Edit .env and fill in your API Key
```

Get your API Key: https://docs.tronscan.org/zh/api/api-keys

> **Tip:** Run `npm link` to register the `ts` command globally, so you can use it from any directory:
> ```bash
> npm link
> ts help
> ```

## Option 1: Terminal Commands

```bash
# View all commands
ts help

# Examples
ts token usdt                   # Token info
ts search usdt                  # Search
ts block                        # Latest block
ts tps                          # Current TPS
ts account TXxx...              # Account details
ts tx af949...                  # Transaction hash
ts transfer-trc20 TXxx...       # TRC20 transfers
ts security-account TXxx...     # Account risk check
```

## Option 2: Natural Language Queries in AI IDEs

Open this project as your working directory. The AI will automatically read the rule files, understand your query intent, select the right API, and interpret the results.

Built-in rule files:

| AI IDE | Rule File |
|--------|-----------|
| Claude Code | `CLAUDE.md` |
| Cursor | `.cursorrules` |
| VS Code Copilot | `.github/copilot-instructions.md` |

Example using Claude Code:

```
You: Look up USDT token info
AI:  Runs ts token usdt and summarizes key fields (price, supply, holders, etc.)

You: Show account details for TXxx...
AI:  Runs ts account TXxx... and interprets balance, resources, and related fields

You: What's the TRON network overview?
AI:  Runs ts overview and summarizes the bundled network stats

You: What's the latest block?
AI:  Runs ts block and summarizes the latest block (or height and key fields)

You: What's the current TPS?
AI:  Runs ts tps and returns the result
```

No need to memorize commands or API paths — the AI matches the best endpoint from 80+ APIs in `api-reference.md`.

## Dependencies

- [Node.js](https://nodejs.org/) >= 18

## Command Categories

| Category | Count | Description |
|----------|-------|-------------|
| Token | 7 | Token details, holders, price, list, distribution |
| Search | 2 | Search, trending tokens |
| Overview | 3 | TPS, TRON network overview, nodes |
| Block | 1 | Latest or specific block |
| Account | 11 | Balance, holdings, resources, approvals, votes, analysis |
| Super Representative | 4 | SR list, votes, chain parameters, proposals |
| Transaction | 10 | Transaction details, transfers (TRX/TRC20/TRC721/TRC1155) |
| Statistics | 19 | TRX supply, transaction trends, active accounts, energy, DeFi TVL |
| Contract | 10 | Contract details, callers, energy consumption, daily analysis |
| Security | 6 | Account/token/URL/transaction risk detection, authorization check |
| Deep Analysis | 4 | Related accounts, fund flow, large transactions |
| Stablecoin | 11 | Holder distribution, top holders, mint/burn, liquidity pools |

Run `ts help` for the full command list.

## API Reference

See [api-reference.md](api-reference.md) for the complete API endpoint list.

## License

MIT
