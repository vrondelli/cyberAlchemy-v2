import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkedDerive } from '../l02-migration-v2/bridge.js';
import { deriveFeature } from '../../../../../impl/test-derivation-engine/src/index.js';
import { projectFeatureDirectory } from '../../../../../impl/test-derivation-engine/src/bte/feature-projector.js';
import { deriveFinancialSettlementStructuralEmission } from '../../../../../impl/test-derivation-engine/src/bte/structural-emitter.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../../../../../..');
const feature = join(root, 'validation/poker-team/docs/features/financial-settlement');
const bindings = join(root, 'projects/domainspec-v2/impl/test-derivation-engine/bindings/financial-settlement.json');
test('C01/C02 full financial-settlement legacy obligations match the checked aspect bridge', () => {
  const native = deriveFeature(feature, {emitTests: true});
  const result = checkedDerive(feature, 'aspect', true);
  assert.equal(result.status, 'pass', JSON.stringify(result.diagnostics));
  assert.equal(native.obligations.length, 79);
  assert.deepEqual(result.output, native);
});
test('C02 projector preserves full payload and known mapping diagnostic after bridge use', () => {
  const before = projectFeatureDirectory(feature);
  assert.deepEqual(before.census, {nodes: 10, kinds: 9, edges: 7, families: 6});
  assert.deepEqual(before.diagnostics, []);
  assert.deepEqual(before.conformance_diagnostics.map(({code, subject}) => ({code, subject})), [{code: 'BTE_DEV_EDGE_ENDPOINT_KIND', subject: 'financial-settlement.edge.007.maps'}]);
  assert.equal(checkedDerive(feature, 'aspect').status, 'pass');
  assert.deepEqual(projectFeatureDirectory(feature), before);
});
test('C02 structural emitter preserves exact cases, emitted text, diagnostics and behavioral gaps', () => {
  const before = deriveFinancialSettlementStructuralEmission(feature, bindings);
  assert.equal(before.cases.length, 52);
  assert.equal(before.report.structural.passed, 51);
  assert.equal(before.report.structural.failed, 1);
  assert.equal(before.report.result, 'expected-red');
  assert.deepEqual(before.report.behavioral, {total: 79, assertions: 12, properties: 1, coverage_gaps: 67});
  assert.equal(checkedDerive(feature, 'aspect').status, 'pass');
  assert.deepEqual(deriveFinancialSettlementStructuralEmission(feature, bindings), before);
});
test('L03 bound source and predecessor evidence bytes remain unchanged', () => {
  const manifest = JSON.parse(readFileSync(join(here, 'source-manifest.json'), 'utf8'));
  for (const ref of manifest.files) assert.equal(createHash('sha256').update(readFileSync(join(root, ref.path))).digest('hex'), ref.sha256, ref.path);
});
