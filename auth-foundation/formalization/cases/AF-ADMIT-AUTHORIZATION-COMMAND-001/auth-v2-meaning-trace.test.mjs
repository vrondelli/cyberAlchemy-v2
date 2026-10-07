import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { AUTH_V2_MEANING_SOURCE_PATHS, buildAuthV2MeaningTrace, currentAuthV2MeaningSources, validateAuthV2MeaningAst, verifyAuthV2MeaningReport } from './auth-v2-meaning-trace.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const reportPath = fileURLToPath(new URL('./AUTH-V2-MEANING-TRACE.v1-candidate.json', import.meta.url));
const rows = () => Object.fromEntries(['context', 'decision', 'auth', 'route', 'provenance', 'aggregate', 'operation'].map(key => [key, JSON.parse(currentAuthV2MeaningSources().get(AUTH_V2_MEANING_SOURCE_PATHS[key]).toString('utf8'))]));
const changed = (name, mutate) => {
  const sources = currentAuthV2MeaningSources();
  const path = AUTH_V2_MEANING_SOURCE_PATHS[name];
  const value = JSON.parse(sources.get(path).toString('utf8'));
  mutate(value);
  sources.set(path, Buffer.from(`${JSON.stringify(value)}\n`));
  return sources;
};

test('exact v2 source/target and clean regeneration retain unresolved prose alignment', () => {
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  const trace = verifyAuthV2MeaningReport(report, currentAuthV2MeaningSources());
  assert.equal(trace.structural_alignment, 'exact-selected-typed-ast-only');
  assert.equal(trace.prose_alignment_status, 'unresolved');
  assert.deepEqual(trace.typed_qualifier_inventory.authentication, [
    'evidence_ref equals request.authentication_evidence_ref',
    'evidence_ref is nonempty',
    'trusted is true',
    'session_id is nonempty',
  ]);
  assert.deepEqual(trace.typed_qualifier_inventory.route, [
    'route_id equals request.route_id',
    'route_id is nonempty',
    'complete is true',
    'scope_evidence_ref is nonempty',
    'required_permission.resource is nonempty',
    'required_permission.action is nonempty',
    'required_permission.scope is nonempty',
  ]);
  assert.equal(trace.typed_qualifier_inventory.additional_provenance_guard, 'request.request_id is nonempty');
  assert.deepEqual(trace.semantic_gaps.map(gap => [gap.gap_id, gap.status]), [
    ['AUTH-V2-MEANING-BLANK-REQUEST-ID', 'unresolved'],
    ['AUTH-V2-MEANING-QUALIFIER-DEFINITION', 'unresolved'],
  ]);
  assert.equal(trace.clean_regeneration, 'byte-identical-rust-cargo-receipt');
  assert.equal(trace.domainspec_business_meaning_status, 'draft-not-accepted');
  assert.equal(trace.all_context_preservation_proven, false);
  assert.equal(trace.can_satisfy_f5, false);
});

test('full leaf Rule AST rejects missing and extra qualifiers and altered candidate equalities', () => {
  const base = rows();
  validateAuthV2MeaningAst(base);
  const mutants = [
    v => { v.auth.body.typed_contract.expression.where.terms.pop(); },
    v => { v.auth.body.typed_contract.expression.where.terms.push({ op: 'literal', type: 'Bool', value: true }); },
    v => { v.route.body.typed_contract.expression.where.terms.splice(4, 1); },
    v => { v.route.body.typed_contract.expression.where.terms.push({ op: 'literal', type: 'Bool', value: true }); },
    v => { v.provenance.body.typed_contract.expression.terms[2].where.terms.splice(3, 1); },
    v => { v.provenance.body.typed_contract.expression.terms[3].where.terms.push({ op: 'literal', type: 'Bool', value: true }); },
    v => { v.provenance.body.typed_contract.expression.terms[2].where.terms[4].right.properties[1] = 'AUTH-CB-AUTHORIZATION-COMMAND#request_id'; },
    v => { v.provenance.body.typed_contract.expression.terms[3].where.terms[7].right.properties[2] = 'AUTH-CB-PERMISSION#scope'; },
    v => { v.provenance.body.typed_contract.expression.terms[1].right.properties[1] = 'AUTH-CB-AUTHORIZATION-COMMAND#session_id'; },
  ];
  for (const mutate of mutants) {
    const candidate = structuredClone(base);
    mutate(candidate);
    assert.throws(() => validateAuthV2MeaningAst(candidate), /AUTH_V2_MEANING_TRACE/);
  }
});

