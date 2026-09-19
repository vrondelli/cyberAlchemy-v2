# Glossary Consistency — @2 Refresh Successor

## Result

Status: pass for candidate authoring; no promotion

| Term | Define use | Design use | Consistency result |
| --- | --- | --- | --- |
| FormalClaim | exact statement plus selected logic semantics | semantic source payload | consistent |
| logic-semantics profile | interpretation contract, FOL one family | source-owned profile binding | consistent |
| `executable_profile` | assessment-only | assessment/projection-only | consistent; explicitly forbidden in source |
| `formalizes` | FormalClaim to BusinessMeaning | same canonical direction | consistent |
| `derived_from` | ProofObligation to FormalClaim | same canonical direction | consistent |
| executable projection | preservation- and boundary-scoped | exact projection binding | consistent |
| DS-SFOL authority migration | future projection from one FormalClaim | planned migration contract | consistent; unapplied |
| EVF evidence handle | bounded immutable evidence join | same, with exact identity/currentness/ceiling fields | consistent; absent |
| provider | owns native semantics | separate from adapter/factory/EVF | consistent |
| theorem-provider lane | separately owned proof evidence | distinct request/receipt family | consistent; absent |
| `sat` / `unsat` | bounded encoded-query outcomes | candidate model/no-model evidence only | consistent |
| capability state | current/design/planned/absent axes | explicit state table | consistent |

## Collision checks

- “FormalClaim owns formal logic” is narrowed to “FormalClaim owns the selected
  logic-semantics profile”; no all-logic-is-FOL collapse remains.
- The pasted source-level `executable_profile` proposal is rejected rather than
  silently accepted.
- DS-SFOL “canonical node `body.logic`” is retained only as current design
  evidence and future projection transport, not a competing @2 authority.
- EVF “formal obligation” remains an evidence-chain artifact and does not
  replace the ontology ProofObligation owner contract.
- “Proof” in EVF's `claim <= proof` rule is evidence-ceiling language; theorem
  proof remains a separately typed provider lane.

No canonical glossary, definition, ontology, or Inventory bytes change.
