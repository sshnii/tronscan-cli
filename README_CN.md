# TronScan CLI

[English](README.md)

基于 [TronScan API](https://docs.tronscan.org/) 的命令行工具，75+ 命令覆盖账户、交易、区块、代币、合约、安全检测、统计、深度分析等场景。

支持两种使用方式：**终端命令行直接调用** 和 **在 AI IDE 中用自然语言查询**（支持 [Claude Code](https://claude.ai/code)、[Cursor](https://cursor.com)、VS Code Copilot 等）。

## 安装

```bash
git clone https://github.com/sshnii/tronscan-cli.git
cd tronscan-cli
cp .env.example .env
# 编辑 .env 填入你的 API Key
```

API Key 申请：https://docs.tronscan.org/zh/api/api-keys

> **建议：** 把 source 加到 `~/.zshrc`，这样每次打开终端就能直接使用 `ts` 命令：
> ```bash
> echo 'source "/path/to/tronscan-cli/tronscan.sh"' >> ~/.zshrc
> ```

## 方式一：终端命令行

```bash
# 加载
source tronscan.sh

# 查看所有命令
ts help

# 示例
ts account TXxx...              # 账户详情
ts tx 0xabc...                  # 交易详情
ts transfer-trc20 TXxx...       # TRC20 转账记录
ts token TR7NHqje...            # 代币信息
ts security-account TXxx...     # 账户风险检测
ts tps                          # 当前 TPS
ts block-num                    # 最新区块高度
ts search sunswap               # 全局搜索
```

## 方式二：在 AI IDE 中用自然语言查询

将本项目作为工作目录，AI 会自动读取规则文件，识别你的查询意图，选择合适的 API 接口并解读返回结果。

已内置规则文件：

| AI IDE | 规则文件 |
|--------|----------|
| Claude Code | `CLAUDE.md` |
| Cursor | `.cursorrules` |
| VS Code Copilot | `.github/copilot-instructions.md` |

以 Claude Code 为例，你只需要用自然语言描述需求：

```
你：查一下这个地址的余额 TXxx...
AI：自动执行 ts account TXxx... 并返回解读结果

你：这个代币安全吗 TRxx...
AI：自动执行 ts security-token TRxx... 并分析风险

你：分析这个地址的 USDT 转账记录
AI：自动执行 ts transfer-trc20 TXxx... 并生成转账分析报告

你：当前 TPS 多少
AI：自动执行 ts tps 并返回结果
```

无需记住任何命令和 API 路径，AI 会根据 `api-reference.md` 中的 80+ 接口自动匹配最合适的调用方式。

## 依赖

- bash
- curl
- [jq](https://jqlang.github.io/jq/download/)

## 命令分类

| 分类 | 命令数 | 说明 |
|------|--------|------|
| 账户 | 11 | 余额、持仓、资源、授权、投票、分析 |
| 交易 | 10 | 交易详情、转账记录(TRX/TRC20/TRC721/TRC1155) |
| 区块 | 4 | 最新区块、指定区块、区块统计 |
| 代币 | 13 | 代币详情、持有者、价格、流通量、NFT |
| 合约 | 10 | 合约详情、调用者、能量消耗、日度分析 |
| 超级代表 | 5 | SR 列表、投票、链参数、提案 |
| 安全 | 6 | 账户/代币/URL/交易风险检测、授权检查 |
| 搜索 | 5 | 全局搜索、TPS、首页概览、热搜、节点 |
| 统计 | 19 | TRX 供应、交易趋势、活跃账户、能量、DeFi TVL |
| 深度分析 | 4 | 关联账户、资金流向、大额交易 |
| 稳定币 | 11 | 持仓分布、大户、增发/销毁、流动性池 |

输入 `ts help` 查看完整命令列表。

## API 参考

完整 API 接口列表见 [api-reference.md](api-reference.md)。

## License

MIT