test('aggregate ordering and Operation READY/DENY paths reject hostile mutations', () => {
  const base = rows();
  for (const mutate of [
    v => { v.aggregate.body.typed_contract.expression.terms.reverse(); },
    v => { v.aggregate.body.typed_contract.expression.terms.push({ op: 'literal', type: 'Bool', value: true }); },
    v => { v.operation.body.typed_contract.guard = 'auth-command-boundary:other'; },
    v => { v.operation.body.typed_contract.success_result.variant = 'Deny'; },
    v => { v.operation.body.typed_contract.failure_result.variant = 'Ready'; },
    v => { v.operation.body.effects.push('downstream-call'); },
    v => { v.context.body.typed_contract.properties[1].type.kind = 'set'; },
    v => { v.decision.body.typed_contract.variants.reverse(); },
  ]) {
    const candidate = structuredClone(base);
    mutate(candidate);
    assert.throws(() => validateAuthV2MeaningAst(candidate), /AUTH_V2_MEANING_TRACE/);
  }
});

test('selected bytes, meaning identity, receipt and held report fail closed on drift', () => {
  for (const [name, mutate] of [
    ['meaning', v => { v.meaning_id = 'BusinessMeaning:foreign'; }],
    ['meaning', v => { v.acceptance.status = 'accepted'; }],
    ['auth', v => { v.body.typed_contract.expression.where.terms.pop(); }],
    ['receipt', v => { v.receipt_sha256 = '0'.repeat(64); }],
    ['candidateEvidence', v => { v.can_satisfy_f5 = true; }],
  ]) assert.throws(() => buildAuthV2MeaningTrace(changed(name, mutate), { regenerate: false }), /AUTH_V2_MEANING_TRACE/);
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  for (const mutate of [
    v => { v.domainspec_business_meaning_status = 'accepted'; },
    v => { v.structural_alignment = 'all-context-proof'; },
    v => { v.prose_alignment_status = 'aligned'; },
    v => { v.semantic_gaps[0].status = 'resolved'; },
    v => { v.typed_qualifier_inventory.route.pop(); },
    v => { v.selected_sha256.provenance = '0'.repeat(64); },
    v => { v.can_satisfy_f5 = true; },
  ]) {
    const held = structuredClone(report);
    mutate(held);
    assert.throws(() => verifyAuthV2MeaningReport(held, currentAuthV2MeaningSources()), /AUTH_V2_MEANING_TRACE:held-report-tamper/);
  }
});

test('historical red witness and v2 blank-ID/positive/negative/mixed/duplicate witnesses execute locally', () => {
  const result = spawnSync(`${root}/../tools/toolchain/run`, ['cargo', 'test', '--offline', '--all-targets'], {
    cwd: `${root}/implementation/trusted-boundary-v2`, env: { ...process.env, TMPDIR: '/var/tmp' }, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
  });
  assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`);
  assert.match(result.stdout, /test result: ok\. 1 passed/);
  assert.match(result.stdout, /test result: ok\. 10 passed/);
  assert.match(result.stdout, /pinned_v1_kernel_accepts_a_nonqualifying_provenance_witness/);
  assert.match(result.stdout, /blank_request_id_denies_despite_unique_qualifying_rows_and_matching_candidate/);
  assert.match(result.stdout, /kernel_rejects_candidate_values_from_nonqualifying_rows/);
  assert.match(result.stdout, /constructor_uses_unique_qualifying_authentication_row_in_either_order/);
  assert.match(result.stdout, /constructor_uses_unique_qualifying_route_row_in_either_order/);
});

test('owner-review envelope binds exact draft and trace without forging an acceptance', () => {
  const bytes = readFileSync(fileURLToPath(new URL('./AUTH-V2-MEANING-OWNER-REVIEW.v1-candidate.json', import.meta.url)));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), '6a8a7861939ece8b60ea7d5b9a1ceaf2d84ffcc878f0c049a3513265f3baeee7');
  const envelope = JSON.parse(bytes.toString('utf8'));
  const digest = path => createHash('sha256').update(readFileSync(`${root}/${path}`)).digest('hex');
  assert.equal(envelope.status, 'candidate-prepared-owner-review-not-requested');
  assert.equal(envelope.owner_decision_status, 'not-requested');
  assert.equal(envelope.decision_maker, 'human CyberAlchemy product owner');
  assert.equal(envelope.artifact_owner_path, 'projects/auth-foundation/formalization');
  assert.match(envelope.semantic_question, /nonempty request_id/);
  assert.match(envelope.semantic_question, /duplicate list entries/);
  assert.equal(envelope.known_assumptions.length, 5);
  assert.equal(envelope.local_evidence.length, 3);
  assert.equal(envelope.residual_proof_gaps.length, 5);
  assert.match(envelope.known_assumptions[4], /historical v1/);
  assert.equal(envelope.meaning_ref.sha256, digest(envelope.meaning_ref.path));
  assert.equal(envelope.trace_ref.sha256, digest(envelope.trace_ref.path));
  assert.equal(envelope.owner_decision, null);
  assert.equal(envelope.acceptance_ref, null);
  assert.equal(envelope.authority_effect, 'none');
});
