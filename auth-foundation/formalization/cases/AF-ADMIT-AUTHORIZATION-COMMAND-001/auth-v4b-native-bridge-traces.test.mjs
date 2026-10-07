import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const impl = resolve(root, 'auth-foundation/implementation');
const toolchain = resolve(root, 'tools/toolchain/run');
const now = Math.floor(Date.now() / 1000);
const identity = { issuer: 'local', subject: 'alice', kind: 'human',
  client: 'client', expires_at: now + 120 };
const principalIdentity = { issuer: identity.issuer, subject: identity.subject,
  kind: identity.kind, client: identity.client };
const grant = { resource: 'documents', action: 'read', scope: 'tenant-7' };

function bridge(path, input, policy) {
  const directory = mkdtempSync(join(tmpdir(), 'auth-v4b-native-trace-'));
  try {
    const policyPath = join(directory, 'policy.json');
    writeFileSync(policyPath, JSON.stringify(policy));
    const manifest = resolve(impl, path, 'Cargo.toml');
    execFileSync(toolchain, ['cargo', 'build', '--locked', '--offline',
      '--manifest-path', manifest, '--features', 'trace'], { cwd: root, stdio: 'pipe' });
    const name = path === 'tenant-bridge' ? 'auth-tenant-bridge' : 'auth-prototype-bridge';
    const binary = resolve(impl, path, 'target/debug', name);
    const result = spawnSync(binary, [policyPath], {
      input: JSON.stringify(input), encoding: 'utf8',
      env: { ...process.env, AUTH_AUTHORIZATION_TRACE_STDERR: '1' },
    });
    assert.equal(result.status, 0, result.stderr);
    return result;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function traces(stderr) {
  return stderr.split('\n').filter(line => line.startsWith('AUTH_AUTHORIZATION_TRACE ')).map(line => {
    const envelope = /^AUTH_AUTHORIZATION_TRACE Trace \{ root: (\w+), invocation_id: (\d+), request_id: "([^"]+)", events: \[(.*)\] \}$/.exec(line);
    assert.ok(envelope, `trace envelope: ${line}`);
    const [, root, invocation, request, body] = envelope;
    const events = [...body.matchAll(/Event \{ root: (\w+), invocation_id: (\d+), request_id: "([^"]+)", epoch_id: Some\((\d+)\), kind: (\w+) \}/g)]
      .map(([, eventRoot, eventInvocation, eventRequest, epoch, kind]) => {
        assert.equal(eventRoot, root);
        assert.equal(eventInvocation, invocation);
        assert.equal(eventRequest, request);
        return { epoch: Number(epoch), kind };
      });
    assert.equal(events.length, (body.match(/Event \{/g) ?? []).length);
    assert.ok(events.every(event => event.epoch === events[0].epoch));
    return { root, invocation: Number(invocation), request, epoch: events[0]?.epoch, events: events.map(event => event.kind) };
  });
}

test('both authentication bridges observe the ordered native READY path', () => {
  const policy = { revision: 1, principals: [{ ...principalIdentity, id: 'human:alice',
    enabled: true, read: true }] };
  for (const path of ['authentication-prototype/bridge', 'authentication-https/bridge']) {
    const result = bridge(path, identity, policy);
    assert.deepEqual(JSON.parse(result.stdout), { decision: 'ALLOW' });
    const [trace] = traces(result.stderr);
    assert.equal(traces(result.stderr).length, 1);
    assert.equal(trace.root, path.startsWith('authentication-https') ? 'HttpsBridge' : 'PrototypeBridge');
    assert.equal(trace.request, 'verified-request');
    assert.equal(trace.epoch, 1);
    assert.deepEqual(trace.events, [
      'EpochOpened', 'GateReady', 'ReadyDecisionEntered', 'PolicyCallBefore', 'PolicyCallReturned',
    ]);
  }
});

test('tenant bridge separates request epochs and policy decisions', () => {
  const denied = { resource: 'documents', action: 'write', scope: 'tenant-7' };
  const input = { identity: { ...identity, jti: 'session-1' }, tenant: 'tenant-7',
    permissions: [grant, denied] };
  const policy = { revision: 1, principals: [{ ...principalIdentity, enabled: true,
    memberships: [{ tenant: 'tenant-7', enabled: true }],
    sessions: [{ jti: 'session-1', enabled: true, active_roles: ['reader'] }] }],
    roles: [{ id: 'reader', permissions: [grant] }] };
  const result = bridge('tenant-bridge', input, policy);
  assert.deepEqual(JSON.parse(result.stdout), { decisions: [true, false] });
  const observed = traces(result.stderr);
  assert.equal(observed.length, 2);
  for (const [index, trace] of observed.entries()) {
    assert.equal(trace.root, 'TenantBridge');
    assert.equal(trace.request, `request-${index}`);
    assert.equal(trace.epoch, index + 1);
    assert.deepEqual(trace.events, [
      'EpochOpened', 'GateReady', 'ReadyDecisionEntered', 'PolicyCallBefore', 'PolicyCallReturned',
    ]);
  }
  assert.notEqual(observed[0].invocation, observed[1].invocation);
});

test('bridge rejection before admission makes no downstream decision call', () => {
  const policy = { revision: 1, principals: [{ ...principalIdentity, id: 'human:alice',
    enabled: true, read: true }] };
  const result = bridge('authentication-prototype/bridge',
    { ...identity, kind: 'unsupported' }, policy);
  assert.deepEqual(JSON.parse(result.stdout), { decision: 'DENY' });
  assert.deepEqual(traces(result.stderr), []);
});
