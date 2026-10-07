import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { parseFormalProposition } from '../../../../language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/formal-claim.ts';
import { readSubjectNodes, renderLeanSubject, translateSubject } from './auth-v2-typed-subject.mjs';

const here = fileURLToPath(new URL('./', import.meta.url));
const lean = process.env.AUTH_LEAN_BIN;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const exact = Object.freeze({
  'AUTH-V2-FOL-TRANSLATION.v1-candidate.json': '371b790692e9ce564195f1e45d4d764c2ea893f01d39b94e9dff5a9daa3d643b',
  'AuthGeneratedSubject.lean': 'c3b5186734c6b7fa50198cc7ded4769ee1e342ea6f27fbde9fb7e7092d438512',
  'AuthExprInterpreter.lean': 'f036d15a3afc94e387d91c6b5bdaa3f14c1dfdd533f9853bd6b482704c4e8c70',
  'AuthTypedPreservation.lean': '1c8a136a4fcf95bd5f4078f4585a02731c6c4ca29fd676982873aa0de441d47b',
  'AuthFolOccurrenceBridge.lean': '5bdfa375d01a56ef9cf55bfa37ca3485a74ce397907ac3130549c77605df0673',
});
const files = Object.fromEntries(Object.entries(exact).map(([name, digest]) => {
  const bytes = readFileSync(join(here, name));
  assert.equal(sha(bytes), digest, `${name} changed; review the FOL-to-Lean binding`);
  return [name, bytes.toString('utf8')];
}));

const checkTypes = `import AuthFolOccurrenceBridge
example (c : AuthGeneratedSubject.Context) (a : AuthFolOccurrenceBridge.AuthOccurrence) :
    AuthFolOccurrenceBridge.qa c a ↔ AuthFolOccurrenceBridge.authMember c a ∧
      a.2.1.evidenceRef = c.request.authenticationEvidenceRef ∧
      a.2.1.evidenceRef ≠ "" ∧ a.2.1.sessionId ≠ "" ∧
      a.2.1.trusted = true :=
  AuthFolOccurrenceBridge.qa_definition c a
example (c : AuthGeneratedSubject.Context) (r : AuthFolOccurrenceBridge.RouteOccurrence) :
    AuthFolOccurrenceBridge.qr c r ↔ AuthFolOccurrenceBridge.routeMember c r ∧
      r.2.1.routeId = c.request.routeId ∧ r.2.1.routeId ≠ "" ∧
      r.2.1.scopeEvidenceRef ≠ "" ∧ r.2.1.complete = true ∧
      r.2.1.permission.resource ≠ "" ∧
      r.2.1.permission.action ≠ "" ∧
      r.2.1.permission.scope ≠ "" :=
  AuthFolOccurrenceBridge.qr_definition c r
example (c : AuthGeneratedSubject.Context) (a : AuthFolOccurrenceBridge.AuthOccurrence)
    (h : ¬ AuthFolOccurrenceBridge.authMember c a) :
    ¬ AuthFolOccurrenceBridge.qa c a := by
  intro q
  exact h q.1
example (c : AuthGeneratedSubject.Context) :
    AuthFolOccurrenceBridge.folReady c ↔
      AuthTypedPreservation.candidateMeaning c :=
  AuthFolOccurrenceBridge.fol_ready_iff_candidate c
example (c : AuthGeneratedSubject.Context) :
    AuthFolOccurrenceBridge.folReady c ↔
      AuthExprInterpreter.operation c = "Ready" :=
  AuthFolOccurrenceBridge.fol_ready_iff_operation c
example (c : AuthGeneratedSubject.Context) :
    ¬ AuthFolOccurrenceBridge.folReady c ↔
      AuthExprInterpreter.operation c = "Deny" :=
  AuthFolOccurrenceBridge.fol_deny_iff_operation c
example (c : AuthGeneratedSubject.Context) (e : AuthGeneratedSubject.Evidence)
    (hRows : c.authRows = [e, e])
    (hQual : AuthTypedPreservation.authQual c e = true) :
    ¬ AuthFolOccurrenceBridge.folReady c := by
  intro h
  obtain ⟨row, hs, _⟩ := (AuthFolOccurrenceBridge.fol_ready_iff_candidate c).mp h |>.2.2.1
  simp [hRows, hQual] at hs
example (c : AuthGeneratedSubject.Context) (r : AuthGeneratedSubject.RouteBinding)
    (hRows : c.routeRows = [r, r])
    (hQual : AuthTypedPreservation.routeQual c r = true) :
    ¬ AuthFolOccurrenceBridge.folReady c := by
  intro h
  obtain ⟨row, hs, _⟩ := (AuthFolOccurrenceBridge.fol_ready_iff_candidate c).mp h |>.2.2.2
  simp [hRows, hQual] at hs
example (c : AuthGeneratedSubject.Context) (h : c.authRows = []) :
    ¬ AuthFolOccurrenceBridge.folReady c := by
  intro hr
  obtain ⟨row, hs, _⟩ := (AuthFolOccurrenceBridge.fol_ready_iff_candidate c).mp hr |>.2.2.1
  simp [h] at hs
#print axioms AuthFolOccurrenceBridge.fol_ready_iff_candidate
#print axioms AuthFolOccurrenceBridge.fol_ready_iff_operation
#print axioms AuthFolOccurrenceBridge.fol_deny_iff_operation
#print axioms AuthFolOccurrenceBridge.qa_definition
#print axioms AuthFolOccurrenceBridge.qr_definition
`;

