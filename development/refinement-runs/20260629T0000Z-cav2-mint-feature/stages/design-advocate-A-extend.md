---
stage: design
role: advocate-A
position: extend-domainspec-new-repo
target: cav2 "Mint" (authority-spine repo-minting)
date: 2026-06-29
authority_cites:
  - implementation/domainspec/.claude/skills/domainspec-new-repo/SKILL.md
  - cyberAlchemy-v2/authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md (CAV2-C17)
  - cyberAlchemy-v2/authority/definitions/DEFINITIONS.md (CAV2-D48, CAV2-D49)
  - projects/goldenquill (hand-built domainspec-new-repo precedent)
  - ../resonantos-economy-research (hand-minted sibling) + cyberAlchemy-v2/authority/imports/resonantos-economy-research/
---

# Advocate A — Mint as a cav2-authority PROFILE of `domainspec-new-repo`

## Thesis

Mint is **not a new skill**. It is a cav2-authority **profile** of the already-validated
`domainspec-new-repo` scaffolder — one new "authority-spine seed" step layered onto a tool
that already solves every hard part of standing up a domain-specialized sibling repo. The
hard parts of minting are not "what is an authority kind" — they are *filesystem and
provenance* problems: materialize a partition tree, attach a shared framework half across a
**clone-safe** boundary, canonicalize sessions, gate-first dry-run, write a provenance node.
`domainspec-new-repo` already solved all five, *and paid down two disk-confirmed defects to
get there*. Re-deriving that machinery inside a fresh "Mint skill" re-opens both defects from
zero. Under CAV2-C17 (Precedent Sweep Before Net-New), a found owner is a **positive** result
and the verdict is **build-from-owned**, not net-new. `domainspec-new-repo` is that owner.

## The owned parts I reuse (cited to `domainspec-new-repo/SKILL.md`)

Every one of these is a hard, *already-validated*, defect-paid mechanism a new skill would
have to re-earn. Citations are to
`implementation/domainspec/.claude/skills/domainspec-new-repo/SKILL.md`:

1. **The partition tree, parameterized — not hardcoded.** `<target-tree>` + the
   `<resolved-source-map>` materialize `knowledge/ implementation/ research/ sessions/
   schema/` with README stubs carrying correct `node_type: readme` frontmatter. Crucially
   (line 38, line 54): *"The seeded framework inventory is RESOLVED from `--source` at run
   time — not hardcoded to goldenquill's literal file list — so the skill scaffolds ANY
   consumer repo."* The minting target ("cast the MOLD onto a domain") **is** "any consumer
   repo from a framework path." cav2 is just another `--source`.

2. **The clone-safe framework attach — the load-bearing defect-fix.** DEFECT 1 (lines 34–35):
   goldenquill attached the framework via **absolute/local symlink shims that broke on clone**
   — `knowledge/vault/ontology-conventions.md` came back as a one-line path string, not a doc.
   The skill's fix: default `--attach submodule`, demote symlink to a warned opt-in, and
   **Step 7 VERIFY (Bash, non-negotiable)** that the canon resolves to a real non-empty doc.
   A minted authority repo has the *exact same* attach problem — it must mount the cav2
   framework half (and the authority spine) across a clone-safe boundary. This is the single
   most expensive thing to get right, and it is already paid for.

3. **Single-sessions canonicalization.** DEFECT 2 (line 36): goldenquill shipped **two**
   `sessions/` dirs with no canonical pick. The skill canonicalizes to one (`sessions/`
   top-level) and **refuses to emit the second**. A new Mint skill that re-models sessions
   from scratch re-rolls this dice.

