#!/usr/bin/env bash
# TronScan CLI - TRON 链上数据查询工具
# 用法: source tronscan.sh && ts <command> [args...]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_URL="https://apilist.tronscanapi.com"

# 加载 API Key
if [[ -z "$TRONSCAN_API_KEY" ]]; then
  if [[ -f "$SCRIPT_DIR/.env" ]]; then
    source "$SCRIPT_DIR/.env"
  else
    echo "错误: 未找到 API Key。请设置 TRONSCAN_API_KEY 环境变量或创建 .env 文件" >&2
    return 1 2>/dev/null || exit 1
  fi
fi

# ============ 底层请求 ============

_ts_get() {
  local path="$1"
  local response
  response=$(curl -s -w "\n%{http_code}" \
    -H "TRON-PRO-API-KEY: ${TRONSCAN_API_KEY}" \
    "${BASE_URL}${path}")
  local http_code=$(echo "$response" | tail -1)
  local body=$(echo "$response" | sed '$d')
  if [[ "$http_code" -ge 400 ]]; then
    echo "请求失败 [HTTP $http_code]" >&2
    echo "$body" >&2
    return 1
  fi
  echo "$body" | jq . 2>/dev/null || echo "$body"
}

_ts_post() {
  local path="$1" data="$2"
  local response
  response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "TRON-PRO-API-KEY: ${TRONSCAN_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$data" "${BASE_URL}${path}")
  local http_code=$(echo "$response" | tail -1)
  local body=$(echo "$response" | sed '$d')
  if [[ "$http_code" -ge 400 ]]; then
    echo "请求失败 [HTTP $http_code]" >&2
    echo "$body" >&2
    return 1
  fi
  echo "$body" | jq . 2>/dev/null || echo "$body"
}

# ============ 子命令 ============

# --- 账户 ---
ts_account()               { _ts_get "/api/accountv2?address=$1"; }
ts_account_list()          { _ts_get "/api/account/list?start=${1:-0}&limit=${2:-20}&sort=${3:--balance}"; }
ts_account_tokens()        { _ts_get "/api/account/tokens?address=$1&start=${2:-0}&limit=${3:-20}"; }
ts_account_resource()      { _ts_get "/api/account/resourcev2?address=$1"; }
ts_account_resource_v1()   { _ts_get "/api/account/resource?address=$1"; }
ts_account_approve()       { _ts_get "/api/account/approve/list?address=$1&start=${2:-0}&limit=${3:-20}"; }
ts_account_approve_change(){ _ts_get "/api/account/approve/change?address=$1&start=${2:-0}&limit=${3:-20}"; }
ts_account_votes()         { _ts_get "/api/vote?address=$1"; }
ts_account_analysis()      { _ts_get "/api/account/analysis?address=$1"; }
ts_account_asset()         { _ts_get "/api/account/token_asset_overview?address=$1"; }
ts_account_projects()      { _ts_get "/api/participate_project?address=$1"; }


# --- 交易 & 转账 ---
ts_tx()                    { _ts_get "/api/transaction-info?hash=$1"; }
ts_tx_list()               { _ts_get "/api/transaction?start=${1:-0}&limit=${2:-20}"; }
ts_tx_stats()              { _ts_get "/api/transaction/statistics"; }
ts_transfer()              { _ts_get "/api/transfer?address=$1&start=${2:-0}&limit=${3:-20}"; }
ts_transfer_stats()        { _ts_get "/api/transfer/statistics"; }
ts_transfer_trc20()        { _ts_get "/api/token_trc20/transfers?relatedAddress=$1&start=${2:-0}&limit=${3:-20}"; }
ts_transfer_trc20_contract() { _ts_get "/api/token_trc20/transfers?contract_address=$1&start=${2:-0}&limit=${3:-20}"; }

ts_transfer_trc1155()      { _ts_get "/api/token_trc1155/transfers?relatedAddress=$1&start=${2:-0}&limit=${3:-20}"; }
ts_transfer_trc721()       { _ts_get "/api/trc721/transfers?contract=$1&tokenId=$2"; }

ts_internal_tx()           { _ts_get "/api/internal-transaction?address=$1&start=${2:-0}&limit=${3:-20}"; }

# --- 区块 ---
ts_block()                 { _ts_get "/api/block?sort=-number&start=${1:-0}&limit=${2:-1}"; }
ts_block_num()             { _ts_get "/api/block?sort=-number&limit=1" | jq '.data[0].number'; }
ts_block_info()            { _ts_get "/api/block?number=$1&limit=1"; }
ts_block_stats()           { _ts_get "/api/block/statistic"; }

