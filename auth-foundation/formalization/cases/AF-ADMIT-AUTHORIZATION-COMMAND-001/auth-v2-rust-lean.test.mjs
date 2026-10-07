import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { extractCurrentGeneratedRust, extractGeneratedRust } from './auth-v2-rust-extract.mjs';
import { renderCurrentRustLeanSubject, renderRustLeanSubject } from './auth-v2-rust-lean.mjs';

const ir = extractCurrentGeneratedRust();
const generated = readFileSync(new URL('./AuthGeneratedRustIR.lean', import.meta.url), 'utf8');
const rust = readFileSync(new URL('../../../implementation/command-boundary-runtime-v2/src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs', import.meta.url), 'utf8');

test('generated Lean data replays byte-exactly from production-mode Rust extraction', () => {
  assert.equal(generated, renderCurrentRustLeanSubject());
  assert.equal(generated, renderRustLeanSubject(ir));
  assert.match(generated, /def selectedRustSha256 : String := "7c19fdb91f4098d7f12cc0c05804dd50c852c69902125af0c3b2d55ba5e497f0"/);
  for (const name of ['candidateCommandProvenance', 'uniqueCompleteRouteBinding',
    'uniqueTrustedAuthenticationEvidence', 'commandBoundaryAdmissible', 'admitAuthorizationCommand']) {
    assert.match(generated, new RegExp(`def ${name} : Expr :=`));
  }
  assert.match(generated, /Expr\.exactlyOne/);
  assert.match(generated, /Expr\.exists/);
  assert.match(generated, /Expr\.ruleRef/);
  assert.match(generated, /Expr\.branch/);
  assert.doesNotMatch(generated, /def eval|theorem|axiom|sorry/);
});

test('production renderer rejects arbitrary fixture IR even with copied source hash', () => {
  const altered = structuredClone(ir);
  altered.functions.admit_authorization_command.expression.success.variant = 'Deny';
  assert.throws(() => renderRustLeanSubject(altered), /production IR must be the current pinned Rust extraction/);
  assert.notEqual(renderRustLeanSubject(altered, { fixture: true }), generated);
});

test('Rust-only semantic mutation changes fixture Lean data, not the fixed typed AST', () => {
  const source = rust.replace('!(binding.required_permission.action == "")', 'true');
  assert.notEqual(source, rust);
  assert.throws(() => extractGeneratedRust(source), /selected-rust-bytes-drift/);
  const altered = extractGeneratedRust(source, { fixture: true });
  const rendered = renderRustLeanSubject(altered, { fixture: true });
  assert.notEqual(rendered, generated);
  assert.match(rendered, /Expr\.bool true/);
});

test('renderer rejects unknown op, wrong type, bad field and unreviewed IR shape', () => {
  const unknown = structuredClone(ir);
  unknown.functions.unique_trusted_authentication_evidence.expression.op = 'magicallyUnique';
  assert.throws(() => renderRustLeanSubject(unknown, { fixture: true }), /unknown-op/);

  const wrongType = structuredClone(ir);
  wrongType.functions.unique_trusted_authentication_evidence.expression.type = 'String';
  assert.throws(() => renderRustLeanSubject(wrongType, { fixture: true }), /type:exactlyOne/);

  const badPath = structuredClone(ir);
  badPath.functions.unique_trusted_authentication_evidence.expression.collection.fields = ['request', 'made_up'];
  assert.throws(() => renderRustLeanSubject(badPath, { fixture: true }), /unknown-field/);

  const extra = structuredClone(ir);
  extra.functions.admit_authorization_command.expression.unreviewed = true;
  assert.throws(() => renderRustLeanSubject(extra, { fixture: true }), /shape:if/);
});

test('renderer rejects changed selected Rust data declarations and branch type', () => {
  const changedType = structuredClone(ir);
  changedType.data_types.records.Permission.action = 'Bool';
  assert.throws(() => renderRustLeanSubject(changedType, { fixture: true }), /data-types/);

  const changedBranch = structuredClone(ir);
  changedBranch.functions.admit_authorization_command.expression.success.type = 'Bool';
  assert.throws(() => renderRustLeanSubject(changedBranch, { fixture: true }), /type:variant/);
});
