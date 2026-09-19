---
tags: [framework-unification, recon, system-inventory, index, cross-repo, capabilities]
node_type: discovery
is_session: false
layer: architecture
nature: explanatory
status: draft
version: 0.1.0
last_updated: 2026-07-03
created_by: victorboscaro@gmail.com
---

# System Recon — INDEX

> **What this node is.** The tying synthesis over six repo maps produced by dispatch
> `2026-07-03-system-recon-census` (6 parallel scouts). Each `MAP-*.md` is one repo's
> high-level census (folders + capability inventory + status). This INDEX does what no single
> scout could: lays the six side by side, **collapses the "how many domainspecs are there"
> confusion**, names the **capabilities that exist in more than one place**, and flags the
> **public/private boundary** hits. It decides no owner — it is the launch map for the deeper
> second pass. Aspirational boundary + open-questions rule governed by [../../SCOPE.md](../../SCOPE.md).

The six maps: [cyberAlchemy-v2](MAP-cyberalchemy-v2.md) · [domainspec-v2](MAP-domainspec-v2.md) ·
[implementation/domainspec](MAP-domainspec-impl.md) · [Arcanum](MAP-arcanum.md) ·
[domainspec (sibling)](MAP-domainspec-sibling.md) · [business-philosopher](MAP-business-philosopher.md).

---

## 1. The six at a glance

| # | Repo / subsystem | Pillar role | Capabilities (approx) | Status floor | Git HEAD |
|---|---|---|---|---|---|
| 1 | `cyberAlchemy-v2/` (in-repo) | **authority spine** (the gate on what becomes authority) | ~20 (mostly ledgers/constitutions; 2 in-dev private sigils Mint + Attestation) | mostly **scaffold**; repo self-rates gate `flag` | `3cc61ad` (master) |
| 2 | `projects/domainspec-v2/` (in-repo) | **DomainSpec** (next-gen rewrite) | ~35 (14 backend meta-type cards + engine + validators + research towers) | partial: backend meta-types green; UI + drift-engine deferred | `3cc61ad` (master) |
| 3 | `implementation/domainspec/` (submodule, **vrondelli**) | **DomainSpec** (built engine — the *how it runs today*) | ~148 skills + 40 agents (35 `domainspec-*`, 57 vendored `gsd-*`, shared) + 2 hooks + ~20 tools | **built, in use**, v2.1.0 | `6418420` (≡ origin/main) |
| 4 | `../Arcanum` (sibling, **cyberAlchemyAI**) | **Arcanum** (public — the reusable capability catalog) | ~76 (37 arcana + 15 spells + 3 formulae + 4 transmutations + disciplines) | built; **~27% registry lag** | `e4d3b5d` (main) |
| 5 | `../domainspec` (sibling, **cyberAlchemyAI**) | **DomainSpec** — *same engine as #3* | 116 skills / ~40 agents (same family, different count) | = #3, one commit behind | `4ea9fea` (main) |
| 6 | `../business-philosopher` (sibling) | **outside the stack** — editorial workspace + dispatch *consumer* | ~10 local + an embedded engine checkout | content, in active use | `6dacea1` (main) |

---

## 2. The "how many DomainSpecs?" question — resolved

There is **one built engine**, mirrored/checked-out in three places at three different commits,
**plus one separate rewrite**. This is the single biggest clarification of the pass:

