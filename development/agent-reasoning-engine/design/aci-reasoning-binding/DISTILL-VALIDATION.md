# Distill validation — ACI reasoning binding

Verdict: **PASS for plan authoring — external target-lifecycle residue remains**

## Coherent unit

The smallest unit is one ownership-and-record mapping covering confirmed
dispatch, command/event journal, semantic receipt, Work Bus publication,
effect intent, artifact bytes, replay, and provenance. Splitting one mapping out
would leave an authority gap that could create a second writer or translate a
semantic result into permission.

## Split pressure

- Implementation belongs in later SWUs and is excluded.
- ACI, Bus, ACP, and APT lifecycle promotion belongs to their external owners.
- Semantic evaluator changes are unnecessary for this binding.
- Glossary synchronization is a separate Invoke define/refresh action.
- The A/B/C/D disposition is closed by option A; plan authoring must preserve its claim ceiling.

## Recomposition proof

If option A is selected, the mapping recomposes by keeping the evaluator pure
and placing an ACI-subordinate adapter around it after external conformance
receipts pass. If option B is selected, the same boundaries support isolated
local evidence but intentionally do not recompose into ACI compatibility. If D
is selected, the evaluator remains a standalone semantic library.

## Plan-readiness gaps

| Gap | Owner | Effect |
|---|---|---|
| binding disposition | `G-ARE-ACI-BINDING` human/architecture owner | resolved by option A; admits plan authoring only |
| ACI runtime gate blocked | ACI owner | blocks integrated adapter/runtime |
| Bus latest review `FIX` | Bus lifecycle owner | blocks Work Bus dependency |
| ACP discovery only | ACP/ACI owner | blocks confirmed protocol binding |
| APT mutation blocked | APT owner | blocks provenance adapter mutation |
| stale local glossary status | Invoke define/refresh owner | flags transport; no silent edit |

The design may route to Invoke Plan for an ACI-subordinate conformance revision. External dependencies block integrated execution, not plan authoring.

