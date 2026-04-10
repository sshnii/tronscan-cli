#!/usr/bin/env node
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

const TEST_ADDR = 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7';
const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const TEST_TX = '33e7c0cba5c527406b74f70e93035e762f45defd6063f8a895a2e8b5f6ce4fc8';
const SR_ADDR = 'TJvaAeFb8Lykt9RQcVyyTFN2iDvGMuyD4M';
const NOW = Date.now();
const YEAR_AGO = NOW - 365 * 24 * 3600 * 1000;

// [command, ...args]
const tasks = [
  // 账户
  ['account', TEST_ADDR],
  ['account-list', '--limit', '3'],
  ['account-tokens', TEST_ADDR, '--limit', '3'],
  ['account-resource', TEST_ADDR],
  ['account-resource-v1', TEST_ADDR],
  ['account-approve', TEST_ADDR, '--limit', '3'],
  ['account-approve-change', TEST_ADDR, '--limit', '3'],
  ['account-votes', TEST_ADDR],
  ['account-analysis', TEST_ADDR],
  ['account-asset', TEST_ADDR],
  ['account-projects', TEST_ADDR],

  // 交易
  ['tx', TEST_TX],
  ['tx-list', '--limit', '3'],
  ['tx-stats'],
  ['transfer', TEST_ADDR, '--limit', '3'],
  ['transfer-stats'],
  ['transfer-trc20', TEST_ADDR, '--limit', '3'],
  ['transfer-trc20-contract', USDT, '--limit', '3'],
  ['transfer-trc1155', TEST_ADDR, '--limit', '3'],
  ['transfer-trc721', 'THjYwnDDN6aYxrzKb88CSMTEYjBuHpoYxS', '1'],
  ['internal-tx', TEST_ADDR, '--limit', '3'],

  // 区块
  ['block'],
  ['block', '81511009'],

  // 代币
  ['token', USDT],
  ['token-trc10', '1002000'],
  ['token-holders', USDT, '--limit', '3'],
  ['token-holders-trc10', '1002000', '--limit', '3'],
  ['token-price', 'trx'],
  ['token-list', '--limit', '3'],
  ['token-distribution', USDT],

  // 合约
  ['contract', USDT],
  ['contract-list', '--limit', '3'],
  ['contract-callers', USDT],
  ['contract-energy', USDT],
  ['contract-daily-callers', USDT, String(YEAR_AGO), String(NOW)],
  ['contract-daily-calls', USDT, String(YEAR_AGO), String(NOW)],
  ['contract-analysis', USDT, '0'],
  ['contract-all-callers', USDT, '--limit', '3'],
  ['contract-triggers', '--limit', '3'],

  // 超级代表
  ['sr'],
  ['sr-votes', SR_ADDR],
  ['params'],
  ['proposal', '1'],

  // 安全
  ['security-account', TEST_ADDR],
  ['security-token', USDT],
  ['security-url', 'https://tronscan.org'],
  ['security-tx', TEST_TX],
  ['security-auth', TEST_ADDR],
  ['security-sign', TEST_ADDR],

  // 搜索/概览
  ['search', 'USDT', '--limit', '3'],
  ['tps'],
  ['overview'],
  ['hot-token'],
  ['nodes'],

  // 统计
  ['trx-supply'],
  ['trx-turnover'],
  ['protocol-revenue', '0'],
  ['burn-revenue', '0'],
  ['stake-revenue', '0'],
  ['tx-trend'],
  ['tx-total'],
  ['active-accounts'],
  ['new-accounts'],
  ['defi-tvl'],
  ['top10'],
  ['trx-price'],
  ['energy-daily'],
  ['energy-dist'],
  ['energy-cost'],
  ['bandwidth-daily'],
  ['trigger-stats'],
  ['token-tvc'],
  ['token-analysis', USDT],
  ['token-transfer-analysis'],

  // 深度分析
  ['deep-related', TEST_ADDR],
  ['deep-flow', TEST_ADDR],
  ['deep-big-tx', TEST_ADDR],
  ['deep-token-transfer', TEST_ADDR, USDT],

  // 稳定币
  ['stable-holders'],
  ['stable-change'],
  ['stable-top'],
  ['stable-big-tx', '1'],
  ['stable-events'],
  ['stable-dist', USDT],
  ['stable-liquidity'],
  ['stable-pool', 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE'],
  ['stable-pool-trend', 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE'],
  ['stable-pool-change', 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE'],
  ['stable-tvl'],
];

const results = {};
let count = 0;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

for (const task of tasks) {
  const cmdName = task[0];
  const args = task.slice(1).map(a => `"${a}"`).join(' ');
  const fullCmd = `ts ${cmdName} ${args} --raw`;

  try {
    const out = execSync(fullCmd, {
      encoding: 'utf-8',
      timeout: 15000,
      cwd: '/Users/songshaohua/Desktop/tronscan cli',
      env: { ...process.env, PATH: '/usr/local/bin:' + process.env.PATH }
    }).trim();

    const size = Buffer.byteLength(out, 'utf-8');
    let parsed;
    try { parsed = JSON.parse(out); } catch { parsed = out; }

    results[cmdName + (task.length > 1 ? ' ' + task.slice(1).join(' ') : '')] = {
      size,
      sizeKB: (size / 1024).toFixed(1),
      data: parsed
    };
    console.log(`✓ ${cmdName} — ${(size/1024).toFixed(1)} KB`);
  } catch (e) {
    results[cmdName + (task.length > 1 ? ' ' + task.slice(1).join(' ') : '')] = {
      size: 0,
      sizeKB: '0',
      error: e.stderr?.trim() || e.message
    };
    console.log(`✗ ${cmdName} — error`);
  }

  count++;
  // 每 10 次暂停 1 秒
  if (count % 10 === 0) {
    await sleep(1000);
  }
}

// 按大小排序的摘要
const summary = Object.entries(results)
  .map(([cmd, r]) => ({ cmd, sizeKB: parseFloat(r.sizeKB), error: r.error || null }))
  .sort((a, b) => b.sizeKB - a.sizeKB);

const output = { summary, details: results };
writeFileSync('/Users/songshaohua/Desktop/tronscan cli/api-responses.json', JSON.stringify(output, null, 2));
console.log('\n=== 按大小排序 (Top 20) ===');
summary.slice(0, 20).forEach(s => {
  console.log(`  ${s.sizeKB.toString().padStart(8)} KB  ${s.cmd}${s.error ? ' ❌' : ''}`);
});
console.log(`\n总命令: ${tasks.length}, 结果已保存至 api-responses.json`);
