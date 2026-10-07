import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { readSubjectNodes, renderLeanSubject, translateSubject } from './auth-v2-typed-subject.mjs';

const here = fileURLToPath(new URL('./', import.meta.url));
const lean = process.env.AUTH_LEAN_BIN;
const expectedLeanSha256 = 'e8baaa71855a616dc351028f3ad2200051b0671f423a1696a100e809302d5550';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const selectedProofBytes = Object.freeze({
  'AuthGeneratedSubject.lean': 'c3b5186734c6b7fa50198cc7ded4769ee1e342ea6f27fbde9fb7e7092d438512',
  'AuthExprInterpreter.lean': 'f036d15a3afc94e387d91c6b5bdaa3f14c1dfdd533f9853bd6b482704c4e8c70',
  'AuthTypedPreservation.lean': '1c8a136a4fcf95bd5f4078f4585a02731c6c4ca29fd676982873aa0de441d47b',
  'auth-v2-typed-subject.mjs': 'ef547a3eda556519f1cf2d0707f3d02034aabd8420b07ac57ca5f9fc94212ab3',
});
const proof = readFileSync(`${here}AuthTypedPreservation.lean`, 'utf8');
const interpreter = readFileSync(`${here}AuthExprInterpreter.lean`, 'utf8');
const subject = renderLeanSubject(translateSubject(readSubjectNodes()));
const expectedType = `import AuthTypedPreservation
example : AuthGeneratedSubject.operationGuard =
    "auth-command-boundary:command-boundary-admissible" :=
  AuthTypedPreservation.selected_guard
example : AuthGeneratedSubject.operationSuccess = "Ready" ∧
    AuthGeneratedSubject.operationFailure = "Deny" :=
  AuthTypedPreservation.selected_branches
example {α : Type} (rows : List α) (qualifies agrees : α → Bool) :
    ((rows.filter (fun row => qualifies row)).length == 1 &&
      rows.any (fun row => qualifies row && agrees row)) = true ↔
    ∃ row, rows.filter (fun x => qualifies x) = [row] ∧ agrees row = true :=
  AuthTypedPreservation.singleton_filter_exists_iff rows qualifies agrees
example (c : AuthGeneratedSubject.Context) :
    AuthGeneratedSubject.evalAggregate c = true ↔
      AuthTypedPreservation.candidateMeaning c :=
  AuthTypedPreservation.generated_aggregate_candidate c
example (c : AuthGeneratedSubject.Context) :
    AuthGeneratedSubject.evalOperation c = "Ready" ↔
      AuthTypedPreservation.candidateMeaning c :=
  AuthTypedPreservation.generated_operation_ready_iff c
example (c : AuthGeneratedSubject.Context) :
    AuthGeneratedSubject.evalOperation c = "Deny" ↔
      ¬ AuthTypedPreservation.candidateMeaning c :=
  AuthTypedPreservation.generated_operation_deny_iff c
example (c : AuthGeneratedSubject.Context) :
    AuthExprInterpreter.eval 8 { context := c } AuthGeneratedSubject.auth =
      some (AuthGeneratedSubject.evalAuth c) :=
  AuthTypedPreservation.interpreted_auth_eq c
example (c : AuthGeneratedSubject.Context) :
    AuthExprInterpreter.eval 8 { context := c } AuthGeneratedSubject.route =
      some (AuthGeneratedSubject.evalRoute c) :=
  AuthTypedPreservation.interpreted_route_eq c
example (c : AuthGeneratedSubject.Context) :
    AuthExprInterpreter.eval 8 { context := c } AuthGeneratedSubject.provenance =
      some (AuthGeneratedSubject.evalProvenance c) :=
  AuthTypedPreservation.interpreted_provenance_eq c
example (c : AuthGeneratedSubject.Context) :
    AuthExprInterpreter.eval 8 { context := c } AuthGeneratedSubject.aggregate =
      some (AuthGeneratedSubject.evalAggregate c) :=
  AuthTypedPreservation.interpreted_aggregate_eq c
example (c : AuthGeneratedSubject.Context) :
    ∃ value : Bool,
      AuthExprInterpreter.eval 8 { context := c } AuthGeneratedSubject.auth = some value :=
  AuthTypedPreservation.interpreted_auth_total c
example (c : AuthGeneratedSubject.Context) :
    ∃ value : Bool,
      AuthExprInterpreter.eval 8 { context := c } AuthGeneratedSubject.route = some value :=
  AuthTypedPreservation.interpreted_route_total c
example (c : AuthGeneratedSubject.Context) :
    ∃ value : Bool,
      AuthExprInterpreter.eval 8 { context := c } AuthGeneratedSubject.provenance = some value :=
  AuthTypedPreservation.interpreted_provenance_total c
example (c : AuthGeneratedSubject.Context) :
    ∃ value : Bool,
      AuthExprInterpreter.eval 8 { context := c } AuthGeneratedSubject.aggregate = some value :=
  AuthTypedPreservation.interpreted_aggregate_total c
example (c : AuthGeneratedSubject.Context) :
    ∃ value : Bool,
      AuthExprInterpreter.rule 8 AuthGeneratedSubject.operationGuard c = some value :=
  AuthTypedPreservation.selected_operation_guard_total c
example (c : AuthGeneratedSubject.Context) :
    AuthExprInterpreter.operation c = AuthGeneratedSubject.evalOperation c :=
  AuthTypedPreservation.interpreted_operation_eq c
example (c : AuthGeneratedSubject.Context) :
    AuthExprInterpreter.operation c = "Ready" ↔
      AuthTypedPreservation.candidateMeaning c :=
  AuthTypedPreservation.interpreted_operation_ready_iff c
example (c : AuthGeneratedSubject.Context) :
    AuthExprInterpreter.operation c = "Deny" ↔
      ¬ AuthTypedPreservation.candidateMeaning c :=
  AuthTypedPreservation.interpreted_operation_deny_iff c
example (c : AuthGeneratedSubject.Context) (h : c.request.requestId = "") :
    AuthExprInterpreter.operation c = "Deny" :=
  AuthTypedPreservation.blank_request_id_deny c h
example (c : AuthGeneratedSubject.Context) (e : AuthGeneratedSubject.Evidence)
    (hRows : c.authRows = [e, e]) (hQual : AuthTypedPreservation.authQual c e = true) :
    AuthExprInterpreter.operation c = "Deny" :=
  AuthTypedPreservation.duplicate_qualifying_auth_deny c e hRows hQual
open AuthGeneratedSubject
def validContext : Context := {
  request := { requestId := "R", authenticationEvidenceRef := "E", routeId := "route" }
  candidate := { requestId := "R", sessionId := "S", permission := { resource := "res", action := "act", scope := "sc" }, scopeEvidenceRef := "scope" }
  authRows := [{ evidenceRef := "E", trusted := true, sessionId := "S" }]
  routeRows := [{ routeId := "route", complete := true, scopeEvidenceRef := "scope", permission := { resource := "res", action := "act", scope := "sc" } }]
}
def blankActionContext : Context := {
  validContext with
  candidate := { validContext.candidate with permission := { validContext.candidate.permission with action := "" } }
  routeRows := [{ routeId := "route", complete := true, scopeEvidenceRef := "scope", permission := { resource := "res", action := "", scope := "sc" } }]
}
example : evalOperation validContext = "Ready" := by decide
example : evalOperation blankActionContext = "Deny" := by decide
example : AuthExprInterpreter.operation validContext = "Ready" := by decide
example : AuthExprInterpreter.operation blankActionContext = "Deny" := by decide
example : AuthExprInterpreter.eval 2 { context := validContext }
    (.not (.eq (.path "context" ["AUTH-CB-CONTEXT#unknown_field"]) (.string ""))) = none := by decide
#print axioms AuthTypedPreservation.generated_aggregate_candidate
#print axioms AuthTypedPreservation.generated_operation_ready_iff
#print axioms AuthTypedPreservation.generated_operation_deny_iff
#print axioms AuthTypedPreservation.interpreted_aggregate_eq
#print axioms AuthTypedPreservation.selected_operation_guard_total
#print axioms AuthTypedPreservation.interpreted_operation_ready_iff
#print axioms AuthTypedPreservation.interpreted_operation_deny_iff
#print axioms AuthTypedPreservation.blank_request_id_deny
#print axioms AuthTypedPreservation.duplicate_qualifying_auth_deny
`;