# --- 代币 ---
ts_token()                 { _ts_get "/api/token_trc20?contract=$1"; }
ts_token_trc10()           { _ts_get "/api/token?id=$1"; }
ts_token_holders()         { _ts_get "/api/token_trc20/holders?contract_address=$1&start=${2:-0}&limit=${3:-20}"; }
ts_token_holders_trc10()   { _ts_get "/api/tokenholders?token=$1&start=${2:-0}&limit=${3:-20}"; }
ts_token_price()           { _ts_get "/api/token/price?token=$1"; }
ts_token_price_list()      { _ts_get "/api/getAssetWithPriceList"; }
ts_token_supply()          { _ts_get "/api/token_trc20/totalSupply?contract=$1"; }
ts_token_list()            { _ts_get "/api/tokens/overview?start=${1:-0}&limit=${2:-20}"; }
ts_token_all()             { _ts_get "/api/token/all?start=${1:-0}&limit=${2:-20}"; }
ts_token_distribution()    { _ts_get "/api/tokens/position-distribution?token=$1"; }
ts_token_trc721()          { _ts_get "/api/trc721/token?contract=$1"; }
ts_token_trc1155_inv()     { _ts_get "/api/trc1155/inventory?contract=$1"; }
ts_token_trc1155_token()   { _ts_get "/api/trc1155/token/inventory?contract=$1"; }

# --- 合约 ---
ts_contract()              { _ts_get "/api/contract?contract=$1"; }
ts_contract_list()         { _ts_get "/api/contracts?start=${1:-0}&limit=${2:-20}&sort=${3:--trxCount}"; }
ts_contract_callers()      { _ts_get "/api/contracts/top_call?contract_address=$1"; }
ts_contract_energy()       { _ts_get "/api/onecontractenergystatistic?address=$1"; }
ts_contract_daily_callers(){ _ts_get "/api/onecontractcallerstatistic?address=$1&start_timestamp=$2&end_timestamp=$3"; }
ts_contract_daily_calls()  { _ts_get "/api/onecontracttriggerstatistic?address=$1&start_timestamp=$2&end_timestamp=$3"; }
ts_contract_analysis()     { _ts_get "/api/contract/analysis?address=$1&type=${2:-0}"; }
ts_contract_all_callers()  { _ts_get "/api/onecontractcallers?address=$1&day=${2:-1}&start=${3:-0}&limit=${4:-20}"; }
ts_contract_triggers()     { _ts_get "/api/contracts/trigger?start=${1:-0}&limit=${2:-20}"; }
ts_contract_events()       { _ts_post "/api/contracts/smart-contract-triggers-batch" "$1"; }

# --- 超级代表 & 治理 ---
ts_sr()                    { _ts_get "/api/pagewitness?witnesstype=${1:-0}"; }
ts_sr_votes()              { _ts_get "/api/vote/witness?address=$1"; }
ts_sr_info()               { _ts_get "/api/witness/general-info"; }
ts_params()                { _ts_get "/api/chainparameters"; }
ts_proposal()              { _ts_get "/api/proposal?id=$1"; }

# --- 安全 ---
ts_security_account()      { _ts_get "/api/security/account/data?address=$1"; }
ts_security_token()        { _ts_get "/api/security/token/data?address=$1"; }
ts_security_url()          { _ts_get "/api/security/url/data?url=$1"; }
ts_security_tx()           { _ts_get "/api/security/transaction/data?hashes=$1"; }
ts_security_auth()         { _ts_get "/api/security/auth/data?address=$1"; }
ts_security_sign()         { _ts_get "/api/security/sign/data?address=$1"; }

# --- 搜索 & 首页 ---
ts_search()                { _ts_get "/api/search/v2?term=$1&start=0&limit=${2:-10}"; }

ts_tps()                   { _ts_get "/api/system/tps"; }
ts_overview()              { _ts_get "/api/system/homepage-bundle"; }
ts_hot_token()                   { _ts_get "/api/search/hot"; }
ts_nodes()                 { _ts_get "/api/nodemap"; }

