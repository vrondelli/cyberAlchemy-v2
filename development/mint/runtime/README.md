# Mint executable runtime

This directory contains a bounded executable Mint runtime for deterministic typed authority-package
validation, pilot-input admission, effect planning, Stage-2 rendering, and create-only application
to an absent private target.

It does not call the scaffolder, create or attach a repository, run Git or a subprocess, classify an
authority kind, ratify authority, sign an act, promote anything, or mint Zagr. L0 and the deferred
Stage-3/4 effects remain plans only.

## Commands

```bash
python3 cyberAlchemy-v2/development/mint/runtime/mint.py template-set-digest
python3 cyberAlchemy-v2/development/mint/runtime/mint.py package-check \
  --input cyberAlchemy-v2/development/mint/runtime/tests/fixtures/authority-package/valid-minimal.json
python3 cyberAlchemy-v2/development/mint/runtime/mint.py package-render \
  --input cyberAlchemy-v2/development/mint/runtime/tests/fixtures/authority-package/valid-minimal.json
python3 cyberAlchemy-v2/development/mint/runtime/mint.py transition-check \
  --request /absolute/path/to/transition-request.json
python3 cyberAlchemy-v2/development/mint/runtime/mint.py package-cedar \
  --input cyberAlchemy-v2/development/mint/runtime/tests/fixtures/authority-package/valid-minimal.json
python3 cyberAlchemy-v2/development/mint/runtime/mint.py package-fol \
  --input cyberAlchemy-v2/development/mint/runtime/tests/fixtures/authority-package/valid-minimal.json
python3 cyberAlchemy-v2/development/mint/runtime/mint.py marketplace-remint \
  --request /absolute/path/to/marketplace-remint-request.json
python3 cyberAlchemy-v2/development/mint/runtime/mint.py pilot-check \
  --contract /absolute/path/to/pilot-contract.json
python3 cyberAlchemy-v2/development/mint/runtime/mint.py plan --manifest /absolute/path/to/manifest.json
python3 cyberAlchemy-v2/development/mint/runtime/mint.py render \
  --manifest /absolute/path/to/manifest.json \
  --plan /absolute/path/to/plan-output.json \
  --bindings /absolute/path/to/render-input.json
python3 cyberAlchemy-v2/development/mint/runtime/mint.py apply \
  --manifest /absolute/path/to/manifest.json \
  --plan /absolute/path/to/plan-output.json \
  --bindings /absolute/path/to/render-input.json \
  --render /absolute/path/to/render-output.json \
  --request /absolute/path/to/apply-request.json
python3 cyberAlchemy-v2/development/mint/runtime/mint.py recover \
  --manifest /absolute/path/to/manifest.json \
  --plan /absolute/path/to/plan-output.json \
  --bindings /absolute/path/to/render-input.json \
  --render /absolute/path/to/render-output.json \
  --request /absolute/path/to/apply-request.json
```

`package-check` is the no-write validator for `authority-package.v0.1`. It checks the closed Draft
2020-12 schema and cross-record semantics: stable identity/reference closure, governed-action
linkage, D21 four-facet accounting, D18 typed residue, D23 status-axis separation, private source
bindings, complete ordered B1-B9 inventory, bidirectional kind/method equality, owner-bound
promotion linkage, and per-semantic-unit projection declarations. It prints one canonical
`mint.authority-package-validation-receipt.v0.1` directly to stdout. Exit status is `0` for `valid`
and `2` for `blocked`. Receipt identity excludes input paths and timestamps; semantic hashing sorts
record families by stable ID and arrays declared as sets. Both results report zero effects, writes,
subprocesses, network calls, Git operations, and authority effect.

This command validates candidate-local meaning only. It does not compile Markdown, execute Cedar,
check FOL, render, apply, remint Marketplace or Zagr, ratify an authority kind, or promote anything.

`package-render` consumes that validated typed package as its only semantic input and emits an
in-memory Markdown package with the same exact 18 Stage-2 destination paths used by the existing
runtime. It proves B1-B9 presence in both baseline views and emits deterministic package/receipt
digests. It does not use or mutate the legacy templates, IR, renderer, apply runtime, or target.

`transition-check` verifies a transition record against exact package, owner-decision,
owner-receipt, and replay-ledger bytes. A `transition-ready` result means only that the bound owner
evidence is coherent and the receipt ID has not already been recorded as consumed. The command is
read-only: it does not consume the receipt, update the replay ledger, change package state, ratify,
promote, deprecate, retire, or write a target.

`package-cedar` maps each supported one-method/one-authority-kind semantic unit into the strict
`cedar-internal-subset.v0.1`, parses the emitted statement back into a typed relation, and requires
exact field parity. Multi-kind methods produce a field-complete translation residue instead of an
ambient choice. This is an internal structural check, not official Cedar engine evaluation, an
authorization decision, or runtime enforcement.