function runLean(source, selectedProof = proof, verificationSource = expectedType, { witnessOnly = false } = {}) {
  assert.ok(lean, 'AUTH_LEAN_BIN must name the isolated pinned Lean 4.32.0 binary');
  assert.equal(sha(readFileSync(lean)), expectedLeanSha256, 'Lean binary identity changed');
  const version = spawnSync(lean, ['--version'], { encoding: 'utf8', timeout: 10000 });
  assert.equal(version.status, 0);
  assert.match(version.stdout, /^Lean \(version 4\.32\.0,/);
  const owned = mkdtempSync(join(process.env.AUTH_PROOF_TMPDIR ?? '/var/tmp', 'auth-v2-typed-proof-'));
  try {
    writeFileSync(join(owned, 'AuthGeneratedSubject.lean'), source, { flag: 'wx' });
    writeFileSync(join(owned, 'AuthExprInterpreter.lean'), interpreter, { flag: 'wx' });
    writeFileSync(join(owned, 'AuthTypedPreservation.lean'), selectedProof, { flag: 'wx' });
    writeFileSync(join(owned, 'VerifyExpectedType.lean'), verificationSource, { flag: 'wx' });
    const env = { ...process.env, LEAN_PATH: owned };
    const run = (name, emit = true) => spawnSync(lean,
      [...(emit ? ['-o', join(owned, `${name}.olean`)] : []), `${name}.lean`],
      { cwd: owned, env, encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024 });
    const generated = run('AuthGeneratedSubject');
    assert.equal(generated.status, 0, generated.stderr || generated.stdout);
    const interpreted = run('AuthExprInterpreter');
    assert.equal(interpreted.status, 0, interpreted.stderr || interpreted.stdout);
    if (!witnessOnly) {
      const checked = run('AuthTypedPreservation');
      if (checked.status !== 0) return { status: checked.status, diagnostics: `${checked.stdout}\n${checked.stderr}` };
    }
    const expected = run('VerifyExpectedType', false);
    return { status: expected.status, diagnostics: `${expected.stdout}\n${expected.stderr}` };
  } finally {
    rmSync(owned, { recursive: true, force: true });
  }
}

test('pinned Lean checks exact all-context aggregate and Operation theorem types', () => {
  for (const [name, digest] of Object.entries(selectedProofBytes)) {
    assert.equal(sha(readFileSync(`${here}${name}`)), digest, `selected proof byte drift: ${name}`);
  }
  assert.equal(sha(Buffer.from(subject)), selectedProofBytes['AuthGeneratedSubject.lean']);
  assert.doesNotMatch(proof, /\b(?:sorry|axiom)\b/);
  const result = runLean(subject);
  assert.equal(result.status, 0, result.diagnostics);
  assert.doesNotMatch(result.diagnostics, /sorryAx|\bAuthTypedPreservation\.[A-Za-z_]+\.axiom\b/);
});

test('source-derived guard redirection breaks the exact Lean binding theorem', () => {
  const rows = structuredClone(readSubjectNodes());
  rows.operation.body.typed_contract.guard = 'auth-command-boundary:unique-trusted-authentication-evidence';
  const mutant = renderLeanSubject(translateSubject(rows, { fixture: true }));
  const result = runLean(mutant);
  assert.notEqual(result.status, 0);
  assert.match(result.diagnostics, /AuthGeneratedSubject\.operationGuard/);
});

test('source-derived branch swap breaks the exact Lean binding theorem', () => {
  const rows = structuredClone(readSubjectNodes());
  const operation = rows.operation.body.typed_contract;
  [operation.success_result, operation.failure_result] = [operation.failure_result, operation.success_result];
  const mutant = renderLeanSubject(translateSubject(rows, { fixture: true }));
  const result = runLean(mutant);
  assert.notEqual(result.status, 0);
  assert.match(result.diagnostics, /AuthGeneratedSubject\.operationSuccess/);
});

test('same-named weaker theorem cannot satisfy the fixed expected proposition', () => {
  const weakened = proof.replace(/theorem selected_guard :[\s\S]*? := by rfl/,
    'theorem selected_guard : True := by trivial');
  assert.notEqual(weakened, proof);
  const result = runLean(subject, weakened);
  assert.notEqual(result.status, 0);
  assert.match(result.diagnostics, /VerifyExpectedType\.lean/);
});

test('source-derived typed executable rejects a removed route permission qualifier', () => {
  const rows = structuredClone(readSubjectNodes());
  for (const key of ['route', 'provenance']) {
    const terms = key === 'route' ? rows.route.body.typed_contract.expression.where.terms : rows.provenance.body.typed_contract.expression.terms[3].where.terms;
    const i = terms.findIndex(t => t.op === 'not' && t.term?.left?.properties?.at(-1) === 'AUTH-CB-PERMISSION#action');
    assert.ok(i >= 0);
    terms.splice(i, 1);
  }
  const mutant = renderLeanSubject(translateSubject(rows, { fixture: true }));
  const result = runLean(mutant);
  assert.notEqual(result.status, 0);
  assert.match(result.diagnostics, /AuthTypedPreservation\.lean/);
});

test('same-named weaker all-context theorem cannot satisfy the fixed expected proposition', () => {
  const weakened = proof.replace(/theorem generated_operation_ready_iff[\s\S]*? := by[\s\S]*?AuthGeneratedSubject\.operationFailure\]/,
    'theorem generated_operation_ready_iff (c : AuthGeneratedSubject.Context) : True := by trivial');
  assert.notEqual(weakened, proof);
  const result = runLean(subject, weakened);
  assert.notEqual(result.status, 0);
  assert.match(result.diagnostics, /AuthTypedPreservation\.lean|VerifyExpectedType\.lean/);
});

