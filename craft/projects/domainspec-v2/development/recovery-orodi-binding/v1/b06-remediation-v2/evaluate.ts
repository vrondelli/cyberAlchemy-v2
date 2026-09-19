/** Successor product entry point. The legacy evaluator remains a fact-only dependency. */
import type { BoundReference } from '../../../../impl/operational-resilience/contracts/operational-evidence.js';
import { type RecoveryBundle, recoveryBundleSchema } from '../../../../impl/operational-resilience/contracts/recovery-product-test.js';
import { normalizeRecoveryEvidence, type AdapterInputs, type AdapterPins } from '../../../../impl/operational-resilience/src/recovery-evidence-adapter.js';
import { evaluateRecoveryProductTest, canonicalRecoveryJson, parseRecoveryJson, recoverySha256, validateRecoveryShape } from '../../../../impl/operational-resilience/src/evaluate-recovery-product-test.js';

const INPUTS = ['manifest', 'sourceManifest', 'scenarioMap', 'matrix', 'results', 'producer', 'observer'] as const;
export type VerifiedContext = {
  binding_digest: string;
  evaluated_at: string;
  // Select this context independently, never from the submitted bundle.
  provenance: {
    mode: AdapterInputs['mode'];
    references: Record<typeof INPUTS[number], BoundReference>;
    pins: AdapterPins;
  };
};
const same = (a: unknown, b: unknown) => canonicalRecoveryJson(a) === canonicalRecoveryJson(b);

export function evaluateVerifiedRecoveryProductTest(text: string, context: VerifiedContext) {
  const basicContext = { binding_digest: context?.binding_digest ?? '', evaluated_at: context?.evaluated_at ?? '' };
  const result = evaluateRecoveryProductTest(text, basicContext);
  let provenanceDigest: string | null = null;
  try {
    if (!context?.provenance) throw new Error('independently selected provenance context required');
    provenanceDigest = recoverySha256(canonicalRecoveryJson(context.provenance));
    const parsed = parseRecoveryJson(text);
    if (validateRecoveryShape(parsed, recoveryBundleSchema).length) throw new Error('invalid bundle shape');
    const bundle = parsed as RecoveryBundle;
    const input = { mode: context.provenance.mode } as AdapterInputs;
    for (const name of INPUTS) {
      const ref = context.provenance.references[name];
      const matches = bundle.documents.filter(d => same(d.reference, ref));
      if (matches.length !== 1) throw new Error('unresolved or duplicate provenance input: ' + name);
      input[name] = matches[0];
    }
    if (!same(input.manifest.reference, bundle.binding.references.subject) ||
        !same(input.producer.reference, bundle.binding.references.producer) ||
        !same(input.observer.reference, bundle.binding.references.observer)) throw new Error('provenance/binding relationship mismatch');
    const rebuilt = normalizeRecoveryEvidence(input, context.provenance.pins);
    if (rebuilt.status !== 'normalized') throw new Error('adapter rejected provenance: ' + rebuilt.findings.join('; '));
    if (bundle.claim_mode !== rebuilt.claim_mode) throw new Error('claim mode differs from verified adapter');
    for (const expected of [rebuilt.normalizedDocument, rebuilt.scenarioDocument]) {
      const matches = bundle.documents.filter(d => same(d.reference, expected.reference));
      if (matches.length !== 1 || matches[0].content !== expected.content) throw new Error('adapter output mismatch: ' + expected.reference.ref);
    }
    if (!same(bundle.binding.references.scenario_contract, rebuilt.scenarioDocument.reference)) throw new Error('unbound adapter scenario contract');
    // Exact records bind each slot to its raw selector through reconstruction,
    // including origin, execution state, timestamps, observer and original cause.
    if (!same(bundle.records, rebuilt.records)) throw new Error('records differ from verified raw observations');
  } catch (error) {
    const reason = String(error);
    return { ...result, schema_version: 'domainspec.orodi.verified-recovery-test-result/v1-candidate',
      state: 'invalid' as const, verdict: 'reject', provenance_digest: provenanceDigest,
      provenance_verified: false,
      findings: [...result.findings, { state: 'invalid' as const, reason }],
      assertion_receipts: result.assertion_receipts.map(r => ({ ...r, state: 'invalid' as const,
        original_runtime_outcome: null, original_cause: null,
        reasons: [...r.reasons, 'Provenance not verified; assertion not accepted: ' + reason] })) };
  }
  return { ...result, schema_version: 'domainspec.orodi.verified-recovery-test-result/v1-candidate',
    provenance_digest: provenanceDigest, provenance_verified: true,
    qualified_limits: ['Raw-to-normalized correspondence verified with independently selected adapter inputs',
      ...result.qualified_limits.filter(x => !x.startsWith('Normalized-fact evaluation only'))] };
}
