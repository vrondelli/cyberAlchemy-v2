import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { renderCurrentRustLeanSubject } from './auth-v2-rust-lean.mjs';

const here = fileURLToPath(new URL('./', import.meta.url));
const lean = process.env.AUTH_LEAN_BIN;
const leanSha = 'e8baaa71855a616dc351028f3ad2200051b0671f423a1696a100e809302d5550';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const files = Object.freeze({
  'AuthGeneratedSubject.lean': 'c3b5186734c6b7fa50198cc7ded4769ee1e342ea6f27fbde9fb7e7092d438512',
  'AuthGeneratedRustIR.lean': '4f3861f2567b721dcb5c3d3dc5773a412832ac8310a852277009c11fe2604c35',
  'AuthRustFragment.lean': 'a575b2d69445a13c4a83000e3edf205d9b653d011c6a9a12c64c84ae4d9bbec0',
  'AuthExprInterpreter.lean': 'f036d15a3afc94e387d91c6b5bdaa3f14c1dfdd533f9853bd6b482704c4e8c70',
  'AuthTypedPreservation.lean': '1c8a136a4fcf95bd5f4078f4585a02731c6c4ca29fd676982873aa0de441d47b',
  'AuthRustRefinement.lean': '011a35e6348656dfad4fc64c04a430a2afe0ae3c8aed1079afc7535114108ac2',
  'AuthRustRefinementCheck.lean': 'd75a9c6fd0a4adaacbf29bd40d075c4e0b98994b7e0a266a933855fd7821963a',
});
const order = ['AuthGeneratedSubject', 'AuthGeneratedRustIR', 'AuthRustFragment',
  'AuthExprInterpreter', 'AuthTypedPreservation', 'AuthRustRefinement',
  'AuthRustRefinementCheck'];

function run(selected = {}) {
  assert.ok(lean, 'AUTH_LEAN_BIN must name the isolated pinned Lean 4.32.0 binary');
  assert.equal(sha(readFileSync(lean)), leanSha, 'Lean binary identity changed');
  const version = spawnSync(lean, ['--version'], { encoding: 'utf8', timeout: 10000 });
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /^Lean \(version 4\.32\.0,/);
  const work = mkdtempSync(join(process.env.AUTH_PROOF_TMPDIR ?? '/var/tmp', 'auth-v2-rust-refinement-'));
  try {
    for (const name of order) {
      const filename = `${name}.lean`;
      if (Object.hasOwn(selected, filename)) writeFileSync(join(work, filename), selected[filename], { flag: 'wx' });
      else copyFileSync(join(here, filename), join(work, filename));
    }
    const env = { ...process.env, LEAN_PATH: work };
    for (const name of order) {
      const result = spawnSync(lean, [
        ...(name === 'AuthRustRefinementCheck' ? [] : ['-o', join(work, `${name}.olean`)]),
        `${name}.lean`,
      ], { cwd: work, env, encoding: 'utf8', timeout: 90000, maxBuffer: 2 * 1024 * 1024 });
      if (result.error || result.signal) throw new Error(`Lean ${name} did not exit normally: ${result.error ?? result.signal}`);
      if (result.status !== 0) return { status: result.status, failed: name, output: `${result.stdout}\n${result.stderr}` };
      if (name === 'AuthRustRefinementCheck') return { status: 0, output: `${result.stdout}\n${result.stderr}` };
    }
    throw new Error('unreachable');
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

test('pinned production Rust IR replays and exact no-sorry Rule/Operation theorems typecheck', () => {
  for (const [name, digest] of Object.entries(files)) {
    assert.equal(sha(readFileSync(join(here, name))), digest, `selected proof byte drift: ${name}`);
  }
  assert.equal(readFileSync(join(here, 'AuthGeneratedRustIR.lean'), 'utf8'), renderCurrentRustLeanSubject());
  for (const name of ['AuthRustFragment.lean', 'AuthRustRefinement.lean']) {
    assert.doesNotMatch(readFileSync(join(here, name), 'utf8'), /\b(?:sorry|axiom|unsafe)\b/);
  }
  const result = run();
  assert.equal(result.status, 0, `${result.failed ?? ''}: ${result.output}`);
  const axioms = result.output.match(/depends on axioms: \[[^\]]+\]/g) ?? [];
  assert.equal(axioms.length, 5, result.output);
  for (const line of axioms) assert.equal(line, 'depends on axioms: [propext, Classical.choice, Quot.sound]');
  assert.doesNotMatch(result.output, /sorryAx|unknown axiom/);
});

test('same-named weaker Operation theorem cannot satisfy exact checker', () => {
  const proof = readFileSync(join(here, 'AuthRustRefinement.lean'), 'utf8');
  const weakened = proof.replace(/theorem rust_operation_eq \(c : Context\)[\s\S]*?\nend AuthRustRefinement/,
    'theorem rust_operation_eq (c : Context) : True := by trivial\n\nend AuthRustRefinement');
  assert.notEqual(weakened, proof);
  const result = run({ 'AuthRustRefinement.lean': weakened });
  assert.ok(Number.isInteger(result.status) && result.status > 0, result.output);
  assert.equal(result.failed, 'AuthRustRefinementCheck', result.output);
  assert.match(result.output, /type mismatch|application type mismatch/i);
});

test('changed generated Rust IR breaks the proof, so its import is used', () => {
  const ir = readFileSync(join(here, 'AuthGeneratedRustIR.lean'), 'utf8');
  const altered = ir.replace(/^def uniqueTrustedAuthenticationEvidence : Expr :=\n  .+$/m,
    'def uniqueTrustedAuthenticationEvidence : Expr :=\n  (Expr.bool true)');
  assert.notEqual(altered, ir);
  const result = run({ 'AuthGeneratedRustIR.lean': altered });
  assert.ok(Number.isInteger(result.status) && result.status > 0, result.output);
  assert.equal(result.failed, 'AuthRustRefinement', result.output);
  assert.match(result.output, /error:/);
});