| Physical location | Remote | Commit | What it is |
|---|---|---|---|
| `implementation/domainspec/` (this repo's submodule) | `vrondelli/domainspec` | `6418420` | The canonical built engine, newest. |
| `../domainspec` (sibling) | `cyberAlchemyAI/domainspec` | `4ea9fea` | **Same repo, one commit behind** — an org mirror of vrondelli (proven by shared history: merge-base = sibling HEAD, strict fast-forward). NOT a divergent fork. |
| `business-philosopher/domainspec/` (its submodule) | `cyberAlchemyAI/domainspec` | `da94796` | **A third checkout** of the same mirror, pinned at yet another commit. |
| `projects/domainspec-v2/` (this repo) | — (lives in domainspec-core) | `3cc61ad` | **A genuine rewrite**, not a checkout — its own 25-meta-type language + its own local authority spine, explicitly independent of both v1 and cav2. |

So: **#3 = #5** (mirror). **#6's engine** is the same lineage, older pin. **#2 is the only truly
distinct DomainSpec.** The real fragmentation is not "many repos" — it's **multiple pinned commits
of one engine across three consumers, and a rewrite that has forked the authority spine** (§4).

⚠️ Open item: `cyberAlchemyAI/domainspec` mirror also has **3 org-only branches** (`codex/goldenquill-promotion-governance`, `vault/subagents-topologies-feature-discovery-format`, `chore/fresh-baseline-reset-2026-05-03`) not diff-checked against vrondelli — could hold work absent from the submodule.

---

## 3. The capability landscape — by function (the "things that do something")

Grouping every repo's inventory by what the capability *does*, so duplicates surface:

| Function | Where it lives | Notes |
|---|---|---|
| **End-to-end pipeline** (plan→spec→tests→code→UI→observe→infra→verify) | engine (`domainspec-pipeline`) | Single owner. The spine the whole system builds around. |
| **Spec authoring / meta-types** | engine (25 types/29 edges) **and** domainspec-v2 (its own 25 + 14 formalized cards) | Two homes — the rewrite re-owns the taxonomy. |
| **Subagent dispatch + telemetry** (`register-dispatch` / `subagents-strategy`) | **4 repos**: domainspec-core, engine, Arcanum, business-philosopher; also a `subagents-strategy-standalone` package | **Most-propagated capability in the system.** The de-facto integration seam (§5). |
| **Session close** (`close-session`) | engine, Arcanum (ZefraHub variant — its HEAD commit), business-philosopher (adapted) | Propagated to 3 repos; variants diverging. |
| **Governance sigils** (definitions-governance, decision-gate, constitution-governance) | Arcanum (as sigils) **and** engine (as `domainspec-*` skills) **and** consumed by cav2 | Same three capabilities, two+ homes — prime single-owner target. |
| **Observability / signals** | engine (emit/observe/reflect loop) + Arcanum (`observability-setup`, `signal-observer`, `workflow-reflect`) | Two implementations of the same telemetry idea. |
| **Authority / promotion gate** | cav2 (promotion ladder, authority-kinds) + domainspec-v2 (its **own** local L1 spine) | Authority ownership itself forked (§4). |
| **Knowledge vault / ontology** | engine (`vault/`, 22 edge types) + Arcanum (`ontology-vault`, `inventory`) + cav2 (`ontology/`) | Three vault/ontology surfaces. |
| **GSD phase-execution pack** (57 skills / 18 agents) | vendored inside every domainspec engine checkout | Third-party; bridged, not owned. |
| **Autonomous loop** | Arcanum (`goal` spell — fail-closed DAG over a Craft frontier) | Newest capability; closest thing to a Saturn-style actuator. |
| **Saturn (evidence loop)** | **nowhere built** | Named as future actuator in domainspec-v2 + cav2 ladder. Confirms Concept-Map status. |

---

## 4. Fragmentation & duplicate-owner map (the assembly targets)

The concrete "assign a single owner" list this recon exists to produce:

1. **The engine's canonical pin.** Three checkouts at three commits (§2). Decide the one source of
   truth and how consumers track it (submodule pin policy).
2. **v1 engine vs v2 rewrite.** domainspec-v2 declares itself the "implementation home" but its
   freeze gate (v1 frozen) is **explicitly unmet** — so v1 is still authoritative for anything not
   yet reformulated. Two live DomainSpec surfaces today.
3. **Authority spine: cav2 vs domainspec-v2.** cav2 is *the* authority spine, yet domainspec-v2
   minted its **own** L1 spine "independent of cav2 (harvested precedent only)." Two authority
   spines — is that intended (local autonomy) or a collision?
4. **Governance capabilities in two homes** — definitions-governance / decision-gate /
   constitution-governance exist as both Arcanum sigils and engine skills. Which is canonical, which
   is the generated install?
5. **subagents-strategy's home** — engine skill vs `subagents-strategy-standalone` package vs cav2
   governance. Three locations for one governing capability.
6. **Taxonomy count drift** — 24/26 (engine README) vs 25/29 (engine canonical files) vs 25
   (domainspec-v2). A number that should have exactly one true value is stated three ways.

---

## 5. Assembly seams already in place (how the pieces *already* connect)

Not everything is fragmented — two mechanisms are already the connective tissue, and they are the
natural backbone for "putting it all together":

- **The dispatch/telemetry pattern** (`register-dispatch` + `subagents-dispatch.yaml`, schema
  `0.6.0`) is already replicated across 4 repos with the same shape. It is the one capability that
  has demonstrably *travelled*. If the system has a nervous system today, this is it.
- **`arcanum-bootstrap`** (Arcanum spell) is the declared install path — it casts sigils +
  observability + runtime adapters into a consuming repo. It is *how* Arcanum capabilities are meant
  to reach the engine/consumers. Whether the engine's `domainspec-*` governance skills are
  bootstrap-generated from Arcanum or hand-maintained is the key unknown for §4.4.

---

## 6. Public/private boundary flags (CLAUDE.md: only Arcanum is public)

Surfaced, not resolved — flagged for the owner:

- **`../Arcanum/projects/ui-prototyping-studio/`** — a running product build inside the *public*
  repo, self-described as extracted from "the now-deprecated `domainspec` monorepo."
- **DomainSpec-named sigils in public Arcanum** — `audit-alignment`, `code-tag-audit`,
  `test-derivation`, `sync-user-stories`, `observability-derivation` all describe operating on "a
  DomainSpec spec's aspect docs." Generic vocabulary, or private-shape leak?
- **`cyberAlchemyAI/domainspec` visibility unknown** — BSL-1.1 content; if the org repo is public it
  interacts with the "DomainSpec never described as shipped/public" rule.
- **business-philosopher commits session transcripts** (`claude/current_conversations/`) — check
  before any exposure.

---

## 7. Open Questions

- **OQ-1. Engine source-of-truth + pin policy.** Which checkout is canonical and how do the three
  consumers track it? **Recommendation:** decide vrondelli-canonical + documented pin. **Status:** OPEN.
- **OQ-2. v1↔v2 precedence.** Until the freeze gate is met, both are live. **Recommendation:** state
  the interim precedence rule explicitly. **Status:** OPEN.
- **OQ-3. One authority spine or two?** cav2 vs domainspec-v2's local spine. **Recommendation:**
  paired-views single-owner decision. **Status:** OPEN.
- **OQ-4. Governance-sigil canonical home** (Arcanum vs engine) + whether engine skills are
  `arcanum-bootstrap`-generated. **Recommendation:** trace one sigil (e.g. `decision-gate`)
  end-to-end. **Status:** OPEN.
- **OQ-5. Public/private boundary** (§6). **Recommendation:** owner review of the four flags before
  any publication move. **Status:** OPEN.
- **OQ-6. Org-only branches** on the mirror may hold divergent work (§2). **Recommendation:** diff
  the 3 branches vs vrondelli. **Status:** OPEN.
- **OQ-7. Depth pass scope.** This was breadth-only. **Recommendation:** the next dispatch drills the
  two seams (§5) and the six duplicate owners (§4), not the folders again. **Status:** OPEN (carried).

---

## Connections

| Document | Type | Description |
|---|---|---|
| [../CAPABILITY-CENSUS.md](../CAPABILITY-CENSUS.md) | `relates-to` | The prior Arcanum-only census this pass reconciles against and widens to six repos. |
| [../../CONCEPT-MAP.md](../../CONCEPT-MAP.md) | `relates-to` | The two-axis engine model; this recon is the cross-repo evidence base under it. |
| [../../SCOPE.md](../../SCOPE.md) | `relates-to` | Governs the aspirational boundary (§2/§6) and the open-questions rule (§7). |
| `MAP-*.md` (×6) | `derives-from` | The six per-repo scout maps this INDEX synthesizes. |
