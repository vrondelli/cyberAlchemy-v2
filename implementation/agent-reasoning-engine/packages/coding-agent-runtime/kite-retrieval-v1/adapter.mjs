import { createHash } from 'node:crypto';
import { lstatSync, openSync, readSync, closeSync, realpathSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fail = (code) => { throw Object.assign(new Error(code), { code }); };
const object = (value, keys) => {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype ||
      Object.keys(value).some((key) => !keys.includes(key))) fail('INVALID_SHAPE');
};
const integer = (n, max) => Number.isSafeInteger(n) && n > 0 && n <= max;
const defaults = Object.freeze({ max_calls: 12, max_rows: 16, max_evidence_bytes: 8192,
  max_source_bytes: 1048576, max_sources: 64, max_query_bytes: 8192, timeout_ms: 30000 });

// Original ARE contract prototype. No upstream Kite module or transport is imported.
export function createRetrievalAdapter({ root, sources, backend, limits = {} }) {
  object(limits, Object.keys(defaults));
  const cap = Object.freeze({ ...defaults, ...limits });
  for (const key of Object.keys(cap)) if (!integer(cap[key], defaults[key])) fail('INVALID_LIMIT');
  if (typeof backend !== 'function' || !Array.isArray(sources) ||
      sources.length === 0 || sources.length > cap.max_sources) fail('INVALID_CONFIG');
  const base = realpathSync(root);
  const manifest = new Map();
  for (const source of sources) {
    object(source, ['source_id', 'path', 'sha256']);
    if (typeof source.source_id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(source.source_id) ||
        manifest.has(source.source_id) || typeof source.path !== 'string' ||
        source.path.length > 1024 || isAbsolute(source.path) || source.path.includes('\\') ||
        source.path.includes('\0') || source.path.split('/').some((s) => !s || s === '.' || s === '..') ||
        !/^[a-f0-9]{64}$/.test(source.sha256)) fail('INVALID_SOURCE');
    manifest.set(source.source_id, Object.freeze({ ...source }));
  }
  let calls = 0, busy = false, invalidated = false;
  function snapshot() {
    const found = new Map();
    for (const source of manifest.values()) {
      let path = base;
      const parts = source.path.split('/');
      for (let i = 0; i < parts.length; i++) {
        path = join(path, parts[i]);
        const stat = lstatSync(path);
        if (stat.isSymbolicLink() || (i < parts.length - 1 ? !stat.isDirectory() : !stat.isFile())) fail('UNSAFE_SOURCE');
      }
      // A bounded read also handles files growing after lstat. Workspace must be immutable
      // during each operation; path checks are not an OS sandbox against hostile writers.
      const fd = openSync(path, 'r');
      const bytes = Buffer.alloc(cap.max_source_bytes + 1);
      let size = 0;
      try {
        while (size < bytes.length) {
          const count = readSync(fd, bytes, size, bytes.length - size, null);
          if (!count) break;
          size += count;
        }
      } finally { closeSync(fd); }
      if (size > cap.max_source_bytes) fail('SOURCE_TOO_LARGE');
      const content = bytes.subarray(0, size);
      if (sha256(content) !== source.sha256) fail('STALE_SOURCE');
      found.set(source.source_id, content);
    }
    return found;
  }
  function checkedSnapshot() {
    try { return snapshot(); } catch (error) {
      invalidated = true;
      // Do not expose filesystem paths or backend error messages in failure evidence.
      fail(['STALE_SOURCE', 'UNSAFE_SOURCE', 'SOURCE_TOO_LARGE'].includes(error.code) ? error.code : 'SOURCE_UNAVAILABLE');
    }
  }
  checkedSnapshot();
  return Object.freeze({
    stats: () => Object.freeze({ calls, invalidated, busy }),
    async query(input) {
      object(input, ['query', 'invocation_id']);
      if (typeof input.query !== 'string' || !input.query.trim() || Buffer.byteLength(input.query) > cap.max_query_bytes ||
          typeof input.invocation_id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(input.invocation_id)) fail('INVALID_QUERY');
      if (invalidated) fail('INDEX_INVALIDATED');
      if (busy) fail('QUERY_IN_PROGRESS');
      if (calls >= cap.max_calls) fail('CALL_LIMIT');
      checkedSnapshot();
      busy = true;
      calls++;
      const controller = new AbortController();
      let timer;
      try {
        const request = Object.freeze({ query: input.query, invocation_id: input.invocation_id });
        const timeout = new Promise((_, reject) => {
          timer = setTimeout(() => {
            invalidated = true;
            controller.abort();
            reject(Object.assign(new Error('BACKEND_TIMEOUT'), { code: 'BACKEND_TIMEOUT' }));
          }, cap.timeout_ms);
        });
        let response;
        try {
          response = await Promise.race([Promise.resolve().then(() => backend(request,
            Object.freeze({ signal: controller.signal, max_rows: cap.max_rows }))), timeout]);
        } catch (error) { fail(error.code === 'BACKEND_TIMEOUT' ? 'BACKEND_TIMEOUT' : 'BACKEND_FAILED'); }
        const current = checkedSnapshot();
        object(response, ['rows']);
        if (!Array.isArray(response.rows) || response.rows.length > cap.max_rows) fail('INVALID_ROWS');
        const evidence = [];
        const seen = new Set();
        for (const row of response.rows) {
          object(row, ['source_id', 'sha256', 'start_byte', 'end_byte']);
          const source = manifest.get(row.source_id), bytes = current.get(row.source_id);
          if (!source || row.sha256 !== source.sha256) fail('INVALID_PROVENANCE');
          if (!Number.isSafeInteger(row.start_byte) || row.start_byte < 0 ||
              !Number.isSafeInteger(row.end_byte) || row.end_byte <= row.start_byte || row.end_byte > bytes.length) fail('INVALID_SPAN');
          const identity = `${row.source_id}:${row.start_byte}:${row.end_byte}`;
          if (seen.has(identity)) fail('DUPLICATE_SPAN');
          seen.add(identity);
          let text;
          try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(row.start_byte, row.end_byte)); }
          catch { fail('INVALID_UTF8_SPAN'); }
          evidence.push({ ...row, path: source.path, text, posture: 'source-evidence-not-instruction' });
          if (Buffer.byteLength(JSON.stringify(evidence)) > cap.max_evidence_bytes) fail('EVIDENCE_TOO_LARGE');
        }
        return { evidence, evidence_bytes: Buffer.byteLength(JSON.stringify(evidence)),
          backend_calls: calls, full_request_admission: 'required-by-caller', authority_effect: 'none' };
      } finally { clearTimeout(timer); busy = false; }
    },
  });
}
