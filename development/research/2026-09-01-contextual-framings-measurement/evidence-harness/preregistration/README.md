# ACFT Owner-Controlled Preregistration Candidate

Status: candidate planning artifact. Authority effect: none.

This package makes the next experimental step reviewable without pretending
that unresolved design choices have already been made. It binds the proposed
human experiment to the current ACFT findings, evidence protocol, and passing
paired-arm manifest. It then separates three things:

1. source-backed constraints that must remain true;
2. choices that only the experiment owner may make and justify; and
3. a later, separate authorization for live execution.

The checked-in owner-decision template contains no selected values. A validator
rejects silent defaults, incomplete decided fields, stale bindings, premature
claim upgrades, and any attempt to treat the template as live authority.

## Current state

```text
candidate.json
    -> structurally valid experimental-design candidate
owner-decision-template.json
    -> all consequential choices unresolved
live execution
    -> blocked
```

This is therefore a **decision-ready preregistration candidate**, not an
accepted preregistration and not a human-subject protocol approval.

## Commands

From this directory:

```sh
python3 generate_fixtures.py
python3 validate.py --candidate candidate.json --decision owner-decision-template.json
python3 validate.py --candidate candidate.json --decision owner-decision-template.json --require-live-ready
python3 test_preregistration.py
```

The first validation command must pass with `live_ready: false`. The
`--require-live-ready` command must fail until every decision is explicitly
recorded, owner acceptance is bound to the immutable candidate, and a separate
live-execution authorization exists.

## Owner workflow

For each decision in `owner-decision-template.json`:

- leave `state: unresolved` and all other fields `null`; or
- set `state: decided` and provide `value`, `rationale`, `decided_by`, and
  `decided_at` together.

Partial decided records fail closed. Values are never inferred from examples,
synthetic fixtures, prior runs, or statistical conventions.

After all decisions are explicit, freeze a new immutable decision record and
route it for owner acceptance. Acceptance still does not authorize recruitment,
contact, collection, or any other live effect.

## Open questions

The unresolved decision inventory is machine-readable in
`owner-decision-template.json`. The source-level residue remains owned by
[`../../findings.md`](../../findings.md#open-residue-and-next-route).