test('exact six-clause FOL source and generated typed subject are pinned before proof replay', () => {
  const source = JSON.parse(files['AUTH-V2-FOL-TRANSLATION.v1-candidate.json']);
  assert.deepEqual(source.clauses.map(row => row.clause_id), [
    'outcomes-distinct', 'outcomes-exhaustive', 'qualifying-authentication',
    'qualifying-route', 'ready-condition', 'decision-biconditionals',
  ]);
  const proposition = source.clauses.map(row => `(${row.source})`).join(' and ');
  assert.ok(parseFormalProposition(proposition, source.formal_signature));
  assert.equal(source.status, 'draft-translation-not-current-claim');
  assert.equal(source.authority_effect, 'none');
  assert.equal(renderLeanSubject(translateSubject(readSubjectNodes())), files['AuthGeneratedSubject.lean']);
  for (const name of ['authMember', 'routeMember', 'qa', 'qr', 'folReady'])
    assert.match(files['AuthFolOccurrenceBridge.lean'], new RegExp(`\\bdef ${name}\\b`));
  assert.match(files['AuthFolOccurrenceBridge.lean'], /abbrev AuthOccurrence := Context × \(Evidence × Nat\)/);
  assert.match(files['AuthFolOccurrenceBridge.lean'], /abbrev RouteOccurrence := Context × \(RouteBinding × Nat\)/);
});

test('pinned Lean proves all-context occurrence correspondence and rejects semantic mutants', () => {
  assert.ok(lean, 'AUTH_LEAN_BIN must point to the isolated pinned Lean 4.32.0 binary');
  assert.equal(sha(readFileSync(lean)), 'e8baaa71855a616dc351028f3ad2200051b0671f423a1696a100e809302d5550');
  const version = spawnSync(lean, ['--version'], { encoding: 'utf8', timeout: 10000 });
  assert.equal(version.status, 0);
  assert.match(version.stdout, /^Lean \(version 4\.32\.0,/);
  const owned = mkdtempSync(join(process.env.AUTH_PROOF_TMPDIR ?? '/var/tmp', 'auth-fol-occurrence-'));
  try {
    for (const name of Object.keys(exact).filter(name => name.endsWith('.lean')))
      writeFileSync(join(owned, name), files[name], { flag: 'wx' });
    writeFileSync(join(owned, 'VerifyExpectedType.lean'), checkTypes, { flag: 'wx' });
    const run = (name, emit = true) => spawnSync(lean,
      [...(emit ? ['-o', join(owned, `${name}.olean`)] : []), `${name}.lean`],
      { cwd: owned, env: { ...process.env, LEAN_PATH: owned }, encoding: 'utf8',
        timeout: 45000, maxBuffer: 2 * 1024 * 1024 });
    for (const name of ['AuthGeneratedSubject', 'AuthExprInterpreter',
      'AuthTypedPreservation', 'AuthFolOccurrenceBridge']) {
      const result = run(name);
      assert.equal(result.status, 0, `${name}: ${result.stdout}${result.stderr}`);
    }
    const verified = run('VerifyExpectedType', false);
    assert.equal(verified.status, 0, `${verified.stdout}${verified.stderr}`);
    assert.equal((verified.stdout.match(/depends on axioms: \[propext, Classical\.choice, Quot\.sound\]/g) ?? []).length, 3);
    assert.doesNotMatch(verified.stdout + verified.stderr, /sorryAx|AuthFolOccurrenceBridge\.[A-Za-z_]+\.axiom/);
    const original = files['AuthFolOccurrenceBridge.lean'];
    for (const [from, to] of [
      ['a.2.1.trusted == true', 'a.2.1.trusted == false'],
      ['(!(r.2.1.permission.action == ""))', '(r.2.1.permission.action == "")'],
      ['c.candidate.sessionId == a.2.1.sessionId', 'c.candidate.sessionId == c.request.requestId'],
      ['authMember c a ∧ qaFields c a = true', 'qaFields c a = true'],
      ['routeMember c r ∧ qrFields c r = true', 'qrFields c r = true'],
    ]) {
      assert.ok(original.includes(from));
      writeFileSync(join(owned, 'AuthFolOccurrenceBridge.lean'), original.replace(from, to));
      const mutant = run('AuthFolOccurrenceBridge');
      assert.notEqual(mutant.status, 0, `${from}: semantic mutant unexpectedly proved`);
    }
  } finally {
    rmSync(owned, { recursive: true, force: true });
  }
});
