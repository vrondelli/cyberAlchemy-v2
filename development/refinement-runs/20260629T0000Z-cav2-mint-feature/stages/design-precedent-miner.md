---
stage: design
role: precedent-miner
run: 20260629T0000Z-cav2-mint-feature
date: 2026-06-29
status: complete
claim-ceiling: what-is-directly-observed-on-disk
---

# Precedent Miner — cav2 Mint Feature

Read-only survey of the actual hand-done mintings. Claims are capped at what files
contain, not inferences about intent.

---

## As-built shape of resonantos-economy-research

### Top-level inventory

`/home/vrondelli/projects/resonantos-economy-research/` contains:

```
authority/          claims/         definitions/    development/
dispatch/           distills/       formulae/       gates/
glossary/           harvest/        lanes/          levels/
ops/                prizes/         research/       residue/
reviews/            sources/        subtowers/      telemetry/
tools/              validation/
.agents/            .arcanum/       .claude/
AGENTS.md  CLAUDE.md  CRAFT.md  FINAL-LEARNING-PACK.md
GUIDE.md   NOTATION.md  QUERYING.md
README.md  RELATED-FRAMEWORK-CROSSWALK.md  TOWER.md
```

`domainspec-new-repo` would produce (subject-primary default):

```
knowledge/{domain_knowledge,system_design_knowledge,vault}/
implementation/  research/  sessions/  schema/  [experiments/]  [internal_tools/]
```

### Scaffold-vs-authority-casting split

**Category A — generic framework scaffold** (the kind `domainspec-new-repo` or any
Arcanum/DomainSpec bootstrap could produce without domain knowledge):

| Dir / File | What it is |
|---|---|
| `.agents/skills/` | local Arcanum skill copies (framework machinery) |
| `.arcanum/inventory/` | evidence-card inventory (Arcanum bootstrap) |
| `telemetry/` | dispatch telemetry (Arcanum pattern) |
| `research/` | research surface stub |
| `development/` | work-pack staging (Arcanum/cav2 pattern) |
| `tools/` | deterministic adapters (repo-local tooling) |
| `CLAUDE.md`, `AGENTS.md` | agent context router (framework boilerplate) |
| `CRAFT.md` | Craft ledger (Arcanum spell) |

These are present by pattern: any governed repo using the Arcanum stack ends up with
some version of them. They do not carry ResonantOS-specific authority claims.

**Category B — cav2 authority-spine artifacts, specialized to the domain** (the part
`domainspec-new-repo` explicitly does not produce; would require a separate authority-
casting act):

