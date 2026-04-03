import { VERSION, c } from './api.js';

export function printHelp() {
  const isTTY = process.stdout.isTTY ?? false;
  const B = (s) => (isTTY ? `\x1b[1m${s}\x1b[0m` : s);
  const C = (s) => (isTTY ? `\x1b[36m${s}\x1b[0m` : s);

  console.log(`${B(`TronScan CLI v${VERSION}`)} - TRON 链上数据查询工具

${C('用法:')} ts <command> [args...] [options...]

${B('全局选项:')}
  --start N     分页起始位置（默认 0）
  --limit N     每页数量（默认 20）
  --sort FIELD  排序字段
  --raw         输出紧凑 JSON（适合管道）
  --help, -h    显示命令帮助
  --version, -V 显示版本号

  配置:
    ts setup [api-key]              配置 API Key（首次使用必须）

  代币:
    ts token <contract|symbol>      TRC20 代币详情（支持 USDT 等符号）
    ts token-trc10 <id|symbol>      TRC10 代币详情
    ts token-holders <contract|symbol> TRC20 持有者列表
    ts token-holders-trc10 <token|symbol> TRC10 持有者列表
    ts token-price <symbol>         代币价格（如 trx、usdt）
    ts token-list                   代币排行
    ts token-distribution <token>   持仓分布

  搜索:
    ts search <keyword>             搜索
    ts hot-token                    热搜代币排行

  概览:
    ts tps                          当前 TPS
    ts overview                     TRON 网络概览
    ts nodes                        全网节点信息

  区块:
    ts block [number]               最新区块（传区块号查指定区块）

  账户:
    ts account <addr>               账户详情
    ts account-list                 账户排行榜
    ts account-tokens <addr>        持仓代币
    ts account-resource <addr>      Stake 2.0 资源(带宽/能量)
    ts account-resource-v1 <addr>   Stake 1.0 资源
    ts account-approve <addr>       代币授权列表
    ts account-approve-change <addr> 授权变更历史
    ts account-votes <addr>         投票记录
    ts account-analysis <addr>      日度分析
    ts account-asset <addr>         持仓总览(含估值)
    ts account-projects <addr>      参与项目

  超级代表:
    ts sr [type]                    SR 列表 (0=SR,1=partner,3=candidate)
    ts sr-votes <addr>              SR 投票详情
    ts params                       链参数
    ts proposal <id>                提案详情

  交易:
    ts tx <hash>                    交易详情
    ts tx-list                      交易列表
    ts tx-stats                     交易统计
    ts transfer <addr>              TRX/TRC10 转账
    ts transfer-stats               转账分布统计
    ts transfer-trc20 <addr>        TRC20 转账(按地址)
    ts transfer-trc20-contract <contract> TRC20 转账(按合约)
    ts transfer-trc1155 <addr>      TRC1155 转账
    ts transfer-trc721 <contract> <tokenId> TRC721 转账
    ts internal-tx <addr>           内部交易

  统计:
    ts trx-supply                   TRX 供应/销毁
    ts trx-turnover                 TRX 发行与销毁分析
    ts tx-trend                     每日交易趋势
    ts tx-total                     累计交易数
    ts active-accounts              活跃账户
    ts new-accounts                 新增账户
    ts defi-tvl                     DeFi TVL
    ts top10                        Top 10 排行
    ts trx-price                    TRX 价格历史
    ts energy-daily                 每日能量消耗
    ts energy-dist                  能量消耗分布
    ts energy-cost                  能量/带宽获取成本
    ts bandwidth-daily              每日带宽消耗
    ts trigger-stats                合约调用分布
    ts token-tvc                    代币链上价值(TVC)
    ts token-analysis <contract|symbol> 代币交易分析
    ts token-transfer-analysis      代币转账分析

  合约:
    ts contract <addr>              合约详情
    ts contract-list                合约列表
    ts contract-callers <addr>      调用者排行
    ts contract-energy <addr>       能量消耗统计
    ts contract-daily-callers <addr> <start_ts> <end_ts> 每日独立调用者
    ts contract-daily-calls <addr> <start_ts> <end_ts>   每日调用次数
    ts contract-analysis <addr> [type] 合约日度分析(type:0-5)
    ts contract-all-callers <addr> [day] 所有调用者列表
    ts contract-triggers            合约触发交易


  安全:
    ts security-account <addr>      账户风险检测
    ts security-token <addr>        代币安全检测
    ts security-url <url>           URL 钓鱼检测
    ts security-tx <hash>           交易风险检测
    ts security-auth <addr>         授权风险检查
    ts security-sign <addr>         多签配置检查

  深度分析:
    ts deep-related <addr>          关联账户
    ts deep-flow <addr>             资金流向
    ts deep-big-tx <addr>           大额交易
    ts deep-token-transfer <addr> <contract> 代币转账次数

  稳定币:
    ts stable-holders               持仓分布概览
    ts stable-change                持有者变化趋势
    ts stable-top                   大户排行
    ts stable-big-tx [types]        大额交易 (1=USDT 2=USDJ 3=TUSD 4=USDC)
    ts stable-events                增发/销毁/黑名单事件
    ts stable-dist <contract>       交易所/DeFi 分布
    ts stable-liquidity             流动性操作记录
    ts stable-pool <pool_address>   池子概览(TVL)
    ts stable-pool-trend <pool_address> 池子趋势
    ts stable-pool-change <pool_address> 池子历史变化
    ts stable-tvl                   稳定币 TVL 分布
`);
}

export function printCommandHelp(name, usage, desc) {
  const isTTY = process.stdout.isTTY ?? false;
  const B = (s) => (isTTY ? `\x1b[1m${s}\x1b[0m` : s);
  const C = (s) => (isTTY ? `\x1b[36m${s}\x1b[0m` : s);

  console.log(`${B('用法:')} ${usage}`);
  console.log(`  ${C(desc)}\n`);
  console.log(`  全局选项: --raw (紧凑JSON)  --start N  --limit N  --sort FIELD`);
}
