import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ============ Config ============

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const PROJECT_ROOT = resolve(__dirname, '..');

export const VERSION = '1.0.0';
const BASE_URL = 'https://apilist.tronscanapi.com';

let apiKey = process.env.TRONSCAN_API_KEY || '';

export function loadConfig() {
  if (apiKey) return;
  const envPath = resolve(PROJECT_ROOT, '.env');
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*TRONSCAN_API_KEY\s*=\s*(.+?)\s*$/);
      if (match) {
        apiKey = match[1].replace(/^["']|["']$/g, '');
        process.env.TRONSCAN_API_KEY = apiKey;
      }
    }
  }
  if (!apiKey) {
    err('未找到 API Key');
    warn('运行 ts setup <your-api-key> 快速配置');
    warn('API Key 申请: https://tronscan.org/#/developer/api');
    process.exit(2);
  }
}

// ============ Colors ============

const isTTY = process.stderr.isTTY ?? false;
const c = {
  red:    (s) => (isTTY ? `\x1b[31m${s}\x1b[0m` : s),
  green:  (s) => (isTTY ? `\x1b[32m${s}\x1b[0m` : s),
  yellow: (s) => (isTTY ? `\x1b[33m${s}\x1b[0m` : s),
  cyan:   (s) => (isTTY ? `\x1b[36m${s}\x1b[0m` : s),
  bold:   (s) => (isTTY ? `\x1b[1m${s}\x1b[0m` : s),
  dim:    (s) => (isTTY ? `\x1b[2m${s}\x1b[0m` : s),
};
export { c };

export function err(msg) {
  console.error(c.red(`✗ ${msg}`));
}

export function warn(msg) {
  console.error(c.yellow(`  ↳ ${msg}`));
}

// ============ HTTP ============

function httpHint(status) {
  if (status === 401 || status === 403) warn('请检查 API Key 是否正确');
  else if (status === 404) warn('接口路径不存在或参数无效');
  else if (status === 429) warn('请求频率超限，请稍后重试');
  else if (status >= 500) warn('服务端异常，请稍后重试');
}

export async function get(path) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'TRON-PRO-API-KEY': apiKey },
    });
  } catch (e) {
    err(`网络请求失败: ${e.message}`);
    warn('请检查网络连接');
    process.exit(3);
  }
  if (!res.ok) {
    err(`请求失败 [HTTP ${res.status}]`);
    httpHint(res.status);
    const body = await res.text();
    if (body) console.error(body);
    process.exit(4);
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`API 返回非 JSON: ${text.slice(0, 200)}`);
  }
}

export async function post(path, body) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'TRON-PRO-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  } catch (e) {
    err(`网络请求失败: ${e.message}`);
    warn('请检查网络连接');
    process.exit(3);
  }
  if (!res.ok) {
    err(`请求失败 [HTTP ${res.status}]`);
    httpHint(res.status);
    const text = await res.text();
    if (text) console.error(text);
    process.exit(4);
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`API 返回非 JSON: ${text.slice(0, 200)}`);
  }
}

// ============ Output ============

export function output(data, raw) {
  if (raw) {
    console.log(JSON.stringify(data));
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

// ============ Resolve ============

export async function resolveContract(input) {
  if (/^T[A-Za-z0-9]{33}$/.test(input)) return input;
  const data = await get(`/api/search/v2?term=${encodeURIComponent(input)}&start=0&limit=1`);
  const tokens = (data.token || [])
    .filter((t) => t.token_type === 'trc20');
  const lq = input.toLowerCase();
  const match =
    tokens.find((t) => t.abbr?.toLowerCase() === lq) ||
    tokens.find((t) => t.name?.toLowerCase() === lq) ||
    tokens.sort((a, b) => (a.vip ? 0 : 1) - (b.vip ? 0 : 1))[0];
  if (match?.token_id) return match.token_id;
  throw new Error(`无法解析代币: ${input}`);
}

export async function resolveTrc10(input) {
  if (/^\d+$/.test(input)) return input;
  const data = await get(`/api/search/v2?term=${encodeURIComponent(input)}&start=0&limit=1`);
  const tokens = (data.token || [])
    .filter((t) => t.token_type === 'trc10');
  const lq = input.toLowerCase();
  const match =
    tokens.find((t) => t.abbr?.toLowerCase() === lq) ||
    tokens.find((t) => t.name?.toLowerCase() === lq) ||
    tokens[0];
  if (match?.token_id) return match.token_id;
  throw new Error(`无法解析 TRC10 代币: ${input}`);
}
