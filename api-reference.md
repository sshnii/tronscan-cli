# TronScan API 速查表

Base URL: `https://apilist.tronscanapi.com`
认证 Header: `TRON-PRO-API-KEY: <key>`
通用分页: `start=0&limit=20`（start+limit ≤ 10000）

---

## 账户

| 接口 | 用途 | 关键参数 |
|------|------|----------|
| `GET /api/accountv2?address=` | 账户详情（余额、资源、质押） | `address` |
| `GET /api/account/list` | 账户列表排行 | `start`, `limit`, `sort=-balance` |
| `GET /api/account/tokens` | 账户持仓代币 | `address`, `start`, `limit` |
| `GET /api/account/resourcev2` | Stake 2.0 资源（带宽/能量） | `address` |
| `GET /api/account/resource` | Stake 1.0 资源 | `address` |
| `GET /api/account/approve/list` | 代币授权列表 | `address`, `start`, `limit` |
| `GET /api/account/approve/change` | 授权变更历史 | `address` |
| `GET /api/account/analysis` | 账户日度分析（余额、转账、能量） | `address` |
| `GET /api/account/token_asset_overview` | 钱包持仓总览（含估值） | `address` |
| `GET /api/vote` | 投票记录 | `address` |
| `GET /api/participate_project` | 参与项目 | `address` |
| `GET /api/multiple/chain/query` | 多链地址查询 | `address` |

---

## 交易 & 转账

| 接口 | 用途 | 关键参数 |
|------|------|----------|
| `GET /api/transaction` | 交易列表 | `start`, `limit`, `fromAddress`, `toAddress`, `block`, `start_timestamp`, `end_timestamp` |
| `GET /api/transaction-info?hash=` | 交易详情（按哈希） | `hash` |
| `GET /api/transfer` | TRX & TRC10 转账记录 | `address`, `fromAddress`, `toAddress`, `tokens`, `start`, `limit` |
| `GET /api/token_trc20/transfers` | TRC20/TRC721 转账 | `relatedAddress`, `contract_address`, `fromAddress`, `toAddress`, `start`, `limit`, `start_timestamp`, `end_timestamp` |
| `GET /api/token_trc1155/transfers` | TRC1155 转账 | `relatedAddress`, `contract_address`, `start`, `limit` |
| `GET /api/internal-transaction` | 内部交易 | `address`, `contract`, `block`, `start`, `limit` |
| `GET /api/token_trc20/transfers-with-status` | TRC20 转账（带状态） | `address`, `trc20Id`, `direction`, `start`, `limit` |
| `GET /api/exchange/transaction` | 交易所交易 | `exchangeID`, `address`, `start`, `limit` |
| `GET /api/transaction/statistics` | 交易统计 | - |
| `GET /api/transfer/statistics` | 转账分布统计 | - |

---

## 区块

| 接口 | 用途 | 关键参数 |
|------|------|----------|
| `GET /api/block` | 区块列表/详情 | `start`, `limit`, `producer`, `sort=-number`, `start_timestamp`, `end_timestamp` |
| `GET /api/block/statistic` | 区块统计（24h 出块、销毁等） | - |

---

## 代币

| 接口 | 用途 | 关键参数 |
|------|------|----------|
| `GET /api/tokens/overview` | 代币列表总览 | `start`, `limit`, `filter` |
| `GET /api/token_trc20` | TRC20/721/1155 代币详情 | `contract` |
| `GET /api/token` | TRC10 代币详情 | `id` |
| `GET /api/token_trc20/holders` | TRC20 持有者列表 | `contract_address`, `start`, `limit` |
| `GET /api/tokenholders` | TRC10 持有者列表 | `token`, `start`, `limit` |
| `GET /api/tokens/position-distribution` | 代币持仓分布 | `token` |
| `GET /api/token/price` | 代币价格 | `token` |
| `GET /api/getAssetWithPriceList` | 带价格的代币列表 | - |
| `GET /api/trc721/transfers` | TRC721 转账记录 | `contract`, `tokenId` |
| `GET /api/token_trc20/totalSupply` | TRC20 流通量 | `contract` |
| `GET /api/trc721/token` | TRC721 NFT 详情 | `contract` |
| `GET /api/trc1155/inventory` | TRC1155 库存 | `contract` |
| `GET /api/token/all` | 所有已索引代币 | `start`, `limit` |

---

## 合约

| 接口 | 用途 | 关键参数 |
|------|------|----------|
| `GET /api/contracts` | 合约列表 | `search`, `sort`, `start`, `limit`, `verified-only`, `open-source-only` |
| `GET /api/contract` | 合约详情 | `contract` |
| `POST /api/contracts/smart-contract-triggers-batch` | 合约事件 | `contractAddress`, `hashList`, `term`, `limit` |
| `GET /api/onecontractenergystatistic` | 合约能量消耗 | `address` |
| `GET /api/contracts/top_call` | 合约调用者排行 | `contract_address` |
| `GET /api/onecontractcallerstatistic` | 每日独立调用者 | `address`, `start_timestamp`, `end_timestamp` |
| `GET /api/onecontracttriggerstatistic` | 每日调用次数 | `address`, `start_timestamp`, `end_timestamp` |
| `GET /api/contract/analysis` | 合约日度分析 | `address`, `type`(0-5), `start_timestamp`, `end_timestamp` |
| `GET /api/onecontractcallers` | 所有调用者列表 | `address`, `day`, `start`, `limit` |
| `GET /api/contracts/trigger` | 合约触发交易 | `start`, `limit`, `start_timestamp`, `end_timestamp` |

