---
stage: design
role: advocate-B
position: new-cav2-native-skill
target: cav2 "Mint" feature
date: 2026-06-29
---

# Advocate B — Mint is a NEW cav2-native minting skill

## Thesis

Mint is a **cav2-owned governance capability** that *casts the authority spine* (kinds D49, the
definitions tower, constitutions, the promotion lifecycle D48, the two-way adopt-back) onto a
target domain to produce a domain-specialized authority repo. It **composes** `domainspec-new-repo`
to get the doc-tree scaffold, but it is **not** an extension of it. The reason is categorical, not
preferential: `domainspec-new-repo` is a *deliberately non-authority deterministic scaffolder*, and
the spine is a *governance act*. You cannot bolt an authority-casting act onto a tool whose own
charter is "enforces nothing" without either (a) violating that tool's stated scope or (b) quietly
promoting it into an authority owner it was explicitly designed not to be. Ownership of Mint must be
cav2's; reuse of the scaffolder is fine, inheritance of its non-authority posture is fatal.

## Why the spine is a governance act, not a seed step

The scaffolder names its own ceiling. From
`implementation/domainspec/.claude/skills/domainspec-new-repo/SKILL.md` `<objective>` (line 21):
the skill "coins no edges, **enforces nothing**, and re-litigates none of the discovery's research-only
Open Questions." Its INVARIANTS (line 50) repeat it: "**nothing enforced** (no CI, no binding
validator, no migration hook)." Its `<anti-patterns>` (line 184) forbid "turning OQ-3 (routing edge),
OQ-5 (epistemic-discipline placement), or OQ-6 (enforcement) into scaffold gates." This is not an
accident of the current version — it is the skill's *identity*. It materializes a tree, attaches a
framework half clone-safely, seeds partitions, writes a provenance session. It is a **dumb,
idempotent, gate-first file-drop**. That is exactly the right altitude for what it does.

The cav2 authority spine is the **opposite kind of thing** at every load-bearing point:

- **It enforces by default-deny.** `authority/AUTHORITY-MODEL.md` (lines 61–69): the authority-kinds
  enumeration is **closed** — "an artifact whose kind is not a row above may not acquire or exercise
  authority — it defaults to **blocked** pending a decision-gate + constitution-governance decision"
  (CAV2-D49). Minting a domain authority *means installing that default-deny posture and deciding
  which kinds the domain may run*. A scaffolder "enforces nothing"; minting authority **is** the act
  of enforcing.

- **It runs the promotion lifecycle.** D48 (`source evidence → candidate → owner-routed review →
  promoted → invariant/constitution pressure`) is the spine's engine, not a directory. Casting it
  onto a domain is wiring up owner routes (definitions-governance, constitution-governance,
  decision-gate, discipline-governance per the Narrowest Owner Rule, lines 90–104) — a *governance
  topology*, not a `README` stub.

- **It carries the two-way adopt-back.** `authority/constitutions/VAULT-CONCEPT-ADOPTION-CONSTITUTION.md`
  is an entirely cav2-side concern: imported source concepts stay **evidence** until a cav2 owner
  re-authors them (CAV2-VC1), four-facet adoption (VC2), lifecycle-axis separation (VC3), provenance-
  first search (VC5), append-only adoption trace (VC7), read-models-cannot-promote (VC8). The minted
  domain has to know *how to promote its own findings back up to the apex* — "use domain authority to
  grow apex authority" (TO-VICTOR catch-up guide, lines 16–17). `domainspec-new-repo` has no concept
  of promotion, adoption, or apex; it cannot own a flow it has no vocabulary for.

**The two-System-5 boundary is the decisive cite.** The machine map
(`development/2026-06-26-TO-VICTOR-catch-up-guide.md`, lines 23–33, 75–76) frames the whole foundry
through Beer's Viable System Model: **CAV2 = the governing "System-5"** (the HEAD/MOLD that "decides
what counts; owns the vocabulary, the kinds, the gates, the promotion lifecycle"); **DomainSpec = the
BASELINE substrate**; **Arcanum = the HANDS**. And: "**CAV2 is a reflexive meta-authority MOLD; each
domain authority is a casting**" (line 75). `domainspec-new-repo` lives in the *DomainSpec* baseline
(`implementation/domainspec/.claude/skills/`). Bolting the cav2 *meta-authority mold* (System-5) onto
the *DomainSpec object-axiom substrate* (the baseline System-1) **fuses two distinct System-5s into
one** — it makes the mold a feature of the substrate it is supposed to govern *from above*. That is
the recursion-boundary the machine map keeps explicitly distinct: meta-authority (what may count) vs
object-axioms (the thing being modeled). Fuse them and **the foundry becomes circular** — the mold
that decides what counts is now a casting of the thing it casts. Mint must sit at the System-5 layer,
which is cav2's, which `domainspec-new-repo` definitionally is not.

