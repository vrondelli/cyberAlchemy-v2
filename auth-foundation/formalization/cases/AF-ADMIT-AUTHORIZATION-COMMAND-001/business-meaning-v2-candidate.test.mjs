import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { lstatSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repo = resolve(fileURLToPath(new URL('../../../', import.meta.url)), '..');
const read = path => readFileSync(resolve(repo, path));
const json = path => JSON.parse(read(path));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const basePath = 'auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/BUSINESS-MEANING.v1-clarified-accepted.json';
const modelPath = 'auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/INTERPRETATION-MODEL.v1-occurrences-candidate.json';
const meaningPath = 'auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/BUSINESS-MEANING.v2-definitions-candidate.json';
const sourcePath = 'auth-foundation/implementation/command-boundary-business-ontology.json';
const base = json(basePath);
const model = json(modelPath);
const meaning = json(meaningPath);
const source = json(sourcePath);
// Reviewed draft snapshot only. This is not a parser, a model check, or owner acceptance.
const expectedExpressionMapDigest = 'ed3d102e10bdbb35630cf812209f656c3c504339e23b183b9d329ff75cdfd3b4';

function expressionMapDigest(definitions) {
  const entries = definitions.map(({ definition_id, formal }) => [definition_id, formal.expression]);
  entries.sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0);
  return sha(JSON.stringify(entries));
}

function exact(ref, expectedPath) {
  assert.equal(ref.path, expectedPath);
  const target = resolve(repo, ref.path);
  assert.equal(lstatSync(target).isSymbolicLink(), false);
  const bytes = read(ref.path);
  assert.equal(ref.sha256, sha(bytes), `stale ref ${ref.path}`);
  assert.equal(ref.size_bytes, bytes.length, `stale size ${ref.path}`);
  if ('current' in ref) assert.equal(ref.current, true);
}

function pointer(value, path) {
  assert.ok(path.startsWith('#/'), `bad pointer ${path}`);
  return path.slice(2).split('/').reduce((at, key) => {
    assert.ok(at !== null && at !== undefined && Object.hasOwn(at, key), `missing pointer ${path}`);
    return at[key];
  }, value);
}

test('v2 draft exact-binds the owner-accepted rule without accepting new definitions', () => {
  exact(meaning.base_accepted_meaning_ref, basePath);
  exact(meaning.definition_source_ref, sourcePath);
  exact(meaning.interpretation_model_ref, modelPath);
  exact(model.business_meaning_ref, basePath);
  for (const key of ['meaning_id', 'owner', 'domain_context', 'rule', 'applies_when', 'actors', 'inputs', 'outcomes', 'examples', 'counterexamples', 'boundaries']) {
    assert.deepEqual(meaning[key], base[key], `accepted business fact changed: ${key}`);
  }
  assert.equal(meaning.schema_version, 'domainspec-v2.business-meaning/v2-candidate');
  assert.equal(meaning.status, 'draft');
  assert.equal(meaning.supersedes, `${base.meaning_id}@${base.version}`);
  assert.equal(meaning.supersession_effect, 'lineage-only-until-accepted');
  assert.deepEqual(meaning.acceptance, { status: 'not-requested', owner_ref: meaning.owner, acceptance_ref: null, acceptance_digest: null });
  assert.equal(meaning.authority_effect, 'none');
  assert.equal(model.status, 'draft');
  assert.equal(model.acceptance.status, 'not-requested');
  assert.equal(model.authority_effect, 'none');
});

test('definition closure, pointers and ontology source concepts resolve exactly', () => {
  const ids = new Set(meaning.definitions.map(row => row.definition_id));
  assert.equal(ids.size, meaning.definitions.length);
  const sourceIds = new Set([
    ...source.nodes.map(row => row.id),
    ...source.properties.map(row => row.property_id),
    ...source.rules.map(row => row.rule_id),
    ...source.operations.map(row => row.operation_id),
  ]);
  const byId = new Map(meaning.definitions.map(row => [row.definition_id, row]));
  for (const row of meaning.definitions) {
    assert.equal(row.status, 'candidate', row.definition_id);
    assert.ok(row.formal.definition && row.formal.expression && row.formal.notation.length && row.formal.operational_interpretation);
    assert.ok(row.plain_language && row.domain_context && row.forbidden_collapses.length);
    for (const dep of row.depends_on) assert.ok(ids.has(dep), `${row.definition_id}: unknown dependency ${dep}`);
    for (const ref of row.business_fact_refs) assert.ok(pointer(meaning, ref) !== undefined);
    for (const ref of row.interpretation_refs) assert.ok(pointer(model, ref) !== undefined);
    for (const ref of row.source_concept_refs) assert.ok(sourceIds.has(ref), `${row.definition_id}: unknown concept ${ref}`);
  }
  const seen = new Set(), active = new Set();
  function visit(id) {
    assert.ok(!active.has(id), `definition cycle ${id}`);
    if (seen.has(id)) return;
    active.add(id);
    for (const dep of byId.get(id).depends_on) visit(dep);
    active.delete(id); seen.add(id);
  }
  for (const id of ids) visit(id);
});

