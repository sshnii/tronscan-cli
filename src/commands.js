import { get, resolveContract, resolveTrc10, err, warn, c } from './api.js';

// ============ Helpers ============

function require(args, index, name, usage) {
  const val = args[index];
  if (!val) {
    err(`缺少必需参数: ${name}`);
    console.error(`  ${c.bold('用法:')} ${usage}`);
    process.exit(2);
  }
  return val;
}

async function resolveAndLog(input, resolver) {
  const result = await resolver(input);
  if (result !== input) console.error(c.dim(`→ ${input} → ${result}`));
  return result;
}

// ============ Command Definitions ============

export const commands = {

  // --- 账户 ---

  'account': {
    usage: 'ts account <address>', desc: '账户详情',
    run: (a) => get(`/api/accountv2?address=${require(a, 0, 'address', 'ts account <address>') }`)
  },
  'account-list': {
    usage: 'ts account-list [--start N] [--limit N]', desc: '账户排行榜',
    run: (a, o) => get(`/api/account/list?start=${o.start}&limit=${o.limit}&sort=${o.sort || '-balance'}`)
  },
  'account-tokens': {
    usage: 'ts account-tokens <address>', desc: '持仓代币',
    run: (a, o) => get(`/api/account/tokens?address=${require(a, 0, 'address', 'ts account-tokens <address>')}&start=${o.start}&limit=${o.limit}`)
  },
  'account-resource': {
    usage: 'ts account-resource <address>', desc: 'Stake 2.0 资源(带宽/能量)',
    run: (a) => get(`/api/account/resourcev2?address=${require(a, 0, 'address', 'ts account-resource <address>')}`)
  },
  'account-resource-v1': {
    usage: 'ts account-resource-v1 <address>', desc: 'Stake 1.0 资源',
    run: (a) => get(`/api/account/resource?address=${require(a, 0, 'address', 'ts account-resource-v1 <address>')}`)
  },
  'account-approve': {
    usage: 'ts account-approve <address>', desc: '代币授权列表',
    run: (a, o) => get(`/api/account/approve/list?address=${require(a, 0, 'address', 'ts account-approve <address>')}&start=${o.start}&limit=${o.limit}`)
  },
  'account-approve-change': {
    usage: 'ts account-approve-change <address>', desc: '授权变更历史',
    run: (a, o) => get(`/api/account/approve/change?address=${require(a, 0, 'address', 'ts account-approve-change <address>')}&start=${o.start}&limit=${o.limit}`)
  },
  'account-votes': {
    usage: 'ts account-votes <address>', desc: '投票记录',
    run: (a) => get(`/api/vote?address=${require(a, 0, 'address', 'ts account-votes <address>')}`)
  },
  'account-analysis': {
    usage: 'ts account-analysis <address>', desc: '日度分析',
    run: (a) => get(`/api/account/analysis?address=${require(a, 0, 'address', 'ts account-analysis <address>')}`)
  },
  'account-asset': {
    usage: 'ts account-asset <address>', desc: '持仓总览(含估值)',
    run: (a) => get(`/api/account/token_asset_overview?address=${require(a, 0, 'address', 'ts account-asset <address>')}`)
  },
  'account-projects': {
    usage: 'ts account-projects <address>', desc: '参与项目',
    run: (a) => get(`/api/participate_project?address=${require(a, 0, 'address', 'ts account-projects <address>')}`)
  },

  // --- 交易 ---

  'tx': {
    usage: 'ts tx <hash>', desc: '交易详情',
    run: (a) => get(`/api/transaction-info?hash=${require(a, 0, 'hash', 'ts tx <hash>')}`)
  },
  'tx-list': {
    usage: 'ts tx-list [--start N] [--limit N]', desc: '交易列表',
    run: (a, o) => get(`/api/transaction?start=${o.start}&limit=${o.limit}`)
  },
  'tx-stats': {
    usage: 'ts tx-stats', desc: '交易统计',
    run: () => get('/api/transaction/statistics')
  },
  'transfer': {
    usage: 'ts transfer <address>', desc: 'TRX/TRC10 转账',
    run: (a, o) => get(`/api/transfer?address=${require(a, 0, 'address', 'ts transfer <address>')}&start=${o.start}&limit=${o.limit}`)
  },
  'transfer-stats': {
    usage: 'ts transfer-stats', desc: '转账分布统计',
    run: () => get('/api/transfer/statistics')
  },
  'transfer-trc20': {
    usage: 'ts transfer-trc20 <address>', desc: 'TRC20 转账(按地址)',
    run: (a, o) => get(`/api/token_trc20/transfers?relatedAddress=${require(a, 0, 'address', 'ts transfer-trc20 <address>')}&start=${o.start}&limit=${o.limit}`)
  },
  'transfer-trc20-contract': {
    usage: 'ts transfer-trc20-contract <contract>', desc: 'TRC20 转账(按合约)',
    run: (a, o) => get(`/api/token_trc20/transfers?contract_address=${require(a, 0, 'contract', 'ts transfer-trc20-contract <contract>')}&start=${o.start}&limit=${o.limit}`)
  },
  'transfer-trc1155': {
    usage: 'ts transfer-trc1155 <address>', desc: 'TRC1155 转账',
    run: (a, o) => get(`/api/token_trc1155/transfers?relatedAddress=${require(a, 0, 'address', 'ts transfer-trc1155 <address>')}&start=${o.start}&limit=${o.limit}`)
  },
  'transfer-trc721': {
    usage: 'ts transfer-trc721 <contract> <tokenId>', desc: 'TRC721 转账',
    run: (a) => {
      require(a, 0, 'contract', 'ts transfer-trc721 <contract> <tokenId>');
      require(a, 1, 'tokenId', 'ts transfer-trc721 <contract> <tokenId>');
      return get(`/api/trc721/transfers?contract=${a[0]}&tokenId=${a[1]}`);
    }
  },
  'internal-tx': {
    usage: 'ts internal-tx <address>', desc: '内部交易',
    run: (a, o) => get(`/api/internal-transaction?address=${require(a, 0, 'address', 'ts internal-tx <address>')}&start=${o.start}&limit=${o.limit}`)
  },

  // --- 区块 ---

  'block': {
    usage: 'ts block [number]', desc: '最新区块(传区块号查指定区块)',
    run: (a, o) => {
      if (a[0] && /^\d+$/.test(a[0])) {
        return get(`/api/block?number=${a[0]}&limit=1`);
      }
      return get(`/api/block?sort=-number&start=${o.start}&limit=${o.limit || '1'}`);
    }
  },

  // --- 代币 ---

  'token': {
    usage: 'ts token <contract|symbol>', desc: 'TRC20 代币详情(支持符号如 USDT)',
    run: async (a) => {
      require(a, 0, 'contract|symbol', 'ts token <contract|symbol>');
      if (a[0].toLowerCase() === 'trx') return get('/api/token?id=0&showAll=1');
      const contract = await resolveAndLog(a[0], resolveContract);
      return get(`/api/token_trc20?contract=${contract}`);
    }
  },
  'token-trc10': {
    usage: 'ts token-trc10 <id|symbol>', desc: 'TRC10 代币详情',
    run: async (a) => {
      require(a, 0, 'id|symbol', 'ts token-trc10 <id|symbol>');
      const tid = await resolveAndLog(a[0], resolveTrc10);
      return get(`/api/token?id=${tid}`);
    }
  },
  'token-holders': {
    usage: 'ts token-holders <contract|symbol>', desc: 'TRC20 持有者列表',
    run: async (a, o) => {
      require(a, 0, 'contract|symbol', 'ts token-holders <contract|symbol>');
      const contract = await resolveAndLog(a[0], resolveContract);
      return get(`/api/token_trc20/holders?contract_address=${contract}&start=${o.start}&limit=${o.limit}`);
    }
  },
  'token-holders-trc10': {
    usage: 'ts token-holders-trc10 <token|symbol>', desc: 'TRC10 持有者列表',
    run: async (a, o) => {
      require(a, 0, 'token|symbol', 'ts token-holders-trc10 <token|symbol>');
      const tid = await resolveAndLog(a[0], resolveTrc10);
      return get(`/api/tokenholders?token=${tid}&start=${o.start}&limit=${o.limit}`);
    }
  },
  'token-price': {
    usage: 'ts token-price <symbol>', desc: '代币价格',
    run: (a) => {
      require(a, 0, 'symbol', 'ts token-price <symbol>');
      return get(`/api/token/price?token=${a[0].toLowerCase()}`);
    }
  },
  'token-list': {
    usage: 'ts token-list [--start N] [--limit N]', desc: '代币排行',
    run: (a, o) => get(`/api/tokens/overview?start=${o.start}&limit=${o.limit}`)
  },
  'token-distribution': {
    usage: 'ts token-distribution <token>', desc: '持仓分布',
    run: (a) => get(`/api/tokens/position-distribution?token=${require(a, 0, 'token', 'ts token-distribution <token>')}`)
  },

  // --- 合约 ---

  'contract': {
    usage: 'ts contract <address>', desc: '合约详情',
    run: (a) => get(`/api/contract?contract=${require(a, 0, 'address', 'ts contract <address>')}`)
  },
  'contract-list': {
    usage: 'ts contract-list [--start N] [--limit N]', desc: '合约列表',
    run: (a, o) => get(`/api/contracts?start=${o.start}&limit=${o.limit}&sort=${o.sort || '-trxCount'}`)
  },
  'contract-callers': {
    usage: 'ts contract-callers <address>', desc: '调用者排行',
    run: (a) => get(`/api/contracts/top_call?contract_address=${require(a, 0, 'address', 'ts contract-callers <address>')}`)
  },
  'contract-energy': {
    usage: 'ts contract-energy <address>', desc: '能量消耗统计',
    run: (a) => get(`/api/onecontractenergystatistic?address=${require(a, 0, 'address', 'ts contract-energy <address>')}`)
  },
  'contract-daily-callers': {
    usage: 'ts contract-daily-callers <addr> <start_ts> <end_ts>', desc: '每日独立调用者',
    run: (a) => {
      require(a, 0, 'address', 'ts contract-daily-callers <addr> <start_ts> <end_ts>');
      require(a, 1, 'start_timestamp', 'ts contract-daily-callers <addr> <start_ts> <end_ts>');
      require(a, 2, 'end_timestamp', 'ts contract-daily-callers <addr> <start_ts> <end_ts>');
      return get(`/api/onecontractcallerstatistic?address=${a[0]}&start_timestamp=${a[1]}&end_timestamp=${a[2]}`);
    }
  },
  'contract-daily-calls': {
    usage: 'ts contract-daily-calls <addr> <start_ts> <end_ts>', desc: '每日调用次数',
    run: (a) => {
      require(a, 0, 'address', 'ts contract-daily-calls <addr> <start_ts> <end_ts>');
      require(a, 1, 'start_timestamp', 'ts contract-daily-calls <addr> <start_ts> <end_ts>');
      require(a, 2, 'end_timestamp', 'ts contract-daily-calls <addr> <start_ts> <end_ts>');
      return get(`/api/onecontracttriggerstatistic?address=${a[0]}&start_timestamp=${a[1]}&end_timestamp=${a[2]}`);
    }
  },
  'contract-analysis': {
    usage: 'ts contract-analysis <address> [type:0-5]', desc: '合约日度分析',
    run: (a) => get(`/api/contract/analysis?address=${require(a, 0, 'address', 'ts contract-analysis <address> [type:0-5]')}&type=${a[1] || '0'}`)
  },
  'contract-all-callers': {
    usage: 'ts contract-all-callers <address> [day]', desc: '所有调用者列表',
    run: (a, o) => get(`/api/onecontractcallers?address=${require(a, 0, 'address', 'ts contract-all-callers <address> [day]')}&day=${a[1] || '1'}&start=${o.start}&limit=${o.limit}`)
  },
  'contract-triggers': {
    usage: 'ts contract-triggers [--start N] [--limit N]', desc: '合约触发交易',
    run: (a, o) => get(`/api/contracts/trigger?start=${o.start}&limit=${o.limit}`)
  },

  // --- 超级代表 ---

  'sr': {
    usage: 'ts sr [type: 0=SR, 1=partner, 3=candidate]', desc: 'SR 列表',
    run: (a) => get(`/api/pagewitness?witnesstype=${a[0] || '0'}`)
  },
  'sr-votes': {
    usage: 'ts sr-votes <address>', desc: 'SR 投票详情',
    run: (a) => get(`/api/vote/witness?address=${require(a, 0, 'address', 'ts sr-votes <address>')}`)
  },
  'params': {
    usage: 'ts params', desc: '链参数',
    run: () => get('/api/chainparameters')
  },
  'proposal': {
    usage: 'ts proposal <id>', desc: '提案详情',
    run: (a) => get(`/api/proposal?id=${require(a, 0, 'id', 'ts proposal <id>')}`)
  },

  // --- 安全 ---

  'security-account': {
    usage: 'ts security-account <address>', desc: '账户风险检测',
    run: (a) => get(`/api/security/account/data?address=${require(a, 0, 'address', 'ts security-account <address>')}`)
  },
  'security-token': {
    usage: 'ts security-token <address>', desc: '代币安全检测',
    run: (a) => get(`/api/security/token/data?address=${require(a, 0, 'address', 'ts security-token <address>')}`)
  },
  'security-url': {
    usage: 'ts security-url <url>', desc: 'URL 钓鱼检测',
    run: (a) => get(`/api/security/url/data?url=${require(a, 0, 'url', 'ts security-url <url>')}`)
  },
  'security-tx': {
    usage: 'ts security-tx <hash>', desc: '交易风险检测',
    run: (a) => get(`/api/security/transaction/data?hashes=${require(a, 0, 'hash', 'ts security-tx <hash>')}`)
  },
  'security-auth': {
    usage: 'ts security-auth <address>', desc: '授权风险检查',
    run: (a) => get(`/api/security/auth/data?address=${require(a, 0, 'address', 'ts security-auth <address>')}`)
  },
  'security-sign': {
    usage: 'ts security-sign <address>', desc: '多签配置检查',
    run: (a) => get(`/api/security/sign/data?address=${require(a, 0, 'address', 'ts security-sign <address>')}`)
  },

  // --- 搜索 ---

  'search': {
    usage: 'ts search <keyword>', desc: '搜索',
    run: (a, o) => get(`/api/search/v2?term=${require(a, 0, 'keyword', 'ts search <keyword>')}&start=0&limit=${o.limit || '10'}`)
  },
  'tps': {
    usage: 'ts tps', desc: '当前 TPS',
    run: () => get('/api/system/tps')
  },
  'overview': {
    usage: 'ts overview', desc: 'TRON 网络概览',
    run: () => get('/api/system/homepage-bundle')
  },
  'hot-token': {
    usage: 'ts hot-token', desc: '热搜代币排行',
    run: () => get('/api/search/hot')
  },
  'nodes': {
    usage: 'ts nodes', desc: '全网节点信息',
    run: () => get('/api/nodemap')
  },

  // --- 统计 ---

  'trx-supply': {
    usage: 'ts trx-supply', desc: 'TRX 供应/销毁',
    run: () => get('/api/funds')
  },
  'trx-turnover': {
    usage: 'ts trx-turnover', desc: 'TRX 发行与销毁分析',
    run: () => get('/api/turnover')
  },
  'tx-trend': {
    usage: 'ts tx-trend', desc: '每日交易趋势',
    run: () => get('/api/overview/dailytransactionnum')
  },
  'tx-total': {
    usage: 'ts tx-total', desc: '累计交易数',
    run: () => get('/api/overview/transactionnum')
  },
  'active-accounts': {
    usage: 'ts active-accounts', desc: '活跃账户',
    run: () => get('/api/account/active_statistic')
  },
  'new-accounts': {
    usage: 'ts new-accounts', desc: '新增账户',
    run: () => get('/api/overview/dailyaccounts')
  },
  'defi-tvl': {
    usage: 'ts defi-tvl', desc: 'DeFi TVL',
    run: () => get('/api/defiTvl')
  },
  'top10': {
    usage: 'ts top10', desc: 'Top 10 排行',
    run: () => get('/api/top10')
  },
  'trx-price': {
    usage: 'ts trx-price', desc: 'TRX 价格历史',
    run: () => get('/api/trx/volume')
  },
  'energy-daily': {
    usage: 'ts energy-daily', desc: '每日能量消耗',
    run: () => get('/api/energydailystatistic')
  },
  'energy-dist': {
    usage: 'ts energy-dist', desc: '能量消耗分布',
    run: () => get('/api/energystatistic')
  },
  'energy-cost': {
    usage: 'ts energy-cost', desc: '能量/带宽获取成本',
    run: () => get('/api/acquisition_cost_statistic')
  },
  'bandwidth-daily': {
    usage: 'ts bandwidth-daily', desc: '每日带宽消耗',
    run: () => get('/api/netstatistic')
  },
  'trigger-stats': {
    usage: 'ts trigger-stats', desc: '合约调用分布',
    run: () => get('/api/triggeramountstatistic')
  },
  'token-tvc': {
    usage: 'ts token-tvc', desc: '代币链上价值(TVC)',
    run: () => get('/api/tokenTvc')
  },
  'token-analysis': {
    usage: 'ts token-analysis', desc: '代币交易分析',
    run: () => get('/api/token/analysis')
  },
  'token-transfer-analysis': {
    usage: 'ts token-transfer-analysis', desc: '代币转账分析',
    run: () => get('/api/tokenTransfer/analysis')
  },

  // --- 深度分析 ---

  'deep-related': {
    usage: 'ts deep-related <address>', desc: '关联账户',
    run: (a) => get(`/api/deep/account/relatedAccount?address=${require(a, 0, 'address', 'ts deep-related <address>')}`)
  },
  'deep-flow': {
    usage: 'ts deep-flow <address>', desc: '资金流向',
    run: (a) => get(`/api/deep/account/transferAmount?address=${require(a, 0, 'address', 'ts deep-flow <address>')}`)
  },
  'deep-big-tx': {
    usage: 'ts deep-big-tx <address>', desc: '大额交易',
    run: (a) => get(`/api/deep/account/token/bigAmount?address=${require(a, 0, 'address', 'ts deep-big-tx <address>')}`)
  },
  'deep-token-transfer': {
    usage: 'ts deep-token-transfer <address>', desc: '代币转账次数',
    run: (a) => get(`/api/deep/account/holderToken/basicInfo/trc20/transfer?address=${require(a, 0, 'address', 'ts deep-token-transfer <address>')}`)
  },

  // --- 稳定币 ---

  'stable-holders': {
    usage: 'ts stable-holders', desc: '持仓分布概览',
    run: () => get('/api/stableCoin/holder/balance/overview')
  },
  'stable-change': {
    usage: 'ts stable-change', desc: '持有者变化趋势',
    run: () => get('/api/stableCoin/holder/change')
  },
  'stable-top': {
    usage: 'ts stable-top', desc: '大户排行',
    run: () => get('/api/stableCoin/holder/top')
  },
  'stable-big-tx': {
    usage: 'ts stable-big-tx', desc: '大额交易',
    run: () => get('/api/deep/stableCoin/bigAmount')
  },
  'stable-events': {
    usage: 'ts stable-events', desc: '增发/销毁/黑名单事件',
    run: () => get('/api/deep/stableCoin/totalSupply/keyEvents')
  },
  'stable-dist': {
    usage: 'ts stable-dist', desc: '交易所/DeFi 分布',
    run: () => get('/api/stableCoin/distribution')
  },
  'stable-liquidity': {
    usage: 'ts stable-liquidity', desc: '流动性操作记录',
    run: () => get('/api/deep/stableCoin/liquidity/transaction')
  },
  'stable-pool': {
    usage: 'ts stable-pool', desc: '池子概览(TVL)',
    run: () => get('/api/stableCoin/pool/overview')
  },
  'stable-pool-trend': {
    usage: 'ts stable-pool-trend', desc: '池子趋势',
    run: () => get('/api/stableCoin/pool/trend')
  },
  'stable-pool-change': {
    usage: 'ts stable-pool-change', desc: '池子历史变化',
    run: () => get('/api/stableCoin/pool/change')
  },
  'stable-tvl': {
    usage: 'ts stable-tvl', desc: '稳定币 TVL 分布',
    run: () => get('/api/stableCoin/tvl')
  },

  // --- 兜底 ---

  'api': {
    usage: 'ts api "/api/xxx?param=value"', desc: '直接调用 API',
    run: (a) => get(require(a, 0, 'path', 'ts api "/api/xxx?param=value"'))
  },
};
