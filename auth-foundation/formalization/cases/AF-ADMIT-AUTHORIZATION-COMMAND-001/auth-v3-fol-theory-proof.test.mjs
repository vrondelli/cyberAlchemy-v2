import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { renderFolTheoryV3 } from './auth-v3-fol-lean-theory.mjs';
import { checkCurrentAuthV3TypedMeaning } from './auth-v3-typed-meaning.mjs';

const here = fileURLToPath(new URL('./', import.meta.url));
const lean = process.env.AUTH_LEAN_BIN;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const oldPins = Object.freeze({
  'AuthGeneratedSubject.lean': 'c3b5186734c6b7fa50198cc7ded4769ee1e342ea6f27fbde9fb7e7092d438512',
  'AuthExprInterpreter.lean': 'f036d15a3afc94e387d91c6b5bdaa3f14c1dfdd533f9853bd6b482704c4e8c70',
  'AuthTypedPreservation.lean': '1c8a136a4fcf95bd5f4078f4585a02731c6c4ca29fd676982873aa0de441d47b',
  'AuthFolOccurrenceBridge.lean': '5bdfa375d01a56ef9cf55bfa37ca3485a74ce397907ac3130549c77605df0673',
  'AuthFolModel.lean': 'c15dde95d14dd71125124278ffd7c7eb85e585b8de90d79fb7505a51ce4e0ce1',
  'AuthFolGeneratedTheory.lean': 'abbc4dd274598cc09f6a1489352299516986a65d12ec508465328c131cfb4f0b',
  'AuthFolTheoryProof.lean': '3320ece8c80a813fad639e1a33a9a7d1ecd30ebf474db39f8db80f106b4055fe',
});
const modules = [
  'AuthGeneratedSubject', 'AuthExprInterpreter', 'AuthTypedPreservation',
  'AuthFolOccurrenceBridge', 'AuthFolModel', 'AuthFolGeneratedTheory',
  'AuthFolTheoryProof', 'AuthFolGeneratedTheoryV3', 'AuthFolTheoryProofV3',
];
const expectedType = `import AuthFolTheoryProofV3
example (decision : AuthFolTheoryProofV3.Decision) :
    AuthFolGeneratedTheoryV3.theory decision ↔
      ∀ c, decision c = AuthFolTheoryProof.expectedDecision c :=
  AuthFolTheoryProofV3.generated_theory_iff_expected decision
example : AuthFolGeneratedTheoryV3.theory AuthFolTheoryProof.expectedDecision :=
  AuthFolTheoryProofV3.expected_satisfies_generated_theory
example : AuthFolGeneratedTheoryV3.theory AuthFolTheoryProof.operationDecision :=
  AuthFolTheoryProofV3.selected_operation_satisfies_generated_theory
#print axioms AuthFolTheoryProofV3.generated_theory_iff_expected
#print axioms AuthFolTheoryProofV3.selected_operation_satisfies_generated_theory
`;

