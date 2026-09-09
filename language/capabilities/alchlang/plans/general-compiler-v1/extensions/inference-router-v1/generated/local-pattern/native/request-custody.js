import { randomUUID } from 'node:crypto';
const fail = (code) => { throw Object.assign(Error(code), { code }); };
export function createMemoryRequestCustody({ policy, decisions, retentionMs = 60000, maxEntries = 128, maxBytes = 65536, clock = () => performance.now() }) {
    for (const n of [retentionMs, maxEntries, maxBytes])
        if (!Number.isSafeInteger(n) || n < 1)
            fail('INVALID_LIMITS');
    decisions = structuredClone(decisions);
    if (typeof policy !== 'function')
        fail('CUSTODY_BINDING_REQUIRED');
    const records = new Map(), tokens = new Map();
    let lock = Promise.resolve(), queued = 0;
    const prune = () => { for (const [key, r] of records)
        if (r.finishedAt !== null && clock() - r.finishedAt >= retentionMs) {
            records.delete(key);
            tokens.delete(r.token);
        } };
    const record = (token) => { prune(); return tokens.get(token) ?? fail('INVALID_EXECUTION_TOKEN'); };
    const finish = (r) => { if (r.finishedAt === null && r.outcome && r.transportSettled)
        r.finishedAt = clock(); };
    const inspect = (r) => structuredClone({ requestId: r.request.requestId, attempt: r.attempt, outcome: r.outcome?.kind ?? null, transportSettled: r.transportSettled, remoteCompletion: r.outcome?.kind === 'json-completed' || r.outcome?.kind === 'stream-completed' ? 'reported-complete' : 'unknown', usage: r.outcome && 'usage' in r.outcome ? r.outcome.usage : null });
    return {
        async reserve(request, control) {
            const req = structuredClone(request);
            const check = () => { if (control.signal.aborted)
                fail(control.signal.reason === 'deadline' ? 'DEADLINE_EXCEEDED' : 'CANCELLED'); if (clock() >= control.deadline)
                fail('DEADLINE_EXCEEDED'); };
            check();
            if (['scope', 'requestId', 'fingerprintVersion', 'fingerprint'].some(k => typeof req[k] !== 'string' || !req[k]) || typeof req.stream !== 'boolean' || (req.key !== null && (typeof req.key !== 'string' || !req.key || Buffer.byteLength(req.key) > 128)))
                fail('INVALID_RESERVATION');
            if (queued >= maxEntries)
                return { kind: 'reject', code: 'REQUEST_STORE_BUSY' };
            if (Buffer.byteLength(JSON.stringify(req)) > maxBytes)
                fail('REQUEST_TOO_LARGE');
            let committed = false, listener;
            const aborted = new Promise((_, reject) => { listener = () => { if (!committed)
                reject(Object.assign(Error(control.signal.reason === 'deadline' ? 'DEADLINE_EXCEEDED' : 'CANCELLED'), { code: control.signal.reason === 'deadline' ? 'DEADLINE_EXCEEDED' : 'CANCELLED' })); }; control.signal.addEventListener('abort', listener, { once: true }); });
            queued++;
            const job = lock.then(async () => {
                check();
                prune();
                const key = req.key === null ? JSON.stringify(['fresh', randomUUID()]) : JSON.stringify(['key', req.scope, req.key]);
                const existing = records.get(key);
                const decision = await policy({ exists: !!existing, matches: !!existing && existing.request.fingerprintVersion === req.fingerprintVersion && existing.request.fingerprint === req.fingerprint, pending: !!existing && existing.finishedAt === null, stream: existing?.request.stream ?? req.stream, succeeded: existing?.outcome?.kind === 'json-completed' });
                check();
                const status = decision?.status;
                if (status === decisions.replay) {
                    if (!existing || existing.finishedAt === null || existing.request.stream || existing.outcome?.kind !== 'json-completed' || existing.request.fingerprint !== req.fingerprint || existing.request.fingerprintVersion !== req.fingerprintVersion)
                        return fail('INVALID_IDEMPOTENCY_DECISION');
                    return { kind: 'replay', requestId: existing.request.requestId, result: structuredClone(existing.outcome.result) };
                }
                if (status !== decisions.execute) {
                    const code = Object.hasOwn(decisions.reject, status) ? decisions.reject[status] : fail('INVALID_IDEMPOTENCY_DECISION');
                    return { kind: 'reject', code, ...(existing ? { requestId: existing.request.requestId } : {}) };
                }
                if (existing)
                    fail('INVALID_IDEMPOTENCY_DECISION');
                if (records.size >= maxEntries)
                    return { kind: 'reject', code: 'REQUEST_STORE_FULL' };
                if ([...records.values()].some(r => r.request.requestId === req.requestId))
                    fail('DUPLICATE_REQUEST_ID');
                const token = randomUUID();
                const r = { request: req, token, attempt: null, outcome: null, transportSettled: false, finishedAt: null };
                records.set(key, r);
                tokens.set(token, r);
                committed = true;
                return { kind: 'execute', requestId: req.requestId, token };
            }).finally(() => { queued--; });
            lock = job.then(() => { }, () => { });
            try {
                return await Promise.race([job, aborted]);
            }
            finally {
                control.signal.removeEventListener('abort', listener);
            }
        },
        async beginAttempt(token, binding) { const r = record(token); if (r.attempt || r.outcome || r.transportSettled)
            fail('ATTEMPT_NOT_ALLOWED'); if (['id', 'version', 'model', 'policyVersion'].some(k => typeof binding[k] !== 'string' || !binding[k] || Buffer.byteLength(binding[k]) > 128))
            fail('INVALID_ATTEMPT'); r.attempt = { id: binding.id, version: binding.version, model: binding.model, policyVersion: binding.policyVersion }; },
        async recordOutcome(token, outcome) { const r = record(token); if (r.outcome)
            fail('OUTCOME_ALREADY_RECORDED'); if (!['json-completed', 'stream-completed', 'failed', 'cancelled'].includes(outcome.kind))
            fail('INVALID_OUTCOME'); if (outcome.kind === 'json-completed' && r.request.stream || outcome.kind === 'stream-completed' && !r.request.stream)
            fail('INVALID_OUTCOME'); if ((outcome.kind === 'json-completed' || outcome.kind === 'stream-completed') && !r.attempt)
            fail('INVALID_OUTCOME'); const copy = structuredClone(outcome); if (Buffer.byteLength(JSON.stringify(copy)) > maxBytes)
            fail('RESULT_TOO_LARGE'); r.outcome = copy; finish(r); },
        async markTransportSettled(token) { const r = record(token); r.transportSettled = true; finish(r); },
        async inspect(requestId) { prune(); const r = [...records.values()].find(r => r.request.requestId === requestId); return r ? inspect(r) : null; },
        inspectAll() { prune(); return [...records.values()].map(inspect); }
    };
}
//# sourceMappingURL=request-custody.js.map