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

function timeRange(days = 7) {
  const end = Date.now();
  const start = end - days * 24 * 3600 * 1000;
  return `start_timestamp=${start}&end_timestamp=${end}`;
}

function revenueRange(timeType) {
  const end = Date.now();
  const days = { '0': 30, '1': 365 * 3, '2': 365 * 5, '3': 365 * 10 };
  const start = end - (days[timeType] || 30) * 24 * 3600 * 1000;
  return { start, end };
}

function trim(data, limit = 20) {
  const arr = Array.isArray(data) ? data : (data?.data || []);
  if (!Array.isArray(arr) || arr.length <= limit) return data;
  const sliced = arr.slice(-limit);
  if (Array.isArray(data)) return { total: data.length, data: sliced };
  return { ...data, _total: arr.length, _trimmed: limit, data: sliced };
}

// ============ Command Definitions ============

export const commands = {

  // --- 账户 ---

  'account': {
    usage: 'ts account <address>', desc: '账户详情',
    run: async (a) => {
      const r = await get(`/api/accountv2?address=${require(a, 0, 'address', 'ts account <address>')}`);
      if (r.bandwidth?.assets) delete r.bandwidth.assets;
      if (r.tokenBalances) r.tokenBalances = r.tokenBalances.slice(0, 10);
      if (r.trc20token_balances) r.trc20token_balances = r.trc20token_balances.slice(0, 10);
      return r;
    }
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
  'account-votes': {
    usage: 'ts account-votes <address>', desc: '投票记录',
    run: (a) => get(`/api/vote?voter=${require(a, 0, 'address', 'ts account-votes <address>')}`)
  },
  'account-analysis': {
    usage: 'ts account-analysis <address>', desc: '日度分析(默认近7天)',
    run: (a) => get(`/api/account/analysis?address=${require(a, 0, 'address', 'ts account-analysis <address>')}&${timeRange()}`)
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
  'token-holders': {
    usage: 'ts token-holders <contract|symbol>', desc: 'TRC20 持有者列表',
    run: async (a, o) => {
      require(a, 0, 'contract|symbol', 'ts token-holders <contract|symbol>');
      const contract = await resolveAndLog(a[0], resolveContract);
      return get(`/api/token_trc20/holders?contract_address=${contract}&start=${o.start}&limit=${o.limit}`);
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
    usage: 'ts contract-energy <address>', desc: '能量消耗统计(默认近7天)',
    run: (a) => get(`/api/onecontractenergystatistic?address=${require(a, 0, 'address', 'ts contract-energy <address>')}&${timeRange()}`)
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
    usage: 'ts contract-analysis <address> [type:0-5]', desc: '合约日度分析(默认近30条)',
    run: async (a) => {
      const r = await get(`/api/contract/analysis?address=${require(a, 0, 'address', 'ts contract-analysis <address> [type:0-5]')}&type=${a[1] || '0'}`);
      return trim(r, 30);
    }
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
    usage: 'ts sr [type: 0=SR, 1=partner, 3=candidate]', desc: 'SR 列表(默认前20)',
    run: async (a, o) => {
      const r = await get(`/api/pagewitness?witnesstype=${a[0] || '0'}&limit=${o.limit}`);
      if (r.data) {
        r.data = r.data.map(({ address, name, url, realTimeVotes, changeVotes, producePercentage,
          annualizedRate, lastWithDrawAmount, brokerage }) =>
          ({ address, name, url, realTimeVotes, changeVotes, producePercentage,
            annualizedRate, lastWithDrawAmount, brokerage }));
      }
      return r;
    }
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
    usage: 'ts proposal [id] [--start N] [--limit N]', desc: '提案列表(传ID查详情)',
    run: async (a, o) => {
      if (a[0]) {
        const r = await get(`/api/proposal?id=${a[0]}`);
        const trimApproval = (list) => (list || []).map(({ address, name, votes }) =>
          ({ address, name, votes }));
        if (r.approvals) r.approvals = trimApproval(r.approvals);
        if (r.activeApprovals) r.activeApprovals = trimApproval(r.activeApprovals);
        if (r.veto) r.veto = trimApproval(r.veto);
        if (r.typeApprovals) {
          for (const k of Object.keys(r.typeApprovals)) {
            r.typeApprovals[k] = trimApproval(r.typeApprovals[k]);
          }
        }
        delete r.lastProposerInfos;
        return r;
      }
      return get(`/api/proposal?sort=-number&start=${o.start}&limit=${o.limit}`);
    }
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
    run: async (a, o) => {
      const limit = parseInt(o.limit) || 10;
      const r = await get(`/api/search/v2?term=${require(a, 0, 'keyword', 'ts search <keyword>')}&start=0&limit=${limit}`);
      const trimArr = (arr, n) => (arr || []).slice(0, n).map(({ abbr, name, token_id, token_type, vip, price }) =>
        ({ abbr, name, token_id, token_type, vip, price }));
      return {
        token: trimArr(r.token, limit),
        contract: (r.contract || []).slice(0, limit).map(({ address, name, tag, verified }) =>
          ({ address, name, tag, verified })),
        account: r.account,
      };
    }
  },
  'tps': {
    usage: 'ts tps', desc: '当前 TPS',
    run: () => get('/api/system/tps')
  },
  'overview': {
    usage: 'ts overview', desc: 'TRON 网络概览',
    run: async () => {
      const r = await get('/api/system/homepage-bundle');
      const { statsOverview, freezeResource, stableCoin, ...rest } = r;
      const result = { ...rest };
      if (statsOverview) {
        const { data, ...summary } = statsOverview;
        result.statsOverview = summary;
      }
      if (freezeResource) {
        const { data, ...summary } = freezeResource;
        result.freezeResource = summary;
      }
      return result;
    }
  },
  'hot-token': {
    usage: 'ts hot-token', desc: '热搜代币排行',
    run: () => get('/api/search/hot')
  },
  'nodes': {
    usage: 'ts nodes [--limit N]', desc: '全网节点信息(默认前20)',
    run: async (a, o) => trim(await get('/api/nodemap'), parseInt(o.limit) || 20)
  },

  // --- 统计 ---

  'trx-supply': {
    usage: 'ts trx-supply', desc: 'TRX 供应/销毁',
    run: () => get('/api/funds')
  },
  'trx-turnover': {
    usage: 'ts trx-turnover', desc: 'TRX 发行与销毁分析(默认近7天)',
    run: () => get(`/api/turnover?${timeRange()}`)
  },
  'protocol-revenue': {
    usage: 'ts protocol-revenue [timeType]', desc: 'TRON 协议总收入 (timeType: 0=天 1=月 2=季 3=年, 默认0)',
    run: async (a, o) => {
      const t = a[0] || '0';
      const limit = parseInt(o.limit) || 30;
      const { start, end } = revenueRange(t);
      const r = await get(`/api/external/turnover/new?size=1000&start=${start}&end=${end}&timeType=${t}`);
      const trimmed = trim(r, limit);
      if (trimmed.data) {
        trimmed.data = trimmed.data.map(({ day, totalIncome, burnIncome, stakeIncome, energyIncome, netIncome, trxClosePrice }) =>
          ({ day, totalIncome, burnIncome, stakeIncome, energyIncome, netIncome, trxClosePrice }));
      }
      return trimmed;
    }
  },
  'burn-revenue': {
    usage: 'ts burn-revenue [timeType]', desc: 'TRON 销毁收入 (timeType: 0=天 1=月 2=季 3=年, 默认0)',
    run: async (a, o) => {
      const t = a[0] || '0';
      const limit = parseInt(o.limit) || 30;
      const { start, end } = revenueRange(t);
      const r = await get(`/api/external/consumption/statistic?size=1000&start=${start}&end=${end}&timeType=${t}&type=burn`);
      return trim(r, limit);
    }
  },
  'stake-revenue': {
    usage: 'ts stake-revenue [timeType]', desc: 'TRON 质押收入 (timeType: 0=天 1=月 2=季 3=年, 默认0)',
    run: async (a, o) => {
      const t = a[0] || '0';
      const limit = parseInt(o.limit) || 30;
      const { start, end } = revenueRange(t);
      const r = await get(`/api/external/consumption/statistic?size=1000&start=${start}&end=${end}&timeType=${t}&type=stake`);
      return trim(r, limit);
    }
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
    usage: 'ts active-accounts', desc: '活跃账户(默认近7天)',
    run: () => get(`/api/account/active_statistic?${timeRange()}`)
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
    usage: 'ts energy-dist', desc: '能量消耗分布(默认近7天)',
    run: () => get(`/api/energystatistic?${timeRange()}`)
  },
  'energy-cost': {
    usage: 'ts energy-cost', desc: '能量/带宽获取成本',
    run: () => get('/api/acquisition_cost_statistic')
  },
  'bandwidth-daily': {
    usage: 'ts bandwidth-daily', desc: '每日带宽消耗(默认近7天)',
    run: () => get(`/api/netstatistic?${timeRange()}`)
  },
  'trigger-stats': {
    usage: 'ts trigger-stats', desc: '合约调用分布',
    run: () => get('/api/triggeramountstatistic')
  },
  'token-tvc': {
    usage: 'ts token-tvc [--limit N]', desc: '代币链上价值(TVC)(默认前10)',
    run: async (a, o) => {
      const r = await get('/api/tokenTvc');
      const limit = parseInt(o.limit) || 10;
      return {
        totalTvc: r.totalTvc,
        totalTokenNum: r.totalTokenNum,
        updateTime: r.updateTime,
        tokens: (r.tokens || []).slice(0, limit).map(({ abbr, name, contractAddress, priceInUsd, marketCapUSD,
          volume24hInUsd, nrOfTokenHolders, transferCount, gain }) =>
          ({ abbr, name, contractAddress, priceInUsd, marketCapUSD,
            volume24hInUsd, nrOfTokenHolders, transferCount, gain })),
      };
    }
  },
  'token-analysis': {
    usage: 'ts token-analysis <contract|symbol>', desc: '代币交易分析',
    run: async (a) => {
      require(a, 0, 'contract|symbol', 'ts token-analysis <contract|symbol>');
      const contract = await resolveAndLog(a[0], resolveContract);
      return get(`/api/token/analysis?token=${contract}`);
    }
  },
  'token-transfer-analysis': {
    usage: 'ts token-transfer-analysis [--limit N]', desc: '代币转账分析(默认近30条)',
    run: async (a, o) => trim(await get('/api/tokenTransfer/analysis'), parseInt(o.limit) || 30)
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
    usage: 'ts deep-token-transfer <address> <contract>', desc: '代币转账次数',
    run: (a) => {
      require(a, 0, 'address', 'ts deep-token-transfer <address> <contract>');
      require(a, 1, 'contract', 'ts deep-token-transfer <address> <contract>');
      return get(`/api/deep/account/holderToken/basicInfo/trc20/transfer?accountAddress=${a[0]}&tokenAddress=${a[1]}`);
    }
  },

  // --- 稳定币 ---

  'stable-holders': {
    usage: 'ts stable-holders', desc: '持仓分布概览',
    run: () => get('/api/stableCoin/holder/balance/overview')
  },
  'stable-change': {
    usage: 'ts stable-change', desc: '持有者变化趋势(默认近10条)',
    run: async () => {
      const r = await get('/api/stableCoin/holder/change');
      if (r.statistics) r.statistics = r.statistics.slice(-10);
      return r;
    }
  },
  'stable-top': {
    usage: 'ts stable-top', desc: '大户排行',
    run: () => get('/api/stableCoin/holder/top')
  },
  'stable-big-tx': {
    usage: 'ts stable-big-tx [types]', desc: '大额交易 (types: 1=USDT 2=USDJ 3=TUSD 4=USDC)',
    run: async (a, o) => {
      const r = await get(`/api/deep/stableCoin/bigAmount?types=${a[0] || '1'}&start=${o.start}&limit=${o.limit}`);
      if (r.contractMap) delete r.contractMap;
      return r;
    }
  },
  'stable-events': {
    usage: 'ts stable-events [--sort 0|1] [--start N] [--limit N]', desc: '增发/销毁/黑名单事件 (sort: 0=asc 1=desc)',
    run: (a, o) => get(`/api/deep/stableCoin/totalSupply/keyEvents?direction=1&sort=${o.sort || '1'}&start=${o.start}&limit=${o.limit}`)
  },
  'stable-dist': {
    usage: 'ts stable-dist <contract>', desc: '交易所/DeFi 分布',
    run: (a) => get(`/api/stableCoin/distribution?token=${require(a, 0, 'contract', 'ts stable-dist <contract>  (如 USDT: TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t)')}`)
  },
  'stable-liquidity': {
    usage: 'ts stable-liquidity [--limit N]', desc: '流动性操作记录(默认近20条)',
    run: async (a, o) => trim(await get('/api/deep/stableCoin/liquidity/transaction'), parseInt(o.limit) || 20)
  },
  'stable-pool': {
    usage: 'ts stable-pool <pool_address>', desc: '池子概览(TVL)',
    run: (a) => get(`/api/stableCoin/pool/overview?pool=${require(a, 0, 'pool_address', 'ts stable-pool <pool_address>')}`)
  },
  'stable-pool-trend': {
    usage: 'ts stable-pool-trend <pool_address>', desc: '池子趋势',
    run: (a) => get(`/api/stableCoin/pool/trend?pool=${require(a, 0, 'pool_address', 'ts stable-pool-trend <pool_address>')}`)
  },
  'stable-pool-change': {
    usage: 'ts stable-pool-change <pool_address> [--limit N]', desc: '池子历史变化(默认近30条)',
    run: async (a, o) => trim(await get(`/api/stableCoin/pool/change?pool=${require(a, 0, 'pool_address', 'ts stable-pool-change <pool_address>')}`), parseInt(o.limit) || 30)
  },
  'stable-tvl': {
    usage: 'ts stable-tvl', desc: '稳定币 TVL 分布(默认近10条)',
    run: async () => {
      const r = await get('/api/stableCoin/tvl');
      for (const key of Object.keys(r)) {
        if (Array.isArray(r[key])) r[key] = r[key].slice(-10);
      }
      return r;
    }
  },

  // --- 兜底 ---

  'api': {
    usage: 'ts api "/api/xxx?param=value"', desc: '直接调用 API',
    run: (a) => get(require(a, 0, 'path', 'ts api "/api/xxx?param=value"'))
  },
};