There is also a **front-door gap** no scaffold step can fill. Minting authority needs the
authority-triage entry: capture → governed authority, owner sweep, kind determination (the
Narrowest Owner Rule routing, AUTHORITY-MODEL lines 90–104; the provenance-first sweep VC5). That is a
cav2 governance flow with owner gates and a default-deny verdict — not a branch point in a tree
materializer. `domainspec-new-repo` decides "only the **three** scaffold-time branch points (top-axis,
system_design split, attach-mode)" (line 21). Authority triage is a fourth concern of an entirely
different *kind*, and adding it would break the very anti-pattern the skill forbids (line 184).

## Composition without inheritance

The honest reuse is **delegation, not subclassing**. Mint (cav2-owned) does:

1. **Triage / kind-determination** (cav2 governance) — front-door capture, owner sweep, default-deny
   over D49, decide which authority kinds the target domain instantiates.
2. **Scaffold the doc-tree** — *call* `domainspec-new-repo` as a deterministic subroutine for the
   partition tree + clone-safe framework attach. Mint passes inputs; new-repo stays the dumb
   scaffolder it is. **It keeps all its clone-safe fixes** (submodule default, canon-resolves
   verification Step 7, single sessions dir) — Mint inherits those *as a caller*, for free.
3. **Cast the spine** (cav2 governance) — install the definitions tower reference, the closed
   kind enumeration with default-deny, the constitutions, the D48 lifecycle owner routes, the
   adopt-back contract.
4. **Wire promotion + adopt-back** (cav2 governance) — the two-way path so the minted repo can grow
   the apex.

Composition reuses the scaffolder's *mechanism* without importing its *scope ceiling*. The scaffolder
stays "enforces nothing" inside its own boundary; Mint does the enforcing *around* it. This is the
precedent already walked by hand: `resonantos-economy-research` is a "fully-minted sibling repo"
(decision `authority/decisions/2026-06-26-resonantos-economy-research-standalone.md`) and `goldenquill`
was scaffolded *via* `domainspec-new-repo` — two distinct acts, hand-fused once, now to be named as
one capability whose **owner is cav2**.

## Rebuttal to A

A's strongest line is: *reuse beats new; extending an owner is build-from-owned; a brand-new skill
risks re-introducing the clone-safe defects `domainspec-new-repo` already fixed.* Three rebuttals.

1. **"Extend the owner" mis-identifies the owner.** Build-from-owned means build from the owner *of the
   capability you're extending*. The capability here is **authority-casting**, and its owner is **cav2**
   (AUTHORITY-MODEL; the System-5/MOLD framing). `domainspec-new-repo` owns *doc-tree scaffolding* —
   a different capability in a different pillar (DomainSpec baseline). Bolting authority-casting onto it
   is not build-from-owned; it is build-from-the-wrong-owner. The precedent-sweep memory ("a found
   owner is build-from-owned") *supports* Mint: the found owner of governance-casting is cav2, so the
   build-from-owned move is **a cav2 skill that composes the scaffolder**, not an extension of the
   scaffolder.

2. **Composition strictly dominates on the clone-safe-defect risk.** A new skill that *re-implements*
   the tree would re-introduce the defects. Mint does not re-implement it — it **calls**
   `domainspec-new-repo`, so the submodule default, the Step-7 canon-resolution verify, and the
   single-sessions-dir guarantee are inherited unchanged. A's defect objection actually argues *for*
   composition over a fork, and composition is exactly position B.

3. **Extension would violate the scaffolder's own charter and the recursion boundary.** Even if one
   wanted to extend it, doing so requires teaching a "nothing enforced" skill (line 50) to *enforce
   default-deny*, *run a promotion lifecycle*, and *own adopt-back* — directly contradicting its
   `<objective>` and `<anti-patterns>`, and collapsing the two-System-5 boundary into a circular
   foundry. Reuse that breaks the reused thing's identity is not reuse; it is a silent rewrite.

## Convergence criterion

I concede to A — Mint should be an extension of `domainspec-new-repo`, not a new cav2 skill — **if**
one fact is shown: that the cav2 authority spine can be cast onto a target domain **purely by dropping
files/templates that carry no enforcing, no owner-routing, and no promotion/adopt-back behavior** — i.e.
that minting authority is *fully reducible to a non-authority scaffold step* with zero governance act.
Concretely: if it is demonstrated that installing D49 default-deny, the D48 lifecycle owner routes, and
the VAULT-CONCEPT-ADOPTION two-way path require **no decision-gate, no owner determination, and no
enforcement** at mint time — that they are inert until a human later runs them — then the spine *is* just
templates, the scaffolder can carry it, and the System-5/baseline distinction does not bind here. Absent
that proof, the spine is a governance act and Mint is cav2's.
