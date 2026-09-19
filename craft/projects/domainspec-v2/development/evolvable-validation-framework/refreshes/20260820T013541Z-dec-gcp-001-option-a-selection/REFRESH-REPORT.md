---
artifact: refresh-report
spell: invoke
mode: refresh
run_id: 20260820T013541Z-dec-gcp-001-option-a-selection
target: projects/domainspec-v2/development/evolvable-validation-framework
activation_source: direct-user
mutation_mode: proposal-only
mutation_mode_source: explicit
phase_status: flag
handoff_status: deferred
mutation_ready: false
evidence_date: 2026-08-20
---

# Invoke Refresh — DEC-GCP-001 Option A Selection

## Outcome Brief

The owner selected Option A for `DEC-GCP-001`, so the Evolvable Validation
Framework finally has a permitted source of meaning and `SWU-GCP-001` is no
longer blocked on `FORMAL_PREDICATE_MISSING`. This Refresh revalidated the
frozen Candidate A package against live bytes, confirmed it is materially
intact seven days after the freeze, and scoped the exact 36-target apply the
selection unlocks. It stops short of that apply, and it also stops short of
completing its own authoring job: only 11 of the 36 apply targets have exact
bytes ready.

- Objective: convert the Option A selection into an exact, evidence-backed
  apply scope for the EVF planning corpus without mutating any canonical target.
- Result: selection recorded as a typed signal; freeze revalidated at 43/44
  targets byte-exact; 11/11 owner-material postimages verified; **25 of 25
  invoke-owned planning postimages are unauthored**, which keeps the apply
  incomplete.
- Why it matters: the decision that was blocking EVF is resolved, but the
  remaining work is a concrete authoring job with a known denominator rather
  than another design question.

## Boundary and Next Decision

- **Changed:** only this run directory
  (`REFRESH-REPORT.md`, `refresh-report.json`, `REFRESH-PATCH-PROPOSAL.md`).
- **Unchanged:** every one of the 26 canonical planning targets, all 11
  owner-material targets (still absent, as declared), the EVF root-level
  `REFRESH-REPORT.md` / `refresh-report.json` from the earlier run, all
  implementation bytes, semantic authority, relationship/profile authority,
  Task Session state, Git index, release, publication, deployment, production.
- **Open questions:** whether the 25 planning postimages are authored in one
  bounded job or split across several; and whether the uncommitted Arcanum
  invoke apply path is reviewed and committed before or after that authoring.
- **User decision:** authorize the bounded postimage-authoring job, and decide
  the disposition of `spells/invoke/scripts/refresh_material_handoff.py`.
- **Next action:** a bounded Invoke Refresh authoring pass that materializes the
  25 planning postimages and their digests. Not Task Session. Not the apply.

## Technical Details

## Invoke Result

- Mode: refresh
- Spell: invoke
- Canonical ID: invoke
- Scope: library
- Phase status: `flag`
- Phase status basis: the proposal is exact and complete for every target it
  covers, but one `refresh-authoring` blocker remains open — 25 planning
  postimages required by the inventory invariant
  `planning_updates_require_exact_postimages_before_apply` do not exist.
- Handoff readiness: `deferred`
- Mode contract: `arcanum/spells/invoke/refresh.md`
- Outputs: `REFRESH-REPORT.md`, `refresh-report.json`,
  `REFRESH-PATCH-PROPOSAL.md`
- Mutation mode: `proposal-only` (explicit; overrides the `direct-user`
  default of `apply-approved`)
- Mutation ready: `false`
- Material package: not required for `proposal-only`; none supplied, none
  validated
- Next route: bounded Invoke Refresh postimage authoring

## Selection Recorded

`DEC-GCP-001` = **Option A — EVF-local machine capsule**, selected by the
semantic owner on 2026-08-20.