function compile(source, shouldPass) {
  const owned = mkdtempSync(join(process.env.AUTH_PROOF_TMPDIR ?? '/var/tmp', 'auth-v3-fol-theory-'));
  try {
    for (const name of modules) {
      const filename = `${name}.lean`;
      let bytes;
      if (name === 'AuthFolGeneratedTheoryV3') bytes = renderFolTheoryV3(source);
      else {
        bytes = readFileSync(join(here, filename));
        if (Object.hasOwn(oldPins, filename))
          assert.equal(sha(bytes), oldPins[filename], `historical ${filename} drifted`);
      }
      writeFileSync(join(owned, filename), bytes, { flag: 'wx' });
    }
    writeFileSync(join(owned, 'VerifyExpectedType.lean'), expectedType, { flag: 'wx' });
    const run = (name, emit = true) => spawnSync(lean,
      [...(emit ? ['-o', join(owned, `${name}.olean`)] : []), `${name}.lean`],
      { cwd: owned, env: { ...process.env, LEAN_PATH: owned }, encoding: 'utf8',
        timeout: 45000, maxBuffer: 2 * 1024 * 1024 });
    for (const name of modules) {
      const result = run(name);
      if (name === 'AuthFolTheoryProofV3' && !shouldPass) {
        assert.notEqual(result.status, 0,
          'mutated V3 source unexpectedly retained the unchanged proof');
        assert.match(result.stdout + result.stderr, /AuthFolTheoryProofV3\.lean/);
        return;
      }
      assert.equal(result.status, 0, `${name}: ${result.stdout}${result.stderr}`);
    }
    assert.ok(shouldPass, 'mutant unexpectedly passed all modules');
    const verified = run('VerifyExpectedType', false);
    assert.equal(verified.status, 0, `${verified.stdout}${verified.stderr}`);
    const axiomSets = [...verified.stdout.matchAll(/depends on axioms: \[([^\]]+)\]/g)];
    assert.equal(axiomSets.length, 2);
    for (const [, set] of axiomSets)
      assert.deepEqual(set.split(',').map(item => item.trim()),
        ['propext', 'Classical.choice', 'Quot.sound']);
    assert.doesNotMatch(verified.stdout + verified.stderr, /sorryAx|\.axiom/);
  } finally {
    rmSync(owned, { recursive: true, force: true });
  }
}

test('current typed definition and FOL source generate a parsed six-clause V3 theory', () => {
  const checked = checkCurrentAuthV3TypedMeaning();
  assert.equal(checked.fol_clause_count, 6);
  assert.equal(checked.exact_file_refs_checked, true);
  const source = JSON.parse(readFileSync(join(here, 'AUTH-V3-FOL-TRANSLATION.v1-candidate.json')));
  const generated = renderFolTheoryV3(source);
  assert.equal(generated, readFileSync(join(here, 'AuthFolGeneratedTheoryV3.lean'), 'utf8'));
  assert.match(generated, /namespace AuthFolGeneratedTheoryV3/);
  assert.match(generated, /def clause5 /);
});

test('pinned Lean replays V3 theory and selected-operation proof in a fresh build', () => {
  const checked = checkCurrentAuthV3TypedMeaning();
  assert.equal(checked.exact_file_refs_checked, true);
  assert.equal(sha(readFileSync(join(here, 'auth-v2-fol-lean-theory.mjs'))),
    '1f848bbd583bf7adeb01e68215d12ade856a8581b6eb184388ee017056177f77');
  assert.ok(lean, 'AUTH_LEAN_BIN must name the isolated pinned Lean 4.32.0 binary');
  assert.equal(sha(readFileSync(lean)),
    'e8baaa71855a616dc351028f3ad2200051b0671f423a1696a100e809302d5550');
  const version = spawnSync(lean, ['--version'], { encoding: 'utf8', timeout: 10000 });
  assert.equal(version.status, 0);
  assert.match(version.stdout, /^Lean \(version 4\.32\.0,/);
  const source = JSON.parse(readFileSync(join(here, 'AUTH-V3-FOL-TRANSLATION.v1-candidate.json')));
  compile(source, true);
});

test('a parseable V3 uniqueness mutant fails the unchanged Lean proof', () => {
  const source = JSON.parse(readFileSync(join(here, 'AUTH-V3-FOL-TRANSLATION.v1-candidate.json')));
  const mutant = structuredClone(source);
  const clause = mutant.clauses.find(row => row.clause_id === 'ready-condition');
  assert.ok(clause.source.includes('QA(c,a2) implies a2=a'));
  clause.source = clause.source.replace('QA(c,a2) implies a2=a', 'QA(c,a2) implies a2=r');
  assert.throws(() => renderFolTheoryV3(mutant), /sort|Sort|mismatch|expected/i);
  const parseable = structuredClone(source);
  const ready = parseable.clauses.find(row => row.clause_id === 'ready-condition');
  ready.source = ready.source.replace('QA(c,a2) implies a2=a', 'QA(c,a2) implies a2=a2');
  compile(parseable, false);
});
