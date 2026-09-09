# Session Handoff: advance cyberAlchemy-v2 primordial-basis pass + resolve the residue-type blocker

## Identity

- Source session reference: `domainspec-lean-formalization @ 2026-06-21 — re-scope review → AX-ONT information-leg → cyberAlchemy-v2 work`
- Destination label: `cav2-primordial-basis`
- Handoff type: `new-lifecycle-thread` (with a `research-direction` sub-thread for the residue type)
- Target project or lifecycle: `cyberAlchemy-v2` (Craft `define` stage; CTX-CAV2-DEF-TOWERS / CTX-CAV2-ROOT)
- Created for: continuing v2's primordial-basis pass and clearing the gaps/decisions that block it, without carrying this session's lean-repo strategy debate forward.

## New Session Prompt

```text
Continue cyberAlchemy-v2's primordial-basis pass (Craft stage `define`, gate `flag`).
The promoted basis is CAV2-D16 (typed coupling invariant), D17 (reflection tower method),
D18 (residue), D19 (ontology), D29 (axis orthogonality invariant), D30
(bounded recursive self-application), D31 (primitive type), D32 (method), and
D33 (definition), D34 (authority), D35 (provenance), D36 (traceability), D37
(gate), D38 (claim <= proof), and D39 (intent). Next moves, in order:
1. Classify `artifact` as the last explicit T-1 candidate, then cluster → dedup
   → localize the 149 staged definition candidates (closes
   GAP-CAV2-TERM-CLUSTERING-001, feeds GAP-CAV2-DUPLICATE-DETECTION-001 /
   GAP-CAV2-LOCAL-REPRESENTATION-001; unblocks BLK-CAV2-SOURCE-TRUTH-001).
2. Build ONLY layer-1 of the fusion: the `subset-rule` gate sigil (cyber-alchemy-lean-fusion
   DESIGN.md §6). Do NOT write the residue ledger — it is blocked on the residue-type question.
Close or defer the two human-required decisions (visible-spaces, public/private) before any
standalone extraction.
```

## Route Rationale

- Recommended next route: `invoke define` (continue definitions-governance), plus a parallel `research` dispatch for the residue type.
- Rationale: v2 is mid-`define` with an explicit ledger next-move; the work is governance/definitions, not implementation. The one high-value piece (residue ledger) has a hard type blocker that must be resolved by research before it is honest to build — so it splits off as a research-direction sub-thread.
- Lifecycle owner: `invoke` (basis pass) + `research` (residue type) + `decision-gate` (the two blocking decisions).

## Context Builder Selection

| Obligation | Coverage | Selected Source | Why It Matters |
| --- | --- | --- | --- |
| O1 promote primordial basis beyond D16-D19 | `closed` | `DEFINITIONS.md` CAV2-D29-D39 | Orthogonality, recursivity, primitive type, method, definition, authority, provenance, traceability, gate, claim <= proof, and intent are promoted with local CAV2 boundaries. |
| O2 cluster/dedup/localize 149 candidates | `covered` | `CRAFT.md:157–190 (GAPs), :127–135 (BLK-SOURCE-TRUTH)` | The real bottleneck between "basis promoted" and "towers buildable". |
| O3 close/defer the two blocking decisions | `covered` | `CRAFT.md:98–114 (DEC-VISIBLE-SPACES, DEC-PUBLIC-PRIVATE)` | Human-required; block standalone extraction, not local work. |
| O4 build only layer-1 (subset-rule gate); defer ledger | `covered` | `cyber-alchemy-lean-fusion/DESIGN.md §5–§6, §9` | Collapse-test: a free-text residue ledger = `residuality-spec` renamed, contribution zero. |
| O5 resolve the residue TYPE (the layer-2 gate) | `flag` (open question, route named) | `DESIGN.md §7 BLOCKER; §9 next route` | Decides whether the ledger is a unification or a rename; routed to a research dispatch. |

Strict coverage: `flag` — O1–O4 covered from the v2 ledger + fusion packet; O5 is an open question with a named route, not resolved. Context Builder was enacted by hand (the `context-builder` / `inventory` sigils were not run), so coverage is reported honestly as flag, not pass.

## Selected Session Context

