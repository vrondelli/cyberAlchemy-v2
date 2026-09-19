---
decision_id: DEC-GCP-001
proposal_revision: R1
status: selected
target: SWU-GCP-001
semantic_owner: user
runtime_admission_owner: task-session
decision_gate: pass
proposal_only: false
canonical_target_on_apply: projects/domainspec-v2/development/evolvable-validation-framework/decisions/2026-07-20-key-and-door-formal-source.md
current_preimage_sha256: a4e762ab00984ee0f17f85795d4172977cd1a191c515b58cd32690c6c81b955b
---

# Decision R1: EVF-Local Machine Capsule Selected

## Why The Old Decision Is Insufficient

The current decision recommends Markdown `operations.md`. The accepted later review establishes that Markdown, fixtures, validation-owned obligations, generated artifacts, tests, results, and receipts cannot author domain semantics. A second hidden choice also remains: no real `UnlockDoor` runtime target currently exists.

One later Task Session can be one-shot only if the owner selects a fully instantiated semantic-source bundle now and Task Session can deterministically admit the bundle's already-specified runtime/material contract without asking another product question.

## Authority Split

- The semantic owner selects the machine semantic source and its claim ceiling.
- The selected option completely specifies its runtime candidate so no product choice remains.
- Task Session separately admits or blocks the exact runtime/material target, current baselines, write scope, validation surface, and effect immediately before mutation.
- Neither selection nor Task Session admission changes canonical relationship/profile/release/publication authority.

## Option A — EVF-Local Machine Capsule (Recommended)

### Semantic source

- Source: `development/evolvable-validation-framework/semantic-source/key-door-predicate.v1.json`
- Validating schema: `development/evolvable-validation-framework/semantic-source/key-door-predicate.v1.schema.json`
- Source ID: `evf.key-door.predicate-source.v1`
- Predicate ID: `evf.key-door.has-key.v1`
- Exact AST: Boolean equality `variable(has_key) == literal(true)`
- Claim: owner-admitted semantics for this EVF-local proof only; not a shared Rule/profile or release source

### Expected-free input and independent evidence

- Fixture input: `development/evolvable-validation-framework/fixtures/SWU-GCP-001/key-door-input.v1.json`
- Fixture schema: `development/evolvable-validation-framework/fixtures/SWU-GCP-001/key-door-input.v1.schema.json`
- Exact cases, in order: `has-key-locked` with `has_key:true`; `no-key-locked-control` with `has_key:false`; both call the locked-door-only runtime contract with `door_locked:true`.
- No expected output is allowed in fixture bytes.
- Exact binding contract and schema: `development/evolvable-validation-framework/fixtures/SWU-GCP-001/key-door-binding.v1.json` and `.schema.json`; the binding pins relationship, raw-source, graph, manifest, predicate, fixture, runtime-contract, and O_spec refs. The actual runtime-module digest is added by Task Session material reconciliation before execution.
- Validation-owned O_spec: `development/evolvable-validation-framework/contracts/key-door-obligations.v1.json`, validated by its own schema and carrying exactly one obligation ID—not predicate authority.

### Runtime candidate

- Planned create: `impl/test-derivation-engine/src/minted-project/fixtures/key-door-runtime.ts`
- Exact runtime contract and schema: `development/evolvable-validation-framework/contracts/key-door-runtime.v1.json` and `.schema.json`
- Adapter ID/version: `evf.key-door.runtime-adapter.v1` / `1`
- Export: `attemptUnlock`
- Input: `{ has_key: boolean; door_locked: true }`; the proof makes no claim about already-unlocked inputs
- Output: `{ status: "unlocked" | "denied"; door_locked: boolean }`
- Pure result: true/locked -> exact `unlocked/false`; false/locked -> exact `denied/true`; no I/O, clock, random, filesystem, network, or external effects
- Output guard: reject every other shape or status/state pair with `RUNTIME_OUTPUT_INVALID` before projection
- Result projection: `status === "unlocked" && door_locked === false`
- Expected result source: direct independent evaluation of the typed predicate against fixture variables, never runtime output
- Claim: harness-only causal proof; not an application or production implementation

### Execution proof cardinality

- Exactly one generated Vitest test ID: `evf.s1.generated-test.has-key-unlock-door.v1`.
- Exactly one joined child test-result envelope ID: `evf.s1.child-result.has-key-unlock-door.v1`.
- Exactly two ordered runtime calls/observations inside that one test: `has-key-locked`, then `no-key-locked-control`.
- Exactly one aggregate assertion ID: `evf.s1.aggregate.has-key-unlock-door.v1`, a Vitest deep-equality check of the observed Boolean vector against the independently evaluated expected vector after both output-transition guards pass.
- `T_gen=1` counts the generated test ID and `E_run=1` counts the joined child-result envelope ID; neither counts runtime calls.

### Exact conditional postimages

If and only if the owner selects Option A, selection binds these proposal bytes without semantic editing. Schema validation checks form and never grants authority.