| Artifact | Where | What makes it authority-spine |
|---|---|---|
| `authority/AUTHORITY-MODEL.md` | `authority/` | Defines authority kinds for THIS domain: primary-source, method-authority, formalization-discipline, related-evidence, local-synthesis, candidate-invariant, workflow-witness, external-policy-authority. Eight rows, all domain-specific. |
| `authority/source-spine.md` | `authority/` | Names source families, allowed/blocked use, and explicitly records CAV2 as a harvested method-authority source (supporting-source, not primary). |
| `authority/promotion-policy.md` | `authority/` | Defines the domain's promotion ladder (source-evidence → source-record → source-claim → subtower-synthesis → candidate-invariant → workflow-witness → research-recommendation) and six named gates (source-kind, authority, failure-corpus, behavioral, formal, phase-2). |
| `authority/constitutions/RESEARCH-CREDIBILITY-CONSTITUTION.md` | `authority/constitutions/` | 14 domain-specific constitution rules (REC-C1 through REC-C14). Includes load-bearing term tracking, no-reciprocal-authority-laundering, finding-to-development contract, non-collapse of status labels. |
| `authority/decisions/2026-06-26-standalone-repository.md` | `authority/decisions/` | Human governance decision authorizing the repo's scope and authority boundary, signed by decision-gate + constitution-governance. |
| `definitions/DEFINITIONS.md` (34.3K) | `definitions/` | Domain-specific definitions (ER-D* series), including ER-D23 Load-Bearing Term Lifecycle — coined for this domain. |
| `definitions/DEFINITION-DRIFT-AUDIT.md` | `definitions/` | Drift audit record for domain definitions. |
| `definitions/DEFINITIONS-INDEX.md` | `definitions/` | Index of promoted domain terms. |
| `definitions/closure-gates.md` | `definitions/` | Per-term closure gates. |
| `gates/` | `gates/` | Domain-specific research gates (BET-REGISTER, PRIZE-REGISTER, SEED). |
| `prizes/` | `prizes/` | Domain prize register (prize-register, bet-register, seed). |
| `glossary/GLOSSARY.md` | `glossary/` | Domain-specific vocabulary (6K). |
| `RELATED-FRAMEWORK-CROSSWALK.md` | root | Explicit bridge decisions between the domain and external frameworks (CyberAlchemy Evidence Exchange, DomainSpec three-axis audit, failed-DAO precedents). Each row has: why included, source-kind, residue it closes, boundary. This is the seam document between CAV2 authority and the domain. |
| `lanes/ATTACK-LANES.md`, `lanes/TWO-LANE-DIALECTICS.md` | `lanes/` | Domain research dialectic structure (attack lanes, two-lane tension). |
| `levels/L0-corpus.md`, `levels/L1-residue-map.md`, `levels/L2-closure-plan.md` | `levels/` | Domain-specific tower levels with residue map and closure plan. |
| `claims/SOURCE-CLAIM-LEDGER.md` | `claims/` | Domain source-claim ledger. |
| `sources/` | `sources/` | Domain source records (including local snapshots of cav2 and lean formalization as supporting-source). |
| `subtowers/` | `subtowers/` | Domain subtower stubs (failed-dao-crypto, science-of-science, formal-mechanisms, socioeconomic-behavior). |
| `TOWER.md` | root | Domain tower plan with borrow/block posture table. |

### Rough fraction

By directory count: 8 dirs are generic framework scaffold; 14+ dirs are cav2-
authority-spine artifacts specialized to the domain. By content weight: the authority/
family alone (AUTHORITY-MODEL, source-spine, promotion-policy, constitution, decisions)
represents purpose-built governance work. `definitions/DEFINITIONS.md` at 34.3K is
the largest single artifact and is entirely domain-coined. The `RELATED-FRAMEWORK-
CROSSWALK.md` is the clearest "bridge" artifact — it enumerates bridge decisions and
source-kind labels that connect CAV2 method authority to the ResonantOS domain. That
document does not exist in any domainspec-new-repo scaffold.

Rough estimate: **~30% generic scaffold, ~70% authority-casting artifacts**.

---

## The kit + the import-back

### resonantos-cyberalchemy-kit

Location: `/home/vrondelli/projects/resonantos-cyberalchemy-kit/`

Contents: `INTEGRATION-GUIDE.md` (7.4K), `OWNED-BASE.md` (7.9K), `README.md` (3.3K)

This is NOT a generalized minting kit. It is a **domain-specific integration handoff**
to the resonantOS Living Archive team. Concretely:

- It describes how to wire CyberAlchemy governance onto the resonantOS Living Archive
  (a specific product with specific surfaces: `archive-read`, `memory-provider`,
  `archive-intake-write`, a Review Queue, MCP tools `decide_review`/
  `promote_review_artifact`).
- `OWNED-BASE.md` is a "what to copy/port/skip" guide addressed to a resonantOS engineer
  working on the Living Archive — not a procedure for minting a new domain repo.
- The kit points to public Arcanum as the copyable base (schemas, validators, installers)
  and identifies the design pieces to port (necronomicon no-promotion guardrail,
  definitions-governance, ontology-vault).
- It does NOT contain: partition trees, scaffold procedures, authority-model templates,
  promotion-policy templates, or constitution templates parameterized for a new domain.
- Status note in README: "Saturn and DomainSpec are named here as direction only —
  intended, not shipped."

**Finding**: `resonantos-cyberalchemy-kit` is an outbound integration handoff, not a
reusable Mint procedure. It does not prefigure Mint.

