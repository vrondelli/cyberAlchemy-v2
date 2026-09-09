# PythonConstraint Lean Reuse Audit

Status: candidate research evidence  
Task: `PYC-LEAN-REUSE-AUDIT-001`  
Parent Research: `CA2-RESEARCH-PYTHONCONSTRAINT-ADMISSION`  
Authority effect: none

## Outcome

This package converts the successful Vero GaloisTools proof-production experience and selected
Lean corpus patterns into a bounded reuse audit for the 20-spec PythonConstraint benchmark.
It does not copy polynomial mathematics into the CSP model and does not claim that a source
theorem can be imported into the target sandbox.

The main result is deliberately mixed:

- the GaloisTools evidence procedure is a strong method precedent because it used the same Vero
  commit, Lean version, codeproof artifact model, official grader, and independent receipt shape;
- eight construct or method candidates map onto the PythonConstraint proof surface;
- none of the four repository Lean files inspected is currently proven directly importable into
  PythonConstraint's mathlib-free sandbox;
- all 20 specifications have one matrix row and one attack wave;
- missing generic cartesian-product, permutation, `Nodup`, counting, and pigeonhole lemmas remain
  explicit new proof work.

## Package Map

| Artifact | Purpose |
| --- | --- |
| `profile.json` | Stable candidate identity, target boundary, artifact closure, and claim ceiling. |
| `sources.json` | Digest-bound local, Git-object, and pinned-HTTPS evidence sources. |
| `evidence-procedure-ontology.json` | Candidate system ontology for the proof/evidence production loop. |
| `lean-construct-inventory.json` | Selected proof constructs and method patterns with adaptation requirements. |
| `spec-reuse-matrix.json` | Exact 20-row mapping from Vero specification to reuse candidates and new lemmas. |
| `import-closure-report.json` | Mathlib-free compatibility classification for every construct. |
| `proof-attack-order.json` | Five dependency-aware proof waves and the inherited blocker taxonomy. |
| `schemas/lean-reuse-audit.schema.json` | Closed top-level artifact contracts. |
| `validate.py` | Deterministic structural, digest, source, closure, and denominator validator. |

## Evidence Procedure

The GaloisTools result supports reusing this sequence:

```text
pinned baseline
  -> recognized-slot mutation
  -> exact delta audit
  -> artifact render/extract roundtrip
  -> full build
  -> official Vero grader
  -> theorem axiom probes
  -> independent reconstruction
  -> skeptic audit
  -> bounded aggregate receipt
```

Rejected attempts remain evidence and are explicitly excluded from the successful chain. A grader
process exit is not substituted for the native report, and a benchmark score is not widened into a
general mathematics or product claim.

## Reuse Boundary

`ContextManifestIntegrity.lean`, `JsonDuplicateKeyAdmission.lean`, and
`ScopedContextReindexing.lean` import Mathlib. `APTCaptureHeadReducer.lean` imports a repository
module with transitive dependencies. PythonConstraint is declared mathlib-free. Consequently these
files supply patterns and candidate lemma shapes, not authorized imports.

The first proof implementation must restate the smallest required helpers inside allowed Vero
proof-support slots and compile them against the exact rendered sandbox. If a source dependency is
later proposed, that is a separate dependency-boundary decision.

## Validation

Offline validation checks local files, Git-object sources, schemas, source/construct/wave closure,
and the exact 20-spec denominator:

```bash
python3 validate.py
```

The stronger check also re-downloads the two commit-pinned Vero sources and verifies their SHA-256
digests:

```bash
python3 validate.py --verify-remote
```

The validator writes nothing. A PASS establishes only internal consistency and source identity for
this candidate package.

## Residue And Next Gate

Before any proof attack:

1. materialize the exact PythonConstraint codeproof sandbox;
2. freeze recognized slots, instructions, toolchain, and an empty baseline report;
3. probe which Core `List` lemmas are actually available without Mathlib;
4. produce the first implementation-to-reference helper bridge;
5. obtain a separate accepted local execution boundary.

Haskell remains outside this package. Rust and multi-provider EVF evidence remain later successor
phases after ontology and Lean proof closure.

## Claim Ceiling

This package is candidate research evidence with `authority_effect: none`. It does not admit a
business or system ontology, prove any PythonConstraint theorem, authorize a Vero run, establish
EVF effectiveness, register a D65 ConstructionBinding, change the Goal state, or authorize Rust,
Haskell, publication, release, deployment, or external effects.
