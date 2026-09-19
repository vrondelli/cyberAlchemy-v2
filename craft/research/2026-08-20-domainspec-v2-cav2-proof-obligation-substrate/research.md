# Verbatim Explorer Returns

These returns are preserved exactly as received from the three registered
explorer actions. They are research evidence, not authority, canonical
documentation, implementation approval, promotion, publication, release, or
production evidence.

<a id="explorer-return-1-van-lamsweerde-domainspec"></a>

## Agent 1 — van Lamsweerde, Axel — DomainSpec v2

{
  "receipt_version": "1",
  "action_id": "spawn-0001",
  "role": "explorer-domainspec",
  "status": "complete",
  "mode": "explore",
  "mutation_policy": "read-only",
  "repository_mutations": [],
  "requested_output_ref": "research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate/receipts/explorer-domainspec.json",
  "persistence": "returned-to-parent-for-persistence because worker write scope was empty",
  "claim_ceiling": "Current-byte DomainSpec reconstruction only. Structural authority and exact-reference consistency were observed; no EVF execution, discharge, canonical promotion, release admission, or end-to-end proof is claimed.",
  "headline_findings": [
    "DomainSpec semantic authority remains owner-separated: DS-D1 owns meta-types and DS-D2/DS-D8 own relationship labels and signatures. The live authority contains 31 signatures; the Inventory seed's 30-signature statement is stale.",
    "The current EVF predicate, obligation, binding, fixture, runtime, evaluator, verifier, and receipt surfaces are dirty or untracked candidate bytes. Their schemas and self-descriptions do not promote them.",
    "All eight exact references embedded in key-door-binding.v1.json currently match their target hashes and sizes.",
    "No EVF S1 evidence directory, positive receipt, negative-control receipt, generated test, executor receipt, or validation receipt exists.",
    "The intended terminal command is not installed in impl/package.json, seven declared focused test targets are absent, and the verifier currently reads its validation contract from a refresh staging tree rather than the absent canonical work-pack path.",
    "A live schema-valid stale-link witness exists: the binding declares the runtime source pre-state as absent and requires a postimage digest before execution, while that runtime source now exists untracked and has no digest recorded in the binding."
  ],
  "canonical_owner_map": [
    {
      "record": "meta-type",
      "owner": "DomainSpec definitions-governance",
      "classification": "canonical source",
      "source": "projects/domainspec-v2/definitions/DEFINITIONS.md:1057-1070; projects/domainspec-v2/definitions/meta-types/meta-types.yml",
      "current_fact": "Rule DS-D1.7 and Operation DS-D1.4 are active; per-type criterion schemas own machine-checkable formation."
    },
    {
      "record": "relationship verb and signature",
      "owner": "DomainSpec definitions-governance",
      "classification": "canonical source",
      "source": "projects/domainspec-v2/definitions/DEFINITIONS.md:1072-1151; projects/domainspec-v2/definitions/relationships/relationships.yml:1-18,101-113",
      "current_fact": "enforces is one active canonical Rule-to-Operation signature admitting same-feature and cross-feature placement."
    },
    {
      "record": "minted-project profile admission",
      "owner": "definitions/minted-project",
      "classification": "experimental owner authority",
      "source": "projects/domainspec-v2/definitions/minted-project/supported-profiles.yml:1-67",
      "current_fact": "The profile binds exact meta-type and relationship registry digests, admits four kinds, and explicitly grants no release admission."
    },
    {
      "record": "authored key-door graph source",
      "owner": "minted-project conformance fixture owner",
      "classification": "authored fixture source, not global semantic authority",
      "source": "projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/specs/key-and-door/nodes/has-key-rule.json:1-17",
      "current_fact": "It authors the enforces edge and boolean return type, but no executable predicate."
    },
    {
      "record": "generated graph, source manifest, build receipt",
      "owner": "minted-project generator",
      "classification": "derived projection and generated verification evidence",
      "source": "projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/",
      "current_fact": "The graph and manifest join exactly to the Rule source; the build receipt labels itself generated-verification-evidence."
    },
    {
      "record": "predicate",
      "owner": "DomainSpec EVF semantic owner, selection not yet synchronized into the pending canonical decision record",
      "classification": "owner-selectable untracked candidate",
      "source": "projects/domainspec-v2/development/evolvable-validation-framework/semantic-source/key-door-predicate.v1.json:1-28",
      "current_fact": "ID evf.key-door.has-key.v1 means has_key == true; authority metadata explicitly says schema validation grants no authority."
    },
    {
      "record": "obligation",
      "owner": "unresolved between an independently authored O_spec owner and the EVF derivation implementation",
      "classification": "candidate validation evidence plus derived implementation output",
      "source": "projects/domainspec-v2/development/evolvable-validation-framework/contracts/key-door-obligations.v1.json:1-16; projects/domainspec-v2/impl/test-derivation-engine/src/minted-project/derive.ts:245-265",
      "current_fact": "O_spec labels itself validation-evidence-only-not-semantic-authority; O_gen is a hard-coded fixed record exact-compared to O_spec."
    },
    {
      "record": "binding and fixture",
      "owner": "EVF candidate execution plane",
      "classification": "untracked candidate",
      "source": "projects/domainspec-v2/development/evolvable-validation-framework/fixtures/SWU-GCP-001/",
      "current_fact": "The binding enforces exactly-one semantics and content-addresses predicate, fixture, runtime contract, O_spec, relationship authority, raw source, graph, and manifest."
    },
    {
      "record": "runtime contract, runtime adapter, evaluator, test emitter",
      "owner": "test-derivation-engine implementation owner",
      "classification": "dirty or untracked candidate implementation",
      "source": "projects/domainspec-v2/development/evolvable-validation-framework/contracts/key-door-runtime.v1.json; projects/domainspec-v2/impl/test-derivation-engine/src/minted-project/; projects/domainspec-v2/impl/test-derivation-engine/src/emit/tests.ts:444-523",
      "current_fact": "The evaluator independently computes expected booleans from the predicate and validates exact runtime transitions, but no current execution receipt proves it ran."
    },
    {
      "record": "receipt and negative control",
      "owner": "EVF candidate evidence plane",
      "classification": "schema and implementation only; execution instances missing",
      "source": "projects/domainspec-v2/development/evolvable-validation-framework/contracts/evolvable-validation-receipt.v1.schema.json; projects/domainspec-v2/impl/test-derivation-engine/src/minted-project/evolvable-validation-receipt.ts",
      "current_fact": "Positive and negative classes are claim-limited and grant no release admission. No instance exists."
    },
    {
      "record": "human documentation",
      "owner": "EVF Invoke/work-pack owner",
      "classification": "candidate or derived projection",
      "source": "projects/domainspec-v2/development/evolvable-validation-framework/{DEFINE.md,DESIGN.md,PLAN.md,WORK-PACK.md,GLOSSARY.md}",
      "current_fact": "These documents are non-authoritative and currently stale relative to the selected predicate and partially materialized implementation."
    }
  ],
  "source_to_receipt_trace": {
    "observed_current_chain": [
      "DS-D1 active Rule and Operation definitions",
      "DS-D8 active enforces Rule-to-Operation signature",
      "authored HasKeyRule edge",
      "generated graph and source-manifest lineage",
      "owner-selectable predicate evf.key-door.has-key.v1",
      "expected-free two-case fixture",
      "O_spec obligation evf.s1.enforces.has-key.unlock-door.v1",
      "exact binding evf.key-door.binding.v1",
      "harness-only runtime contract and untracked attemptUnlock adapter",
      "candidate deriver, typed evaluator, strict test emitter, mutant runner, and receipt builder"
    ],
    "missing_terminal_chain": [
      "generated test instance",
      "executed child-result envelope",
      "16 persisted negative-control receipts",
      "positive EVF receipt",
      "validation receipt",
      "target-result inventory",
      "independent replay or discharge record"
    ],
    "proof_status": "Observed structural and content-addressed candidate lineage; terminal execution unverified and evidence absent."
  },
  "witnesses": {
    "positive": {
      "id": "EVF-STATIC-LINEAGE-001",
      "status": "observed-partial",
      "evidence": [
        "All eight binding exact refs match current hashes and sizes.",
        "Live relationship validation passed: 6 specs checked, edgesChecked=34, canonicalSignatures=31.",
        "Raw Rule edge, generated graph edge, and source-manifest lineage agree on key-and-door.edge.has-key-rule-enforces-unlock-door.",
        "The runtime adapter exists and implements the two contract transitions."
      ],
      "ceiling": "Static structural/lineage consistency only; not an executed proof or obligation discharge."
    },
    "broken_or_stale": {
      "id": "EVF-STALE-RUNTIME-BINDING-001",
      "status": "observed-current",
      "evidence": [
        "key-door-binding.v1.json:53-59 declares runtime_source_binding.pre_state=absent and postimage_digest_required_before_execution=true.",
        "key-door-runtime.v1.json:5-10 declares target.pre_state=planned-create.",
        "projects/domainspec-v2/impl/test-derivation-engine/src/minted-project/fixtures/key-door-runtime.ts now exists untracked, SHA-256 1ba24134f1bb2180abfae7af037238413d55ffe7abbf8fde11020128f5ceb0e8, 323 bytes.",
        "The binding schema requires the stale absent-state literal, and the current verifier merely observes a fresh runtime exactRef at execution; it does not reconcile the declared postimage lifecycle."
      ],
      "first_stop_required": "Lifecycle and exact-reference validation must reject or supersede the stale binding before any positive receipt.",
      "forbidden_inference": "Schema validity must not be treated as current binding authority or execution readiness."
    }
  },
  "identifier_and_lifecycle_requirements": [
    "Separate stable semantic ID from schema version, record revision, and immutable content digest.",
    "Namespace IDs under the semantic owner; cross-project records reference owner IDs and revisions rather than transferring ownership.",
    "Every obligation must bind an exact source selector, source revision/digest, relationship-signature revision, predicate revision, and derivation-rule identity/version.",
    "Every binding must bind exact obligation, predicate, fixture, runtime-contract, and actual runtime-source postimage bytes. Pre-state metadata cannot survive materialization as current state.",
    "Retain superseded IDs permanently and forbid reuse, following the existing DS-D1.10 precedent; add explicit supersedes and superseded_by links.",
    "Keep semantic lifecycle separate from execution lifecycle: candidate/active/superseded is not open/discharged/failed/reopened, and neither is receipt pass/killed.",
    "Reopening must append a new lifecycle event and new execution attempt; it must not mutate an old receipt or silently preserve a prior discharge as current.",
    "Receipts require unique run and attempt identity, observed time, evaluator/deriver/emitter/verifier identities and digests, exact input refs, observed outputs, claim ceiling, and immutable result.",
    "Negative-control receipts must bind the mutated input, observed failure envelope, expected failure code, and verifier identity; the current validation-contract-only exact ref is insufficient.",
    "Human pages and machine indexes must be generated projections unless an owner explicitly promotes a source document through the DomainSpec definition route."
  ],
  "documentation_and_contract_gaps": [
    "No canonical ProofClaim record or catalog exists; claim meaning is scattered across receipt_class and hard-coded claim_ceiling strings.",
    "No canonical obligation owner exists. Generic engine obligations use a SHA-1 obligation_key, while EVF uses a parallel fixed obligation_id and hard-coded GeneratedObligation type.",
    "The generic IR still overloads enforces as Operation-to-Invariant, while DS-D8 canonically defines Rule-to-Operation; a shared substrate must keep these contexts distinct.",
    "O_spec lacks source selector, authority posture, rule-set version, lifecycle state, and supersession fields.",
    "No evaluator record or digest is bound into the positive receipt. Generated-test imports name evaluator paths but do not content-bind evaluator bytes.",
    "Negative receipts contain only an exact ref to the staged validation contract, not the mutated artifact or observed failure evidence.",
    "Receipt IDs and output root are fixed to v1 and attempt-001; no append-only multi-run, supersession, discharge, or reopen model exists.",
    "The canonical decision file still says pending while a refresh report records the owner selection.",
    "PLAN.md and WORK-PACK.md still report the formal-source blocker and task-session-awaiting status despite current untracked candidate implementation.",
    "work-pack/validation-contract.s1.json, target-inventory.candidate-a.json, CLOSEOUT-CONTRACT.md, and EXECUTION-ENTRY.json are absent at their intended canonical paths; the verifier imports the validation contract from an untracked refresh staging path.",
    "The terminal npm script verify:evf-s1 is absent, seven declared focused test files are absent, and the complete evidence directory is absent.",
    "Inventory and the imported Lean snapshot are historical discovery evidence: Inventory reports 30 signatures and Lean transcribes 29, while live authority has 31."
  ],
  "candidate_file_map": {
    "canonical_existing": [
      "projects/domainspec-v2/definitions/DEFINITIONS.md",
      "projects/domainspec-v2/definitions/meta-types/meta-types.yml",
      "projects/domainspec-v2/definitions/relationships/relationships.yml",
      "projects/domainspec-v2/definitions/minted-project/supported-profiles.yml"
    ],
    "derived_existing": [
      "projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/graph.json",
      "projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/source-manifest.json",
      "projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/build-receipt.json"
    ],
    "untracked_owner_material_candidate": [
      "projects/domainspec-v2/development/evolvable-validation-framework/semantic-source/key-door-predicate.v1.json",
      "projects/domainspec-v2/development/evolvable-validation-framework/semantic-source/key-door-predicate.v1.schema.json",
      "projects/domainspec-v2/development/evolvable-validation-framework/contracts/key-door-obligations.v1.json",
      "projects/domainspec-v2/development/evolvable-validation-framework/contracts/key-door-obligations.v1.schema.json",
      "projects/domainspec-v2/development/evolvable-validation-framework/contracts/key-door-runtime.v1.json",
      "projects/domainspec-v2/development/evolvable-validation-framework/contracts/key-door-runtime.v1.schema.json",
      "projects/domainspec-v2/development/evolvable-validation-framework/contracts/evolvable-validation-receipt.v1.schema.json",
      "projects/domainspec-v2/development/evolvable-validation-framework/fixtures/SWU-GCP-001/key-door-binding.v1.json",
      "projects/domainspec-v2/development/evolvable-validation-framework/fixtures/SWU-GCP-001/key-door-binding.v1.schema.json",
      "projects/domainspec-v2/development/evolvable-validation-framework/fixtures/SWU-GCP-001/key-door-input.v1.json",
      "projects/domainspec-v2/development/evolvable-validation-framework/fixtures/SWU-GCP-001/key-door-input.v1.schema.json"
    ],
    "dirty_or_untracked_implementation_candidate": [
      "projects/domainspec-v2/impl/test-derivation-engine/src/bindings/index.ts",
      "projects/domainspec-v2/impl/test-derivation-engine/src/emit/tests.ts",
      "projects/domainspec-v2/impl/test-derivation-engine/src/index.ts",
      "projects/domainspec-v2/impl/test-derivation-engine/src/minted-project/types.ts",
      "projects/domainspec-v2/impl/test-derivation-engine/src/minted-project/derive.ts",
      "projects/domainspec-v2/impl/test-derivation-engine/src/minted-project/typed-predicate.ts",
      "projects/domainspec-v2/impl/test-derivation-engine/src/minted-project/enforces-execution.ts",
      "projects/domainspec-v2/impl/test-derivation-engine/src/minted-project/evolvable-validation-receipt.ts",
      "projects/domainspec-v2/impl/test-derivation-engine/src/minted-project/verify-evf-s1.ts",
      "projects/domainspec-v2/impl/test-derivation-engine/src/minted-project/fixtures/key-door-runtime.ts"
    ],
    "missing_execution_and_documentation_surface": [
      "projects/domainspec-v2/development/evolvable-validation-framework/work-pack/validation-contract.s1.json",
      "projects/domainspec-v2/development/evolvable-validation-framework/evidence/SWU-GCP-001/attempt-001/",
      "seven validation-contract focused test targets",
      "impl/package.json script verify:evf-s1",
      "owner-governed proof-claim and obligation catalog",
      "generated machine index and human companion carrying lifecycle and supersession"
    ]
  },
  "validation": {
    "exact_ref_check": "PASS, 8 of 8 binding refs matched current hash and size",
    "relationship_validator": "PASS, 6 specs checked, 34 edges checked, 31 canonical signatures",
    "relationship_validator_command": "cwd projects/domainspec-v2/impl; Linux Node v22.12.0; node --import tsx tools/validate-relationships.ts",
    "evf_terminal_verifier": "NOT RUN because it writes evidence and this action was read-only",
    "repository_receipt_written": false
  },
  "key_source_hashes": {
    "definitions/DEFINITIONS.md": "04541ad0f1cb995324950fa2c04a839a236aff1cda168e1767bb2b67a7adcc4d",
    "definitions/meta-types/meta-types.yml": "4394968327b785d50cd323ad58a799feb71b9debf7e06b650b4fd1e4008f9ede",
    "definitions/relationships/relationships.yml": "ffc97f2c358e4bebeebd8ceeb25aef59628be9c970cf6a7e510f7a37c9876d9f",
    "semantic-source/key-door-predicate.v1.json": "1e8d49d55c463e98d012775f6d39b79d50d50faaaffbf2930528811b073fc94b",
    "contracts/key-door-obligations.v1.json": "0abb0901bb8ac659e1d26ec2611e5926a74fede5f35bba27ee4de99de354af62",
    "contracts/key-door-runtime.v1.json": "40c9f27244dc7bfe4e955f595ae4924a442c8948dc43830ca57c8de998fb861f",
    "fixtures/SWU-GCP-001/key-door-binding.v1.json": "ae49a8b33aa3b1c7b20691252e41461769762ea6bae77c4585b182c8d08e0a08",
    "contracts/evolvable-validation-receipt.v1.schema.json": "d52e86e7604bf8f041edb33eeec9dfc5838238940b53508abb8f68e42be834ee"
  },
  "residue": [
    "Cross-project topology remains a synthesizer and owner decision.",
    "No assertion is made that the EVF candidate is canonical, discharged, reproducible, implementation-complete, release-ready, or production-ready.",
    "Existing dirty and untracked bytes were preserved."
  ]
}