### The import-back (cav2 ← resonantos-economy-research)

Location: `/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/imports/resonantos-economy-research/`

Contents: `README.md` (import posture), `2026-06-28-load-bearing-term-tracking-handoff.md`

**What was adopted back**: one candidate handoff — the Load-Bearing Term Tracking
Discipline (REC-C14 / ER-D23). It offers the discipline as candidate evidence for
CAV2's definitions-governance, constitution-governance, and discipline-governance routes.
It has NOT been promoted into CAV2 authority yet (status: "candidate — unreviewed").

The import README explicitly states: "It is not CAV2 authority by proximity." The
promotion route requires definitions-governance for terms, constitution-governance for
structural rules, decision-gate for scope.

**The two-way relationship is structurally asymmetric**:
- CAV2 → resonantos: method authority (source posture, promotion discipline, non-collapse
  rules), authorized by `authority/decisions/2026-06-26-resonantos-economy-research-standalone.md`
  on both sides.
- resonantos → CAV2: candidate evidence only, traveling through named owner routes;
  nothing has cleared those routes yet.

The cav2 decision record (`2026-06-26-resonantos-economy-research-standalone.md`) grants
only method authority outbound — it explicitly does NOT grant token policy, bounty policy,
governance weights, payout rules, Phase 2 readiness, or proof of any mechanism.

**Finding**: the import-back confirms the two-way relationship is a governed exchange
between separate authority surfaces, not a single "minting" action that left both repos
in the same state.

---

## What goldenquill / domainspec-new-repo does NOT do

From the `domainspec-new-repo` SKILL.md (objective and process, disk-read):

The skill produces:
- `knowledge/{domain_knowledge,system_design_knowledge,vault}/` partition tree
- `implementation/` (stub only; interior governed by folder-structure-constitution)
- `research/` (stub; birthplace, no decisions/ or findings/ subfolders)
- `sessions/` (one canonical dir; modality only)
- `schema/code-ontology/` (project-local extension layer)
- `experiments/` (optional machinery copy)
- Framework carve-out attached (`.claude/`, `.github/`, `.codex/`, `arcanum/`)
- Dev constitutions seeded (process copies; architecture stubs)
- Provenance session node

The skill's own language: "it **coins no edges, enforces nothing**, and re-litigates
none of the discovery's research-only Open Questions." The output-contract confirms:
"Enforcement: none (gate-first)."

**What it does NOT produce** — and what was instead hand-built in resonantos:

| Absent from domainspec-new-repo | Present in resonantos-economy-research |
|---|---|
| `authority/` tree (authority-model, source-spine, promotion-policy, constitutions, decisions) | Yes — entire authority spine |
| `definitions/` with domain-specific D* IDs and DEFINITION-DRIFT-AUDIT | Yes — 34.3K definitions file |
| `glossary/` | Yes |
| `gates/` and `prizes/` (BET-REGISTER, PRIZE-REGISTER) | Yes |
| `lanes/` (attack lanes, two-lane dialectics) | Yes |
| `levels/` (L0 corpus, L1 residue map, L2 closure plan) | Yes |
| `claims/SOURCE-CLAIM-LEDGER.md` | Yes |
| `sources/` (source records, local snapshots) | Yes |
| `subtowers/` (domain-specific research subtowers) | Yes |
| `RELATED-FRAMEWORK-CROSSWALK.md` | Yes |
| `TOWER.md` (domain tower plan with borrow/block table) | Yes |
| Agent context router (`CLAUDE.md`) wired to local authority routes | Yes |
| `harvest/` (named harvest passes, e.g. cav2-lean-findings) | Yes |
| `dispatch/` (tension-gated dispatch proposals) | Yes |

The skill's anti-patterns confirm: "Fabricating a source the framework repo lacks
instead of reporting a SEED-GAP." The skill is a scaffolder, not an authority-caster.