# --- 统计 ---
ts_trx_supply()                { _ts_get "/api/funds"; }
ts_turnover()              { _ts_get "/api/turnover"; }
ts_tx_trend()              { _ts_get "/api/overview/dailytransactionnum"; }
ts_tx_total()              { _ts_get "/api/overview/transactionnum"; }
ts_active_accounts()       { _ts_get "/api/account/active_statistic"; }
ts_new_accounts()          { _ts_get "/api/overview/dailyaccounts"; }
ts_defi_tvl()              { _ts_get "/api/defiTvl"; }
ts_top10()                 { _ts_get "/api/top10"; }
ts_trx_price()             { _ts_get "/api/trx/volume"; }
ts_energy_daily()          { _ts_get "/api/energydailystatistic"; }
ts_energy_dist()           { _ts_get "/api/energystatistic"; }
ts_energy_cost()           { _ts_get "/api/acquisition_cost_statistic"; }
ts_bandwidth_daily()       { _ts_get "/api/netstatistic"; }
ts_trigger_stats()         { _ts_get "/api/triggeramountstatistic"; }
ts_token_tvc()             { _ts_get "/api/tokenTvc"; }
ts_token_analysis()        { _ts_get "/api/token/analysis"; }
ts_token_transfer_analysis() { _ts_get "/api/tokenTransfer/analysis"; }
ts_block_size()            { _ts_get "/api/overview/dailyavgblockSize"; }
ts_blockchain_size()       { _ts_get "/api/overview/totalblockchainsize"; }

# --- 深度分析 ---
ts_deep_related()          { _ts_get "/api/deep/account/relatedAccount?address=$1"; }
ts_deep_flow()             { _ts_get "/api/deep/account/transferAmount?address=$1"; }
ts_deep_big_tx()           { _ts_get "/api/deep/account/token/bigAmount?address=$1"; }
ts_deep_token_transfer()   { _ts_get "/api/deep/account/holderToken/basicInfo/trc20/transfer?address=$1"; }

# --- 稳定币 ---
ts_stable_holders()        { _ts_get "/api/stableCoin/holder/balance/overview"; }
ts_stable_change()         { _ts_get "/api/stableCoin/holder/change"; }
ts_stable_top()            { _ts_get "/api/stableCoin/holder/top"; }
ts_stable_big_tx()         { _ts_get "/api/deep/stableCoin/bigAmount"; }
ts_stable_events()         { _ts_get "/api/deep/stableCoin/totalSupply/keyEvents"; }
ts_stable_dist()           { _ts_get "/api/stableCoin/distribution"; }
ts_stable_liquidity()      { _ts_get "/api/deep/stableCoin/liquidity/transaction"; }
ts_stable_pool()           { _ts_get "/api/stableCoin/pool/overview"; }
ts_stable_pool_trend()     { _ts_get "/api/stableCoin/pool/trend"; }
ts_stable_pool_change()    { _ts_get "/api/stableCoin/pool/change"; }
ts_stable_tvl()            { _ts_get "/api/stableCoin/tvl"; }

# ============ 主入口 ============