---

## 超级代表 & 治理

| 接口 | 用途 | 关键参数 |
|------|------|----------|
| `GET /api/pagewitness` | SR 列表 | `witnesstype`(0=SR,1=partner,3=candidate) |
| `GET /api/account/votes` | 账户投票记录 | `address` |
| `GET /api/vote/witness` | SR 当前投票详情 | `address` |
| `GET /api/witness/general-info` | SR 总览统计 | - |
| `GET /api/chainparameters` | 链参数列表 | - |
| `GET /api/proposal` | 提案信息 | `id`, `start`, `limit`, `address` |

---

## 安全检测

| 接口 | 用途 | 关键参数 |
|------|------|----------|
| `GET /api/security/account/data` | 账户风险检测 | `address` |
| `GET /api/security/token/data` | 代币安全检测 | `address` |
| `GET /api/security/url/data` | URL 钓鱼检测 | `url` |
| `GET /api/security/transaction/data` | 交易风险检测 | `hashes` |
| `GET /api/security/sign/data` | 多签配置检查 | `address` |
| `GET /api/security/auth/data` | 授权风险检查 | `address` |

---

## 首页 & 搜索

| 接口 | 用途 | 关键参数 |
|------|------|----------|
| `GET /api/system/homepage-bundle` | 首页综合数据 | - |
| `GET /api/search/v2` | 全局搜索 | `term`, `type`(token/address/contract/transaction/block), `start`, `limit` |
| `GET /api/search/bar` | 热门搜索代币 | - |
| `GET /api/search/hot` | 热搜排行 | - |
| `GET /api/system/tps` | 当前 TPS | - |
| `GET /api/nodemap` | 全网节点信息 | - |

---

## 链上统计

| 接口 | 用途 | 关键参数 |
|------|------|----------|
| `GET /api/funds` | TRX 供应量/销毁 | - |
| `GET /api/turnover` | TRX 发行与销毁分析 | - |
| `GET /api/trx/volume` | TRX 历史价格和交易量 | - |
| `GET /api/overview/dailytransactionnum` | 每日交易数趋势 | - |
| `GET /api/overview/transactionnum` | 累计交易数 | - |
| `GET /api/account/active_statistic` | 每日活跃账户 | - |
| `GET /api/overview/dailyaccounts` | 每日新增账户 | - |
| `GET /api/energydailystatistic` | 每日能量消耗 | - |
| `GET /api/energystatistic` | 能量消耗分布 | - |
| `GET /api/acquisition_cost_statistic` | 能量/带宽获取成本 | - |
| `GET /api/netstatistic` | 每日带宽消耗 | - |
| `GET /api/triggeramountstatistic` | 合约调用分布 | - |
| `GET /api/tokenTvc` | 代币链上价值(TVC) | - |
| `GET /api/token/analysis` | 代币交易分析 | - |
| `GET /api/tokenTransfer/analysis` | 代币转账分析 | - |
| `GET /api/overview/dailyavgblockSize` | 平均区块大小 | - |
| `GET /api/overview/totalblockchainsize` | 区块链总大小 | - |
| `GET /api/top10` | Top 10 排行 | - |
| `GET /api/defiTvl` | DeFi TVL | - |

---

## 深度分析

| 接口 | 用途 | 关键参数 |
|------|------|----------|
| `GET /api/deep/account/relatedAccount` | 关联账户 | `address` |
| `GET /api/deep/account/transferAmount` | 资金流入/流出分析 | `address` |
| `GET /api/deep/account/token/bigAmount` | 大额交易 | `address`, `token`, `type` |
| `GET /api/deep/account/holderToken/basicInfo/trc20/transfer` | 代币转账次数 | `address` |

---

## 稳定币分析

| 接口 | 用途 | 关键参数 |
|------|------|----------|
| `GET /api/stableCoin/holder/balance/overview` | 持仓分布概览 | - |
| `GET /api/stableCoin/holder/change` | 持有者变化趋势 | - |
| `GET /api/stableCoin/holder/top` | 大户排行 | - |
| `GET /api/deep/stableCoin/bigAmount` | 稳定币大额交易 | - |
| `GET /api/deep/stableCoin/totalSupply/keyEvents` | 增发/销毁/黑名单事件 | - |
| `GET /api/stableCoin/distribution` | 交易所/DeFi 分布 | - |
| `GET /api/deep/stableCoin/liquidity/transaction` | 流动性操作记录 | - |
| `GET /api/stableCoin/pool/overview` | 池子概览(TVL) | - |
| `GET /api/stableCoin/pool/trend` | 池子趋势 | - |
| `GET /api/stableCoin/pool/change` | 池子历史变化 | - |
| `GET /api/stableCoin/tvl` | 稳定币 TVL 分布 | - |