**Critical gap**: the resonantos repo does not use `knowledge/` as a top-level
partition at all. Its knowledge is organized under `definitions/`, `sources/`,
`claims/`, `subtowers/`, `glossary/` — a domain-native shape that the domainspec-new-repo
scaffold does not produce and is not designed to produce. The two shapes are orthogonal,
not nested.

---

## Which position the precedent supports

### As-built evidence

1. **The minting was done entirely by hand.** No record in resonantos-economy-research
   references domainspec-new-repo, partition-scaffold, or goldenquill. The `authority/`
   tree, `definitions/`, `RELATED-FRAMEWORK-CROSSWALK.md`, `TOWER.md`, constitution, and
   promotion-policy were written directly into the repo. The decision record
   (`2026-06-26-standalone-repository.md`) says: "Initial contents are copied from the
   CyberAlchemy v2 research tower ... then hardened with local agent policy, authority
   model, promotion policy, and a research credibility constitution." No scaffold tool
   was invoked.

2. **Authority casting was treated as a SEPARATE governance act, not a step bolted onto
   a scaffold.** The decision to create the standalone repo was itself a
   `decision-gate + constitution-governance` event. The authority-model, promotion-policy,
   and constitution were written post-copy as distinct governance artifacts. The
   `RELATED-FRAMEWORK-CROSSWALK.md` bridge decisions (borrow-carefully / block /
   analogy-only / promotion-candidate) are each human governance calls. The import-back
   into CAV2 (`authority/imports/resonantos-economy-research/`) is another governance
   act. Each of these is an owner-route event, not a scaffold output.

3. **The repo shape does NOT match domainspec-new-repo's partition tree.** The top-level
   structure is `authority/`, `definitions/`, `claims/`, `lanes/`, `levels/`, `sources/`,
   `subtowers/` — a research-tower shape, not a `knowledge/domain_knowledge/system_design_knowledge/` shape. Applying domainspec-new-repo first and then casting authority onto it would require either (a) mapping authority artifacts into the `knowledge/` tree, which does not match how resonantos is organized, or (b) creating a parallel `authority/` tree that lives beside the scaffold. Option (b) is what was hand-done — but without the scaffold having been run first.

4. **The cyberalchemy-kit is not a minting kit.** It is a domain-specific outbound
   integration handoff to one team for one product surface. It does not generalize.

### Position verdict

**The evidence most directly supports position B (new cav2-native skill), with a
qualification.**

The qualifier: the precedent does not show that advocate A's scaffold is irrelevant —
it shows that the scaffold and the authority-casting are genuinely separate acts that
serve different purposes. What the hand-minting reveals is:

- The scaffold (if any were used) would produce at most the `.agents/`, `.arcanum/`,
  `development/`, `research/`, `telemetry/`, `CLAUDE.md`, `AGENTS.md` skeleton — a
  small fraction of what a minted domain repo actually requires.
- The authority-spine (authority/, definitions/, constitutions, promotion-policy,
  source-spine, RELATED-FRAMEWORK-CROSSWALK, TOWER, lanes, levels, claims, glossary,
  gates, prizes) is the majority of the minted repo by content weight and governance
  significance. This spine was hand-authored as a governance act, not generated.

**The fork-deciding fact**: `domainspec-new-repo` explicitly "coins no edges, enforces
nothing." Minting a domain-specialized authority spine is exactly the act of coining
edges and enforcing something — it defines what authority kinds exist, what the promotion
ladder is, what the constitution rules are, what source families are allowed, and how the
domain's findings may travel back to CAV2. That cannot be delegate to a scaffold that
is, by design, a non-authority-casting tool.

**The composition reading**: a Mint skill could call domainspec-new-repo for the generic
scaffold layer (`.arcanum/`, `.agents/`, `telemetry/`, `development/` skeleton) and then
execute the authority-casting as its distinct cav2-native step. But the as-built evidence
suggests the scaffold layer is the smaller and less load-bearing half. If forced to choose
a primary characterization, the precedent says: **Mint is primarily an authority-casting
governance act** that may optionally produce some generic scaffold as a side-effect. B is
the more accurate characterization of what a Mint skill must DO; A describes one of the
cheaper sub-steps.
