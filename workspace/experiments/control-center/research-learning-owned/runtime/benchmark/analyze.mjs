import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

export const protocolBytes = readFileSync(new URL('./protocol.json', import.meta.url));
export const protocol = JSON.parse(protocolBytes);
export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const finite = v => typeof v === 'number' && Number.isFinite(v);
const hash = v => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const keys = ['candidateSha256','binarySha256','budgetSha256','protocolSha256','hostSha256'];

export function qualify(observations, startMs, endMs) {
  const reasons = [];
  if (!finite(startMs) || !finite(endMs) || endMs <= startMs || !Array.isArray(observations)) return ['host-window-invalid'];
  const pre = observations.filter(o => o.atMs < startMs);
  const during = observations.filter(o => o.atMs >= startMs && o.atMs <= endMs);
  if (pre.length < protocol.prelaunchObservations || during.length < 2) reasons.push('host-coverage-missing');
  if (!pre.length || startMs-pre.at(-1).atMs > protocol.maxObservationGapMs || !during.length || during[0].atMs-startMs > protocol.maxObservationGapMs || endMs-during.at(-1).atMs > protocol.maxObservationGapMs) reasons.push('host-edge-gap');
  observations.forEach((o, i) => {
    if (!finite(o.atMs) || (i && (o.atMs <= observations[i-1].atMs || o.atMs-observations[i-1].atMs > protocol.maxObservationGapMs))) reasons.push('host-observation-gap');
    for (const [key, limit, lower] of [
      ['normalizedLoad1',protocol.maxNormalizedLoad1,false],
      ['availableMemoryFraction',protocol.minAvailableMemoryFraction,true],
      ['cpuPressureAvg10',protocol.maxCpuPressureAvg10,false],
      ['memoryPressureAvg10',protocol.maxMemoryPressureAvg10,false],
    ]) if (!finite(o[key]) || o[key] < 0 || (key === 'availableMemoryFraction' && o[key] > 1) || (lower ? o[key] < limit : o[key] > limit)) reasons.push('host-unqualified:'+key);
  });
  return [...new Set(reasons)];
}

export function analyze(identity, attempts, budgetBytes) {
  const budget = JSON.parse(budgetBytes).budgets;
  const errors = [];
  if (!keys.every(k => hash(identity?.[k])) || identity.protocolSha256 !== digest(protocolBytes) || identity.budgetSha256 !== digest(budgetBytes)) errors.push('identity-invalid');
  if (!Array.isArray(attempts) || attempts.length > protocol.maxAttempts) throw new Error('attempt-sequence-invalid');
  const accepted = [], rejected = [], seen = new Set();
  for (const [index, a] of attempts.entries()) {
    if (accepted.length >= protocol.qualifiedSessions) errors.push('attempt-after-fixed-population');
    if (!a.runId || seen.has(a.runId) || a.attempt !== index+1) errors.push('attempt-identity:'+index);
    seen.add(a.runId);
    if (!keys.every(k => a.identity?.[k] === identity[k])) errors.push('mixed-identity:'+index);
    if (a.coldProcess !== true || a.freshStorage !== true) errors.push('cold-posture:'+index);
    const reasons = qualify(a.host, a.startMs, a.endMs);
    if (reasons.length) { rejected.push({runId:a.runId,reasons}); continue; }
    if (accepted.length >= protocol.qualifiedSessions) { errors.push('attempt-after-fixed-population'); continue; }
    accepted.push(a);
    if (a.status !== 'completed') errors.push('qualified-session-failed:'+a.runId);
  }
  const metrics = Object.entries(budget).map(([name,b]) => {
    const values = accepted.map(a => {
      const samples = a.metrics?.[name];
      if (!Array.isArray(samples) || samples.length < b.minimum_samples || !samples.every(v => finite(v) && v >= 0)) { errors.push('metric-missing-or-invalid:'+a.runId+':'+name); return null; }
      return Math.max(...samples);
    });
    const complete = accepted.length === protocol.qualifiedSessions && values.every(v => v !== null);
    const sorted = complete ? [...values].sort((a,b)=>a-b) : [];
    const p95Ms = complete ? sorted[Math.ceil(sorted.length*0.95)-1] : null;
    return {name,sessionCount:values.length,sessionMaximaMs:values,p95Ms,budgetMs:b.p95_ms,status:!complete?'not_evaluable':p95Ms>b.p95_ms?'FAIL':'PASS'};
  });
  return {schema:'cc-campaign-analysis/v1',identity,attemptsSha256:digest(JSON.stringify(attempts)),status:errors.length?'INVALID':accepted.length<protocol.qualifiedSessions?'INCOMPLETE':metrics.some(m=>m.status!=='PASS')?'FAIL':'PASS',errors,qualifiedCount:accepted.length,rejected,metrics,authorityEffect:'none'};
}

export function differential(before, after) {
  const comparable = [before,after].every(r=>['PASS','FAIL'].includes(r.status)) && ['budgetSha256','protocolSha256','hostSha256'].every(k=>before.identity[k]===after.identity[k]) && before.identity.candidateSha256!==after.identity.candidateSha256 && before.metrics.length===after.metrics.length && before.metrics.every(m=>after.metrics.some(n=>n.name===m.name));
  return {status:comparable?'COMPARABLE':'not_evaluable',before,after,deltas:comparable?after.metrics.map(m=>({name:m.name,p95DeltaMs:m.p95Ms-before.metrics.find(n=>n.name===m.name).p95Ms})):[],authorityEffect:'none',claimCeiling:'Comparison only; not product approval. Input reports must come from validated raw attempts.'};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const input = JSON.parse(readFileSync(process.argv[2]));
  const result = analyze(input.identity,input.attempts,readFileSync(process.argv[3]));
  console.log(JSON.stringify(result,null,2));
  process.exitCode = result.status === 'PASS' ? 0 : 1;
}
