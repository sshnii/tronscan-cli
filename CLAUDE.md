# TronScan CLI

## 这是什么

基于 TronScan API 的命令行工具（Node.js / JavaScript）。支持 80+ 子命令，覆盖账户、交易、区块、代币、安全、统计等场景。

## 自动识别规则

当用户消息涉及以下内容时，**自动执行对应命令**，无需用户明确要求：

### 触发关键词 → 命令映射

| 用户意图 | 执行命令 |
|----------|----------|
| 查地址/余额/账户 | `ts account <addr>` |
| 查持仓/代币余额 | `ts account-tokens <addr>` |
| 查资源/能量/带宽 | `ts account-resource <addr>` |
| 查授权/approve | `ts account-approve <addr>` |
| 查交易/tx hash | `ts tx <hash>` |
| 查转账记录 | `ts transfer <addr>` 或 `ts transfer-trc20 <addr>` |
| 查区块/最新区块 | `ts block` |
| 查代币信息 | `ts token <contract>` |
| 查代币持有者 | `ts token-holders <contract>` |
| 查代币价格 | `ts token-price <token>` |
| 查合约 | `ts contract <addr>` |
| 安全检测/风险/是否安全 | `ts security-account` / `ts security-token` |
| 钓鱼/诈骗 URL | `ts security-url <url>` |
| 搜索 | `ts search <keyword>` |
| TPS | `ts tps` |
| TRX 供应量/销毁 | `ts trx-supply` |
| 活跃账户 | `ts active-accounts` |
| DeFi TVL | `ts defi-tvl` |
| 关联分析/资金追踪 | `ts deep-related` / `ts deep-flow` |
| 大额交易 | `ts deep-big-tx <addr>` |
| 稳定币 | `ts stable-*` 系列 |
| SR/超级代表 | `ts sr` |
| 链参数 | `ts params` |

### 首次配置

当用户提到配置 API Key、首次安装、setup 等，引导执行：

```bash
ts setup <your-api-key>    # 直接写入
ts setup                   # 查看配置状态和引导
```

### 执行模板

先在本机全局安装（在克隆目录执行 `npm link` 或 `npm install -g .`），再：

```bash
ts <command> [args...]
```

### 输出要求

- 执行命令后，**用简洁中文解读 JSON 结果**，提取关键字段
- 金额自动换算（sun → TRX，除以 1,000,000）
- 大数字加千分位
- 如果结果有风险标记，醒目提示

## 用户也可以直接敲命令

```bash
# 全局安装后直接用
ts help                          # 查看所有命令
ts account TXxx...               # 查账户
ts security-token TRxx...        # 代币安全检测
ts api "/api/xxx?param=value"    # 直接调 API（兜底）
```

## 注意事项

- API Key 在 `.env` 文件中，**禁止提交到版本控制**
- 分页参数支持 `--start N` `--limit N`，默认 0 和 20
- 完整 API 文档见 `api-reference.md`
- `ts api` 兜底命令可直接调用任何未封装的接口