The selection is recorded here as a typed signal only. It is **not** yet
written to
`decisions/2026-07-20-key-and-door-formal-source.md`, because that file is an
`invoke-refresh`-owned planning target whose allowed delta
(`owner-selected-r1-decision-and-exact-material-digests`) requires an exact
authored postimage before apply. Recording the selection by direct edit would
bypass the authority split the package depends on.

## Freeze Revalidation, 2026-08-20

The Candidate A package was frozen at repository observation
`1c34f89967bbf7691fd782d7108f3ee7e33869d5` on 2026-08-13. Revalidated today
against live bytes:

| Class | Declared | Verified | Result |
| --- | ---: | ---: | --- |
| Planning targets | 26 | 26 | all match declared present/absent + digest |
| Owner-material canonical targets | 11 | 11 | all still absent, as declared |
| Owner-material postimages | 11 | 11 | all hash exactly to declared digests |
| Implementation targets | 18 | 17 | 1 drift |

**The single drift** is `projects/domainspec-v2/impl/package.json`,
3650 → 3726 bytes. The change is the addition of a `validate:format` script
plus a unicode re-escape of the `description` field — both from unrelated
format-honesty work (`WP-FMT-001`). The inventory already classified this
target as `worktree_status: modified-unrelated-owner-bytes`, owner
`current-user-worktree`, allowed delta
`surgical-add-scripts.verify:evf-s1-only-preserve-all-current-bytes`. The
drift is therefore in-class and benign, but the recorded preimage digest
`c36f88e3…` is now stale and must be re-observed before Task Session
admission, per invariant `rehash_immediately_before_task_session_mutation`.

Conclusion: the freeze is materially intact and Option A can be acted on
without regenerating the owner-material corpus.

## Apply Scope Unlocked By The Selection

36 targets pre-audit, 37 post-audit:

| Group | Count | Owner | State |
| --- | ---: | --- | --- |
| Planning docs to update | 19 | `invoke-refresh` | present; postimages **unauthored** |
| Work-pack files to create | 6 | `invoke-refresh` | absent; postimages **unauthored** |
| Owner-material files to create | 11 | `invoke-refresh` after selection | absent; postimages **ready and verified** |
| Independent audit receipt | 1 | `independent-reviewer` | created after the 36-target audit |

Per-target deltas are enumerated in `REFRESH-PATCH-PROPOSAL.md`.

## Blocking Finding — 25 Unauthored Postimages

`proposals/candidate-a/postimages/` contains exactly 11 files, all
owner-material. No postimage exists for any of the 25 `invoke-owned` planning
targets. The refine run's validation statement — "eleven Candidate A material
postimages match their exact digests and sizes" — is accurate and was never a
claim about the planning corpus.

This is Invoke Refresh's own declared gate-1 work
("author and validate exact staged canonical planning postimages"), so it is
scoped `refresh-authoring`, not `apply-authorization`. It is the reason this
run returns `flag` rather than `pass`.

## Blocking Finding — Uncommitted Arcanum Apply Path

`arcanum/spells/invoke/scripts/refresh_material_handoff.py` carries 143
uncommitted added lines introducing `resolve_file_bound_refresh_handoff`,
which revalidates current material bytes and rejects stale embedded receipts.

Assessed, not assumed:

- the module imports cleanly; `material_package_validator.py` is tracked and clean;
- the new CLI arguments are optional, so the legacy path is preserved;
- at live lines 239–240 the new function returns `resolve_refresh_handoff(...)`
  unchanged whenever `mutation_mode != "apply-approved"`.

Therefore the uncommitted logic is **unreachable from this `proposal-only`
run** and reachable only from the apply. The change is stricter than the
committed baseline and is well-matched to a seven-day-old freeze, but it is
unreviewed and `arcanum` is the public submodule. It must be reviewed and
committed before it executes a 36-target apply.

