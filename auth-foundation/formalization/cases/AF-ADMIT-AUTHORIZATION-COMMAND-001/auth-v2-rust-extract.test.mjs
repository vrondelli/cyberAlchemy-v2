import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { extractGeneratedRust } from './auth-v2-rust-extract.mjs';

const rust = readFileSync(new URL('../../../implementation/command-boundary-runtime-v2/src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs', import.meta.url), 'utf8');
const baseline = extractGeneratedRust(rust);
const fixture = source => extractGeneratedRust(source, { fixture: true });
const comparable = value => {
  const selected = structuredClone(value);
  delete selected.rust_sha256;
  for (const row of Object.values(selected.functions)) delete row.source_span;
  return selected;
};
const editBody = (name, edit) => {
  const { start, end } = baseline.functions[name].source_span;
  const oldBody = rust.slice(start, end);
  const newBody = edit(oldBody);
  assert.notEqual(newBody, oldBody);
  return `${rust.slice(0, start)}${newBody}${rust.slice(end)}`;
};
const changedIR = (source, name) => {
  const changed = fixture(source);
  assert.notDeepEqual(changed.functions[name].expression, baseline.functions[name].expression);
  assert.throws(() => extractGeneratedRust(source), /selected-rust-bytes-drift/);
  return changed;
};

test('exact generated Rust bytes produce five typed executable IR bodies and six record declarations', () => {
  assert.equal(baseline.rust_sha256, '7c19fdb91f4098d7f12cc0c05804dd50c852c69902125af0c3b2d55ba5e497f0');
  assert.deepEqual(Object.keys(baseline.functions), [
    'candidate_command_provenance',
    'unique_complete_route_binding',
    'unique_trusted_authentication_evidence',
    'command_boundary_admissible',
    'admit_authorization_command',
  ]);
  assert.equal(Object.keys(baseline.data_types.records).length, 6);
  assert.equal(baseline.functions.unique_trusted_authentication_evidence.expression.op, 'exactlyOne');
  assert.equal(baseline.functions.unique_complete_route_binding.expression.op, 'exactlyOne');
  assert.equal(baseline.functions.admit_authorization_command.expression.op, 'if');
  assert.equal(baseline.functions.admit_authorization_command.expression.success.variant, 'Ready');
  assert.equal(baseline.functions.admit_authorization_command.expression.failure.variant, 'Deny');
});

test('Rust-only removed qualifier changes extracted meaning while fixed bytes reject it', () => {
  const mutant = editBody('candidate_command_provenance', body =>
    body.replace('!(binding.required_permission.action == "")', 'true'));
  changedIR(mutant, 'candidate_command_provenance');
});

test('Rust-only redirected same-typed equality changes extracted meaning', () => {
  const mutant = editBody('candidate_command_provenance', body =>
    body.replace('evidence.session_id == context.candidate_command.session_id',
      'evidence.session_id == context.request.request_id'));
  changedIR(mutant, 'candidate_command_provenance');
});

test('Rust-only filter/count to any changes list multiplicity semantics', () => {
  const mutant = editBody('unique_trusted_authentication_evidence', body =>
    body.replace('.filter(|evidence| {', '.any(|evidence| {')
      .replace(/\}\)\s*\.count\(\) == 1/, '})'));
  const changed = changedIR(mutant, 'unique_trusted_authentication_evidence');
  assert.equal(changed.functions.unique_trusted_authentication_evidence.expression.op, 'exists');
});

test('Rust-only swapped Operation branches remain parsed but change extracted decision', () => {
  const mutant = editBody('admit_authorization_command', body =>
    body.replace('CommandBoundaryDecision::Ready', 'CommandBoundaryDecision::TEMP')
      .replace('CommandBoundaryDecision::Deny', 'CommandBoundaryDecision::Ready')
      .replace('CommandBoundaryDecision::TEMP', 'CommandBoundaryDecision::Deny'));
  const changed = changedIR(mutant, 'admit_authorization_command');
  assert.equal(changed.functions.admit_authorization_command.expression.success.variant, 'Deny');
});

test('unknown call, wrong-typed path, extra statement and nested shadowing fail closed', () => {
  assert.throws(() => fixture(editBody('command_boundary_admissible', body =>
    body.replace('candidate_command_provenance(context)', 'external_authorize(context)'))), /unknown-call/);
  assert.throws(() => fixture(editBody('candidate_command_provenance', body =>
    body.replace('context.candidate_command.request_id == context.request.request_id',
      'context.candidate_command.request_id == context.resolved_route_bindings'))), /incompatible-equality/);
  assert.throws(() => fixture(editBody('command_boundary_admissible', body =>
    body.replace('{\n', '{\n    let __rogue = true;\n'))), /local-use:__rogue:0/);
  assert.throws(() => fixture(editBody('candidate_command_provenance', body =>
    body.replace('.any(|evidence| {', '.any(|evidence| {\n                let __domainspec_rule_000 = true;'))), /shadowed-local/);
});

test('selected Rule calls reject both direct and indirect recursion', () => {
  const direct = editBody('command_boundary_admissible', body =>
    body.replace('unique_trusted_authentication_evidence(context)',
      'command_boundary_admissible(context)'));
  assert.throws(() => fixture(direct), /rule-cycle:command_boundary_admissible>command_boundary_admissible/);

  const indirect = editBody('unique_trusted_authentication_evidence', () =>
    '{ command_boundary_admissible(context) }');
  assert.throws(() => fixture(indirect),
    /rule-cycle:unique_trusted_authentication_evidence>command_boundary_admissible>unique_trusted_authentication_evidence/);
});

test('unknown syntax and extra selected or nonpublic function fail closed', () => {
  assert.throws(() => fixture(editBody('command_boundary_admissible', body =>
    body.replace('__domainspec_rule_000 &&', '__domainspec_rule_000 ||'))), /expected|unknown|type/);
  assert.throws(() => fixture(`${rust}\npub fn stealth(context: &CommandBoundaryContext) -> bool { true }\n`), /unexpected-function/);
  assert.throws(() => fixture(`${rust}\nfn stealth() {}\n`), /nonpublic-function/);
});

test('whole-module pin rejects unparsed top-level executable additions', () => {
  assert.throws(() => extractGeneratedRust(`${rust}\ninclude!("untrusted.rs");\n`), /selected-rust-bytes-drift/);
  assert.throws(() => extractGeneratedRust(`${rust}\nstatic EXTRA: bool = true;\n`), /selected-rust-bytes-drift/);
  assert.throws(() => extractGeneratedRust(rust.replace('#[rustfmt::skip]', '#[cfg(feature = "altered")]')), /selected-rust-bytes-drift/);
});

test('comments and strings are lexically distinct from executable tokens in fixture mode', () => {
  const comment = fixture(editBody('command_boundary_admissible', body =>
    body.replace('{\n', '{\n    // pub fn stealth() { external_authorize() }\n')));
  assert.deepEqual(comparable(comment), comparable(baseline));
  assert.throws(() => fixture(editBody('candidate_command_provenance', body =>
    body.replace('request.request_id == ""', 'request.request_id == "fn stealth"'))), /unsupported-string-literal/);
});
