// Candidate source-shape bridge. No full qualifier, FOL, or Lean model proof.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { checkTypedDefinitionModelIR } from '../../../../craft/projects/domainspec-v2/formalization/typed-definition-model-ir.mjs';
import { readSubjectNodes, readTypedRecordNodes, renderLeanSubject,
  translateSubject, validateTypedRecordClosure } from './auth-v2-typed-subject.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const leanPath = fileURLToPath(new URL('./AuthGeneratedSubject.lean', import.meta.url));
const sourceToLean = Object.freeze({
  request: { model: { name: 'request', kind: 'record', type: 'Request' },
    sourceType: { kind: 'named', selector: 'auth-command-boundary:boundary-request' } },
  candidate_command: { model: { name: 'candidate', kind: 'record', type: 'Command' },
    sourceType: { kind: 'named', selector: 'auth-command-boundary:authorization-command' } },
  resolved_authentication_evidence: { model: { name: 'authRows', kind: 'list', type: 'Evidence' },
    sourceType: { kind: 'list', element: { kind: 'named', selector: 'auth-command-boundary:authenticated-session-evidence' } } },
  resolved_route_bindings: { model: { name: 'routeRows', kind: 'list', type: 'RouteBinding' },
    sourceType: { kind: 'list', element: { kind: 'named', selector: 'auth-command-boundary:route-authorization-binding' } } },
});
const contextFieldOrder = Object.freeze(['request', 'candidate', 'authRows', 'routeRows']);

export function assertLeanContextDeclaration(lean, fields) {
  const start = 'structure Context where\n';
  const end = 'deriving Repr, DecidableEq\n';
  assert.equal(typeof lean, 'string');
  assert.equal(lean.split(start).length, 2, 'Lean Context declaration must occur exactly once');
  const after = lean.split(start)[1];
  const ending = after.indexOf(end);
  assert.ok(ending >= 0, 'Lean Context declaration has no deriving boundary');
  const declaration = start + after.slice(0, ending) + end;
  const sorted = [...fields].sort((a, b) =>
    contextFieldOrder.indexOf(a.name) - contextFieldOrder.indexOf(b.name));
  assert.deepEqual(sorted.map(row => row.name), contextFieldOrder,
    'selected Context fields do not match exact Lean field order');
  const expected = start + sorted.map(row =>
    `  ${row.name} : ${row.kind === 'list' ? `List ${row.type}` : row.type}\n`).join('') + end;
  assert.equal(declaration, expected,
    'generated Lean Context declaration differs from pinned typed source field mapping');
}

export function checkCurrentAuthTypedModelSourceBridge(model, logicalIR) {
  const checked = checkTypedDefinitionModelIR(model, logicalIR);
  const recordRows = validateTypedRecordClosure(readTypedRecordNodes());
  const subject = translateSubject(readSubjectNodes());
  const rendered = renderLeanSubject(subject, { recordRows });
  const actual = readFileSync(leanPath, 'utf8');
  assert.equal(actual, rendered, 'selected generated Lean subject differs from pinned source projection');

  const properties = recordRows.context.body.typed_contract.properties;
  assert.deepEqual(properties.map(row => row.name).sort(), Object.keys(sourceToLean).sort(),
    'selected Context property set differs from closed source-to-Lean mapping');
  const fields = properties.map(row => {
    const mapping = sourceToLean[row.name];
    assert.deepEqual(row.type, mapping.sourceType, `selected Context property type differs: ${row.name}`);
    return mapping.model;
  });
  assertLeanContextDeclaration(rendered, fields);
  assertLeanContextDeclaration(actual, fields);
  assert.equal(model.context.sort, 'Context', 'model must name selected Context sort');
  assert.deepEqual([...model.context.fields].sort((a, b) => a.name.localeCompare(b.name)),
    fields.sort((a, b) => a.name.localeCompare(b.name)),
    'model Context fields differ from all selected typed source fields');
  return { ...checked, status: 'checked-auth-context-field-shape-and-qualifier-membership',
    selected_typed_context_field_shape_bound: true,
    selected_typed_context_source_ref: {
      generated_lean_path: 'auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/AuthGeneratedSubject.lean',
      generated_lean_sha256: sha(Buffer.from(actual)),
      typed_record_node_count: Object.keys(recordRows).length,
    },
    // Byte equality and a closed field mapping do not prove the model's full
    // interpretation, evaluator completion, or a current FormalClaim.
    typed_context_carrier_correspondence_proved: false,
    logical_qualifier_full_definition_checked: false,
    lean_obligations_proved: false,
    model_obligations_checked: false,
    authority_effect: 'none' };
}
