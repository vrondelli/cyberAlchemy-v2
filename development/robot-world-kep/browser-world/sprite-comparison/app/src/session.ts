export interface Robot {
  readonly id: string; readonly owner: string;
  readonly position: readonly [number, number]; readonly energy: number; readonly cargo: number;
  readonly memory: readonly number[]; readonly prior: readonly number[];
}
export interface Frame {
  readonly tick: number; readonly revision: number; readonly worldId: string;
  readonly built: number; readonly resource: number; readonly stock: number;
  readonly knowledge: readonly string[]; readonly robots: readonly Robot[];
}
export interface Capability {
  readonly capabilityId: string; readonly version: string; readonly kind: 'tool' | 'workflow';
  readonly artifactType: 'dataset' | 'recipe'; readonly domain: string; readonly effect: string;
  readonly byteCount: number; readonly contributors: readonly string[]; readonly consumers: readonly string[];
}
export interface Session {
  readonly schemaVersion: string; readonly mode: string; readonly provenance: string;
  readonly frames: readonly Frame[]; readonly catalog: readonly Capability[];
  readonly sourceReplaySha256: string; readonly sourceCatalogSha256: string;
}

export const SESSION_SHA256 = 'ddbb3d12bdb89964fa29c9760f53616390fd1e82d138b0b209ff6bfebd317516';
const ID = /^[A-Za-z0-9._-]{1,160}$/;
const HASH = /^[a-f0-9]{64}$/;
const MAX_BYTES = 2 * 1024 * 1024;

function check(value: unknown, message: string): asserts value {
  if (!value) throw new Error(`Session rejected: ${message}`);
}
function object(x: unknown, keys: readonly string[], at: string): Record<string, unknown> {
  check(x !== null && typeof x === 'object' && !Array.isArray(x), `${at} must be an object`);
  const r = x as Record<string, unknown>;
  check(Object.keys(r).length === keys.length && keys.every(k => Object.hasOwn(r, k)), `${at} fields`);
  return r;
}
function list(x: unknown, max: number, at: string, min = 0): unknown[] {
  check(Array.isArray(x) && x.length >= min && x.length <= max, `${at} length`);
  return x;
}
function number(x: unknown, min: number, max: number, at: string, integer = false): number {
  check(typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max && (!integer || Number.isSafeInteger(x)), `${at} number`);
  return x;
}
function text(x: unknown, at: string, pattern = ID): string {
  check(typeof x === 'string' && pattern.test(x), `${at} identifier`);
  return x;
}
function identifiers(x: unknown, at: string, max = 1000): string[] {
  const a = list(x, max, at).map(v => text(v, at));
  check(new Set(a).size === a.length, `${at} duplicates`);
  return a;
}
function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

