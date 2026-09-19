# Checked composition boundary

Date: 2026-09-09. DSR-011 prerequisite within PCR-06 product construction.
Result: **PASS for this non-executing compiler primitive**.
The full working-CLI objective remains active; authority effect is none.

## Purpose and selected meaning

The current compiler carries three related but different representations:

| Representation | Authoritative input | Preserved meaning |
| --- | --- | --- |
| Domain graph | Registered checked graph relationships | Existing domain relation, endpoints, scope and source evidence |
| Composition-reference graph | Checked project-composition ontology | Composition-local names and reference roles, qualified by composition identity |
| Value contracts | Checked typed core and declarative-function contracts | Explicit inputs, expressions, call arguments, field mappings, defaults and results |

Only an authored `core_bindings` entry connects a composition-local name and
property map to a domain selector. Matching labels or ontology strings are not
implicit connections. `maps-to`, `maps-from`, `calls` and `depends-on` remain
local reference roles; none becomes a new domain relationship.

The fixture intentionally keeps an existing settlement Operation and its lawful
Calculation relationship separate from the function behavior:

```text
Domain:       Total --calculates--> Settle
References:   Result --calls--> Total
              Result --calls--> Emit
Values:       Emit.computed <- Total(amount = uint64(input.value))
```

The mapper formats its supplied argument. It does not secretly calculate the
total. Two call references do not establish two Calculation evaluations.
Removing the required domain edge is rejected by the existing compiler even
though the local Calculation call remains. This unit does not fabricate a
business Operation to make an otherwise invalid source pass.

## Implementation

`compileCompositionBoundary` in
[`composition-boundary.ts`](../../../impl/cli/src/input/composition-boundary.ts)
accepts a registered in-process checked project graph, an exact graph-digest
selection and the pinned candidate descriptor. It returns:

- unchanged domain identities and relationships with source-manifest evidence;
- composition-qualified local identities and references, retaining authored
  schema, source format and source locations;
- original typed core and declarative-function contracts, preserving ordered
  argument/expression structures without inventing an evaluation order;
- explicit core bridges and property-name mappings;
- coverage counts, a visible list of untyped domain nodes, the source
  certificate and a deterministic boundary digest.

The returned packet is deeply immutable. The in-process
`assertCompiledCompositionBoundary` rejects fabricated lookalikes and cloned
packets, just as input graph registration remains distinct from a JSON shape.
Source files are not reread; removed or relocated source paths do not invalidate
an already checked snapshot. No generated behavior is changed.

The [contract](../contracts/composition-boundary.json) and
[agent-facing ontology scaffold](../ontology/composition-candidate.json) are
candidate construction artifacts. They reuse DSR-006's selected distinctions
and do not amend canonical definitions, signatures, profile admission or owner
decisions.

## Validation and evidence ceiling

- Focused boundary suite: **8/8 PASS**, no skips.
- Five-suite regression: **42/42 PASS**, zero failures or skips, **51.07 seconds**.
  Suites: composition boundary, project composition, project model, checked
  field adapter and structured Rule values.
- CLI typecheck and frozen catalog/relationship/integration-profile checks:
  **PASS**.

The regression includes native Rust composition compilation, existing source
and snapshot build/verify paths, generated behavior and the structured Rule
observer/mutation tests. The new fixture executes the already generated
composition with an explicit Calculation provider and observes one Calculation
evaluation and the expected mapped output. The boundary projection itself
executes neither the provider nor any application effect.

Negative tests reject source-role substitution, missing/forged core bindings,
duplicate references, false ontology admission, a missing required domain edge,
forged checked snapshots, stale selection and accessor-backed options.
Relocation, input immutability and source-scoped identity are tested separately.
The current project profile allows one function composition; identity isolation
is tested across separately checked compositions without widening that profile.

This is a checked-source projection, **not a new dataflow type checker**. Keeping
an existing typed contract does not prove additional operand compatibility,
formal correctness, runtime counts, canonical permission or full generated
metatype conformance. Existing compiler limitations remain explicit.

## Exact source identities

| Source | SHA-256 |
| --- | --- |
| `impl/cli/src/input/composition-boundary.ts` | `f8a94948939772a6d6e119207d888fcaa70a05bd4fcedfd91369b7cf771dbb86` |
| `impl/cli/test/input/composition-boundary.test.ts` | `5fb0219bad737b6793a09c9998a7c392a1dc8974ec5ce7a2705d722e1789fbfa` |
| `development/reconciliation-v1/contracts/composition-boundary.json` | `2f11a5a0a33befaf6e074c389f1231d1de3d85abb2690302ac163cbfffb88fde` |
| `development/reconciliation-v1/ontology/composition-candidate.json` | `f9bb9c4087c7642c16203f2f60ce5eb0721ac501373039dca307d0dc89c33187` |

Unchanged dependencies:

| Source | SHA-256 |
| --- | --- |
| `impl/cli/src/input/project-model.ts` | `a5884b5a569ba9f6f442833415ada19dbbd55b9fba158c38b04a7a47455dd280` |
| `impl/cli/src/input/project-composition.ts` | `b2a31e997d4e45d2c3112426730ed2e79f3f254fdc4732e1d90ca00f5e4cc2d7` |
| `impl/cli/src/input/composition-ontology.ts` | `da3b174665713270991c0ce9a0cb5bed0acf043baee469fc153436903544a71f` |
| `impl/cli/src/typed-backend/contracts.ts` | `c27e5f34c29a11706e7b43bf8c50808dd576993888d8d625f8054d256d971307` |
| `impl/cli/src/typed-backend/declarative-function.ts` | `7f667cde8ba1053e10df1bab610a55754d4fc6ab908f8d9e0895c235fff9d9bc` |

## Task-session record

Context-builder selected the current CLI completion ledger, DSR-011/014
obligations, DSR-006 semantic review, typed contracts, graph certificate and
composition compiler/reference-validation selectors, plus their existing tests.
The seven-file write envelope contains the new module, tests, descriptor,
scaffold, this report and two progress ledgers. No historical receipts or parent
work-item status fields were relabeled.

Local execution, no adapter handoff or subagents. Existing user construction
authorization applies. ARE classified the exact mutation as an admissible
consequential option with no additional owner gate; no operational authority was
granted. No blocker-level decision was needed. Experiment harness is not
applicable. The preceding 217-test Rule/factory result remains historical
evidence for its unchanged files; it is not presented as a newly rerun aggregate.

## Remaining work

Next, implement the remaining pure-function generators using the preserved
source contracts and explicit argument boundaries. Standalone Calculation
source admission, broader mapper inputs, Rule-reusing Policy authoring,
transition triggers/effects and workflow occurrence identity still need their
respective DSR-013..017 work; this projection does not silently resolve them.

The full PCR-06 matrix, shared public entry points, Python/Rust generation
parity, commerce composition, compatibility and clean installation are not
complete. No public default, release, acceptance or publication state changed.
