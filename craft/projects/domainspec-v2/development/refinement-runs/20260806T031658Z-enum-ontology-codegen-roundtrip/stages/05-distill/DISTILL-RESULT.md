---
artifact_kind: distill-result
mode: tournament
status: pass
authority_effect: none
---

# Distill Result — Smallest Coherent Architecture Realization Unit

## Intent and budget

- Seed: add ontology-driven TypeScript Enum realization while preserving the
  BTE obligation-to-replay discipline in architecture terms.
- Target context: one DomainSpec v2 prototype, first TypeScript, then already
  planned Python/Rust and later meta-types.
- Output: one selected architecture unit and explicit elimination conditions
  for alternative compiler boundaries.
- Optimization goal: smallest independently provable unit without
  generator/evaluator self-authorship or TypeScript leakage into portable
  meaning.
- Mode: Tournament; three proposal tracks, two recursive rounds, one pitch-off.

## Discovery baseline

Current evidence supplies the TypeScript runtime provider, active profile,
direct-source adapter, fixture denominator, deterministic runner, and BTE proof
object precedent. It does not supply an authoritative Enum instance,
realization compiler, independent architecture catalogue/evaluator, compiled
generated-source witness, or reconstructive replay.

## Round 1 — proposals and Balancer objections

### Track A — direct ontology-to-TypeScript compiler

Proposer: normalize an owner-frozen Enum definition inside the TypeScript
backend and emit the admitted `defineEnum` form directly.

Evidence/assumption: shortest first implementation; one language is active.

Balancer objections:

- boundary: portable normalization and TypeScript emission share one owner;
- evolution: Python/Rust would duplicate semantic normalization;
- proof: target binding and semantic identity can become inseparable;
- migration: extracting shared behavior later changes evidence contracts.

Disposition: reject for the confirmed multi-language target. Re-admit only if
Python/Rust realization is explicitly abandoned and the independent catalogue
can still bind definition semantics without importing the backend.

### Track B — portable minimal IR plus target binding

Proposer: normalize canonical semantic identity into a minimal
`EnumRealizationIR/v1`, keep all module/export/identifier/import choices in a
separate `TypeScriptTargetBinding/v1`, and let a TypeScript emitter consume
both.

Evidence/assumption: stable member identity/value preservation is shared by all
three languages; target naming and imports are not.

Balancer objections:

- complexity: an IR can become a second ontology;
- authority: evaluator might treat the IR as expected truth;
- scope: composition and generic compiler plugins could be smuggled in early;
- drift: definition, IR, binding, and source add more handles.

Disposition: revise. Make the IR derived and non-authoritative, freeze expected
obligations from the canonical definition rather than the IR, keep the first
IR direct-only, forbid syntax/import/output fields, and bind every handle in a
GenerationReceipt and replay.

### Track C — TypeScript-specific IR behind a stable compiler interface

Proposer: define a TypeScript-owned IR now and extract shared fields only after
Python/Rust implementations exist.

Evidence/assumption: avoids speculative universality.

Balancer objections:

- duplication: stable member identity/value normalization would be repeated;
- authority: target member names can masquerade as semantic member identity;
- migration: later portable extraction changes output and receipt schemas;
- recomposition: current cross-language Work Pack already supplies concrete
  evolution pressure.

Disposition: reject. Re-admit only if the portable IR cannot remain smaller
than the canonical definition or if later languages demonstrate incompatible
normalization semantics.

## Round 2 — repaired Track B

### Minimal `EnumRealizationIR/v1`

Required fields only:

```text
schema_version
definition_ref {definition_id, version, sha256}
concept_id
members[] {member_id, semantic_value}
composition_kind = direct
order_semantics = none
ir_sha256
authority_effect = none
```

Rules:

- members are nonempty and unique by both `member_id` and `semantic_value`;
- canonical serialization sorts by `member_id` because direct Enum order has no
  semantics in the active profile;
- every IR member traces exactly once to a canonical member;
- no module path, filename, export name, TypeScript identifier, provider import,
  formatting choice, source span, or proof verdict appears in the IR;
- the IR is derived evidence and cannot be the evaluator's expected oracle.

### `TypeScriptTargetBinding/v1`

Target-owned fields:

```text
definition_ref
language = typescript
module_path
export_name
type_name
member_names {member_id -> TypeScript identifier}
provider_module_specifier
protocol_id
profile_ref
provider_ref
emitter_version/config_digest
format_version
```

The member-name mapping is exact and injective. A later naming-policy owner may
derive it, but the prototype requires an owner-frozen binding so that the
generator does not invent semantic identity.

### Expected catalogue independence

The architecture catalogue is built and frozen from the canonical definition,
portable contracts, and target profile by an owner distinct from the
realization compiler. Full obligation payloads—not only keys—are digest-bound.
The evaluator consumes the frozen catalogue plus raw build/observation handles;
it does not consume the IR as expectation.

## Selected smallest coherent unit

`SCU-ARCH-ENUM-REALIZE-001`: one direct `OrderStatus` member-preservation
obligation through the complete architecture proof chain.

Inputs:

- owner-frozen `CanonicalEnumDefinition/v1` with two members;
- independently frozen catalogue member `enum.member-bijection@1`;
- minimal `EnumRealizationIR/v1`;
- owner-frozen `TypeScriptTargetBinding/v1`;
- exact active TypeScript profile/provider/compiler/emitter/adapter/evaluator
  handles.

Positive path:

1. Exact-join the frozen obligation and current handles.
2. Materialize one pre-run `ArchitectureRealizationCase/v1`.
3. Normalize the definition into the minimal IR.
4. Emit deterministic `OrderStatus` TypeScript and a source manifest.
5. Compile with pinned `tsc`; run type and runtime freeze witnesses.
6. Observe real generated source through the adapter.
7. Evaluate the member-ID/value bijection independently.
8. Emit a bounded GenerationReceipt and ArchitectureProofReceipt.
9. Reconstruct the proof in a separate isolated replay entry point.

Primary mutation:

- derive a child from the exact green generated source;
- remove the emitted `Paid` member only;
- require generation and compilation to remain green;
- require independent evaluation to fail only with
  `ARCH_ENUM_MEMBER_MISSING` for `status.paid`;
- bind parent, child, and delta digests; and
- require replay to recompute the kill.

## Closure

Responsibility: prove that one canonical direct Enum member set survives one
complete architecture realization without self-authored expectations.

It cannot be split after execution begins because generation alone, compilation
alone, observation alone, mutation death alone, or a receipt alone cannot
establish the selected proof claim. Planning may and should split prerequisite
contract publication, independent red freeze, compiler surfaces, and proof
execution into ordered SWUs.

## Recomposition

```text
one direct member-preservation proof unit
  -> all direct Enum obligation families
  -> composition observation and proof
  -> complete TypeScript Enum breadth
  -> Python and Rust emitters against the same portable IR/catalogue contract
  -> cross-language semantic parity
  -> later meta-type realization families
```

The current TypeScript provider/adapter/runner become bounded implementation
dependencies or migration evidence; they are not silently relabeled as the new
independent proof.

## Technique trace

- abstraction guard: selected one obligation, not a universal compiler;
- tournament: three alternatives compared with explicit re-admission rules;
- Pareto gate: Track B dominates on proof independence and confirmed evolution
  while accepting a small handle-cost increase;
- recomposition proof: mechanism-to-breadth path explicit;
- requisite variety: portable IR justified by three confirmed language targets;
- boundary-object check: IR contains shared semantics only, target binding owns
  syntax and naming;
- premortem: likely failure is a passing round trip that compares generator
  output to generator-authored expectations; guardrail is independent catalogue
  plus forbidden-import evaluator and isolated replay;
- cycle guard: stopped after the second round because further alternatives
  renamed the same direct-versus-portable tension without new evidence.

## Frame expiry

Re-run Distill if Python/Rust realization is removed, Enum order becomes
semantic, canonical member identity changes, composition enters the first
proof unit, or the independent catalogue/evaluator ownership model changes.

## Verdict and navigation

- Verdict: pass.
- Start with: `SELECTED-UNIT.json`.
- Next: Invoke Design must express the complete component/import/authority
  contracts and planned witnesses.
- Deferred: composition, full Enum breadth, other languages, plugin hosts,
  later meta-types, promotion, publication, and release.
- Telemetry: not configured; evidence emission is complete through persisted
  stage artifacts and receipt.