Provenance is unresolved: the file was last modified 2026-08-13 20:11 +0100,
the same evening as the EVF refine run, but that run's
`refine-dispatch-governance-defect.json` records
`canonical_generator_changed: false` and `sidecar_write_count: 0`, and its
defect was in `generate-refine-dispatch.py`. The change cannot be attributed
to this package.

## Arcanum Binding Note

The `CRAFT.md` caution about Arcanum instability ("dirty count moved 12→13
within seconds") was verified and **does not apply to the invoke route**. Of
the 8 modified tracked files, only `arcana/ontology-vault/SKILL.md` is recent
(2026-08-20 01:50); the `task-session-until-blocker` files are stable since
2026-08-16 and the invoke script since 2026-08-13. The caution remains correct
for the Task Session chain.

## Dispatch Technique Trace

| Technique | Trigger | Affected phase/artifact | Validation expectation |
| --- | --- | --- | --- |
| `sequence` | ordered gate 1–5 route after selection | apply scope table | later gates never precede postimage authoring |
| `owner_boundary_check` | 4 distinct owners across 37 targets | apply scope table, blocker scoping | no owner writes another owner's target |
| `concrete_path_evidence` | every claim must name exact bytes | freeze revalidation table | each row re-derived from live files |
| `authority_split_gate` | selection must not become an edit | selection recorded as signal only | decision file left unmodified |
| `residue_ledger` | stale digest + unreviewed WIP survive this run | blocker list | both carried, neither silently closed |
| `validation_loop` | freeze is 7 days old | revalidation section | 44 targets + 11 postimages rehashed today |

Skipped: `scu_swu_reduction` and `recomposition_proof` — SWU decomposition is
already fixed by the accepted Candidate A plan and is not re-opened here.
`frame_handoff` — no new thread is being opened.

Full dispatch document: not required. This run delegates no work, spawns no
subagent, crosses no capability boundary, and creates no reusable route.

## Distill

Skipped, with rationale. The output is a single narrow status-and-scope
delta over one already-decomposed work-pack. No unit boundary, recomposition
claim, or scope reduction is proposed, so Distill has nothing to reduce. Per
the refresh contract, Distill is triggered only when refresh output is broad,
ambiguous, or overbuilt.

## Validation Performed

- 26/26 planning targets rehashed against declared digests — all match
- 11/11 owner-material canonical targets confirmed absent
- 11/11 owner-material postimages rehashed — all match declared digests/sizes
- 18 implementation targets rehashed — 17 match, 1 in-class drift identified
- `refresh_material_handoff.py` import smoke test — passes
- `refresh_material_handoff.py` proposal-only fall-through — confirmed in live bytes
- postimage inventory count — 11 present, 25 absent

## Blockers

| ID | Scope | Owner | Status | Claim |
| --- | --- | --- | --- | --- |
| `BLK-EVF-POSTIMAGES-UNAUTHORED` | refresh-authoring | invoke-refresh | open | 25 invoke-owned planning postimages do not exist; the inventory forbids apply without them |
| `BLK-EVF-APPLY-AUTHORIZATION` | apply-authorization | semantic owner | open | the exact 36-target apply requires separate explicit authorization |
| `BLK-EVF-ARCANUM-WIP-APPLY` | apply-authorization | arcanum owner | open | the invoke apply path runs 143 uncommitted unreviewed lines in the public submodule |
| `BLK-EVF-PKGJSON-PREIMAGE-STALE` | target-lifecycle | task-session | open | `impl/package.json` preimage digest is stale; rehash required immediately before mutation |
| `BLK-EVF-INDEPENDENT-AUDIT` | audit | independent-reviewer | open | target 37 requires an independent audit of the applied 36-target corpus |

## Claim Ceiling

This run proves that Option A was selected, that the frozen package is still
valid, and that the apply scope is exactly 36 targets of which 11 are ready.
It proves nothing about EVF correctness, implementation conformance, profile
admission, release, publication, deployment, or production readiness. No
receipt produced here is admitting evidence.