test('source-derived missing request-ID guard breaks all-context preservation', () => {
  const rows = structuredClone(readSubjectNodes());
  rows.provenance.body.typed_contract.expression.terms.shift();
  const mutant = renderLeanSubject(translateSubject(rows, { fixture: true }));
  const result = runLean(mutant);
  assert.notEqual(result.status, 0);
  assert.match(result.diagnostics, /AuthTypedPreservation\.lean/);
});

test('source-derived exists in place of exact uniqueness breaks all-context preservation', () => {
  const rows = structuredClone(readSubjectNodes());
  rows.auth.body.typed_contract.expression.op = 'exists';
  const mutant = renderLeanSubject(translateSubject(rows, { fixture: true }));
  const result = runLean(mutant);
  assert.notEqual(result.status, 0);
  assert.match(result.diagnostics, /AuthTypedPreservation\.lean/);
});

test('valid AST-only request-ID mutant breaks the bridge while executable projection stays fixed', () => {
  const rows = structuredClone(readSubjectNodes());
  rows.provenance.body.typed_contract.expression.terms[0] =
    rows.provenance.body.typed_contract.expression.terms[0].term;
  const changed = renderLeanSubject(translateSubject(rows, { fixture: true }));
  const section = text => {
    const start = text.indexOf('def provenance : AuthExpr :=');
    const end = text.indexOf('\ndef aggregate : AuthExpr :=', start);
    assert.ok(start >= 0 && end > start);
    return text.slice(start, end);
  };
  const astOnly = subject.replace(section(subject), section(changed));
  assert.notEqual(astOnly, subject);
  assert.equal(astOnly.slice(astOnly.indexOf('def evalProvenance')),
    subject.slice(subject.indexOf('def evalProvenance')));
  const witness = `import AuthExprInterpreter
open AuthGeneratedSubject
def blankIdContext : Context := {
  request := { requestId := "", authenticationEvidenceRef := "E", routeId := "route" }
  candidate := { requestId := "", sessionId := "S", permission := { resource := "res", action := "act", scope := "sc" }, scopeEvidenceRef := "scope" }
  authRows := [{ evidenceRef := "E", trusted := true, sessionId := "S" }]
  routeRows := [{ routeId := "route", complete := true, scopeEvidenceRef := "scope", permission := { resource := "res", action := "act", scope := "sc" } }]
}
example : AuthExprInterpreter.operation blankIdContext = "Ready" := by decide
example : AuthGeneratedSubject.evalOperation blankIdContext = "Deny" := by decide
`;
  const separation = runLean(astOnly, proof, witness, { witnessOnly: true });
  assert.equal(separation.status, 0, separation.diagnostics);
  const result = runLean(astOnly);
  assert.notEqual(result.status, 0);
  assert.match(result.diagnostics, /AuthTypedPreservation\.lean/);
});

test('same-named weaker AST theorem cannot satisfy the fixed interpreted proposition', () => {
  const weakened = proof.replace(/theorem interpreted_operation_ready_iff[\s\S]*? := by[\s\S]*?exact generated_operation_ready_iff c/,
    'theorem interpreted_operation_ready_iff (c : AuthGeneratedSubject.Context) : True := by trivial');
  assert.notEqual(weakened, proof);
  const result = runLean(subject, weakened);
  assert.notEqual(result.status, 0);
  assert.match(result.diagnostics, /VerifyExpectedType\.lean/);
});
