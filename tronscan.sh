#!/usr/bin/env bash
# TronScan CLI - TRON 链上数据查询工具
# 用法: source tronscan.sh && ts <command> [args...]

TS_VERSION="1.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_URL="https://apilist.tronscanapi.com"

# ============ 终端颜色（自动检测 TTY） ============

if [[ -t 2 ]]; then
  _C_RED='\033[31m' _C_GREEN='\033[32m' _C_YELLOW='\033[33m'
  _C_CYAN='\033[36m' _C_BOLD='\033[1m' _C_DIM='\033[2m' _C_RESET='\033[0m'
else
  _C_RED='' _C_GREEN='' _C_YELLOW=''
  _C_CYAN='' _C_BOLD='' _C_DIM='' _C_RESET=''
fi

# ============ 辅助函数 ============

_ts_err()     { echo -e "${_C_RED}✗ $1${_C_RESET}" >&2; }
_ts_warn()    { echo -e "${_C_YELLOW}  ↳ $1${_C_RESET}" >&2; }

_ts_require() {
  if [[ -z "$1" ]]; then
    _ts_err "缺少必需参数: $2"
    echo -e "  ${_C_BOLD}用法: $3${_C_RESET}" >&2
    return 2
  fi
}

_ts_resolve_contract() {
  local input="$1"
  if [[ "$input" =~ ^T[A-Za-z0-9]{33}$ ]]; then
    echo "$input"
    return 0
  fi
  local result contract
  result=$(curl -s -H "TRON-PRO-API-KEY: ${TRONSCAN_API_KEY}" \
    "${BASE_URL}/api/search/v2?term=${input}&start=0&limit=1" 2>/dev/null) || return 1
  contract=$(echo "$result" | jq -r --arg q "$input" '
    ($q | ascii_downcase) as $lq |
    [(.token // [])[]] | [.[] | select(.token_type == "trc20")] |
    ([.[] | select(.abbr | ascii_downcase == $lq)] | sort_by(if .vip then 0 else 1 end) | .[0].token_id) //
    ([.[] | select(.name | ascii_downcase == $lq)] | sort_by(if .vip then 0 else 1 end) | .[0].token_id) //
    (sort_by(if .vip then 0 else 1 end) | .[0].token_id) //
    empty
  ' 2>/dev/null)
  if [[ -n "$contract" && "$contract" != "null" ]]; then
    echo "$contract"
    return 0
  fi
  return 1
}

_ts_resolve_trc10() {
  local input="$1"
  if [[ "$input" =~ ^[0-9]+$ ]]; then
    echo "$input"
    return 0
  fi
  local result token_id
  result=$(curl -s -H "TRON-PRO-API-KEY: ${TRONSCAN_API_KEY}" \
    "${BASE_URL}/api/search/v2?term=${input}&start=0&limit=1" 2>/dev/null) || return 1
  token_id=$(echo "$result" | jq -r --arg q "$input" '
    ($q | ascii_downcase) as $lq |
    [(.token // [])[]] | [.[] | select(.token_type == "trc10")] |
    ([.[] | select(.abbr | ascii_downcase == $lq)] | .[0].token_id) //
    ([.[] | select(.name | ascii_downcase == $lq)] | .[0].token_id) //
    (.[0].token_id) //
    empty
  ' 2>/dev/null)
  if [[ -n "$token_id" && "$token_id" != "null" ]]; then
    echo "$token_id"
    return 0
  fi
  return 1
}

# ============ 加载 API Key ============

if [[ -z "$TRONSCAN_API_KEY" ]]; then
  if [[ -f "$SCRIPT_DIR/.env" ]]; then
    source "$SCRIPT_DIR/.env"
  else
    _ts_err "未找到 API Key"
    _ts_warn "请设置 TRONSCAN_API_KEY 环境变量或创建 .env 文件"
    return 2 2>/dev/null || exit 2
  fi
fi

# ============ 全局选项（每次调用 ts 重置） ============

_TS_RAW=0
_TS_OPT_START=""
_TS_OPT_LIMIT=""
_TS_OPT_SORT=""
_TS_HELP=0

# ============ 底层请求 ============

_ts_output() {
  if [[ "$_TS_RAW" -eq 1 ]]; then
    echo "$1" | jq -c . 2>/dev/null || echo "$1"
  else
    echo "$1" | jq . 2>/dev/null || echo "$1"
  fi
}

_ts_http_hint() {
  case "$1" in
    401|403)     _ts_warn "请检查 API Key 是否正确" ;;
    404)         _ts_warn "接口路径不存在或参数无效" ;;
    429)         _ts_warn "请求频率超限，请稍后重试" ;;
    5[0-9][0-9]) _ts_warn "服务端异常，请稍后重试" ;;
  esac
}

_ts_get() {
  local path="$1" response curl_exit http_code body
  response=$(curl -s -w "\n%{http_code}" \
    -H "TRON-PRO-API-KEY: ${TRONSCAN_API_KEY}" \
    "${BASE_URL}${path}")
  curl_exit=$?
  if [[ $curl_exit -ne 0 ]]; then
    _ts_err "网络请求失败 (curl: $curl_exit)"
    _ts_warn "请检查网络连接"
    return 3
  fi
  http_code=$(echo "$response" | tail -1)
  body=$(echo "$response" | sed '$d')
  if [[ "$http_code" -ge 400 ]]; then
    _ts_err "请求失败 [HTTP $http_code]"
    _ts_http_hint "$http_code"
    echo "$body" >&2
    return 4
  fi
  _ts_output "$body"
}

_ts_post() {
  local path="$1" data="$2" response curl_exit http_code body
  response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "TRON-PRO-API-KEY: ${TRONSCAN_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$data" "${BASE_URL}${path}")
  curl_exit=$?
  if [[ $curl_exit -ne 0 ]]; then
    _ts_err "网络请求失败 (curl: $curl_exit)"
    _ts_warn "请检查网络连接"
    return 3
  fi
  http_code=$(echo "$response" | tail -1)
  body=$(echo "$response" | sed '$d')
  if [[ "$http_code" -ge 400 ]]; then
    _ts_err "请求失败 [HTTP $http_code]"
    _ts_http_hint "$http_code"
    echo "$body" >&2
    return 4
  fi
  _ts_output "$body"
}

# ============ 子命令 ============

# --- 账户 ---

ts_account() {
  _ts_require "$1" address "ts account <address>" || return $?
  _ts_get "/api/accountv2?address=$1"
}
ts_account_list() {
  _ts_get "/api/account/list?start=${_TS_OPT_START:-${1:-0}}&limit=${_TS_OPT_LIMIT:-${2:-20}}&sort=${_TS_OPT_SORT:-${3:--balance}}"
}
ts_account_tokens() {
  _ts_require "$1" address "ts account-tokens <address> [--start N] [--limit N]" || return $?
  _ts_get "/api/account/tokens?address=$1&start=${_TS_OPT_START:-${2:-0}}&limit=${_TS_OPT_LIMIT:-${3:-20}}"
}
ts_account_resource() {
  _ts_require "$1" address "ts account-resource <address>" || return $?
  _ts_get "/api/account/resourcev2?address=$1"
}
ts_account_resource_v1() {
  _ts_require "$1" address "ts account-resource-v1 <address>" || return $?
  _ts_get "/api/account/resource?address=$1"
}
ts_account_approve() {
  _ts_require "$1" address "ts account-approve <address> [--start N] [--limit N]" || return $?
  _ts_get "/api/account/approve/list?address=$1&start=${_TS_OPT_START:-${2:-0}}&limit=${_TS_OPT_LIMIT:-${3:-20}}"
}
ts_account_approve_change() {
  _ts_require "$1" address "ts account-approve-change <address> [--start N] [--limit N]" || return $?
  _ts_get "/api/account/approve/change?address=$1&start=${_TS_OPT_START:-${2:-0}}&limit=${_TS_OPT_LIMIT:-${3:-20}}"
}
ts_account_votes() {
  _ts_require "$1" address "ts account-votes <address>" || return $?
  _ts_get "/api/vote?address=$1"
}
ts_account_analysis() {
  _ts_require "$1" address "ts account-analysis <address>" || return $?
  _ts_get "/api/account/analysis?address=$1"
}
ts_account_asset() {
  _ts_require "$1" address "ts account-asset <address>" || return $?
  _ts_get "/api/account/token_asset_overview?address=$1"
}
ts_account_projects() {
  _ts_require "$1" address "ts account-projects <address>" || return $?
  _ts_get "/api/participate_project?address=$1"
}

# --- 交易 & 转账 ---

ts_tx() {
  _ts_require "$1" hash "ts tx <hash>" || return $?
  _ts_get "/api/transaction-info?hash=$1"
}
ts_tx_list() {
  _ts_get "/api/transaction?start=${_TS_OPT_START:-${1:-0}}&limit=${_TS_OPT_LIMIT:-${2:-20}}"
}
ts_tx_stats()       { _ts_get "/api/transaction/statistics"; }
ts_transfer() {
  _ts_require "$1" address "ts transfer <address> [--start N] [--limit N]" || return $?
  _ts_get "/api/transfer?address=$1&start=${_TS_OPT_START:-${2:-0}}&limit=${_TS_OPT_LIMIT:-${3:-20}}"
}
ts_transfer_stats() { _ts_get "/api/transfer/statistics"; }
ts_transfer_trc20() {
  _ts_require "$1" address "ts transfer-trc20 <address> [--start N] [--limit N]" || return $?
  _ts_get "/api/token_trc20/transfers?relatedAddress=$1&start=${_TS_OPT_START:-${2:-0}}&limit=${_TS_OPT_LIMIT:-${3:-20}}"
}
ts_transfer_trc20_contract() {
  _ts_require "$1" contract "ts transfer-trc20-contract <contract> [--start N] [--limit N]" || return $?
  _ts_get "/api/token_trc20/transfers?contract_address=$1&start=${_TS_OPT_START:-${2:-0}}&limit=${_TS_OPT_LIMIT:-${3:-20}}"
}
ts_transfer_trc1155() {
  _ts_require "$1" address "ts transfer-trc1155 <address> [--start N] [--limit N]" || return $?
  _ts_get "/api/token_trc1155/transfers?relatedAddress=$1&start=${_TS_OPT_START:-${2:-0}}&limit=${_TS_OPT_LIMIT:-${3:-20}}"
}
ts_transfer_trc721() {
  _ts_require "$1" contract "ts transfer-trc721 <contract> <tokenId>" || return $?
  _ts_require "$2" tokenId "ts transfer-trc721 <contract> <tokenId>" || return $?
  _ts_get "/api/trc721/transfers?contract=$1&tokenId=$2"
}
ts_internal_tx() {
  _ts_require "$1" address "ts internal-tx <address> [--start N] [--limit N]" || return $?
  _ts_get "/api/internal-transaction?address=$1&start=${_TS_OPT_START:-${2:-0}}&limit=${_TS_OPT_LIMIT:-${3:-20}}"
}

# --- 区块 ---

ts_block() {
  if [[ -n "$1" && "$1" =~ ^[0-9]+$ ]]; then
    _ts_get "/api/block?number=$1&limit=1"
  else
    _ts_get "/api/block?sort=-number&start=${_TS_OPT_START:-${1:-0}}&limit=${_TS_OPT_LIMIT:-${2:-1}}"
  fi
}
# --- 代币 ---

ts_token() {
  _ts_require "$1" "contract|symbol" "ts token <contract|symbol>  (如: ts token USDT)" || return $?
  local input_lower
  input_lower=$(echo "$1" | tr '[:upper:]' '[:lower:]')
  if [[ "$input_lower" == "trx" ]]; then
    _ts_get "/api/token?id=0&showAll=1"
    return $?
  fi
  local contract
  contract=$(_ts_resolve_contract "$1") || {
    _ts_err "无法解析代币: $1"
    _ts_warn "请输入合约地址或代币符号（如 USDT、trx）"
    return 2
  }
  [[ "$contract" != "$1" ]] && echo -e "${_C_DIM}→ $1 → $contract${_C_RESET}" >&2
  _ts_get "/api/token_trc20?contract=$contract"
}
ts_token_trc10() {
  _ts_require "$1" "id|symbol" "ts token-trc10 <id|symbol>" || return $?
  local tid
  tid=$(_ts_resolve_trc10 "$1") || { _ts_err "无法解析 TRC10 代币: $1"; return 2; }
  [[ "$tid" != "$1" ]] && echo -e "${_C_DIM}→ $1 → $tid${_C_RESET}" >&2
  _ts_get "/api/token?id=$tid"
}
ts_token_holders() {
  _ts_require "$1" "contract|symbol" "ts token-holders <contract|symbol> [--start N] [--limit N]" || return $?
  local contract
  contract=$(_ts_resolve_contract "$1") || { _ts_err "无法解析代币: $1"; return 2; }
  [[ "$contract" != "$1" ]] && echo -e "${_C_DIM}→ $1 → $contract${_C_RESET}" >&2
  _ts_get "/api/token_trc20/holders?contract_address=$contract&start=${_TS_OPT_START:-${2:-0}}&limit=${_TS_OPT_LIMIT:-${3:-20}}"
}
ts_token_holders_trc10() {
  _ts_require "$1" "token|symbol" "ts token-holders-trc10 <token|symbol> [--start N] [--limit N]" || return $?
  local tid
  tid=$(_ts_resolve_trc10 "$1") || { _ts_err "无法解析 TRC10 代币: $1"; return 2; }
  [[ "$tid" != "$1" ]] && echo -e "${_C_DIM}→ $1 → $tid${_C_RESET}" >&2
  _ts_get "/api/tokenholders?token=$tid&start=${_TS_OPT_START:-${2:-0}}&limit=${_TS_OPT_LIMIT:-${3:-20}}"
}
ts_token_price() {
  _ts_require "$1" "symbol" "ts token-price <symbol>  (如: ts token-price trx)" || return $?
  local sym
  sym=$(echo "$1" | tr '[:upper:]' '[:lower:]')
  _ts_get "/api/token/price?token=$sym"
}
ts_token_list() {
  _ts_get "/api/tokens/overview?start=${_TS_OPT_START:-${1:-0}}&limit=${_TS_OPT_LIMIT:-${2:-20}}"
}

ts_token_distribution() {
  _ts_require "$1" token "ts token-distribution <token>" || return $?
  _ts_get "/api/tokens/position-distribution?token=$1"
}
# --- 合约 ---

ts_contract() {
  _ts_require "$1" address "ts contract <address>" || return $?
  _ts_get "/api/contract?contract=$1"
}
ts_contract_list() {
  _ts_get "/api/contracts?start=${_TS_OPT_START:-${1:-0}}&limit=${_TS_OPT_LIMIT:-${2:-20}}&sort=${_TS_OPT_SORT:-${3:--trxCount}}"
}
ts_contract_callers() {
  _ts_require "$1" address "ts contract-callers <address>" || return $?
  _ts_get "/api/contracts/top_call?contract_address=$1"
}
ts_contract_energy() {
  _ts_require "$1" address "ts contract-energy <address>" || return $?
  _ts_get "/api/onecontractenergystatistic?address=$1"
}
ts_contract_daily_callers() {
  _ts_require "$1" address "ts contract-daily-callers <address> <start_ts> <end_ts>" || return $?
  _ts_require "$2" start_timestamp "ts contract-daily-callers <address> <start_ts> <end_ts>" || return $?
  _ts_require "$3" end_timestamp "ts contract-daily-callers <address> <start_ts> <end_ts>" || return $?
  _ts_get "/api/onecontractcallerstatistic?address=$1&start_timestamp=$2&end_timestamp=$3"
}
ts_contract_daily_calls() {
  _ts_require "$1" address "ts contract-daily-calls <address> <start_ts> <end_ts>" || return $?
  _ts_require "$2" start_timestamp "ts contract-daily-calls <address> <start_ts> <end_ts>" || return $?
  _ts_require "$3" end_timestamp "ts contract-daily-calls <address> <start_ts> <end_ts>" || return $?
  _ts_get "/api/onecontracttriggerstatistic?address=$1&start_timestamp=$2&end_timestamp=$3"
}
ts_contract_analysis() {
  _ts_require "$1" address "ts contract-analysis <address> [type:0-5]" || return $?
  _ts_get "/api/contract/analysis?address=$1&type=${2:-0}"
}
ts_contract_all_callers() {
  _ts_require "$1" address "ts contract-all-callers <address> [day] [--start N] [--limit N]" || return $?
  _ts_get "/api/onecontractcallers?address=$1&day=${2:-1}&start=${_TS_OPT_START:-${3:-0}}&limit=${_TS_OPT_LIMIT:-${4:-20}}"
}
ts_contract_triggers() {
  _ts_get "/api/contracts/trigger?start=${_TS_OPT_START:-${1:-0}}&limit=${_TS_OPT_LIMIT:-${2:-20}}"
}
ts_contract_events() {
  _ts_require "$1" json "ts contract-events '<json>'" || return $?
  _ts_post "/api/contracts/smart-contract-triggers-batch" "$1"
}

# --- 超级代表 & 治理 ---

ts_sr()       { _ts_get "/api/pagewitness?witnesstype=${1:-0}"; }
ts_sr_votes() {
  _ts_require "$1" address "ts sr-votes <address>" || return $?
  _ts_get "/api/vote/witness?address=$1"
}
ts_params()   { _ts_get "/api/chainparameters"; }
ts_proposal() {
  _ts_require "$1" id "ts proposal <id>" || return $?
  _ts_get "/api/proposal?id=$1"
}

# --- 安全 ---

ts_security_account() {
  _ts_require "$1" address "ts security-account <address>" || return $?
  _ts_get "/api/security/account/data?address=$1"
}
ts_security_token() {
  _ts_require "$1" address "ts security-token <address>" || return $?
  _ts_get "/api/security/token/data?address=$1"
}
ts_security_url() {
  _ts_require "$1" url "ts security-url <url>" || return $?
  _ts_get "/api/security/url/data?url=$1"
}
ts_security_tx() {
  _ts_require "$1" hash "ts security-tx <hash>" || return $?
  _ts_get "/api/security/transaction/data?hashes=$1"
}
ts_security_auth() {
  _ts_require "$1" address "ts security-auth <address>" || return $?
  _ts_get "/api/security/auth/data?address=$1"
}
ts_security_sign() {
  _ts_require "$1" address "ts security-sign <address>" || return $?
  _ts_get "/api/security/sign/data?address=$1"
}

# --- 搜索 & 首页 ---

ts_search() {
  _ts_require "$1" keyword "ts search <keyword> [--limit N]" || return $?
  _ts_get "/api/search/v2?term=$1&start=0&limit=${_TS_OPT_LIMIT:-${2:-10}}"
}
ts_tps()       { _ts_get "/api/system/tps"; }
ts_overview()  { _ts_get "/api/system/homepage-bundle"; }
ts_hot_token() { _ts_get "/api/search/hot"; }
ts_nodes()     { _ts_get "/api/nodemap"; }

# --- 统计 ---

ts_trx_supply()              { _ts_get "/api/funds"; }
ts_turnover()                { _ts_get "/api/turnover"; }
ts_tx_trend()                { _ts_get "/api/overview/dailytransactionnum"; }
ts_tx_total()                { _ts_get "/api/overview/transactionnum"; }
ts_active_accounts()         { _ts_get "/api/account/active_statistic"; }
ts_new_accounts()            { _ts_get "/api/overview/dailyaccounts"; }
ts_defi_tvl()                { _ts_get "/api/defiTvl"; }
ts_top10()                   { _ts_get "/api/top10"; }
ts_trx_price()               { _ts_get "/api/trx/volume"; }
ts_energy_daily()            { _ts_get "/api/energydailystatistic"; }
ts_energy_dist()             { _ts_get "/api/energystatistic"; }
ts_energy_cost()             { _ts_get "/api/acquisition_cost_statistic"; }
ts_bandwidth_daily()         { _ts_get "/api/netstatistic"; }
ts_trigger_stats()           { _ts_get "/api/triggeramountstatistic"; }
ts_token_tvc()               { _ts_get "/api/tokenTvc"; }
ts_token_analysis()          { _ts_get "/api/token/analysis"; }
ts_token_transfer_analysis() { _ts_get "/api/tokenTransfer/analysis"; }
ts_block_size()              { _ts_get "/api/overview/dailyavgblockSize"; }
ts_blockchain_size()         { _ts_get "/api/overview/totalblockchainsize"; }

# --- 深度分析 ---

ts_deep_related() {
  _ts_require "$1" address "ts deep-related <address>" || return $?
  _ts_get "/api/deep/account/relatedAccount?address=$1"
}
ts_deep_flow() {
  _ts_require "$1" address "ts deep-flow <address>" || return $?
  _ts_get "/api/deep/account/transferAmount?address=$1"
}
ts_deep_big_tx() {
  _ts_require "$1" address "ts deep-big-tx <address>" || return $?
  _ts_get "/api/deep/account/token/bigAmount?address=$1"
}
ts_deep_token_transfer() {
  _ts_require "$1" address "ts deep-token-transfer <address>" || return $?
  _ts_get "/api/deep/account/holderToken/basicInfo/trc20/transfer?address=$1"
}

# --- 稳定币 ---

ts_stable_holders()     { _ts_get "/api/stableCoin/holder/balance/overview"; }
ts_stable_change()      { _ts_get "/api/stableCoin/holder/change"; }
ts_stable_top()         { _ts_get "/api/stableCoin/holder/top"; }
ts_stable_big_tx()      { _ts_get "/api/deep/stableCoin/bigAmount"; }
ts_stable_events()      { _ts_get "/api/deep/stableCoin/totalSupply/keyEvents"; }
ts_stable_dist()        { _ts_get "/api/stableCoin/distribution"; }
ts_stable_liquidity()   { _ts_get "/api/deep/stableCoin/liquidity/transaction"; }
ts_stable_pool()        { _ts_get "/api/stableCoin/pool/overview"; }
ts_stable_pool_trend()  { _ts_get "/api/stableCoin/pool/trend"; }
ts_stable_pool_change() { _ts_get "/api/stableCoin/pool/change"; }
ts_stable_tvl()         { _ts_get "/api/stableCoin/tvl"; }

# ============ 子命令帮助（ts <cmd> --help） ============

_ts_cmd_usage() {
  local u B='' C='' R=''
  [[ -t 1 ]] && { B='\033[1m'; C='\033[36m'; R='\033[0m'; }
  case "$1" in
    account)                u="ts account <address>|账户详情（余额、资源、质押等）" ;;
    account-list)           u="ts account-list [--start N] [--limit N] [--sort FIELD]|账户排行榜" ;;
    account-tokens)         u="ts account-tokens <address> [--start N] [--limit N]|持仓代币列表" ;;
    account-resource)       u="ts account-resource <address>|Stake 2.0 资源（带宽/能量）" ;;
    account-resource-v1)    u="ts account-resource-v1 <address>|Stake 1.0 资源" ;;
    account-approve)        u="ts account-approve <address> [--start N] [--limit N]|代币授权列表" ;;
    account-approve-change) u="ts account-approve-change <address> [--start N] [--limit N]|授权变更历史" ;;
    account-votes)          u="ts account-votes <address>|投票记录" ;;
    account-analysis)       u="ts account-analysis <address>|日度分析" ;;
    account-asset)          u="ts account-asset <address>|持仓总览（含估值）" ;;
    account-projects)       u="ts account-projects <address>|参与项目" ;;
    tx)                     u="ts tx <hash>|交易详情" ;;
    tx-list)                u="ts tx-list [--start N] [--limit N]|交易列表" ;;
    tx-stats)               u="ts tx-stats|交易统计" ;;
    transfer)               u="ts transfer <address> [--start N] [--limit N]|TRX/TRC10 转账记录" ;;
    transfer-stats)         u="ts transfer-stats|转账分布统计" ;;
    transfer-trc20)         u="ts transfer-trc20 <address> [--start N] [--limit N]|TRC20 转账（按地址）" ;;
    transfer-trc20-contract) u="ts transfer-trc20-contract <contract> [--start N] [--limit N]|TRC20 转账（按合约）" ;;
    transfer-trc1155)       u="ts transfer-trc1155 <address> [--start N] [--limit N]|TRC1155 转账" ;;
    transfer-trc721)        u="ts transfer-trc721 <contract> <tokenId>|TRC721 转账" ;;
    internal-tx)            u="ts internal-tx <address> [--start N] [--limit N]|内部交易" ;;
    block)                  u="ts block [number]|最新区块（传区块号查指定区块）" ;;
    token)                  u="ts token <contract|symbol>|TRC20 代币详情（支持符号如 USDT）" ;;
    token-trc10)            u="ts token-trc10 <id|symbol>|TRC10 代币详情（支持符号）" ;;
    token-holders)          u="ts token-holders <contract|symbol> [--start N] [--limit N]|TRC20 持有者列表（支持符号）" ;;
    token-holders-trc10)    u="ts token-holders-trc10 <token|symbol> [--start N] [--limit N]|TRC10 持有者列表（支持符号）" ;;
    token-price)            u="ts token-price <symbol>|代币价格（如 trx、usdt）" ;;
    token-list)             u="ts token-list [--start N] [--limit N]|已索引代币列表/排行" ;;

    token-distribution)     u="ts token-distribution <token>|持仓分布" ;;

    contract)               u="ts contract <address>|合约详情" ;;
    contract-list)          u="ts contract-list [--start N] [--limit N] [--sort FIELD]|合约列表" ;;
    contract-callers)       u="ts contract-callers <address>|调用者排行" ;;
    contract-energy)        u="ts contract-energy <address>|能量消耗统计" ;;
    contract-daily-callers) u="ts contract-daily-callers <address> <start_ts> <end_ts>|每日独立调用者" ;;
    contract-daily-calls)   u="ts contract-daily-calls <address> <start_ts> <end_ts>|每日调用次数" ;;
    contract-analysis)      u="ts contract-analysis <address> [type:0-5]|合约日度分析" ;;
    contract-all-callers)   u="ts contract-all-callers <address> [day] [--start N] [--limit N]|所有调用者" ;;
    contract-triggers)      u="ts contract-triggers [--start N] [--limit N]|合约触发交易" ;;
    contract-events)        u="ts contract-events '<json>'|合约事件（POST）" ;;
    sr)                     u="ts sr [type: 0=SR, 1=partner, 3=candidate]|SR 列表" ;;
    sr-votes)               u="ts sr-votes <address>|SR 投票详情" ;;
    params)                 u="ts params|链参数列表" ;;
    proposal)               u="ts proposal <id>|提案详情" ;;
    security-account)       u="ts security-account <address>|账户风险检测" ;;
    security-token)         u="ts security-token <address>|代币安全检测" ;;
    security-url)           u="ts security-url <url>|URL 钓鱼检测" ;;
    security-tx)            u="ts security-tx <hash>|交易风险检测" ;;
    security-auth)          u="ts security-auth <address>|授权风险检查" ;;
    security-sign)          u="ts security-sign <address>|多签配置检查" ;;
    search)                 u="ts search <keyword> [--limit N]|全局搜索" ;;
    tps)                    u="ts tps|当前 TPS" ;;
    overview)               u="ts overview|TRON 网络概览" ;;
    hot-token)              u="ts hot-token|热搜代币排行" ;;
    nodes)                  u="ts nodes|全网节点信息" ;;
    trx-supply)             u="ts trx-supply|TRX 供应/销毁" ;;
    turnover)               u="ts turnover|TRX 发行与销毁分析" ;;
    tx-trend)               u="ts tx-trend|每日交易趋势" ;;
    tx-total)               u="ts tx-total|累计交易数" ;;
    active-accounts)        u="ts active-accounts|活跃账户" ;;
    new-accounts)           u="ts new-accounts|新增账户" ;;
    defi-tvl)               u="ts defi-tvl|DeFi TVL" ;;
    top10)                  u="ts top10|Top 10 排行" ;;
    trx-price)              u="ts trx-price|TRX 价格历史" ;;
    energy-daily)           u="ts energy-daily|每日能量消耗" ;;
    energy-dist)            u="ts energy-dist|能量消耗分布" ;;
    energy-cost)            u="ts energy-cost|能量/带宽获取成本" ;;
    bandwidth-daily)        u="ts bandwidth-daily|每日带宽消耗" ;;
    trigger-stats)          u="ts trigger-stats|合约调用分布" ;;
    token-tvc)              u="ts token-tvc|代币链上价值(TVC)" ;;
    token-analysis)         u="ts token-analysis|代币交易分析" ;;
    token-transfer-analysis) u="ts token-transfer-analysis|代币转账分析" ;;
    block-size)             u="ts block-size|平均区块大小" ;;
    blockchain-size)        u="ts blockchain-size|区块链总大小" ;;
    deep-related)           u="ts deep-related <address>|关联账户" ;;
    deep-flow)              u="ts deep-flow <address>|资金流向" ;;
    deep-big-tx)            u="ts deep-big-tx <address>|大额交易" ;;
    deep-token-transfer)    u="ts deep-token-transfer <address>|代币转账次数" ;;
    stable-holders)         u="ts stable-holders|持仓分布概览" ;;
    stable-change)          u="ts stable-change|持有者变化趋势" ;;
    stable-top)             u="ts stable-top|大户排行" ;;
    stable-big-tx)          u="ts stable-big-tx|大额交易" ;;
    stable-events)          u="ts stable-events|增发/销毁/黑名单事件" ;;
    stable-dist)            u="ts stable-dist|交易所/DeFi 分布" ;;
    stable-liquidity)       u="ts stable-liquidity|流动性操作记录" ;;
    stable-pool)            u="ts stable-pool|池子概览(TVL)" ;;
    stable-pool-trend)      u="ts stable-pool-trend|池子趋势" ;;
    stable-pool-change)     u="ts stable-pool-change|池子历史变化" ;;
    stable-tvl)             u="ts stable-tvl|稳定币 TVL 分布" ;;
    api)                    u="ts api \"/api/xxx?param=value\"|直接调用 API（兜底）" ;;
    *) _ts_err "未知命令: $1"; _ts_warn "输入 ts help 查看帮助"; return 1 ;;
  esac
  printf "${B}用法:${R} %s\n" "${u%%|*}"
  printf "  ${C}%s${R}\n\n" "${u#*|}"
  printf "  全局选项: --raw (紧凑JSON)  --start N  --limit N  --sort FIELD\n"
}

