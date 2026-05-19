/**
 * Smoke-test key APIs (run with backend on :3000).
 *   cd backend && node scripts/smoke-api.js
 */
require('dotenv').config();

const BASE = process.env.API_BASE || 'http://localhost:3000';
const DEMO = { email: 'owner@demo-landlord.rw', password: 'Demo2026!' };
const TENANT = { email: 'tenant@demo-landlord.rw', password: 'Demo2026!' };

async function req(path, options = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { ok: res.ok, status: res.status, body };
}

async function login(creds) {
  const r = await req('/auth/login', { method: 'POST', body: JSON.stringify(creds) });
  if (!r.ok) throw new Error(`login ${creds.email}: ${r.status} ${JSON.stringify(r.body)}`);
  return r.body.accessToken;
}

async function main() {
  const results = [];
  const pass = (name) => results.push({ name, ok: true });
  const fail = (name, err) => results.push({ name, ok: false, err: String(err) });

  try {
    const plans = await req('/billing/plans');
    if (!plans.ok || !plans.body?.plans?.length) throw new Error('no plans');
    pass('GET /billing/plans');
  } catch (e) {
    fail('GET /billing/plans', e);
  }

  let ownerToken;
  let tenantToken;
  try {
    ownerToken = await login(DEMO);
    pass('POST /auth/login (owner)');
  } catch (e) {
    fail('POST /auth/login (owner)', e);
    console.table(results);
    process.exit(1);
  }

  try {
    tenantToken = await login(TENANT);
    pass('POST /auth/login (tenant)');
  } catch (e) {
    fail('POST /auth/login (tenant)', e);
  }

  const auth = (token) => ({ Authorization: `Bearer ${token}` });

  const ownerGets = [
    '/dashboard/hub',
    '/analytics/overview',
    '/analytics/annual-forecast',
    '/analytics/team-roles',
    '/buildings',
    '/units',
    '/tenants',
    '/contracts',
    '/payments',
    '/payments/invoices',
    '/payments/settings',
    '/compliance/profile',
    '/compliance/summary',
    '/compliance/obligations',
    '/expenses',
    '/expenses/summary',
    '/accounts/users',
    '/audit-events',
  ];

  for (const path of ownerGets) {
    try {
      const r = await req(path, { headers: auth(ownerToken) });
      if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(r.body)}`);
      pass(`GET ${path}`);
    } catch (e) {
      fail(`GET ${path}`, e);
    }
  }

  try {
    const r = await req('/dashboard/hub', { headers: auth(tenantToken) });
    if (!r.ok) throw new Error(`${r.status}`);
    pass('GET /dashboard/hub (tenant)');
  } catch (e) {
    fail('GET /dashboard/hub (tenant)', e);
  }

  try {
    const contracts = await req('/contracts', { headers: auth(tenantToken) });
    if (!contracts.ok) throw new Error(`${contracts.status}`);
    const list = Array.isArray(contracts.body) ? contracts.body : [];
    const approved = list.find((c) => c.isApproved && c.status === 'ACTIVE');
    if (approved) {
      const month = new Date().toISOString().slice(0, 7);
      const quote = await req('/payments/quote', {
        method: 'POST',
        headers: auth(tenantToken),
        body: JSON.stringify({
          contractId: approved.id,
          billingMonths: [month],
        }),
      });
      if (!quote.ok) throw new Error(`quote ${quote.status} ${JSON.stringify(quote.body)}`);
      pass('POST /payments/quote (tenant)');
    } else {
      pass('POST /payments/quote (tenant) [skipped — no approved contract]');
    }
  } catch (e) {
    fail('POST /payments/quote (tenant)', e);
  }

  try {
    const fd = new FormData();
    fd.append('category', 'Smoke test');
    fd.append('description', 'API smoke');
    fd.append('amountRwf', '1000');
    fd.append('expenseDate', new Date().toISOString().slice(0, 10));
    const res = await fetch(`${BASE}/expenses`, {
      method: 'POST',
      headers: auth(ownerToken),
      body: fd,
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`${res.status} ${t}`);
    }
    pass('POST /expenses (multipart, no file)');
  } catch (e) {
    fail('POST /expenses', e);
  }

  const failed = results.filter((r) => !r.ok);
  console.log('\nSmoke test results:\n');
  for (const r of results) {
    console.log(r.ok ? '  OK ' : ' FAIL', r.name, r.ok ? '' : `— ${r.err}`);
  }
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
