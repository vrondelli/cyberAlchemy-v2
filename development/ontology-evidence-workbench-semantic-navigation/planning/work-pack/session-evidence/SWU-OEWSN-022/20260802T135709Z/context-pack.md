# Runtime Context Pack: SWU-OEWSN-022

Session evidence only; this pack is not planning or implementation authority.

## Identity

- Task: `TASK-OEWSN-01B-SEMANTIC-BUILD-EVOLUTION`
- SWU: `SWU-OEWSN-022`
- Attempt: `20260802T135709Z`
- Resolution: explicit user selector
- Runtime: native bounded helper with parent-owned admission and closeout
- Authority effect: none

## Obligations

| ID | Obligation | Status | Controlling evidence |
| --- | --- | --- | --- |
| O-01 | preserve legacy build and v1 SWU-004 binding compatibility | covered | current builder test and immutable v1 binding |
| O-02 | validate exact v2 predecessor, owner and output identity | covered | selected task, admission contract and builder selectors |
| O-03 | preserve historical L1, overlay, first-working and patches 0001–0002 | covered | protected input refs and SWU-004 PASS receipt |
| O-04 | order the semantic patch after historical patches and reject path, repeat and collision drift | covered | task done criteria and current patch phase selectors |
| O-05 | derive typed-test discovery from the bound profile and reject count/path drift | covered | task done criteria and current typed-discovery selectors |
| O-06 | derive handle and output paths from the bound owner SWU | covered | task done criteria and current output-identity selectors |
| O-07 | keep writes and successor closeout exact | covered | SWU manifest, admission and closeout row |

Strict coverage: pass (7/7).

## Selected evidence

- `planning/work-pack/tasks/TASK-OEWSN-01B-SEMANTIC-BUILD-EVOLUTION.md`
  - Selectors: objective, SWU contract, done criteria, stop conditions
  - Covers: O-01 through O-07
- `planning/WORK-PACK.md`
  - Selectors: selected SWU, G-06 route, gate checks
  - Covers: O-02, O-07
- `planning/SWU-MANIFEST.json`
  - Selectors: SWU-OEWSN-004, 022, 005 and 006
  - Covers: O-01, O-02, O-07
- `planning/MUTATION-ADMISSION-CONTRACT.json`
  - Selectors: selected SWU, required preflight, protected inputs, forbidden scope
  - Covers: O-01 through O-07
- `planning/CLOSEOUT-SYNC-INVENTORY.json`
  - Selector: SWU-OEWSN-022 row and successor-admission rule
  - Covers: O-07
- `planning/work-pack/session-evidence/SWU-OEWSN-004/20260802T022042Z/receipt.json`
  - Selectors: PASS, builder/test postimages, protected identity result
  - Covers: O-01, O-03
- `planning/work-pack/session-evidence/SWU-OEWSN-005/20260802T030021Z/receipt.json`
  - Selectors: blocker, zero product mutation and unblock actions
  - Covers: O-02, O-04, O-06, O-07
- `implementation/ontology-evidence-workbench/upstream/OEWSN-BUILD.binding.json`
  - Selectors: v1 binding, historical base, current typed/output contract
  - Covers: O-01, O-03, O-05
- `implementation/ontology-evidence-workbench/scripts/build-thin-prototype.mjs`
  - Selectors: semantic output validation, semantic binding validation, patch application, typed discovery and handle emission
  - Covers: O-01 through O-06
- `implementation/ontology-evidence-workbench/test/thin-prototype-build.test.mjs`
  - Selectors: CLI/path, v1 binding, typed discovery and patch negative tests
  - Covers: O-01, O-04, O-05

## Execution contract

### Material writes

- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/scripts/build-thin-prototype.mjs`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/thin-prototype-build.test.mjs`

### Execution outputs

- `cyberAlchemy-v2/development/ontology-evidence-workbench-semantic-navigation/planning/work-pack/session-evidence/SWU-OEWSN-022/20260802T135709Z/receipt.json`

### Validation commands

1. `node --experimental-strip-types --test cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/thin-prototype-build.test.mjs`
2. `sha256sum --check cyberAlchemy-v2/development/ontology-evidence-workbench-semantic-navigation/planning/work-pack/session-evidence/SWU-OEWSN-022/20260802T135709Z/protected-identities.sha256`
3. `git diff --check -- cyberAlchemy-v2/implementation/ontology-evidence-workbench/scripts/build-thin-prototype.mjs cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/thin-prototype-build.test.mjs`

Write profile: `material-bound`. Lifecycle owner: `task-session`. Authority:
`private`. Publication: `internal`. Live validation is mandatory.

## Implementation guidance

- Preserve the v1 schema and current SWU-004 behavior as a compatibility path.
- Add a versioned v2 cumulative-binding path; do not reinterpret v1.
- A v2 binding must bind an exact predecessor artifact and equality-check its
  historical base. Owner and output SWU identities must match.
- The semantic patch phase is cumulative and follows historical patches. It is
  apply-once, path-confined and collision-rejecting.
- Typed files and expected counts come from the validated binding profile.
- Handle and output identities derive from the validated binding owner.
- Tests must include one positive v2 fixture plus predecessor, historical-base,
  owner, output, order, path, reapply, collision and typed-contract negatives.

## Constraints and non-goals

- Do not edit the v1 binding, L1 lock, overlay manifest, first-working manifest,
  patches 0001–0002, patch 0003, UI, ontology or planning artifacts.
- Do not create a package root, make network calls, run browser work, publish,
  promote, release or deploy.
- Do not implement relation rendering. SWU-OEWSN-005 remains separate.
- Preserve `OEWSN-RELATION-DUPLICATE-TUPLES` as unrelated fail-closed residue.

## Decisions

No unresolved user decision. The approved strategy already separates reusable
builder evolution from UI behavior. Internal fixture/schema naming is a
reversible implementation detail constrained by the explicit v1/v2 contract.

## Fallback rule

No broad repository search. Inspect only the two writable files and the named
read-only binding/historical artifacts. Any need to widen scope blocks.

## Closeout

On terminal PASS, the exact Invoke Refresh closeout inventory is WORK-PACK,
EXECUTION-PACK, SWU-MANIFEST, MUTATION-ADMISSION-CONTRACT, TASK-OEWSN-01B and
this terminal receipt. The unique declared successor is SWU-OEWSN-005, but it
may be selected only after binding the actual builder/test postimages.
