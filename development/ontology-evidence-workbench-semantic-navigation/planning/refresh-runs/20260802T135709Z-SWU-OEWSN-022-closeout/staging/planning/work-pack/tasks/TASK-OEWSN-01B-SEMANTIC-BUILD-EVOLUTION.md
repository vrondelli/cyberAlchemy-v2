# TASK-OEWSN-01B: Semantic Build Evolution

Status: complete-terminal-pass. SWU-OEWSN-022 kept reusable build-contract
behavior separate from the selected-edge renderer and completed in Task
Session attempt `20260802T135709Z`. Product mutation for the selected successor
remains unauthorized until a fresh SWU-OEWSN-005 Task Session admission receipt
passes.

## Objective

Generalize the existing fail-closed semantic-navigation builder from one fixed
SWU-OEWSN-004 identity to a versioned cumulative-binding chain without changing
historical inputs or rendering behavior.

## SWU-OEWSN-022 — Admit versioned cumulative semantic bindings

- Primary behavior: validate and execute one exact per-SWU cumulative binding
  whose owner, predecessor and output identities agree.
- Independent acceptance: the legacy v1 SWU-OEWSN-004 binding remains
  compatible, one v2 positive fixture passes, and predecessor/base/owner/output/
  order/collision negative controls fail closed.
- Split analysis: binding validation and runner identity derivation are one
  reusable build-contract behavior. UI semantics remain SWU-OEWSN-005.
- Dependency: SWU-OEWSN-004 terminal PASS.
- Material write scope: `scripts/build-thin-prototype.mjs` and
  `test/thin-prototype-build.test.mjs` only.
- Execution output: terminal Task Session receipt only.
- Read-only preimages:
  - `upstream/OEWSN-BUILD.binding.json` —
    `bfc9ff752d6bd829496715383721ad9276098d868e3f8204bed88105f70719de`,
    5312 bytes;
  - builder —
    `d4d22d40276f5d68b005dfe0123c3e7104ef103af0909a4eec8b479d8c08ae94`,
    41911 bytes;
  - builder test —
    `3f3a96a987d5f0aa5fd848907519900da9ef7c8102bd45834f6934055dfbafbe`,
    9989 bytes.
- Historical invariants: `L1-BUILD.lock.json`, the base overlay manifest,
  first-working manifest and patches 0001–0002 remain byte-exact. The v2 chain
  references an exact predecessor binding digest; semantic patching occurs only
  after historical patches; no historical artifact is rewritten.
- Done criteria:
  - legacy build and v1 binding tests remain compatible;
  - v2 validation equality-checks predecessor digest, owner SWU and output SWU;
  - typed-test contract is binding-owned and count/path drift fails closed;
  - patch order, apply-once, path confinement and collision policy fail closed;
  - emitted handle and output paths derive from the bound owner rather than a
    hard-coded SWU.
- Validation: `node --experimental-strip-types --test
  test/thin-prototype-build.test.mjs`, legacy build compatibility, protected
  identity hashes, exact material/output algebra and scoped whitespace.
- Handoff: terminal and owner PASS bind the actual builder/test postimages into
  SWU-OEWSN-005, select it and refresh admission without executing it.

## Terminal evidence

- Task Session receipt:
  `planning/work-pack/session-evidence/SWU-OEWSN-022/20260802T135709Z/receipt.json`
  (`a4f09ae43685d810a575fd3ab3b4308aa256e1a8e03849098bf8e1ce1ee48851`,
  7229 bytes, `PASS`).
- Builder postimage:
  `6a762811808932c698ebebb7eb176b27bf7f65c5153ef03edc9010a26c9aee24`,
  64405 bytes.
- Builder-test postimage:
  `bdb5d6440533134c23fd6504f45ae4214ec59f12b751e68574b2ba327134de18`,
  24823 bytes.
- Validation: 21 builder tests passed; v1 compatibility, exact predecessor and
  historical-base equality, owner/output identity, ordered multi-target
  modify/create patch confinement, apply-once/collision controls,
  binding-owned typed tests, deterministic semantic patch snapshot, protected
  identities and exact write algebra passed.
- Noncritical residue remains `OEWSN-022-FIXTURE-ONLY-V2` and
  `OEWSN-RELATION-DUPLICATE-TUPLES`; SWU-OEWSN-005 owns the real v2
  binding/patch/full-build/browser evidence frontier.

## Stop conditions

Any historical identity drift, compatibility regression, owner/output mismatch,
unordered or repeatable semantic patch, path escape, collision acceptance,
unexpected write, or missing negative fixture blocks before successor selection.

## Claim ceiling

Candidate-local build-contract evidence only. This task has no UI, ontology,
promotion, release, deployment, production or human-outcome effect.
