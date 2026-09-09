---
node_type: template
is_session: false
status: candidate
boundary: INTERNAL — Mint emit-template (Universal Governance Baseline, SWU-B2); intended-not-shipped
created: 2026-07-01
authored_by: sigil-development (--update, universal-baseline L1 build)
swu: SWU-B2 (baseline primitive vocabulary)
source_artifact: cyberAlchemy-v2/authority/definitions/DEFINITIONS.md (FORMS only; strip-bindings applied)
emits_to: <TARGET_REPO>/authority/BASELINE-PRIMITIVES.md
partition: development/research/2026-07-01-universal-baseline-partition/findings.md (bucket A primitives + strip-bindings)
guardrail: >
  Reference cards for the universal primitive vocabulary any governed repo inherits. Each is a FORM +
  provenance D-ID; the domain specializes locally. STRIP-BINDINGS: D11 omits cav2's space list; D31
  substitutes the domain's own authority_scope/owner for the literal CAV2 binding; D40 seeds the protocol
  without cav2's ontology NODE-MODEL consumers. Integrates as baseline rows in DEFINITIONS-INDEX (#8).
---

<!--
  MINT EMIT-TEMPLATE (intended-not-shipped). The universal PRIMITIVE/vocabulary baselines (frozen
  partition bucket A). Each card = the FORM + a `(CAV2-D<k>)` provenance tag + a "Domain specializes:"
  hook. NOT full re-definitions - references the domain fills. cav2 appears only as provenance.
-->

# <DOMAIN> Baseline Primitives (inherited vocabulary)

Status: **PROPOSED** — pending owner ratification (mint ratify-CLOSE)
Owner: definitions-governance (domain-local) · indexed in [DEFINITIONS-INDEX.md](../definitions/DEFINITIONS-INDEX.md)

The base semantic kit every minted repo inherits. Each primitive is the universal FORM; the domain
authors its own specifics. cav2 D-IDs are provenance, never a resolution path.

## Core primitive vocabulary
- **method** (CAV2-D32) — a governed repeatable intent→artifact transform (scope/inputs/actions/gates/residue). Domain specializes: its own methods.
- **definition** (CAV2-D33) — a governed semantic unit + record shape; `candidate ≠ canonical`. Domain specializes: its own cards.
- **authority** (CAV2-D34) — a scoped right to make something count (scope/owner/surface/object/operation/basis/effect/challenge). Domain specializes: its kinds.
- **provenance** (CAV2-D35) — a typed origin/transformation chain `Prov(x)`. Domain specializes: its sources.
- **traceability** (CAV2-D36) — navigable typed links why→what→next, no hidden context. Domain specializes: its links.
- **gate** (CAV2-D37) — a checkpoint `G(scope,input,evidence,criteria)→{pass,flag,block,defer}`. Domain specializes: its gates.
- **intent** (CAV2-D39) — a declared purpose orienting a method before output shape settles. Domain specializes: its intents.
- **primitive-type** (CAV2-D31) — the base-kind admission rule (`not-derived-from-narrower`, boundary, consumers). Domain specializes: `authority_scope = <DOMAIN>` / `owner = <DOMAIN owner>` *(strip-binding: NEVER `CAV2` / `definitions-governance`)*.
- **challenge-contract** (CAV2-D40) — the 8-tuple protocol for how a load-bearing claim may be challenged/routed (modes/edges/owner/gate/residue-route) *(strip-binding: protocol only; NO cav2 ontology NODE-MODEL consumers)*. Domain specializes: its challengeable claims.

## Authority / source structure primitives
- **authority-layer** (CAV2-D3) — a scope allowed to define normative meaning. Domain specializes: its authority surface.
- **authority-import** (CAV2-D7) + **import-candidate** (CAV2-D8) — stage source paths as candidates before promotion (import before promotion). Domain specializes: its imports ledger.
- **definition-tower** (CAV2-D10) + **tower-space** (CAV2-D11) — cluster terms by altitude/owner/next; a space that owns/supplies/consumes tower content *(strip-binding: seed the space-typing rule, OMIT cav2's `inventory/ontology/authority/…` enumeration)*. Domain specializes: its towers/spaces.
- **promotion-queue** (CAV2-D13) — an ordered review set where queue position ≠ approval. Domain specializes: its queue.
- **source-space** (CAV2-D14) — an area outside the authority surface supplying candidate evidence. Domain specializes: its source areas.
- **reflection-tower-method** (CAV2-D17) — residue R_n → seed(L_{n+1}). Domain specializes: its reflection loop.
- **craft-method** (CAV2-D20) — recursive ledger-governance over a bounded scope (ledger-of-truth / derived-views / typed-residue). Domain specializes: its craft ledger.

<!-- Emit self-check #13: grep `CAV2` in the emitted file returns ONLY `(CAV2-D<k>)` provenance tags —
     never `authority_scope=CAV2`, never a cav2 space/consumer list (strip-bindings verified). -->
