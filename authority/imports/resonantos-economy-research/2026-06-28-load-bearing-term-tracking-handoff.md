# Handoff — Load-Bearing Term Tracking Discipline (Reciprocal Return Candidate)

Status: candidate evidence for CAV2 owner review — NOT CAV2 authority
Direction: `resonantos-economy-research` → CyberAlchemy v2
Date: 2026-06-28
Source repo: `/home/vrondelli/projects/resonantos-economy-research`
Owner route (CAV2): definitions-governance + constitution-governance +
discipline-governance; decision-gate for scope. No authority transfers until
that route runs.

## What this is

A reusable **anti-drift discipline** developed in the standalone economy research
repo. The rule: every *load-bearing term* cited in a formal rule, fixture
FAIL-region, candidate invariant, decidable rule, or claim-ledger entry must
resolve to a tracked definition ID; a new such term enters as `candidate` and
moves through a defined lifecycle as evidence arrives.

It is offered as **candidate method evidence**, classified onto CAV2's own
promotion routes (per `authority/imports/resonantos-economy-research/README.md`).
It is referenced by source path, not copied (per `authority/imports/README.md`
OQ-1: copy only after a promotion decision).

## Why it may be useful to CAV2

CAV2 supplies *method authority* — source posture, promotion discipline,
non-collapse rules. This discipline is in that lane: it is a general semantic-
authority hygiene rule, not an economy mechanism. The CAV2 imports README already
names "definitions-governance for load-bearing terms" and "constitution-governance
for structural rules" as promotion routes — this handoff is exactly that shape.

## Provenance / trigger

A decidable fixture FAIL-region (`Σ(emitted) > treasury` per `epoch`) was found
citing three load-bearing primitives — `treasury`, `epoch`, `emission` — with no
tracked definitions. A surface reconciliation pass had reconciled the *named
concepts* but missed the *symbols inside a formula*. The discipline closes that
gap class.

- Triggering finding: `research/four-surface-reconciliation/findings.md`
- Drift record: `definitions/DEFINITION-DRIFT-AUDIT.md` (2026-06-28 sections)

## Source artifacts (referenced by path — normative content stays at source)

| Artifact | Source path (in resonantos repo) | CAV2 promotion route |
| --- | --- | --- |
| `REC-C14` Load-Bearing Term Tracking (constitution rule) | `authority/constitutions/RESEARCH-CREDIBILITY-CONSTITUTION.md` | constitution-governance |
| `ER-D23` Load-Bearing Term Lifecycle (definition + `Lifecycle status:` field) | `definitions/DEFINITIONS.md` | definitions-governance |
| Candidate-term pattern (`candidate→grounded→promoted/residue/retired`, `Open / to-ground:` field) | `ER-D23` + the `ER-D24/D25/D26` candidate instances | discipline-governance (recurring practice) |

## The discipline in brief (summary; source is normative)

- **Trigger scope:** *formal-and-claims* — symbols/named quantities in a formal
  expression, fixture FAIL-region, candidate invariant, decidable rule, or the
  normative content of a claim entry. (Deliberately excludes ordinary prose.)
- **Lifecycle:** `candidate → grounded` (source kind + witness/typed-negative)
  `→ promoted` (owner gate); `candidate → residue` (no source); `→ retired`
  (no longer cited).
- **Card fields:** every new definition carries `Lifecycle status:`; every
  `candidate` carries an `Open / to-ground:` field naming the exact missing
  input. Pre-existing definitions read as `grounded` until individually revised
  (lazy migration).
- **Key invariant:** *candidate is not validation* — a decidable rule may not be
  called "fully specified" while any of its terms is still `candidate`.
- **Validation mode:** hybrid. A deterministic adapter (grep formal blocks +
  FAIL-regions against the definitions index for untracked symbols) is specified
  but `none-yet` (not built).

## Allowed use (CAV2)

- Adopt the load-bearing-term tracking pattern as a CAV2 definitions /
  constitution / discipline rule **through CAV2's own owner route**.
- Cite as a research-credibility / anti-drift pattern.

## Blocked use

- Treating this as CAV2 authority by proximity.
- Importing the economy-specific instances (`ER-D24` treasury, `ER-D25` epoch,
  `ER-D26` emission) as CAV2 terms — they are ResonantOS-local, gated, and not
  generalizable; they appear here only as the triggering instance.
- Promoting any claim via a cyclic citation chain alone (resonantos REC-C13).

## Unresolved / open findings

- The deterministic adapter is **not built** (`none-yet`); without it the rule is
  review-only.
- The `Lifecycle status:` field is not yet retro-applied to the pre-existing
  definitions (intentional lazy migration).
- Whether CAV2 wants this as a *definition*, a *constitution rule*, or a
  *discipline* artifact (or all three) is the CAV2 owner's decision.

## Public/private scrub status

Contains no private material or secrets. References local repository paths only.
Safe for CAV2 import staging.

## Non-transfer statement (resonantos REC-C13 / ER-D20)

This package transfers no CAV2 authority, proves no ResonantOS economy mechanism,
contains no validation report, and implements no behavior. It is candidate
evidence for an independent CAV2 owner route, which alone may decide any reuse.
