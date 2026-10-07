import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { renderFolTheory } from './auth-v2-fol-lean-theory.mjs';

const here = fileURLToPath(new URL('./', import.meta.url));
const lean = process.env.AUTH_LEAN_BIN;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const pins = Object.freeze({
  'AUTH-V2-FOL-TRANSLATION.v1-candidate.json': '371b790692e9ce564195f1e45d4d764c2ea893f01d39b94e9dff5a9daa3d643b',
  'auth-v2-fol-lean-theory.mjs': '1f848bbd583bf7adeb01e68215d12ade856a8581b6eb184388ee017056177f77',
  'AuthGeneratedSubject.lean': 'c3b5186734c6b7fa50198cc7ded4769ee1e342ea6f27fbde9fb7e7092d438512',
  'AuthExprInterpreter.lean': 'f036d15a3afc94e387d91c6b5bdaa3f14c1dfdd533f9853bd6b482704c4e8c70',
  'AuthTypedPreservation.lean': '1c8a136a4fcf95bd5f4078f4585a02731c6c4ca29fd676982873aa0de441d47b',
  'AuthFolOccurrenceBridge.lean': '5bdfa375d01a56ef9cf55bfa37ca3485a74ce397907ac3130549c77605df0673',
  'AuthFolModel.lean': 'c15dde95d14dd71125124278ffd7c7eb85e585b8de90d79fb7505a51ce4e0ce1',
  'AuthFolGeneratedTheory.lean': 'abbc4dd274598cc09f6a1489352299516986a65d12ec508465328c131cfb4f0b',
  'AuthFolTheoryProof.lean': '3320ece8c80a813fad639e1a33a9a7d1ecd30ebf474db39f8db80f106b4055fe',
});
const files = Object.fromEntries(Object.entries(pins).map(([name, digest]) => {
  const bytes = readFileSync(join(here, name));
  assert.equal(sha(bytes), digest, `${name} changed; review the AST interpretation binding`);
  return [name, bytes.toString('utf8')];
}));
const source = JSON.parse(files['AUTH-V2-FOL-TRANSLATION.v1-candidate.json']);
const modules = [
  'AuthGeneratedSubject', 'AuthExprInterpreter', 'AuthTypedPreservation',
  'AuthFolOccurrenceBridge', 'AuthFolModel', 'AuthFolGeneratedTheory',
  'AuthFolTheoryProof',
];
const expectedType = `import AuthFolTheoryProof
example (decision : AuthFolTheoryProof.Decision) :
    AuthFolGeneratedTheory.theory decision ↔
      ∀ c, decision c = AuthFolTheoryProof.expectedDecision c :=
  AuthFolTheoryProof.generated_theory_iff_expected decision
example : AuthFolGeneratedTheory.theory AuthFolTheoryProof.expectedDecision :=
  AuthFolTheoryProof.expected_satisfies_generated_theory
example : AuthFolGeneratedTheory.theory AuthFolTheoryProof.operationDecision :=
  AuthFolTheoryProof.selected_operation_satisfies_generated_theory
example (c : AuthFolModel.Context) :
    AuthExprInterpreter.operation c = "Ready" ∨
      AuthExprInterpreter.operation c = "Deny" :=
  AuthFolTheoryProof.selected_operation_two_outcomes c
#print axioms AuthFolTheoryProof.generated_theory_iff_expected
#print axioms AuthFolTheoryProof.expected_satisfies_generated_theory
#print axioms AuthFolTheoryProof.selected_operation_satisfies_generated_theory
#print axioms AuthFolTheoryProof.selected_operation_two_outcomes
`;

