# TronScan CLI

[中文文档](README_CN.md)

A CLI tool built on [TronScan API](https://docs.tronscan.org/), providing 80+ subcommands covering tokens, search, blocks, accounts, governance, transactions, statistics, contracts, security, deep analysis, stablecoins, and more.

Two ways to use: **`ts` in the terminal** (after global install) and **natural language in AI IDEs** ([Claude Code](https://claude.ai/code), [Cursor](https://cursor.com), VS Code Copilot, etc.).

## Install

### 1. Install from npm (recommended)

```bash
npm install -g @tronscanteam/cli
```

This registers the global command **`ts`** for use in any directory.

**API Key**:

Get your API Key: https://docs.tronscan.org/zh/api/api-keys

**Method A: environment variable**

Persist it in your shell config, then `source` once. zsh example:

```bash
echo 'export TRONSCAN_API_KEY="your-api-key"' >> ~/.zshrc
source ~/.zshrc
```

For bash, use `~/.bashrc` or `~/.bash_profile` instead of `~/.zshrc`.

**Method B: `.env` next to the global package**

Create `.env` under `$(npm root -g)/@tronscanteam/cli/` with `TRONSCAN_API_KEY=your-api-key`.

### 2. Install from source (clone)

```bash
git clone https://github.com/sshnii/tronscan-cli.git
cd tronscan-cli
npm install
cp .env.example .env
# Edit .env and set TRONSCAN_API_KEY
```

Register **`ts`** on your machine:

```bash
npm link
# or
npm install -g .
```

The CLI reads `.env` from the **cloned project root** (next to `package.json`). After that, run `ts` from any working directory.

## Usage

### 1. In the terminal

After installing `ts` globally, run commands directly:

```bash
ts help                         # list all subcommands
ts token usdt                   # token info
ts search usdt                  # search
ts block                        # latest block
ts tps                          # current TPS
ts account TXxx...              # account details
ts tx af949...                  # transaction by hash
ts transfer-trc20 TXxx...       # TRC20 transfers
ts security-account TXxx...     # account risk check
```

### 2. In AI IDEs

To use with AI IDEs, we recommend installing from source (clone). Cloning downloads the full set of rule files (`CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`), which improve AI response accuracy. Run `ts setup` on first use to quickly configure your API Key.

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
| Statistics | 17 | TRX supply, transaction trends, active accounts, energy, DeFi TVL |
| Contract | 9 | Contract details, callers, energy consumption, daily analysis |
| Security | 6 | Account/token/URL/transaction risk detection, authorization check |
| Deep Analysis | 4 | Related accounts, fund flow, large transactions |
| Stablecoin | 11 | Holder distribution, top holders, mint/burn, liquidity pools |

Run `ts help` for the full command list.

## API Reference

See [api-reference.md](api-reference.md) for the complete API endpoint list.

## License

MIT
