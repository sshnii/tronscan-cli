# TronScan CLI

基于 TronScan API 的命令行工具（Node.js / JavaScript），80+ 子命令覆盖账户、交易、区块、代币、安全、统计等场景。

## 自动识别规则

当用户消息涉及 TRON 链上数据查询时，自动执行对应命令，无需用户明确要求。

### 执行方式

全局安装后（克隆目录下 `npm link` 或 `npm install -g .`）：

```bash
ts <command> [args...]
```

`.env` 配置在克隆的项目根目录（与 `package.json` 同级）。

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
| 安全检测/风险 | `ts security-account <addr>` / `ts security-token <addr>` |
| 钓鱼/诈骗 URL | `ts security-url <url>` |
| 搜索 | `ts search <keyword>` |
| TPS | `ts tps` |
| TRX 供应量/销毁 | `ts trx-supply` |
| 活跃账户 | `ts active-accounts` |
| DeFi TVL | `ts defi-tvl` |
| 关联分析/资金追踪 | `ts deep-related <addr>` / `ts deep-flow <addr>` |
| 大额交易 | `ts deep-big-tx <addr>` |
| 稳定币 | `ts stable-*` 系列 |
| SR/超级代表 | `ts sr` |
| 链参数 | `ts params` |

### 输出要求

- 执行命令后，用简洁中文解读 JSON 结果，提取关键字段
- 金额自动换算（sun → TRX，除以 1,000,000）
- 大数字加千分位
- 如果结果有风险标记，醒目提示

### 查看所有命令

```bash
ts help
```

### 完整 API 参考

见项目内 `api-reference.md`，包含 80+ 接口路径和参数说明。未封装的接口可通过 `ts api "/api/xxx?param=value"` 调用。

### 注意事项

- API Key 在 `.env` 文件中，禁止提交到版本控制
- 分页参数支持 `--start N` `--limit N`，默认 0 和 20
