import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const base = process.env.TEST_BASE_URL;
assert(base?.startsWith('https://'), 'Set TEST_BASE_URL to the production HTTPS URL');
async function call(path, data) {
  const response = await fetch(`${base}${path}`, data === undefined ? undefined : {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data),
    signal: AbortSignal.timeout(300000),
  });
  const body = await response.json();
  return { response, body };
}
function pass(name) { console.log(`PASS ${name}`); }
const health = await call('/api/health');
assert.equal(health.response.status, 200);
assert.deepEqual(health.body.checks, { database: true, storage: true });
pass('live PostgreSQL and R2 health');
const original = (await call('/api/documents')).body.documents;
assert(original.length >= 8);
pass('existing documents persisted');
const invalid = new FormData();
invalid.set('file', new File(['not a PDF'], 'invalid.pdf', { type: 'application/pdf' }));
assert.equal((await fetch(`${base}/api/documents`, { method: 'POST', body: invalid })).status, 415);
assert.equal((await call('/api/reset', { confirmation: 'invalid' })).response.status, 400);
assert.equal((await call('/api/scan', { ids: [] })).response.status, 400);
pass('invalid upload, empty selection and reset guards');
const bytes = await readFile(new URL('./fixtures/sample.pdf', import.meta.url));
const form = new FormData();
form.set('file', new File([bytes], 'production-verification.pdf', { type: 'application/pdf' }));
const uploaded = await fetch(`${base}/api/documents`, { method: 'POST', body: form });
assert.equal(uploaded.status, 201);
const document = (await uploaded.json()).document;
pass('PDF upload to actual input storage');
const scan = await call('/api/scan', { ids: [document.id] });
assert.equal(scan.response.status, 200);
assert.equal(scan.body.total, 1);
assert.equal(scan.body.failures.length, 0, JSON.stringify(scan.body.failures));
assert.equal(scan.body.processed.length, 1);
const routed = scan.body.processed[0];
assert.match(routed.storageKey, /^output\/(accepted|needs-review|rejected)\//);
assert.match(routed.result, /Routing decision/);
console.log(`Provider: ${routed.provider}; category: ${routed.classification}`);
pass('one selected PDF complete production flow');
const stored = await fetch(`${base}/api/documents/${document.id}/file`);
assert.equal(stored.status, 200);
assert.equal(Buffer.compare(Buffer.from(await stored.arrayBuffer()), bytes), 0);
pass('routed PDF download byte-for-byte');
const report = await fetch(`${base}/api/documents/${document.id}/report`);
assert.equal(report.status, 200);
assert.match(report.headers.get('content-disposition'), /attachment; filename=.*routing-report\.md/);
assert.equal(await report.text(), routed.result);
pass('server-backed report download');
const after = (await call('/api/documents')).body.documents;
for (const old of original) assert.equal(after.find(d=>d.id===old.id).storageKey, old.storageKey);
pass('unselected files left unchanged');
const pending = after.find(d=>d.classification==='pending' && !/protected|encrypted/i.test(d.name));
assert(pending, 'Need a readable pending file for debug checks');
const started = await call('/api/debug', { action: 'start', ids: [pending.id] });
assert.equal(started.response.status, 200);
const sessionId = started.body.sessionId;
assert.equal((await call('/api/debug', { sessionId, step: 'validate' })).response.status, 500);
for (const step of ['read', 'ocr', 'validate', 'analyze', 'route']) {
  const result = await call('/api/debug', { sessionId, step });
  assert.equal(result.response.status, 200, JSON.stringify(result.body));
  pass(`durable debug checkpoint: ${step}`);
}
const backup = await call('/api/backup', {});
assert.equal(backup.response.status, 200, JSON.stringify(backup.body));
pass('R2 backup creation');
console.log('Production API smoke checks completed. Workspace reset deliberately not invoked.');