| Target class | Proposal postimage SHA-256 | Size |
| --- | --- | ---: |
| predicate schema | `b3705e42c3570f4aeb6ba2a2bd128ae5510fd3c583d074b1f3811b33c14eae33` | 2790 |
| predicate source | `1e8d49d55c463e98d012775f6d39b79d50d50faaaffbf2930528811b073fc94b` | 729 |
| input schema | `87be8ea1d87ac801f260b68279953568f046ff126747d8a6cbb3ef7b39989416` | 2798 |
| expected-free input | `6e6e32637c9492b084b39ee3209b1c2957c74ac91a919144125553321574f668` | 526 |
| binding schema | `d636dd8d540dcd8eee15303ef16ccce59bc88bd9daf562376de4c0a91edf112f` | 2817 |
| binding contract | `ae49a8b33aa3b1c7b20691252e41461769762ea6bae77c4585b182c8d08e0a08` | 2949 |
| runtime schema | `9e387376506669d5f3367675f49e85abfc8ce23534fc5ddeb4839a19c25e7c91` | 3462 |
| runtime contract | `40c9f27244dc7bfe4e955f595ae4924a442c8948dc43830ca57c8de998fb861f` | 1787 |
| O_spec schema | `2ef832ab1c8446a2d22b68133dc27f4f5eeb93e1b0b013e4194c554aa0d93f11` | 1225 |
| O_spec | `0abb0901bb8ac659e1d26ec2611e5926a74fede5f35bba27ee4de99de354af62` | 575 |
| receipt schema | `d52e86e7604bf8f041edb33eeec9dfc5838238940b53508abb8f68e42be834ee` | 8395 |

The exact target-to-postimage mapping is machine-bound by `target-inventory.candidate-a.json`. Invoke Refresh may copy those accepted bytes to absent canonical targets; Task Session may reconcile and implement the exact runtime contract, but neither owner may author or vary the selected predicate, fixture cases, binding identity, runtime behavior contract, or O_spec denominator.

### Trade-offs

- Benefit: narrowest reversible machine-source boundary; clear source/evidence/runtime separation; no shared minted Rule schema/compiler change.
- Cost/risk: proves the EVF-local adapter and causal chain only. Later work still decides whether predicates belong in general Rule sources.
- Speed/complexity: smallest target set and lowest current dirty-overlap risk.
- Maintenance: one explicit local source adapter to retire or generalize after L1 evidence.

## Option B — Shared Minted Rule Predicate + Same Bounded Runtime (Wider Refresh Route)

### Semantic source

- Extend `impl/spec/minted-project/formations/rule-body.schema.json` with the same typed equality AST.
- Author the predicate in the existing `has-key-rule.json` Rule source.
- Preserve predicate lineage through minted schema validation, compiler, generated graph/source manifest, and verifier.

### Readiness classification

Option B is intentionally **not one-shot-ready from this Refine result**. It would reuse the Option A expected-free input, bounded runtime behavior, evaluator, and non-admitting receipt ceiling, but its shared Rule-schema/compiler/source postimages and regenerated expected outputs are not authored or digest-bound here. Selecting B routes to a separate Refine/Invoke Refresh package and independent review; it never routes directly to Task Session.

### Trade-offs

- Benefit: predicate travels with the Rule machine source and creates a more general evolution seam.
- Cost/risk: widens scope into shared formation/schema/compiler/fixture/generated-view surfaces and requires a larger material inventory and review.
- Speed/complexity: slower and more conflict-prone; current L0 evidence does not require the shared generalization.
- Maintenance: fewer local adapters later if the generalized contract survives broader validation.

## Option C — Preserve The Honest Typed Block

Keep all current semantic/runtime sources unchanged. `verify:evf-s1` must return nonzero with `{ "status": "blocked", "code": "FORMAL_PREDICATE_MISSING" }` and emit no positive receipt.

- Benefit: no semantic assumption or shared mutation.
- Cost/risk: `SWU-GCP-001` cannot execute to completion.
- Use when: neither Option A nor B has acceptable authority/scope.

## Recommendation

Choose **Option A**. It is the smallest machine-authored, contract-validated, reversible source/runtime capsule that can prove the L0 causal chain without committing DomainSpec to shared Rule-schema evolution. Its narrow claim and separate Task Session admission prevent local proof evidence from becoming application, authority, release, or production evidence.

## Decision Record

- Selected option: **Option A — EVF-Local Machine Capsule**
- Decision handle: `DEC-GCP-001-R1:option-a`
- Source of decision: direct user selection recorded by Invoke Refresh on 2026-08-20
- Consequence class: consequential semantic/scope choice; never auto-select
- Reversibility: Option A high, Option B medium, Option C high but non-closing
- Selection consequence: the exact owner-material and planning package was applied only through its separate approval gate; an independent reviewer must now accept all exact applied bytes before Implementation Readiness may classify the route
- After selecting B: reroute to a wider exact-postimage Refine/Invoke Refresh; do not reuse the Candidate A execution entry
- Lifecycle note: selection alone did not authorize mutation; this canonical decision postimage may exist only through an exact apply receipt. Remaining post-apply blockers are fresh independent applied-byte review, unchanged-entry classification, and Task Session live baseline/runtime admission.