ts() {
  local cmd="$1"
  shift 2>/dev/null

  case "$cmd" in
    # 账户
    account)               ts_account "$@" ;;
    account-list)          ts_account_list "$@" ;;
    account-tokens)        ts_account_tokens "$@" ;;
    account-resource)      ts_account_resource "$@" ;;
    account-resource-v1)   ts_account_resource_v1 "$@" ;;
    account-approve)       ts_account_approve "$@" ;;
    account-approve-change) ts_account_approve_change "$@" ;;
    account-votes)         ts_account_votes "$@" ;;
    account-analysis)      ts_account_analysis "$@" ;;
    account-asset)         ts_account_asset "$@" ;;
    account-projects)      ts_account_projects "$@" ;;

    # 交易
    tx)                    ts_tx "$@" ;;
    tx-list)               ts_tx_list "$@" ;;
    tx-stats)              ts_tx_stats ;;
    transfer)              ts_transfer "$@" ;;
    transfer-stats)        ts_transfer_stats ;;
    transfer-trc20)        ts_transfer_trc20 "$@" ;;
    transfer-trc20-contract) ts_transfer_trc20_contract "$@" ;;

    transfer-trc1155)      ts_transfer_trc1155 "$@" ;;
    transfer-trc721)       ts_transfer_trc721 "$@" ;;

    internal-tx)           ts_internal_tx "$@" ;;


    # 区块
    block)                 ts_block "$@" ;;
    block-num)             ts_block_num ;;
    block-info)            ts_block_info "$@" ;;
    block-stats)           ts_block_stats ;;

    # 代币
    token)                 ts_token "$@" ;;
    token-trc10)           ts_token_trc10 "$@" ;;
    token-holders)         ts_token_holders "$@" ;;
    token-holders-trc10)   ts_token_holders_trc10 "$@" ;;
    token-price)           ts_token_price "$@" ;;
    token-price-list)      ts_token_price_list ;;
    token-supply)          ts_token_supply "$@" ;;
    token-list)            ts_token_list "$@" ;;
    token-all)             ts_token_all "$@" ;;
    token-distribution)    ts_token_distribution "$@" ;;
    token-trc721)          ts_token_trc721 "$@" ;;
    token-trc1155-inv)     ts_token_trc1155_inv "$@" ;;
    token-trc1155-token)   ts_token_trc1155_token "$@" ;;

    # 合约
    contract)              ts_contract "$@" ;;
    contract-list)         ts_contract_list "$@" ;;
    contract-callers)      ts_contract_callers "$@" ;;
    contract-energy)       ts_contract_energy "$@" ;;
    contract-daily-callers) ts_contract_daily_callers "$@" ;;
    contract-daily-calls)  ts_contract_daily_calls "$@" ;;
    contract-analysis)     ts_contract_analysis "$@" ;;
    contract-all-callers)  ts_contract_all_callers "$@" ;;
    contract-triggers)     ts_contract_triggers "$@" ;;
    contract-events)       ts_contract_events "$@" ;;

    # SR
    sr)                    ts_sr "$@" ;;
    sr-votes)              ts_sr_votes "$@" ;;
    sr-info)               ts_sr_info ;;
    params)                ts_params ;;
    proposal)              ts_proposal "$@" ;;

    # 安全
    security-account)      ts_security_account "$@" ;;
    security-token)        ts_security_token "$@" ;;
    security-url)          ts_security_url "$@" ;;
    security-tx)           ts_security_tx "$@" ;;
    security-auth)         ts_security_auth "$@" ;;
    security-sign)         ts_security_sign "$@" ;;

    # 搜索
    search)                ts_search "$@" ;;

    tps)                   ts_tps ;;
    overview)              ts_overview ;;
    hot-token)             ts_hot_token ;;
    nodes)                 ts_nodes ;;

    # 统计
    trx-supply)            ts_trx_supply ;;
    turnover)              ts_turnover ;;
    tx-trend)              ts_tx_trend ;;
    tx-total)              ts_tx_total ;;
    active-accounts)       ts_active_accounts ;;
    new-accounts)          ts_new_accounts ;;
    defi-tvl)              ts_defi_tvl ;;
    top10)                 ts_top10 ;;
    trx-price)             ts_trx_price ;;
    energy-daily)          ts_energy_daily ;;
    energy-dist)           ts_energy_dist ;;
    energy-cost)           ts_energy_cost ;;
    bandwidth-daily)       ts_bandwidth_daily ;;
    trigger-stats)         ts_trigger_stats ;;
    token-tvc)             ts_token_tvc ;;
    token-analysis)        ts_token_analysis ;;
    token-transfer-analysis) ts_token_transfer_analysis ;;
    block-size)            ts_block_size ;;
    blockchain-size)       ts_blockchain_size ;;

    # 深度分析
    deep-related)          ts_deep_related "$@" ;;
    deep-flow)             ts_deep_flow "$@" ;;
    deep-big-tx)           ts_deep_big_tx "$@" ;;
    deep-token-transfer)   ts_deep_token_transfer "$@" ;;

    # 稳定币
    stable-holders)        ts_stable_holders ;;
    stable-change)         ts_stable_change ;;
    stable-top)            ts_stable_top ;;
    stable-big-tx)         ts_stable_big_tx ;;
    stable-events)         ts_stable_events ;;
    stable-dist)           ts_stable_dist ;;
    stable-liquidity)      ts_stable_liquidity ;;
    stable-pool)           ts_stable_pool ;;
    stable-pool-trend)     ts_stable_pool_trend ;;
    stable-pool-change)    ts_stable_pool_change ;;
    stable-tvl)            ts_stable_tvl ;;

    # 直接调 API（兜底）
    api)                   _ts_get "$@" ;;

    # 帮助
    help|"")
      cat <<'HELP'