function compile(sourceCandidate, shouldPass) {
  const owned = mkdtempSync(join(process.env.AUTH_PROOF_TMPDIR ?? '/var/tmp', 'auth-fol-theory-'));
  try {
    for (const name of modules)
      writeFileSync(join(owned, `${name}.lean`), name === 'AuthFolGeneratedTheory'
        ? renderFolTheory(sourceCandidate) : files[`${name}.lean`], { flag: 'wx' });
    writeFileSync(join(owned, 'VerifyExpectedType.lean'), expectedType, { flag: 'wx' });
    const run = (name, emit = true) => spawnSync(lean,
      [...(emit ? ['-o', join(owned, `${name}.olean`)] : []), `${name}.lean`],
      { cwd: owned, env: { ...process.env, LEAN_PATH: owned }, encoding: 'utf8',
        timeout: 45000, maxBuffer: 2 * 1024 * 1024 });
    for (const name of modules) {
      const result = run(name);
      if (name === 'AuthFolTheoryProof' && !shouldPass) {
        assert.notEqual(result.status, 0, 'mutated FOL source unexpectedly retained the unchanged proof');
        assert.match(result.stdout + result.stderr, /AuthFolTheoryProof\.lean/);
        return;
      }
      assert.equal(result.status, 0, `${name}: ${result.stdout}${result.stderr}`);
    }
    assert.ok(shouldPass, 'mutant unexpectedly passed all modules');
    const verified = run('VerifyExpectedType', false);
    assert.equal(verified.status, 0, `${verified.stdout}${verified.stderr}`);
    assert.match(verified.stdout, /generated_theory_iff_expected.*depends on axioms:/);
    assert.match(verified.stdout, /expected_satisfies_generated_theory.*depends on axioms:/);
    assert.match(verified.stdout, /selected_operation_satisfies_generated_theory.*depends on axioms:/);
    assert.match(verified.stdout, /selected_operation_two_outcomes.*depends on axioms:/);
    const axiomSets = [...verified.stdout.matchAll(/depends on axioms: \[([^\]]+)\]/g)];
    assert.equal(axiomSets.length, 4);
    for (const [, set] of axiomSets)
      assert.deepEqual(set.split(',').map(item => item.trim()),
        ['propext', 'Classical.choice', 'Quot.sound']);
    assert.doesNotMatch(verified.stdout + verified.stderr, /sorryAx|AuthFolTheoryProof\.[A-Za-z_]+\.axiom/);
  } finally {
    rmSync(owned, { recursive: true, force: true });
  }
}

test('the checked generated theory is exact replay of the typed six-clause AST', () => {
  assert.equal(renderFolTheory(source), files['AuthFolGeneratedTheory.lean']);
  assert.equal(source.status, 'draft-translation-not-current-claim');
  assert.equal(source.authority_effect, 'none');
});

test('pinned Lean proves the full source-derived theory nonvacuously', () => {
  assert.ok(lean, 'AUTH_LEAN_BIN must point to the isolated pinned Lean 4.32.0 binary');
  assert.equal(sha(readFileSync(lean)), 'e8baaa71855a616dc351028f3ad2200051b0671f423a1696a100e809302d5550');
  const version = spawnSync(lean, ['--version'], { encoding: 'utf8', timeout: 10000 });
  assert.equal(version.status, 0);
  assert.match(version.stdout, /^Lean \(version 4\.32\.0,/);
  compile(source, true);
});

test('fresh Lean builds reject parseable FOL semantic mutants with unchanged model and theorem', () => {
  const mutants = [
    ['qualifying-authentication', 'Trusted(a)', 'not Trusted(a)'],
    ['qualifying-route', 'not (PermissionAction(r)=empty)', 'PermissionAction(r)=empty'],
    ['qualifying-authentication', 'AuthMember(c,a)', 'not AuthMember(c,a)'],
    ['qualifying-route', 'RouteMember(c,r)', 'not RouteMember(c,r)'],
    ['outcomes-exhaustive', 'd=READY or d=DENY', 'd=READY and d=DENY'],
    ['ready-condition', 'QA(c,a) and QR(c,r)', 'QA(c,a) or QR(c,r)'],
    ['ready-condition', 'CandidateSessionID(c)=SessionID(a)', 'CandidateSessionID(c)=RequestID(c)'],
    ['decision-biconditionals', 'Decision(c)=READY iff ReadyCondition(c)',
      'Decision(c)=DENY iff ReadyCondition(c)'],
    ['decision-biconditionals', 'forall c:Context:', 'exists c:Context:'],
  ];
  for (const [id, from, to] of mutants) {
    const mutant = structuredClone(source);
    const clause = mutant.clauses.find(row => row.clause_id === id);
    assert.ok(clause?.source.includes(from), id);
    clause.source = clause.source.replace(from, to);
    compile(mutant, false);
  }
});