- `CRAFT.md (cyberAlchemy-v2)` — basis now includes D16-D19 plus D29-D39; every context at `define`/`flag`; next move = classify `artifact`, then cluster/dedup/localize the 149 staged definition candidates; blockers BLK-SOURCE-TRUTH / PUBLIC-PRIVATE / VISIBLE-SPACES; gaps TERM-CLUSTERING, DUPLICATE-DETECTION, CONSTITUTION-CLUSTERING, LOCAL-REPRESENTATION.
- `cyber-alchemy-lean-fusion/DESIGN.md` — the residue-ledger is the killer feature (§3) but gated: §5 collapse-test (typed signature that fires Pass/Flag/Block, else rename), §6 build layer-1 first (subset-rule gate sigil), §7 the load-bearing BLOCKER = "what type does an artifact-level residue carry?", §9 resolve via a research dispatch, do NOT write the ledger.
- This session's reusable input for O5's research sub-thread: the information-leg math the residue type would draw on (Shannon/MI/maxent/Markov) is already formalized; candidate owned machinery to mine for the type is listed in DESIGN.md §7 (MI/resource theories, codensity/nucleus, Grothendieck-fibration Σ-fibre, refinement types, Galois connections, residuality theory). Carried as a pointer for the dispatch, not as a status report.

## Excluded Context

| Candidate | Reason Excluded |
| --- | --- |
| The re-scope debate (demote the residue north star to "maximum prize") | lean-repo strategic decision; not v2 work — out of this thread's scope |
| The C-bridge verdict (A1 = schema→instance leg → KILL, tautological) | closed negative; not obligation-relevant to v2's basis pass |
| The full AX-ONT→Lean anchor map (per-axiom file:symbol status) | lean-repo deliverable; only the §7 type-candidates pointer is carried |
| The two TO-VLAD drafts from this session | superseded by this handoff artifact |

## Target Boundary

- In scope: v2 definitions-governance (orthogonality, recursivity), the 149-candidate clustering, the two blocking decisions, and layer-1 of the fusion (subset-rule gate sigil).
- Out of scope: writing the residue ledger; promoting the constitution pack before clustering; the lean-repo re-scope; any public/standalone extraction before the decisions close.
- Prior decisions to preserve: DEC-CAV2-DEFINITION-LOCALIZATION-001 = `v2-local-definition-space` (closed); DEC-CAV2-TOWER-ALTITUDE-001 = `umbrella-pillars-craft-subtower` (active, non-blocking, default kept).

## Gaps And Blockers

| Gap | Owner | Status | Next Action |
| --- | --- | --- | --- |
| Residue artifact-level TYPE undefined | research (Lean repo) | `open` | Run a `research` dispatch (explorer→skeptic→writer→auditor) on §7; verdict-per-candidate, collapse-tested |
| 149 definition candidates unclustered | definitions-governance | `open` | One clustering pass by tower/source/posture |
| Duplicate/conflicting terms undetected | definitions-governance | `open` | Dedup across Arcanum/DomainSpec/CyberAlchemy/MARS after clustering |
| DEC-CAV2-VISIBLE-SPACES-001 | decision-gate (human) | `blocked` | Close or defer with extraction-stage rationale |
| DEC-CAV2-PUBLIC-PRIVATE-001 | decision-gate (human) | `blocked` | Close with public/private derivative rules |

## Next-Session Start Prompt

```text
You are in cyberAlchemy-v2 (Craft `define`, gate `flag`). Basis: D16 typed coupling invariant,
D17 reflection tower method, D18 residue, D19 ontology, D23 authority lifecycle axis,
D29 axis orthogonality invariant, D30 bounded recursive self-application,
D31 primitive type, D32 method, D33 definition, D34 authority, D35 provenance,
D36 traceability, D37 gate, D38 claim <= proof, and D39 intent. Operational Ontology is
demoted into D19+D23 language. D29-D39 are promoted. Do, in order:
(1) classify `artifact` as the last explicit T-1 candidate, then cluster the 149 staged definition candidates by tower/source/posture, then dedup, then write
v2-local representation records (unblocks BLK-CAV2-SOURCE-TRUTH-001); (2) build ONLY the
`subset-rule` gate sigil (DESIGN.md §6) — do NOT write the residue ledger (blocked on the
residue-type question, being resolved by a separate research dispatch). Surface the two
human-required decisions (visible-spaces, public/private) for the owner before any extraction.
Constraint: nothing in inventory/ or ontology/ is promoted by proximity; source spine is
candidate read-model only.
```

## Provenance

- Source refs: `cyberAlchemy-v2/CRAFT.md`, `cyberAlchemy-v2/SOURCE-MAP.md`, `cyberAlchemy-v2/README.md`, `projects/framework-unification/layers/cyber-alchemy-lean-fusion/DESIGN.md`
- Context Builder mode: `manual` (sigils not run; selection enacted by hand)
- Evidence date: `2026-06-21`
- Output path: `cyberAlchemy-v2/TO-VLAD/SESSION-HANDOFF-cav2-primordial-basis.md`

## Gate Result

- Status: `flag`
- Reason: O1–O4 covered from the v2 ledger and fusion packet; O5 (residue type) is an open question with a named research route, not resolved; Context Builder ran in manual mode, so coverage is honestly `flag` rather than `pass`. Safe to open the new thread; standalone extraction stays blocked on the two human decisions.
