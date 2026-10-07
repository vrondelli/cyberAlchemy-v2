import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { extractCurrentWrapper } from './auth-v2-wrapper-extract.mjs';
import { renderWrapperLean } from './auth-v2-wrapper-lean.mjs';

const here = fileURLToPath(new URL('./', import.meta.url));
const lean = process.env.AUTH_LEAN_BIN;
const leanSha = 'e8baaa71855a616dc351028f3ad2200051b0671f423a1696a100e809302d5550';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const pinned = Object.freeze({
  'AuthGeneratedSubject.lean': 'c3b5186734c6b7fa50198cc7ded4769ee1e342ea6f27fbde9fb7e7092d438512',
  'AuthGeneratedRustIR.lean': '4f3861f2567b721dcb5c3d3dc5773a412832ac8310a852277009c11fe2604c35',
  'AuthRustFragment.lean': 'a575b2d69445a13c4a83000e3edf205d9b653d011c6a9a12c64c84ae4d9bbec0',
  'AuthExprInterpreter.lean': 'f036d15a3afc94e387d91c6b5bdaa3f14c1dfdd533f9853bd6b482704c4e8c70',
  'AuthTypedPreservation.lean': '1c8a136a4fcf95bd5f4078f4585a02731c6c4ca29fd676982873aa0de441d47b',
  'AuthRustRefinement.lean': '011a35e6348656dfad4fc64c04a430a2afe0ae3c8aed1079afc7535114108ac2',
  'AuthGeneratedWrapperIR.lean': '1bb471fcce69c542637b8de5152ba54da52f951439485d1b28ed376851d12a85',
  'AuthWrapperTrace.lean': '8b8d17e531cf7f9cd6bc50a3b71024855891fc963f6ae52c8a40fecb019d2862',
  'AuthWrapperQualifiers.lean': 'a831ff22d5d7714cb5bc64f5d00ed3b6286dde27abeea40253601877cbebbb9d',
  'AuthWrapperCandidate.lean': '87c4e04856bf878dda25fc5670e6da28523025866820b31afdbb88a5e76505a4',
  'AuthWrapperMapping.lean': '786a6ac90649e035d2ffab9158f0c45d4c685aac442df0f902a19aed59dadf96',
  'AuthWrapperAuthorize.lean': '8c1868b0f88bfbd93a522e7cbe618300e124a7ec83fd6d00b388758f0e615e59',
  'AuthWrapperTraceCheck.lean': '56e32ab3ac22c3495967b0618af12bd8ac8ccbacfe8015d575af91c2dc983529',
});
const order = ['AuthGeneratedSubject', 'AuthGeneratedRustIR', 'AuthRustFragment',
  'AuthExprInterpreter', 'AuthTypedPreservation', 'AuthRustRefinement',
  'AuthGeneratedWrapperIR', 'AuthWrapperTrace', 'AuthWrapperQualifiers',
  'AuthWrapperCandidate', 'AuthWrapperMapping', 'AuthWrapperAuthorize',
  'AuthWrapperTraceCheck'];

test('pinned wrapper source replays and exact direct-call, qualifier, candidate and mapper theorems typecheck', () => {
  assert.ok(lean, 'AUTH_LEAN_BIN must name the isolated pinned Lean 4.32.0 binary');
  assert.equal(sha(readFileSync(lean)), leanSha, 'Lean binary identity changed');
  const version = spawnSync(lean, ['--version'], { encoding: 'utf8', timeout: 10000 });
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /^Lean \(version 4\.32\.0,/);
  for (const [name, digest] of Object.entries(pinned)) {
    assert.equal(sha(readFileSync(join(here, name))), digest, `selected proof byte drift: ${name}`);
  }
  assert.equal(readFileSync(join(here, 'AuthGeneratedWrapperIR.lean'), 'utf8'),
    renderWrapperLean(extractCurrentWrapper()));
  for (const name of ['AuthGeneratedWrapperIR', 'AuthWrapperTrace', 'AuthWrapperQualifiers',
    'AuthWrapperCandidate', 'AuthWrapperMapping', 'AuthWrapperAuthorize']) {
    assert.doesNotMatch(readFileSync(join(here, `${name}.lean`), 'utf8'), /\b(?:sorry|axiom|unsafe)\b/);
  }
  const work = mkdtempSync(join(process.env.AUTH_PROOF_TMPDIR ?? '/var/tmp', 'auth-v2-wrapper-proof-'));
  try {
    const env = { ...process.env, LEAN_PATH: work };
    for (const name of order) {
      copyFileSync(join(here, `${name}.lean`), join(work, `${name}.lean`));
    }
    let checkerOutput = '';
    for (const name of order) {
      const result = spawnSync(lean, [
        ...(name === 'AuthWrapperTraceCheck' ? [] : ['-o', join(work, `${name}.olean`)]),
        `${name}.lean`,
      ], { cwd: work, env, encoding: 'utf8', timeout: 90000, maxBuffer: 2 * 1024 * 1024 });
      if (result.error || result.signal) throw new Error(`Lean ${name} did not exit normally: ${result.error ?? result.signal}`);
      assert.equal(result.status, 0, `${name}: ${result.stdout}\n${result.stderr}`);
      if (name === 'AuthWrapperTraceCheck') checkerOutput = `${result.stdout}\n${result.stderr}`;
    }
    const axiomLines = checkerOutput.match(/depends on axioms: \[[^\]]+\]/g) ?? [];
    assert.deepEqual(axiomLines, [
      ...Array(3).fill('depends on axioms: [propext]'),
      ...Array(3).fill('depends on axioms: [propext, Quot.sound]'),
      ...Array(5).fill('depends on axioms: [propext, Classical.choice, Quot.sound]'),
    ], checkerOutput);
    assert.doesNotMatch(checkerOutput, /sorryAx|unknown axiom/);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});
