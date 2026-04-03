# TronScan CLI

[English](README.md)

基于 [TronScan API](https://docs.tronscan.org/) 的命令行工具，80+ 子命令覆盖代币、搜索、区块、账户、治理、交易、统计、合约、安全、深度分析、稳定币等场景。

支持两种使用方式：**终端全局命令 `ts`** 和 **在 AI IDE 中用自然语言查询**（支持 [Claude Code](https://claude.ai/code)、[Cursor](https://cursor.com)、VS Code Copilot 等）。

## 安装

### 一、通过 npm 全局安装

```bash
npm install -g @tronscanteam/cli
```

安装后即可在任意目录使用全局命令 **`ts`**，输入 `ts setup` 设置 API Key，输入 `ts help` 查看全部命令。

**配置 API Key**：

API Key 申请：https://docs.tronscan.org/zh/api/api-keys

```bash
ts setup YOUR_API_KEY    # 替换为你的真实 API Key
```

### 二、从源码克隆安装

```bash
git clone https://github.com/sshnii/tronscan-cli.git
cd tronscan-cli
npm install
npm link
ts setup YOUR_API_KEY    # 替换为你的真实 API Key
```

## 使用方式

### 一、在终端中使用

全局安装 `ts` 后，在终端直接输入命令：

```bash
ts help                         # 查看所有子命令
ts token usdt                   # 代币信息
ts search usdt                  # 搜索
ts block                        # 最新区块
ts tps                          # 当前 TPS
ts account TXxx...              # 账户详情
ts tx af949...                  # 按交易哈希查询
ts transfer-trc20 TXxx...       # TRC20 转账记录
ts security-account TXxx...     # 账户风险检测
```

### 二、在 AI IDE 中使用

若要在 AI IDE 中使用，建议优先通过从源码克隆的方式安装。克隆会下载完整的规则文件（`CLAUDE.md`、`.cursorrules`、`.github/copilot-instructions.md`），提升 AI 回复的准确性。首次使用运行 `ts setup` 即可快速完成 API Key 配置。

| AI IDE | 规则文件 |
|--------|----------|
| Claude Code | `CLAUDE.md` |
| Cursor | `.cursorrules` |
| VS Code Copilot | `.github/copilot-instructions.md` |

以 Claude Code 为例，你只需要用自然语言描述需求：

```
你：查一下 USDT 代币信息
AI：自动执行 ts token usdt 并解读价格、供应、持币地址等关键字段

你：查一下这个地址的账户信息 TXxx...
AI：自动执行 ts account TXxx... 并解读余额、资源等相关字段

你：TRON 网络概况怎么样
AI：自动执行 ts overview 并汇总网络综合数据

你：最新区块是什么
AI：自动执行 ts block 并解读最新区块（或高度与关键字段）

你：当前 TPS 多少
AI：自动执行 ts tps 并返回结果
```

无需记住任何命令和 API 路径，AI 会根据 `api-reference.md` 中的 80+ 接口自动匹配最合适的调用方式。

## 依赖

- [Node.js](https://nodejs.org/) >= 18

## 命令分类

| 分类 | 命令数 | 说明 |
|------|--------|------|
| 代币 | 7 | 代币详情、持有者、价格、列表、持仓分布 |
| 搜索 | 2 | 搜索、热搜代币 |
| 概览 | 3 | TPS、TRON 网络概览、节点 |
| 区块 | 1 | 最新或指定区块 |
| 账户 | 11 | 余额、持仓、资源、授权、投票、分析 |
| 超级代表 | 4 | SR 列表、投票、链参数、提案 |
| 交易 | 10 | 交易详情、转账记录(TRX/TRC20/TRC721/TRC1155) |
| 统计 | 17 | TRX 供应、交易趋势、活跃账户、能量、DeFi TVL |
| 合约 | 9 | 合约详情、调用者、能量消耗、日度分析 |
| 安全 | 6 | 账户/代币/URL/交易风险检测、授权检查 |
| 深度分析 | 4 | 关联账户、资金流向、大额交易 |
| 稳定币 | 11 | 持仓分布、大户、增发/销毁、流动性池 |

## API 参考

完整 API 接口列表见 [api-reference.md](api-reference.md)。

## License

MIT