export function validateSession(input: unknown): Session {
  const s = object(input, ['schemaVersion','mode','provenance','frames','catalog','sourceReplaySha256','sourceCatalogSha256'], 'session');
  check(s.schemaVersion === 'robot-world.unity-session/v1-prototype', 'schema version');
  check(s.mode === 'recorded-scripted-policy', 'recorded mode');
  check(typeof s.provenance === 'string' && s.provenance.length <= 1000, 'provenance');
  text(s.sourceReplaySha256, 'replay hash', HASH); text(s.sourceCatalogSha256, 'catalog hash', HASH);
  let lastTick = -1, lastRevision = -1, world = '', dimension = 0;
  let identities: Map<string, string> | undefined;
  for (const [index, value] of list(s.frames, 10_000, 'frames', 1).entries()) {
    const f = object(value, ['tick','revision','worldId','built','resource','stock','knowledge','robots'], `frame ${index}`);
    const tick = number(f.tick, 0, 1e9, 'tick', true), revision = number(f.revision, 0, 1e9, 'revision', true);
    check(tick >= lastTick && revision > lastRevision, 'frame order');
    lastTick = tick; lastRevision = revision;
    const id = text(f.worldId, 'world');
    if (!world) world = id;
    check(world === id, 'world identity changed');
    for (const k of ['built','resource','stock']) number(f[k], 0, 1e9, k, true);
    identifiers(f.knowledge, 'knowledge');
    const current = new Map<string, string>();
    for (const value of list(f.robots, 128, 'robots', 1)) {
      const r = object(value, ['id','owner','position','energy','cargo','memory','prior'], 'robot');
      const id = text(r.id, 'robot'), owner = text(r.owner, 'owner');
      check(!current.has(id), 'duplicate robot'); current.set(id, owner);
      list(r.position, 2, 'position', 2).forEach(v => number(v, -5, 5, 'position'));
      number(r.energy, 0, 100, 'energy'); number(r.cargo, 0, 1e9, 'cargo', true);
      const memory = list(r.memory, 64, 'memory', 1), prior = list(r.prior, 64, 'prior', 1);
      if (!dimension) dimension = memory.length;
      check(memory.length === dimension && prior.length === dimension, 'semantic dimensions');
      memory.forEach(v => number(v, -1e6, 1e6, 'memory')); prior.forEach(v => number(v, 0, 1, 'prior'));
    }
    if (!identities) identities = current;
    check(current.size === identities.size && [...current].every(([id, owner]) => identities!.get(id) === owner), 'robot or owner identity changed');
  }
  const catalogIds = new Set<string>();
  for (const value of list(s.catalog, 1000, 'catalog')) {
    const c = object(value, ['capabilityId','version','kind','artifactType','domain','effect','byteCount','contributors','consumers'], 'capability');
    const id = text(c.capabilityId, 'capability'), version = text(c.version, 'version', HASH);
    check(!catalogIds.has(`${id}@${version}`), 'duplicate capability version'); catalogIds.add(`${id}@${version}`);
    check(c.kind === 'tool' || c.kind === 'workflow', 'capability kind');
    check(c.artifactType === 'dataset' || c.artifactType === 'recipe', 'artifact type');
    text(c.domain, 'domain'); check(c.effect === 'read-only' || c.effect === 'simulation-only', 'effect');
    number(c.byteCount, 1, 1e9, 'artifact bytes', true);
    check(identifiers(c.contributors, 'contributors').length > 0, 'contributors empty');
    check(identifiers(c.consumers, 'consumers').length > 0, 'consumers empty');
  }
  return freeze(input as Session);
}

export async function validateBytes(bytes: Uint8Array, inputManifest: unknown): Promise<Session> {
  check(bytes.length <= MAX_BYTES && bytes.length > 0, 'byte limit');
  const m = object(inputManifest, ['schemaVersion','fileName','sha256','byteCount','frameCount','sourceReplaySha256','sourceCatalogSha256','scope'], 'manifest');
  check(m.schemaVersion === 'robot-world.unity-session-manifest/v1-prototype' && m.fileName === 'session.json', 'manifest format');
  check(m.byteCount === bytes.length, 'manifest byte count');
  check(typeof m.scope === 'string' && m.scope.length <= 1000, 'manifest scope');
  const hashBuffer = await crypto.subtle.digest('SHA-256', new Uint8Array(bytes).buffer);
  const hash = [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, '0')).join('');
  check(hash === m.sha256 && hash === SESSION_SHA256, 'content hash or selected fixture');
  const s = validateSession(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
  check(m.frameCount === s.frames.length, 'manifest frame count');
  check(m.sourceReplaySha256 === s.sourceReplaySha256 && m.sourceCatalogSha256 === s.sourceCatalogSha256, 'source association');
  return s;
}

async function boundedFetch(url: string, limit: number, signal: AbortSignal): Promise<Uint8Array> {
  const response = await fetch(url, { signal });
  if (!response.ok || !response.body) throw new Error(`Unable to load ${url} (${response.status})`);
  const announced = Number(response.headers.get('content-length'));
  if (announced > limit) { await response.body.cancel(); throw new Error('Session download exceeds limit'); }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) throw new Error('Session download exceeds limit');
      chunks.push(value);
    }
  } finally { await reader.cancel(); reader.releaseLock(); }
  const result = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
  return result;
}

export async function loadSession(signal: AbortSignal): Promise<Session> {
  const [bytes, manifest] = await Promise.all([
    boundedFetch('/session/session.json', MAX_BYTES, signal),
    boundedFetch('/session/session-manifest.json', 16 * 1024, signal),
  ]);
  return validateBytes(bytes, JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(manifest)));
}
