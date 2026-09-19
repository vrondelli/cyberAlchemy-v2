# Glossary consistency

The Design package reuses the Define terms `EmitsIncomingClosureEvidenceEnvelope`, `EmitsTargetMaxEvaluationReceipt`, snapshot binding, completeness attestation, and currentness reference unchanged.

New candidate-local wording:

- **Dedicated closure sidecar**: one consumer-authored, project-contained, non-generated file that materializes the envelope for one exact snapshot.
- **Evaluation request wrapper**: optional transport metadata that references the sidecar by path and digest; it never copies or replaces the attestation.

Neither term is a canonical Definitions Governance entry. No boundary-kind vocabulary is minted.