4. **Gate-first `--dry-run` default + single master gate.** `<modes>` + Step 5: dry-run is the
   default, Steps 1–4 read/plan/write-nothing, one `AskUserQuestion` master gate, abort ⇒
   nothing persists. This is *exactly* the cav2 posture ("Nothing here is enforced yet
   (gate-first)" — the skill even writes that line into the root README, line 75). The mint of
   an **authority** repo demands gate-first more than anything; the owner already enforces it.

5. **The provenance session node + idempotent/non-clobbering invariants.** Step 8 writes
   `sessions/<...>-scaffolded-by-domainspec-new-repo.md` with `is_session: true`,
   `node_type: discovery`, forward-only edges (`derives-from`, `cites`), recording the
   resolved decisions and which choices were witnessed vs transferred. INVARIANTS (line 50):
   idempotent + non-clobbering, always-on provenance, always-on SEED-GAP reporting. Minting
   needs *all of this* and adds nothing novel to it — a mint is a provenance event by
   definition.

6. **The SEED-GAP discipline.** A partition with no resolvable source is reported, never
   fabricated (lines 54, 114). For an authority mint this is the safety rail that stops a
   half-attached spine from masquerading as a real one.

A net-new Mint skill must re-implement #2, #3, #5, #6 from scratch — and #2 and #3 are
**named, disk-confirmed defects**. Re-deriving them re-introduces them. That is the core of my
case.

## Why the spine is just a seed step

The cav2 authority spine — authority kinds (D49 closed enumeration), the definitions tower,
the constitutions, the promotion lifecycle (D48) — is **additive content**, not a different
scaffolder. The skill already has the exact shaped slot for it:

- `<resolved-source-map>` already does a **process-copies vs architecture-stubs split** on the
  dev constitutions (lines 64–67): COPY the editable process constitutions, STUB the
  architecture-specific ones, *resolved from `--source`*. The cav2 authority spine slots into
  the **same mechanism**: with `--source <cav2-spine>`, the resolver copies the editable
  `authority/definitions/` tower + `authority/constitutions/` as real seeds and stubs what the
  domain must fill. The skill *already distinguishes "ship this editable" from "stub this for
  the domain to fill."* That is precisely what casting a MOLD is.

- The whole point of `--source` (line 43) is that the framework half is *resolved, not
  baked-in*. cav2's authority spine is a framework half. The seed step is one addition:
  **"after the framework attach (Step 7), drop in the authority/ kinds + definitions tower +
  constitution import as a resolved-source cohort, and VERIFY the spine canon resolves the
  same way the ontology canon already does."** It reuses the Step-7 verify harness verbatim.

- The two real precedents support this. `goldenquill` (`projects/goldenquill`) is the
  hand-built `domainspec-new-repo` instance the skill codifies. `resonantos-economy-research`
  (the sibling at `../resonantos-economy-research`, with its cav2 import surface at
  `cyberAlchemy-v2/authority/imports/resonantos-economy-research/`) is the hand-minted
  authority sibling. **Both were hand-done.** The skill exists *specifically to mechanize the
  goldenquill hand-build*; Mint's job is to mechanize the *resonantos* hand-build the same way.
  The natural shape of "mechanize a hand-build" is "extend the skill that already mechanizes
  the homologous hand-build," not "fork a parallel one."

- **CAV2-C17 / build-from-owned is not a nicety here — it is the governing rule of the very
  repo Mint serves.** C17
  (`STABLE-REPOSITORY-CONSTITUTION.md` §CAV2-C17): *"Before any capability emits a … net-new
  verdict … it must first sweep for an existing owner in-repo. A found owner is a positive
  result, never a kill."* A Mint skill *is itself* a candidate capability subject to C17.
  `domainspec-new-repo` is the owner the sweep finds. Building a parallel Mint skill is the
  textbook C17 violation: emitting net-new with an owner sitting right there.

## Rebuttal to B

**B's strongest objection:** *"The authority spine is castings/kinds/promotion (D48/D49) — a
different KIND of artifact than DomainSpec's doc tree. Bolting it onto domainspec-new-repo
overloads a skill scoped to a doc partition tree; the seed step isn't 'one step,' it's a
second scaffolder wearing a trench coat."*

Three rebuttals:

1. **The skill is already kind-heterogeneous — it does not scaffold a uniform "doc tree."** It
   attaches read-only canon (`vault/**`), copies *editable* constitutions, copies *runnable*
   `code-ontology/` + experiments machinery (real files, "never symlink these," lines 60–61),
   stubs architecture-specific constitutions, and writes a provenance session. That is at
   least **five distinct artifact kinds with five distinct mechanisms already**. The authority
   spine is a sixth cohort with the *same* copy-vs-stub-vs-attach choices the resolver already
   makes. "Different kind of artifact" is the rule, not the exception, in this skill.

2. **D49 cuts the other way for B.** D49 closes the enumeration of *authority kinds* and
   default-denies unenumerated ones — it is a **content/governance invariant about what the
   minted repo may contain**, not a statement about *which tool lays the files down*. Minting
   does not *create new authority kinds*; it casts the **existing** enumerated spine onto a
   domain. So the artifact Mint emits is governed by D49 regardless of which skill emits it —
   and a thin profile of `domainspec-new-repo` is the lower-risk way to stay inside the closed
   enumeration, because it *resolves the spine from the canonical `--source`* instead of
   re-typing kinds by hand (where a fresh skill could drift and accidentally mint an
   unenumerated kind — a D49 default-deny violation).

3. **"Overload" is a real cost, but it is a frontmatter/profile boundary, not a fork.** The
   honest concession-shaped version of B's worry is maintainability. The answer is a **profile
   flag** (e.g. `--profile cav2-authority` or a sibling `--source` cohort), not a fork: one
   body, one set of defect-fixes, one Step-7 verify harness, with the authority-spine cohort
   gated behind an explicit flag so the DomainSpec consumer path is untouched. One maintenance
   surface; one place the clone-safe-attach fix lives; one place the sessions canon lives.

## Convergence criterion (what fact makes me concede to B)

I concede and support a **net-new Mint skill** if the precedent-miner shows that **minting an
authority repo requires a step that is structurally incompatible with `domainspec-new-repo`'s
gate/attach/provenance contract — not merely additive content.** Concretely, I concede if
**either**:

- (a) The hand-built `resonantos-economy-research` mint required a **mutation of an
  already-attached framework artifact** (editing the canon, re-typing an authority *kind*, or
  a back-edge in the provenance graph) — because `domainspec-new-repo` treats the attached
  canon as **read-only-by-intent** and writes **forward-only** session edges (Step 8,
  `<anti-patterns>`). If minting must *write into* the spine rather than *cast it forward*, it
  breaks the owner's core invariant and earns net-new. **OR**
- (b) Minting must **add or alter an authority KIND** (a D49 enumeration change) as part of the
  cast — not just instantiate enumerated kinds — because that is an owner-gated authority act
  (D49: "Adding a kind is itself owner-gated"), categorically outside a scaffolder's remit, and
  no `--profile` flag should smuggle it.

Absent (a) or (b), the spine is additive content over a solved scaffolder, and C17 binds: the
verdict is **build-from-owned (extend), not net-new (fork).**

---

### Return-message thesis (for chat)

Mint = a `--profile cav2-authority` extension of `domainspec-new-repo`, not a new skill.