# ============ 主入口 ============

ts() {
  case "${1:-}" in
    --version|-V|version) echo "TronScan CLI v${TS_VERSION}"; return 0 ;;
    --help|-h)            set -- help ;;
  esac

  local cmd="${1:-help}"
  shift 2>/dev/null

  # 解析命名参数，分离位置参数
  _TS_RAW=0; _TS_OPT_START=""; _TS_OPT_LIMIT=""; _TS_OPT_SORT=""; _TS_HELP=0
  local _ts_args=()
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --raw)     _TS_RAW=1; shift ;;
      --start)   _TS_OPT_START="$2"; shift 2 2>/dev/null || { _ts_err "--start 需要一个值"; return 2; } ;;
      --limit)   _TS_OPT_LIMIT="$2"; shift 2 2>/dev/null || { _ts_err "--limit 需要一个值"; return 2; } ;;
      --sort)    _TS_OPT_SORT="$2";  shift 2 2>/dev/null || { _ts_err "--sort 需要一个值"; return 2; } ;;
      --help|-h) _TS_HELP=1; shift ;;
      --)        shift; _ts_args+=("$@"); break ;;
      *)         _ts_args+=("$1"); shift ;;
    esac
  done
  if (( ${#_ts_args[@]} > 0 )); then
    set -- "${_ts_args[@]}"
  else
    set --
  fi

  # 子命令 --help
  if [[ "$_TS_HELP" -eq 1 && "$cmd" != "help" ]]; then
    _ts_cmd_usage "$cmd"
    return $?
  fi

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
    # 代币
    token)                 ts_token "$@" ;;
    token-trc10)           ts_token_trc10 "$@" ;;
    token-holders)         ts_token_holders "$@" ;;
    token-holders-trc10)   ts_token_holders_trc10 "$@" ;;
    token-price)           ts_token_price "$@" ;;
    token-list)            ts_token_list "$@" ;;

    token-distribution)    ts_token_distribution "$@" ;;


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
      local _hB='' _hC='' _hD='' _hR=''
      [[ -t 1 ]] && { _hB='\033[1m'; _hC='\033[36m'; _hD='\033[2m'; _hR='\033[0m'; }
      printf "${_hB}TronScan CLI v%s${_hR} - TRON 链上数据查询工具\n\n" "$TS_VERSION"
      printf "${_hC}用法:${_hR} ts <command> [args...] [options...]\n\n"
      printf "${_hB}全局选项:${_hR}\n"
      cat <<'OPTS'
  --start N     分页起始位置（默认 0）
  --limit N     每页数量（默认 20）
  --sort FIELD  排序字段
  --raw         输出紧凑 JSON（适合管道）
  --help, -h    显示命令帮助
  --version, -V 显示版本号

OPTS
      cat <<'HELP'
  代币:
    ts token <contract|symbol>      TRC20 代币详情（支持 USDT 等符号）
    ts token-trc10 <id|symbol>       TRC10 代币详情
    ts token-holders <contract|symbol> TRC20 持有者列表
    ts token-holders-trc10 <token|symbol> TRC10 持有者列表
    ts token-price <symbol>          代币价格（如 trx、usdt）
    ts token-list                   已索引代币列表/排行
    ts token-distribution <token>   持仓分布

  搜索:
    ts search <keyword>             全局搜索
    ts tps                          当前 TPS
    ts overview                     TRON 网络概览
    ts hot-token                    热搜代币排行
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
    ts contract-events '<json>'     合约事件(POST)

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


HELP
      ;;
    *)
      _ts_err "未知命令: $cmd"
      _ts_warn "输入 ts help 查看帮助"
      return 1
      ;;
  esac
}

if [[ -z "$_TS_LOADED" ]]; then
  echo -e "${_C_GREEN}✓ TronScan CLI v${TS_VERSION} 已加载${_C_RESET}。输入 ts help 查看命令列表" >&2
  export _TS_LOADED=1
fi
