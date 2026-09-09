---
mode: design
status: pass-with-mutation-blocker
date: 2026-07-14
template: domainspec-spec
companion: ux-plan
---

# Invoke Design Receipt

## Outcome

The design selects a deterministic projection compiler/read application, defines component/data/API/UI/evidence boundaries, supplies two core learning journeys, and makes equivalent spatial/non-spatial access a first-class contract.

## Inputs

- Approved define contract: [SPEC.md](./SPEC.md)
- Aspect views: [operations](./operations.md), [queries](./queries.md), [interfaces](./interfaces.md), [states](./states.md), [events](./events.md), [mappings](./mappings.md)
- Candidate vocabulary: [GLOSSARY.md](./GLOSSARY.md)

## Technique trace

| Technique | Application | Result |
|---|---|---|
| `sequence` | spec -> components -> data -> API -> UX -> evidence | pass |
| `frame_handoff` | define success and forbidden scope framed design | pass |
| `artifact_contract_bridge` | acceptance criteria mapped to components and validators | pass |
| `state_namespace_boundary` | source, projection, claim, Craft, publication states separated | pass |
| `authority_split_gate` | source/project/publication owners kept outside application authority | pass |
| `validation_loop` | every design claim has a fixture or receipt surface | pass |
| `residue_ledger` | owners, host, exact versions, SWU term retained | pass |

## Distill unit check

- Core mechanism: source-preserving deterministic projection plus independently stored learning views.
- Necessary components: manifest, adapters, normalization, validators, snapshot/layout builders, read API, four UI surfaces, evidence harness.
- Removed: mutation service, live ontology authority, accounts, public packaging, auto-scaling renderer.
- Recomposition: every component satisfies a SPEC criterion; none depends on forbidden authority mutation.
- Verdict: `pass` for planning.

## Gate

Design stage: `PASS` for plan authoring. The private witness root is `./prototype/`; mutation-capable execution remains `BLOCKED` until G-OWNER closes. Production website integration is deferred, and exact library versions are an implementation-time pin.
