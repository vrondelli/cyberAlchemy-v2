# Learning Graph And Next-Route Guide Research Strategy

Status: `confirmation-readiness candidate`
Dispatch type: `research`
Evidence contract: `exact-binding`
Authority effect: `none`

## P1 Trigger Decision

Dispatch is required. The result must synthesize at least three independent
corpora and lenses: the primary DomainSpec implementation-conformance ontology
and HTML, current cyberAlchemy-v2 ontology experiment families and their
authority/runtime evidence, and learner-question/comprehension evidence. The raw
source volume is large, the lanes can proceed independently, and the proposed
semantics need adversarial checks before writing.

## Intended Result

The research asks for the smallest source-bound learning graph that helps a user:

1. understand one ontology concept in its actual context;
2. name what remains confusing or unknown;
3. formulate a more discriminating next question;
4. see the evidence and owner behind the answer;
5. choose, but not confirm or execute, the next governed route.

The final `findings.md` is also the detailed introductory guide. Its writer uses
Whisper's `product_research_blueprint` preset and includes candidate node and
relation records, one positive learner witness, one abstention witness, and a
verification plan.

## Groups And Subagents

| Group | Execution | Anti-bias purpose | Agents and outputs |
| --- | --- | --- | --- |
| `explorers` | three lanes in parallel | Primary executable target vs cross-experiment ownership/runtime evidence vs learner-centered human-view evidence | **Hewitt, Carl** — exact DomainSpec JSON/HTML anatomy and RuleImplementation trace. **Spivak, David** — current experiment-root/owner/proof-ceiling manifest. **Halford, Graeme** — learner confusion, question, focus-scene, comprehension, and route-choice model. |
| `synthesizer` | after all explorers | Reconcile without collapsing ontology, evidence, learner state, workflow, or authority | **Bateson, Gregory** — candidate node/relation model, projection path, witnesses, source trace, and unresolved alternatives. |
| `reviewers` | three lanes in parallel after synthesis, with one bounded zig-zag | Precedent vs non-vacuity vs definitional/scope non-collapse | **Hacking, Ian** — existing-owner and novelty classification. **Popper, Karl** — finite positive/mutant witness and KILL pressure. **Wittgenstein, Ludwig** — type/relation distinction and misuse pressure. |
| `writer` | after exact-binding evidence closure | Turn the accepted research into an introductory guide without losing proof boundaries | **Senge, Peter** — Whisper `product_research_blueprint` author of `findings.md` only. |
| `auditor` | after writer | Independent exact-binding, guide, authority, and claim-ceiling audit | **Brandenburg, Martin** — ACCEPT or one bounded writer revision. |

## Dependency Flow

```text
explorers (parallel)
  -> synthesizer
  <-> reviewers (parallel; zig-zag cap 1)
  -> exact-binding evidence closure
  -> Whisper writer
  -> auditor
  -> parent final approval
```

One conditional synthesizer-to-explorers feedback edge may repair missing source
bindings. One auditor-to-writer feedback edge may repair supported wording or
structure. Missing source evidence cannot be repaired by the writer.

## Inventory Preflight

- Machine index: `.arcanum/inventory/index.json`
- Validation: `lookup_readiness=ready`, 277 entries, zero failures, 133 tag
  warnings, partial source coverage, Inventory read-model boundary only.
- Selected evidence: Inventory-to-ontology promotion ladder; DomainSpec
  implementation-structure research; IOLM workable-example route; Body War
  novice-comprehension and graph-UI reviews; Ontological Way Clear result; simple
  ontology presentation corpus.
- Excluded/deferred: semantic-hierarchy and categorical/DNG towers for the first
  witness; imported historical house-project material; session/staged duplicates
  unless a current owner artifact cites the exact proof.
- Design consequence: the first candidate is a projection/composition test, not a
  new canonical ontology. Every load-bearing row needs a hash and JSON Pointer,
  heading, DOM selector, or receipt selector.

The full non-authority packet is in `strategy-inventory-packet.json`.

## Gates And Ledger State

- Live research schema: `0.8.0`.
- Candidate sheet: `dispatch-sheet.json`; it intentionally omits
  `evidence_binding` before confirmation.
- Confirmation-readiness validator: `pass`; schema `0.8.0`; ledger mutation
  `none`; sheet SHA-256
  `f4b08fedd0dd0c6fdecd420bb36b4a3f8a9d2765a55558dce848467f550612de`.
- Dispatch Spec route validation: `pass`.
- Check-tension: `PASS/PASS`; both independent agents recomputed the admitted
  digest and passed tests 1-5 with no apontamentos.
- Human confirmation: required only after both validators and `PASS/PASS`.
- Registration: not started; the append-only dispatch ledger must not change
  before confirmation.
- Closeout: exactly one dispatch row and one close row if confirmed and run;
  every agent must be joined and closed, with result Inventory and observability
  updates after close.

## Boundaries

- Read-only research except `findings.md`, strategist-owned `research.md`, and
  bounded receipts in this working folder after confirmation.
- No edits to the primary ontology, HTML, beginner guide, validators, profiles,
  fixtures, cyberAlchemy-v2 ontology owners, Arcanum, product code, canonical
  definitions, or Git.
- Candidate node/relation prose does not promote ontology meaning.
- A route recommendation is not confirmation, registration, execution,
  promotion, publication, release, deployment, or production readiness.
- Browser checks may validate rendering and interaction, not human comprehension.

## Next Human Action

Reply exactly `confirmed` to authorize registration and execution of the frozen
sheet digest shown above. Any other reply is discussion, revision, or decline;
it is not confirmation.