TronScan CLI (ts) - 命令列表

  账户:
    ts account <addr>               账户详情
    ts account-list [start] [limit] 账户排行榜
    ts account-tokens <addr>        持仓代币
    ts account-resource <addr>      Stake 2.0 资源(带宽/能量)
    ts account-resource-v1 <addr>   Stake 1.0 资源
    ts account-approve <addr>       代币授权列表
    ts account-approve-change <addr> 授权变更历史
    ts account-votes <addr>         投票记录
    ts account-analysis <addr>      日度分析
    ts account-asset <addr>         持仓总览(含估值)
    ts account-projects <addr>      参与项目

  交易:
    ts tx <hash>                    交易详情
    ts tx-list [start] [limit]      交易列表
    ts tx-stats                     交易统计
    ts transfer <addr>              TRX/TRC10 转账
    ts transfer-stats               转账分布统计
    ts transfer-trc20 <addr>        TRC20 转账(按地址)
    ts transfer-trc20-contract <contract> TRC20 转账(按合约)
    ts transfer-trc1155 <addr>      TRC1155 转账
    ts transfer-trc721 <contract> <tokenId> TRC721 转账
    ts internal-tx <addr>           内部交易

  区块:
    ts block [start] [limit]        最新区块
    ts block-num                    最新区块高度
    ts block-info <number>          指定区块详情
    ts block-stats                  区块统计

  代币:
    ts token <contract>             TRC20 代币详情
    ts token-trc10 <id>             TRC10 代币详情
    ts token-holders <contract>     TRC20 持有者列表
    ts token-holders-trc10 <token>  TRC10 持有者列表
    ts token-price <token>          代币价格
    ts token-price-list             带价格的代币列表
    ts token-supply <contract>      TRC20 流通量
    ts token-list [start] [limit]   代币排行
    ts token-all [start] [limit]    所有已索引代币
    ts token-distribution <token>   持仓分布
    ts token-trc721 <contract>      TRC721 NFT 详情
    ts token-trc1155-inv <contract> TRC1155 库存
    ts token-trc1155-token <contract> TRC1155 代币持仓

  合约:
    ts contract <addr>              合约详情
    ts contract-list [start] [limit] 合约列表
    ts contract-callers <addr>      调用者排行
    ts contract-energy <addr>       能量消耗统计
    ts contract-daily-callers <addr> <start_ts> <end_ts> 每日独立调用者
    ts contract-daily-calls <addr> <start_ts> <end_ts>   每日调用次数
    ts contract-analysis <addr> [type] 合约日度分析(type:0-5)
    ts contract-all-callers <addr> [day] 所有调用者列表
    ts contract-triggers [start] [limit] 合约触发交易
    ts contract-events '<json>'     合约事件(POST)

  超级代表:
    ts sr [type]                    SR 列表 (0=SR,1=partner,3=candidate)
    ts sr-votes <addr>              SR 投票详情
    ts sr-info                      SR 总览统计
    ts params                       链参数
    ts proposal <id>                提案详情

  安全:
    ts security-account <addr>      账户风险检测
    ts security-token <addr>        代币安全检测
    ts security-url <url>           URL 钓鱼检测
    ts security-tx <hash>           交易风险检测
    ts security-auth <addr>         授权风险检查
    ts security-sign <addr>         多签配置检查

  搜索:
    ts search <keyword> [limit]     全局搜索
    ts tps                          当前 TPS
    ts overview                     首页概览
    ts hot-token                    热搜代币排行
    ts nodes                        全网节点信息

  统计:
    ts trx-supply                   TRX 供应/销毁
    ts turnover                     TRX 发行与销毁分析
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
    ts token-analysis               代币交易分析
    ts token-transfer-analysis      代币转账分析
    ts block-size                   平均区块大小
    ts blockchain-size              区块链总大小

  深度分析:
    ts deep-related <addr>          关联账户
    ts deep-flow <addr>             资金流向
    ts deep-big-tx <addr>           大额交易
    ts deep-token-transfer <addr>   代币转账次数

  稳定币:
    ts stable-holders               持仓分布概览
    ts stable-change                持有者变化趋势
    ts stable-top                   大户排行
    ts stable-big-tx                大额交易
    ts stable-events                增发/销毁/黑名单事件
    ts stable-dist                  交易所/DeFi 分布
    ts stable-liquidity             流动性操作记录
    ts stable-pool                  池子概览(TVL)
    ts stable-pool-trend            池子趋势
    ts stable-pool-change           池子历史变化
    ts stable-tvl                   稳定币 TVL 分布

  直接调 API:
    ts api "/api/xxx?param=value"

HELP
      ;;
    *)
      echo "未知命令: $cmd（输入 ts help 查看帮助）" >&2
      return 1
      ;;
  esac
}

echo "TronScan CLI 已加载。输入 ts help 查看命令列表" >&2
