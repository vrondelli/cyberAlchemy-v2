import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { extractCurrentGeneratedRust, extractGeneratedRust } from './auth-v2-rust-extract.mjs';
import { renderRustLeanSubject } from './auth-v2-rust-lean.mjs';

const here = fileURLToPath(new URL('./', import.meta.url));
const rust = readFileSync(new URL('../../../implementation/command-boundary-runtime-v2/src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs', import.meta.url), 'utf8');
const selected = extractCurrentGeneratedRust();
const lean = process.env.AUTH_LEAN_BIN;
const leanSha256 = 'e8baaa71855a616dc351028f3ad2200051b0671f423a1696a100e809302d5550';
const toolchain = join(here, '../../../../tools/toolchain/run');
const context = `import AuthExprInterpreter
import AuthRustFragment
open AuthGeneratedSubject
def validContext : Context := {
  request := { requestId := "request-1", authenticationEvidenceRef := "auth-1", routeId := "route-1" }
  candidate := { requestId := "request-1", sessionId := "session-1", permission := { resource := "documents", action := "read", scope := "tenant-1" }, scopeEvidenceRef := "scope-1" }
  authRows := [{ evidenceRef := "auth-1", sessionId := "session-1", trusted := true }]
  routeRows := [{ routeId := "route-1", complete := true, scopeEvidenceRef := "scope-1", permission := { resource := "documents", action := "read", scope := "tenant-1" } }]
}
`;
const separator = (name, changedContext, rustResult, typedResult) => `${context}
def selectedContext : Context := ${changedContext}
example : AuthRustFragment.operation selectedContext = some "${rustResult}" := by decide
example : AuthExprInterpreter.operation selectedContext = "${typedResult}" := by decide
example : AuthRustFragment.operation selectedContext ≠
    some (AuthExprInterpreter.operation selectedContext) := by decide
`;

function editBody(name, edit) {
  const { start, end } = selected.functions[name].source_span;
  const original = rust.slice(start, end);
  const changed = edit(original);
  assert.notEqual(changed, original);
  return `${rust.slice(0, start)}${changed}${rust.slice(end)}`;
}

function checkLean(mutatedRust, leanSource) {
  assert.ok(lean, 'AUTH_LEAN_BIN must name the isolated pinned Lean 4.32.0 binary');
  assert.equal(createHash('sha256').update(readFileSync(lean)).digest('hex'), leanSha256);
  const changedIR = extractGeneratedRust(mutatedRust, { fixture: true });
  assert.notDeepEqual(changedIR.functions, selected.functions);
  assert.throws(() => extractGeneratedRust(mutatedRust), /selected-rust-bytes-drift/);
  const owned = mkdtempSync('/var/tmp/auth-rust-separator-');
  try {
    writeFileSync(join(owned, 'Mutant.rs'), mutatedRust);
    const rustCheck = spawnSync(toolchain,
      ['rustc', '--edition=2021', '--crate-type=lib', '--emit=metadata', '-o', join(owned, 'Mutant.rmeta'), join(owned, 'Mutant.rs')],
      { cwd: owned, env: { ...process.env, TMPDIR: '/var/tmp' }, encoding: 'utf8', timeout: 60000, maxBuffer: 1024 * 1024 });
    assert.equal(rustCheck.status, 0, `mutant Rust must typecheck: ${rustCheck.error?.message ?? ''}\n${rustCheck.stdout}\n${rustCheck.stderr}`);
    for (const name of ['AuthGeneratedSubject', 'AuthExprInterpreter', 'AuthRustFragment'])
      writeFileSync(join(owned, `${name}.lean`), readFileSync(`${here}${name}.lean`));
    writeFileSync(join(owned, 'AuthGeneratedRustIR.lean'), renderRustLeanSubject(changedIR, { fixture: true }));
    writeFileSync(join(owned, 'Separation.lean'), leanSource);
    const env = { ...process.env, LEAN_PATH: owned };
    for (const name of ['AuthGeneratedSubject', 'AuthGeneratedRustIR', 'AuthExprInterpreter', 'AuthRustFragment', 'Separation']) {
      const args = name === 'Separation' ? [`${name}.lean`] : ['-o', join(owned, `${name}.olean`), `${name}.lean`];
      const run = spawnSync(lean, args, { cwd: owned, env, encoding: 'utf8', timeout: 60000, maxBuffer: 1024 * 1024 });
      assert.equal(run.status, 0, `${name}: ${run.error?.message ?? ''}\n${run.stdout}\n${run.stderr}`);
      assert.doesNotMatch(`${run.stdout}\n${run.stderr}`, /sorryAx|declaration uses 'sorry'/);
    }
  } finally { rmSync(owned, { recursive: true, force: true }); }
}

test('Rust-only missing request-ID guard has a Lean-reduced blank-ID separator', () => {
  const mutant = editBody('candidate_command_provenance', body =>
    body.replace('!(context.request.request_id == "")', 'true'));
  checkLean(mutant, separator('blank', `{
    validContext with
    request := { validContext.request with requestId := "" }
    candidate := { validContext.candidate with requestId := "" }
  }`, 'Ready', 'Deny'));
});

test('Rust-only redirected session equality has a Lean-reduced provenance separator', () => {
  const mutant = editBody('candidate_command_provenance', body =>
    body.replace('evidence.session_id == context.candidate_command.session_id',
      'evidence.session_id == context.request.request_id'));
  checkLean(mutant, separator('wrong-session', `{
    validContext with
    request := { validContext.request with requestId := "session-1" }
    candidate := { validContext.candidate with requestId := "session-1", sessionId := "wrong" }
  }`, 'Ready', 'Deny'));
});

test('Rust-only filter/count to any has a Lean-reduced duplicate-row separator', () => {
  const mutant = editBody('unique_trusted_authentication_evidence', body =>
    body.replace('.filter(|evidence| {', '.any(|evidence| {')
      .replace(/\}\)\s*\.count\(\) == 1/, '})'));
  checkLean(mutant, separator('duplicate', `{
    validContext with
    authRows := validContext.authRows ++ validContext.authRows
  }`, 'Ready', 'Deny'));
});

test('Rust-only branch swap has a Lean-reduced valid-context separator', () => {
  const mutant = editBody('admit_authorization_command', body =>
    body.replace('CommandBoundaryDecision::Ready', 'CommandBoundaryDecision::TEMP')
      .replace('CommandBoundaryDecision::Deny', 'CommandBoundaryDecision::Ready')
      .replace('CommandBoundaryDecision::TEMP', 'CommandBoundaryDecision::Deny'));
  checkLean(mutant, separator('swapped', 'validContext', 'Deny', 'Ready'));
});