test('critical occurrence, qualifier, provenance and decision distinctions are explicit', () => {
  const d = Object.fromEntries(meaning.definitions.map(row => [row.definition_id, row.formal.expression]));
  assert.match(d['AUTH-CB-DEF-AUTH-OCCURRENCE-V2'], /list position|i\)=\(c,j\)/);
  assert.match(d['AUTH-CB-DEF-ROUTE-OCCURRENCE-V2'], /list position|j\)=\(c,k\)/);
  assert.match(d['AUTH-CB-DEF-QUALIFYING-AUTH-V2'], /AuthMember\(c,a\).*EvidenceRef\(a\).*SessionID\(a\).*Trusted\(a\)/);
  assert.match(d['AUTH-CB-DEF-QUALIFYING-ROUTE-V2'], /RouteMember\(c,r\).*RouteID\(r\).*ScopeEvidenceRef\(r\).*Complete\(r\).*PermissionResource\(r\).*PermissionAction\(r\).*PermissionScope\(r\)/);
  assert.match(d['AUTH-CB-DEF-SAME-ROW-PROVENANCE-V2'], /SessionID\(a\).*PermissionResource\(r\).*PermissionAction\(r\).*PermissionScope\(r\).*ScopeEvidenceRef\(r\)/);
  assert.match(d['AUTH-CB-DEF-READY-CONDITION-V2'], /RequestID\(c\)≠empty.*∃a:AuthOccurrence,r:RouteOccurrence.*ExactOneAuth\(c,a\).*ExactOneRoute\(c,r\).*Provenance\(c,a,r\)/);
  assert.match(d['AUTH-CB-DEF-DECISION-V2'], /Decision\(c\)=READY ⇔ P\(c\).*Decision\(c\)=DENY ⇔ ¬P\(c\)/);
  assert.equal(d['AUTH-CB-DEF-IN-SCOPE-NORMAL-V2'], '∀c:Context. InScopeNormal(c) ⇔ true');
  assert.ok(!meaning.definitions.some(row => /direct.*call|downstream.*call/i.test(row.term)), 'the accepted unqualified no-call fact is not redefined by a direct-site trace');
  assert.match(meaning.claim_ceiling, /R5 direct-call proof is narrower/);
  assert.match(base.rule, /without a downstream authorization call/);
  assert.ok(model.assumptions.some(value => value.includes('source/preservation') || value.includes('exact canonical claim')));
  assert.ok(model.predicates.some(value => value.name === 'InScopeNormal(c)' && value.domain.includes('entire Context carrier')));
  assert.ok(model.witnesses.some(value => value.includes('positions 0 and 1')));
  assert.ok(model.witnesses.some(value => value.includes('lists empty')));
});

test('the complete draft expression map rejects formula suffixes hidden by keyword regexes', () => {
  assert.equal(meaning.definitions.length, 10);
  assert.equal(expressionMapDigest(meaning.definitions), expectedExpressionMapDigest);
  for (const id of [
    'AUTH-CB-DEF-QUALIFYING-AUTH-V2',
    'AUTH-CB-DEF-QUALIFYING-ROUTE-V2',
    'AUTH-CB-DEF-DECISION-V2',
  ]) {
    const mutant = structuredClone(meaning.definitions);
    mutant.find(row => row.definition_id === id).formal.expression += ' ∨ true';
    assert.notEqual(expressionMapDigest(mutant), expectedExpressionMapDigest, `${id}: suffix must invalidate draft snapshot`);
  }
  const missingDefinition = structuredClone(meaning.definitions).slice(1);
  assert.notEqual(expressionMapDigest(missingDefinition), expectedExpressionMapDigest);
  const changedIdentity = structuredClone(meaning.definitions);
  changedIdentity[0].definition_id += '-WRONG';
  assert.notEqual(expressionMapDigest(changedIdentity), expectedExpressionMapDigest);
});

test('v2 meaning and occurrence model satisfy their schemas without allowing draft promotion', () => {
  const schemas = resolve(repo, 'craft/projects/domainspec-v2/formalization/schemas');
  const script = `import json,sys,pathlib,jsonschema
root=pathlib.Path(sys.argv[1]); values=json.load(sys.stdin)
for key,name in [('meaning','business-meaning.v2-candidate.schema.json'),('model','interpretation-model.schema.json')]:
    schema=json.loads((root/name).read_text())
    validator=jsonschema.Draft202012Validator(schema)
    validator.validate(values[key])
    promoted={**values[key], 'status':'accepted'}
    if not list(validator.iter_errors(promoted)):
        raise AssertionError(f'{key}: unaccepted draft cannot be promoted by status alone')`;
  const result = spawnSync('python3', ['-c', script, schemas], {
    input: JSON.stringify({ meaning, model }), encoding: 'utf8', timeout: 10000,
  });
  assert.equal(result.status, 0, result.stderr || String(result.error));
});