`package-fol` maps rule-to-constitution and method-to-authority-kind relations into the strict
`tptp-fof-internal-subset.v0.1`. It parses every emitted fact and three fixed quantified structural
invariants back into typed ASTs and checks exact relation parity. This is not a theorem prover,
satisfiability result, proof of each normative rule, or enforcement runtime.

`marketplace-remint` is the only target-writing command in this authority-package extension. It
first validates the semantic package, Markdown, internal Cedar subset, and internal TPTP FOF subset
entirely in memory. It then exclusively creates exactly 24 files—18 Markdown views, one Cedar file,
one FOL file, and four component receipts—in an absent direct child of the fixed SWU-06 evidence
root. It binds and rechecks a read-only Zagr tree digest before and after. It cannot target Zagr,
promote candidate authority, call a network, or run Git.

`pilot-check` is the no-write front door for a later Zagr pilot. It accepts one strict
`mint.pilot-contract.v0.1` document, re-hashes every bound evidence file, checks the active runtime,
templates and Stage-2 IR, requires one current primary source and an independent authority owner,
and rejects unresolved precedence or non-pending ratification. It also requires an absent private
target outside this workspace, separate narrow allowed and journal roots, explicit protection for
the workspace, Zagr, sources and evidence, and a before-snapshot of selected Zagr files. It emits a
canonical `mint.pilot-validation-receipt.v0.1` on stdout. Exit status is `0` for
`admission-ready` and `2` for `blocked`; either result reports zero effects, writes, subprocesses,
network calls and Git operations. The command never invokes `plan`, `render`, `apply`, `recover`, or
the scaffolder.

`plan` emits one canonical JSON object to stdout and has no output-file flag. Exit status is `0` when
the plan is ready and `2` when admission is blocked. Both outcomes carry a plan and a zero-mutation
receipt. In the receipt, `stdout_sha256` binds the canonical `plan` object (the pre-receipt stdout
payload), avoiding a self-referential receipt hash.

`render` consumes the exact ready P0 output and a strict typed bindings document. It compiles the 18
Stage-2 effects entirely in memory and emits canonical JSON; it never writes the target. Each file
record binds its effect ordinal, destination, source-template digest, content bytes and digest,
plan ID, manifest digest, and template-set digest. The legacy templates are evidence inputs rather
than programs for global token substitution.

`apply` consumes that exact render package and a `mint.apply-request.v0.1` document. It rechecks the
current plan, templates, render IR, renderer, paths, and rendered bytes before mutation. It creates
the absent target and exactly those 18 files with exclusive creation, writing an append-only,
fsynced journal under a separate narrow journal root. It never overwrites existing bytes.

`recover` is attempt-specific. It removes only journal-owned files whose current digest still
matches the recorded created bytes, followed by exact empty directories. Tampered files block the
whole file-removal phase. Recovery does not recursively delete a tree or remove unowned content.

The caller supplies `run_date`; wall-clock time never enters the plan. The target must be an absent
direct child of a narrow existing `allowed_root`, outside this workspace and disjoint from every
protected/source path. The journal root must already exist and be narrow, non-symlinked, and
disjoint from the target, allowed root, workspace, sources, and protected paths. This runtime
supports private visibility and the currently planned `submodule` attachment mode only.

## Effect and owner boundary

- L0 is represented as an unexecuted `domainspec-new-repo` argv owned by that scaffolder.
- Stage 2 contains exactly 18 planned create-only effects bound to allowlisted source-template hashes.
- Stages 3 and 4 are deferred; stage 5 has no file effect.
- `authority-triage` owns kind classification. P0 verifies caller-supplied receipt bytes/digest and the
  exact `new-authority (domain-local)` verdict; it does not reclassify the kind.
- Stage-2 rendering uses the code-owned typed IR at `ir/stage2.v0.1.json`; the current templates mix
  authoring guidance, examples, and intentional angle-bracket specimens and are not treated as
  target-byte programs.
- Apply is restricted to the 18 rendered Stage-2 `create_file` effects. Deferred effects cannot
  enter its package or journal.

## Contracts

JSON Schema Draft 2020-12 contracts are under `contracts/` for typed authority packages and their
semantic-validation receipts, pilot admission and its receipt, the manifest, P0 plan and receipt,
render input/package/receipt, apply request/receipt, authority-triage evidence, and journal records.
Example synthetic inputs and the authority-package positive/negative matrix are under
`tests/fixtures/`.

## Validation

```bash
python3 -m unittest discover -s cyberAlchemy-v2/development/mint/runtime/tests -v
```

Passing these tests proves only candidate-local typed-package validation, deterministic pilot
admission and planning, no-write rendering, plus create-only transactional Stage-2 application and
exact recovery on synthetic private fixtures. Package or pilot validation is not permission to run
effect commands. It is not complete Mint, a Markdown/Cedar/FOL projection proof, ratification,
promotion, release, deployment, production readiness, or evidence that Zagr has been minted.