<a id="explorer-return-3-peirce-precedent"></a>

## Agent 3 — Peirce, Charles Sanders — External precedent

## Bounded receipt

- `action_id`: `spawn-0003`
- `role`: `explorer-precedent`
- `capability`: `research`
- `status`: `pass`
- `mutation_policy`: `read-only`
- `mutations`: none
- `blockers`: none
- `output_ref_for_parent_persistence`: `research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate/receipts/explorer-precedent.json`
- `evidence_cutoff`: 2026-08-20

### Finding

External precedent supports one shared structural contract with two owner-specific canonical catalogs and a derived crosswalk. It does not support a single shared semantic registry.

The reusable denominator is typed, versioned records plus exact, typed relationships. External standards may inform shape, provenance, validation, and presentation; none may decide DomainSpec or CyberAlchemy authority.

### Precedent matrix

| ID | Primary owner and selectors | Minimum reusable invariant | What it does not prove | Fit and access constraint |
|---|---|---|---|---|
| PRE-01 | OMG, [SACM 2.3 normative PDF](https://www.omg.org/spec/SACM/2.3/PDF), §§11.8–11.14, Annex D.4; [official version and machine-readable XML listing](https://www.omg.org/spec/SACM/About-SACM) | Keep claim, assertion state, artifact citation, reasoning, evidence relationship, and counter-evidence distinct. Relationships have explicit sources and targets; `needsSupport`, `assumed`, `defeated`, and ordinary assertion are not interchangeable. | An asserted claim is not thereby true; an artifact citation is not an executed check or discharge decision. | Reuse a small structural subset across both catalogs; do not import SACM/XMI wholesale. OMG permits implementation but restricts copying/modifying the specification and compliance branding. |
| PRE-02 | SCSC Assurance Case Working Group, [GSN Standard v3 landing page](https://scsc.uk/gsn-standard) and [official publication record](https://mail.scsc.uk/resources/citation_r1386.html) | A human assurance view should visibly separate goals/claims, argument strategies, context, assumptions, and solutions/evidence, including undeveloped structure. | A diagram is neither a proof object nor execution evidence. | Useful only as a human projection pattern. The official PDF was edge-verification-blocked in this environment, so no load-bearing field semantics were inferred from it; it is copyrighted SCSC material. |
| PRE-03 | W3C Provenance WG, [PROV-O Recommendation](https://www.w3.org/TR/prov-o/), §§1, 3 and term definitions for Bundle, Attribution, Revision, Generation, and Invalidation | Model artifacts as entities, executions as activities, responsible parties as agents; represent revisions as new entities; preserve attribution, generation, use, and invalidation. A provenance bundle can itself have provenance. | Provenance records describe lineage; they do not certify truth, semantic authority, or policy compliance. `wasRevisionOf` also does not define local supersession policy. | Shared provenance relation vocabulary or a small local analogue fits both projects. No need to adopt RDF/OWL. Public W3C Recommendation; W3C document terms apply. |
| PRE-04 | Why3/Toccata, current release 1.8.2: [project page](https://why3.org/) and [session/replay documentation](https://why3.org/doc/manpages.html), §§5.3–5.5 | Preserve proof obligations separately from proof attempts. Bind an attempt to the task and prover version; mark it obsolete when source, transformation, or prover changes; replay before restoring current status. Preserve old attempts rather than rewriting history. HTML/LaTeX are projections from the session. | A formerly valid attempt is not current after its task changes. A session is not the semantic source of the obligation. A prover result need not be a portable proof object. | Strong DomainSpec lifecycle precedent. CyberAlchemy should consume only owner-approved receipts, not Why3 semantics. Public docs; implementation is LGPL-2.1-only, but no code reuse is proposed. |
| PRE-05 | Rocq project, [current command reference](https://docs.rocq-prover.org/master/refman/proof-engine/vernacular-commands.html), `Print Assumptions`; [project source](https://github.com/rocq-prover/rocq) | A formal-proof record must identify the checked theorem/proof object and expose the axioms, parameters, variables, and unsafe typing assumptions on which it depends. | A displayed “proved” status does not establish axiom-free proof. A test receipt is not a kernel-checkable proof term. | Optional DomainSpec evidence kind where formal proof objects actually exist. Do not make it mandatory for ordinary validators. Public project docs/repository; project license applies to code reuse. |
| PRE-06 | OASIS OSLC Open Project, [RM 2.1 Part 1](https://docs.oasis-open.org/oslc-domains/oslc-rm/v2.1/cs01/part1-requirements-management-spec/oslc-rm-v2.1-cs01-part1-requirements-management-spec.html), §§2.4, 2.9; [Part 2 vocabulary](https://docs.oasis-open.org/oslc-domains/oslc-rm/v2.1/cs01/part2-requirements-management-vocab/oslc-rm-v2.1-cs01-part2-requirements-management-vocab.html), §§2–4 | Give requirements provider-scoped identifiers and typed links such as `trackedBy` and `validatedBy`; preserve subject, relation kind, and target. Machine resources can have HTML/UI presentations without changing identity. | A `validatedBy` link says only that a relationship is asserted; it does not say the referenced test passed, is current, or is authoritative. OSLC explicitly is not a comprehensive RM model. | Useful for DomainSpec traceability and derived crosswalks, not as a replacement registry or server architecture. OASIS permits implementation-oriented derivatives with notices; RF-on-Limited-Terms IPR applies. |
| PRE-07 | W3C Data Shapes WG, stable [SHACL Recommendation](https://www.w3.org/TR/2017/REC-shacl-20170720/), §§3.4–3.6 | Keep validator definition, data input, and validation report distinct and immutable during validation. Report `conforms` plus exact result details such as focus node, path, source shape, value, component, and severity. Treat processor failure separately from non-conformance. | `conforms=true` proves only conformance to the supplied shapes graph. Ill-formed shapes or processor failure are indeterminate, not domain rejection. | Reuse the input/report/failure separation in both projects without requiring RDF. Prefer the stable Recommendation over the newer SHACL 1.2 Working Draft for precedent. |
| PRE-08 | IETF, [RFC 6920](https://www.rfc-editor.org/info/rfc6920/), §§2 and 10 | Exact-byte identity requires digest algorithm, digest length, and value; the application must separately define the bytes hashed. | A matching hash establishes name–data integrity only. It does not establish authority, authorship, confidentiality, semantic truth, or endorsement. | Shared exact-binding field pattern for evidence and source selectors. No requirement to use `ni:` URIs. IETF Trust terms apply to specification text. |
| PRE-09 | in-toto project/CNCF, current [Attestation Framework v1.2](https://github.com/in-toto/attestation/blob/main/spec/README.md), [Statement](https://github.com/in-toto/attestation/blob/main/spec/v1/statement.md), [Envelope](https://github.com/in-toto/attestation/blob/main/spec/v1/envelope.md), [test-result predicate](https://github.com/in-toto/attestation/blob/main/spec/predicates/test-result.md), and [Simple Verification Result](https://github.com/in-toto/attestation/blob/main/spec/predicates/svr.md) | Separate exact subject identity, typed assertion payload, and authentication envelope. Version verifier identity when logic changes; identify policy artifacts and evaluation time. Test records distinguish passed, warned, and failed cases. | A signature authenticates bytes under a trust policy; it does not make the predicate true. SVR explicitly omits reproduction detail, so it is insufficient alone for an exact-binding discharge receipt. | Reuse the layered envelope pattern for both projects; do not import supply-chain semantics. Apache-2.0 licensed. |

### Smallest non-vacuous record model

This is a synthesis from the precedents, not an externally mandated design.

One common envelope:

```text
schema_uri
record_type
owner_namespace
logical_id
version_id
payload_digest { algorithm, value }
authority_kind
visibility
created_at
supersedes_version_id?
source_bindings[] {
  owner_namespace,
  locator,
  selector,
  digest { algorithm, value }
}
relations[] {
  relation_kind,
  target_owner_namespace,
  target_logical_id,
  target_version_id
}
claim_ceiling
typed_payload
```

The minimum non-collapsible payload types are:

1. `claim` — exact proposition, scope, and maximum permitted assertion.
2. `obligation` — the proposition that must be established, its claim reference, discharge rule, and required positive/negative evidence.
3. `predicate` — executable or formal condition, language, and semantic-source reference.
4. `binding` — exact obligation, predicate, fixture/input, runtime, and evaluator bindings.
5. `evidence` — immutable observed artifact or proof object, producer/run identity, exact subjects, environment, and observed outcome.
6. `receipt` — evaluator and version, policy/configuration digests, expected outcome, observed outcome, result, and evidence references.
7. `lifecycle_event` — owner-authorized `opened`, `discharged`, `reopened`, or `killed` transition with exact prior decision and receipt references.

`attestation` is an optional authentication envelope around a record, not semantic authority. A `formal-proof-object` is an evidence kind with checker and assumption closure; “proof status” is a receipt or projection and must not be called a proof object.

### Lifecycle and validation invariants

- `logical_id` is stable within an owner namespace; every changed definition creates a new immutable `version_id`.
- `supersedes` is acyclic and version-exact. Historical versions and receipts remain addressable.
- Current obligation status is derived from authorized lifecycle events, not edited into evidence or inferred from a passing test.
- A source, predicate, binding, evaluator, policy, configuration, or fixture digest change makes the prior discharge non-current and requires a `reopened` event or equivalent fail-closed state.
- A receipt may support discharge but cannot discharge its own obligation.
- Unknown owner namespace, record type, relation kind, authority kind, target version, selector, or digest blocks admission.
- Validator failure is `indeterminate/error`; it must not be normalized to domain rejection or acceptance.
- A human page and cross-project index are generated projections. Each needs a manifest binding generator version and exact catalog digests; neither is canonical authority.
- Visibility is enforced before projection. A shared crosswalk may expose approved locators and claims but must not leak private payloads.
- Every rendered status carries its claim ceiling. Test evidence supports only the bound predicate, fixture, runtime, and evaluator; it does not establish universal proof.

For negative controls, keep two outcomes distinct:

```text
control_kind: negative
expected_domain_outcome: reject
observed_domain_outcome: reject
harness_result: pass
```

A negative control is successful only when the exact invalid fixture is rejected at the expected first validator. Missing source, stale digest, unknown authority kind, validator crash, or unauthorized semantic source are separate blocking/error cases, not interchangeable negative-control successes.

### Topology verdict

`shared contract + owner-specific canonical catalogs + derived crosswalk`: supported.

`single shared semantic registry`: rejected.

`full SACM/GSN/PROV/OSLC adoption`: rejected as unnecessary cargo culting.

External precedent supplies useful invariants for structure, provenance, currentness, validation, integrity, and presentation. DomainSpec must still own DomainSpec meaning; CyberAlchemy must still own its authority and promotion semantics.

<a id="explorer-return-2-beer-cav2"></a>

## Agent 2 — Beer, Stafford — CyberAlchemy v2

{
  "receipt_version": "1.0",
  "action_id": "spawn-0002",
  "dispatch_id": "2026-08-20-domainspec-v2-cav2-proof-obligation-substrate",
  "target": "research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate/dispatch-sheet.json#explorers-agent-1",
  "role": "explorer-cav2",
  "capability": "research",
  "mode": "explore",
  "status": "complete",
  "mutation": {
    "policy": "read-only",
    "writes": [],
    "forbidden_scopes_touched": [],
    "final_status": "No git status entries in the inspected CyberAlchemy v2 authority, ontology, validation, or attestation surfaces.",
    "output_handling": "Returned to parent for persistence at the declared output reference."
  },
  "claim_ceiling": "Current clean tracked CAV2 bytes establish owner routes, non-collapse rules, candidate validation contracts, and a locally executed L1 integrity witness. They do not establish a canonical cross-project proof registry, DomainSpec semantic authority, deterministic authority-kind enforcement, artifact-admission execution, external actor identity, L2 signatures, publication, or promotion.",
  "topology_assessment": {
    "recommended": "One shared structural record contract, two owner-specific catalogs, and generated human/machine crosswalk projections.",
    "verdict": "conditional-pass-with-owner-gate",
    "condition": "The shared contract must remain shape-only and be explicitly ratified or adopted by both the DomainSpec semantic owner and the CAV2 governance owner. CAV2 ownership alone cannot make it govern DomainSpec.",
    "alternatives": [
      {
        "topology": "One cross-project canonical registry",
        "verdict": "reject",
        "reason": "It collapses owner scopes. CAV2 authority does not transfer across sources or owners, and imported DomainSpec meaning remains external unless explicitly adapted."
      },
      {
        "topology": "Two independent registries plus a derived crosswalk",
        "verdict": "authority-correct fallback",
        "reason": "It preserves owners but duplicates record shape and lifecycle mechanics. Use only if the joint structural contract is not ratified."
      },
      {
        "topology": "Shared record contract plus owner-specific catalogs and projections",
        "verdict": "preferred",
        "reason": "A schema can standardize addressability and bindings without deciding truth, ownership, discharge, or promotion. Each catalog retains its own semantic owner."
      }
    ]
  },
  "owner_map": [
    {
      "surface": "DomainSpec proof claims, obligations, predicates, bindings, evaluator meaning, discharge and reopen decisions",
      "owner": "DomainSpec semantic owner",
      "cav2_allowed_role": "External-authority reference, source posture, promotion-boundary documentation, and derived crosswalk only.",
      "proof_status": "owner boundary observed from CAV2 sources; DomainSpec bytes not evaluated by this lane"
    },
    {
      "surface": "CAV2 definitions, authority kinds, owner routes, promotion gates, claim ceiling, public/private policy",
      "owner": "CAV2 definitions, constitution, decision, and authority routes",
      "cav2_allowed_role": "Canonical within declared CAV2 scope after the matching owner route.",
      "proof_status": "observed"
    },
    {
      "surface": "Shared record schema",
      "owner": "Explicit joint or umbrella structural owner",
      "cav2_allowed_role": "Own a CAV2-local adaptation or co-ratify a shape-only contract; cannot self-extend it into DomainSpec semantics.",
      "proof_status": "owner decision missing"
    },
    {
      "surface": "Evidence and execution receipts",
      "owner": "Source, validation, inventory, observability, or runtime owner",
      "cav2_allowed_role": "Support gates and claims within stated scope; never self-promote.",
      "proof_status": "observed"
    },
    {
      "surface": "Crosswalks, indexes, and human documentation",
      "owner": "Projection route plus every referenced source owner",
      "cav2_allowed_role": "Derived, regenerable navigation with exact source bindings.",
      "proof_status": "observed"
    },
    {
      "surface": "Attestation",
      "owner": "Private CAV2 attestation capability",
      "cav2_allowed_role": "Bind a CAV2 governance act to exact canonicalized bytes. Current L1 proves integrity only.",
      "proof_status": "executed locally"
    }
  ],
  "non_collapse_rules": [
    "Schema conformance proves shape, not truth, authority, ownership, promotion, or execution.",
    "A CAV2 canonical artifact is typed/process-born; it is not necessarily authoritative and is not synonymous with canonical source.",
    "Evidence supports an owner decision but cannot replace it.",
    "A receipt records execution and policy results; it does not become the claim, obligation, predicate, binding, or semantic source.",
    "L1 attestation proves content integrity relative to a recorded tuple; it does not prove semantic truth or external actor identity.",
    "A generated crosswalk, index, ontology view, or human page is a projection, not a promotion surface.",
    "CAV2 has no canonical indexed definitions for proof claim, proof obligation, predicate, binding, discharge, receipt, or attestation as the requested cross-project taxonomy. Those terms must remain external references or pass definitions-governance before becoming CAV2 load-bearing vocabulary."
  ],
  "minimum_shared_record_fields": [
    "record_id",
    "record_kind",
    "authority_scope",
    "semantic_owner",
    "authority_surface",
    "source_binding: repository identity, path, structured selector, content digest, source posture",
    "record_version",
    "supersedes_or_reopens",
    "lifecycle_state",
    "status_owner",
    "evidence_bindings with typed relation and evidence scope",
    "receipt_bindings with run identity, policy-source digests, check IDs and observed result",
    "claim_ceiling",
    "residue with failure locus, evidence, owner route and treatment",
    "challenge_route",
    "drift_route",
    "projection_of"
  ],
  "lifecycle_findings": {
    "owned_now": [
      "CAV2-D48 supplies source evidence -> candidate -> owner-routed review -> promoted authority, with stop/demotion.",
      "CAV2-D51 documents authority_state as none | candidate | promoted | demoted; demoted covers withdrawn or superseded authority.",
      "CAV2-D23 requires kind, status, evidence confidence, commitment, provenance, owner, and residue to remain separate.",
      "Artifact-admission receipts define stable schema_version, run_id, check IDs, policy-source SHA-256 digests, verdict and exit code."
    ],
    "missing_or_unresolved": [
      "No complete cross-project version, supersession, reopening, discharge, or killed-state contract exists.",
      "Canonical Kinds says superseded is an edge, but its edge catalog is explicitly in unresolved collision with an existing DomainSpec catalog.",
      "Mutation semantics are unnamed; whether decisions are content-revisable or superseded by a new record remains open.",
      "CAV2-D51 requires artifact_id but specifies no global identifier format.",
      "process_origin is unresolved and its validator is deferred."
    ],
    "required_rule": "Do not infer a shared lifecycle taxonomy. The shared contract may reserve fields, but DomainSpec must own obligation states and CAV2 must owner-gate its local authority-state mapping."
  },
  "validation_findings": [
    {
      "id": "CAV2-VAL-001",
      "finding": "Authority-kind closure is enacted only in review mode. Its deterministic validator is candidate and explicitly not built.",
      "sources": [
        "cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:63-69",
        "cyberAlchemy-v2/validation/authority-kind-closure-validator-SPEC.md:1-13,50-62"
      ],
      "proof_status": "observed"
    },
    {
      "id": "CAV2-VAL-002",
      "finding": "Artifact admission schemas and receipt shapes are candidate contracts; the validator, filesystem checks, harness, CLI and CI are deferred.",
      "sources": [
        "cyberAlchemy-v2/validation/artifact-admission/README.md:1-35,95-126",
        "cyberAlchemy-v2/validation/artifact-admission/receipt.schema.json:5-21,266-363"
      ],
      "proof_status": "observed, not executed"
    },
    {
      "id": "CAV2-VAL-003",
      "finding": "A passing admission receipt is validation evidence, not promotion. Policy source path and SHA-256 are part of the candidate receipt contract.",
      "sources": [
        "cyberAlchemy-v2/validation/artifact-admission/README.md:24-35,95-114",
        "cyberAlchemy-v2/validation/artifact-admission/receipt.schema.json:5-21,316-339"
      ],
      "proof_status": "observed"
    }
  ],
  "attestation_witness": {
    "positive": {
      "source": "cyberAlchemy-v2/authority/decisions/2026-06-24-saturn-domainspec-public-disclosure.md",
      "source_sha256": "f93e39c4a67e5a3fae559d27f2422bb728cf00b8cf3741888fd9a80f946e485b",
      "attestation": "cyberAlchemy-v2/development/attestation-capability/development/specimen/attestation.json",
      "observed_verdict": "valid"
    },
    "negative_control": {
      "mutation": "One content character changed through process substitution; no repository write.",
      "observed_verdict": "tampered",
      "first_stop": "Private L1 verifier",
      "forbidden_effects": [
        "No authority promotion",
        "No semantic-truth claim",
        "No actor-identity claim"
      ]
    },
    "ceiling": "L1 integrity-seal behavior is demonstrated on current bytes. L2 external signature and externally verifiable actor identity remain unbuilt.",
    "status_drift": "The candidate SPEC still contains global intended-not-shipped wording, while the checked-in script and DEMO demonstrate L1. Describe this as a local L1 demonstrator, not a promoted or shipped capability."
  },
  "stale_binding_witnesses": [
    {
      "id": "CAV2-STALE-001",
      "witness": "CAV2-D48 cites CAV2-D34 as Evidence, but current CAV2-D34 is Authority.",
      "sources": [
        "cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:2171-2226",
        "cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:3232-3238"
      ],
      "required_validator_behavior": "Resolve the selector and verify expected ID, term and digest; block projection generation on semantic target mismatch."
    },
    {
      "id": "CAV2-STALE-002",
      "witness": "The active DEFINITION-SCHEMAS backlog labels CAV2-D34..D37 as Constitution, Discipline, Decision and Spec, while the canonical index identifies them as Authority, Provenance, Traceability and Gate.",
      "sources": [
        "cyberAlchemy-v2/authority/definitions/DEFINITION-SCHEMAS.md:45-69",
        "cyberAlchemy-v2/authority/definitions/DEFINITIONS-INDEX.md:42-47"
      ],
      "required_validator_behavior": "Fail schema-registry synchronization before any shared contract treats the registry as current authority."
    },
    {
      "id": "CAV2-STALE-003",
      "witness": "The accepted one-label decision enumerates residue as a canonical kind, while the later candidate Canonical Kinds rules make residue an attribute and omit it from the current seed enumeration.",
      "sources": [
        "cyberAlchemy-v2/authority/decisions/2026-07-13-canonical-kind-one-label.md:41-55,88-103",
        "cyberAlchemy-v2/ontology/canonical-kinds/CANONICAL-KINDS.md:58-90,112-118"
      ],
      "required_validator_behavior": "Treat residue representation as an owner blocker; do not infer file-kind or field semantics."
    }
  ],
  "owner_gates": [
    "Ratify the shared structural contract and its owner; CAV2 alone cannot impose it on DomainSpec.",
    "Decide whether proof/obligation documentation uses existing Spec, Runtime contract, Evidence and Projection kinds or introduces any new kind. An unenumerated authority kind defaults to blocked.",
    "Resolve the Tier-1 residue kind-versus-attribute conflict.",
    "Resolve CAV2-D51 process_origin and whether provenance must be declared or attested.",
    "Define stable version, supersession and reopening semantics before claiming lifecycle completeness.",
    "Repair definition-schema and D48 reference drift before generating canonical documentation from them.",
    "Implement and execute selector, digest, owner-kind, lifecycle and negative-control validators before claiming deterministic enforcement.",
    "Run a boundary scrub before any outward derivative; private DomainSpec validation details and CAV2 attestation mechanisms must not enter public Arcanum."
  ],
  "source_snapshot": [
    {
      "path": "cyberAlchemy-v2/authority/AUTHORITY-MODEL.md",
      "git_blob": "86953ea76dffb7f598b02b329b67456941ccb559",
      "sha256": "8e9d39eb39399cef051b71eb1d37daaad87c2409329151a077e01c5a772b3407",
      "selectors": ["#authority-rule", "#authority-kinds", "#authority-postures", "#narrowest-owner-rule", "#non-collapse-rules"]
    },
    {
      "path": "cyberAlchemy-v2/authority/definitions/DEFINITIONS.md",
      "git_blob": "44e4b72fa00e952c83a59f0ccedef67525d06399",
      "sha256": "b38cb3cd4cb03f3984091a6721af65da9df7fe4838f6a4a12a824b9763a7475c",
      "selectors": ["#cav2-d18-residue", "#cav2-d23-authority-lifecycle-axis", "#cav2-d34-authority", "#cav2-d35-provenance", "#cav2-d36-traceability", "#cav2-d38-claim-proof-bound", "#cav2-d48-authority-promotion-lifecycle", "#cav2-d49-closed-authority-kind-enumeration", "#cav2-d51-canonical-artifact", "#cav2-d56-schema"]
    },
    {
      "path": "cyberAlchemy-v2/authority/definitions/DEFINITION-LOCALIZATION-ROUTE.md",
      "git_blob": "86c300812db896a995f5015974e4d46058bf180",
      "sha256": "8d99484bbd78dc2d2f7548199abcca8cc2f7b2e9f4f22d33b1fc529db20bb970",
      "selectors": ["#layers", "#rule", "#boundary"]
    },
    {
      "path": "cyberAlchemy-v2/authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md",
      "git_blob": "f9ae7f01882138004782ba9d7dc895955c12f4d8",
      "sha256": "ba1339cf6f2ee6c4e2bf2bbf2f82d2fe90e497e7b32507d72dc6d5d4620339d4",
      "selectors": ["#cav2-c2-authority-layer-separation", "#cav2-c11-import-before-promotion", "#cav2-c14-governed-artifact-tree-interface", "#cav2-c18-artifact-admission-before-mutation"]
    },
    {
      "path": "cyberAlchemy-v2/ontology/canonical-kinds/CANONICAL-KINDS.md",
      "git_blob": "d6257688a15e59926399db259444ad0733ea11b4",
      "sha256": "6df7ee155475d6d34e8394ef250293c4cec3a49daa9945141318b8251aa6b3f3",
      "selectors": ["#enumeration-seed--candidate", "#rules", "#instance-contract-frontmatter", "#edges", "#open-questions"]
    },
    {
      "path": "cyberAlchemy-v2/validation/artifact-admission/receipt.schema.json",
      "git_blob": "e908bbe4235958ce4b00050db013a0652d69eb41",
      "sha256": "ffde1ba68b8e025285cc291faf6597025fca023802d2920f2f47be8258a51c8a"
    },
    {
      "path": "cyberAlchemy-v2/development/attestation-capability/SPEC.md",
      "git_blob": "13a4384b6132dc6825718ed1494f13efdb416c56",
      "sha256": "07ab5a84e60261c9fb8d2bd9baadf0d53f649cbaa3d5abefff32da4bec30fca2",
      "selectors": ["#the-capability-contract", "#the-upgrade-ladder-honest-about-cost", "#boundary--internal-moat-adjacent"]
    },
    {
      "path": "cyberAlchemy-v2/development/attestation-capability/development/specimen/DEMO.md",
      "git_blob": "9ec70865c60914e6715134ebdbea65d2a605a6ea",
      "sha256": "b4df95c7cc0840732588160719cd9e6622e99508bac9c968b4ddfcb538480d85",
      "selectors": ["#discriminating-self-test-run-via-python3-attestpy-verify-artifact-claimed", "#verdict"]
    },
    {
      "path": "cyberAlchemy-v2/authority/boundaries.md",
      "git_blob": "93761a37fabe9e73a8d41cf6510c6967c1555c29",
      "sha256": "c84aa3d66fe82137a50c9e6a3059f5e5300b51dc638f5e48fa1c00311a5cdf63",
      "selectors": ["#public-and-private", "#source-and-read-model", "#generated-and-canonical", "#research-and-specification"]
    }
  ]
}
