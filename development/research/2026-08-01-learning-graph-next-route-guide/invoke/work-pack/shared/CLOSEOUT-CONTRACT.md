# Task Session Closeout Contract

## Terminal Source Receipt

Every selected SWU returns:

```yaml
swu_id: SWU-LGP-NNN
result: pass | flag | block | interrupted
capability_ref: task-session
receipt_kind: native-stage | local-fallback | blocked
receipt_artifact: <exact path>
files_touched:
  - <exact declared product path>
validation:
  - command: <exact command>
    result: pass | fail | not-run
blockers:
  - <blocker or none>
residue:
  - <residue or none>
reroute: <owner or none>
handoff_note: <what Invoke Refresh and the owner need>
```

## Baseline Binding

Before mutation, persist `baseline.json` with one row per exact product target:

- repository-relative path;
- `sha256:<digest>` for an existing file or literal `ABSENT`;
- current Git/subproject identity when available;
- learner-view mutation-admission receipt digest;
- predecessor owner-receipt digest.

Any mismatch blocks before write. No glob may admit a target.

## Product Mutation Boundary

Task Session may touch only the selected SWU's exact product write scope plus
`work-pack/session-evidence/<SWU-ID>/baseline.json`,
`task-session-receipt.json`, and `validation.json` (plus task-declared runtime
or observation evidence). It may not write `owner-evidence`, edit the Work
Pack, Design,
canonical ontology/vocabulary, unrelated experiment files, telemetry,
publication state, or external transports.

## Invoke Refresh Consumption And Synchronization

After a terminal Task Session receipt and separately produced lifecycle-owner
receipt, direct-user `invoke refresh` may read:

- `work-pack/session-evidence/<SWU-ID>/baseline.json`;
- `work-pack/session-evidence/<SWU-ID>/task-session-receipt.json`;
- `work-pack/session-evidence/<SWU-ID>/validation.json`;
- `work-pack/owner-evidence/<SWU-ID>/owner-receipt.json`.

It may update only this exact common Plan inventory:

- `WORK-PACK.md`;
- `PLAN-TRANSPORT.md`;
- `work-pack/SWU-MANIFEST.json`.

Refresh records only receipt paths, digests, verdict/status, blockers, and the
resulting successor eligibility in those Plan artifacts. It must not edit any
session or owner evidence file.

Allowed delta classes are `evidence_added`, `blocker_opened`,
`blocker_resolved`, `status_changed`, and `route_changed`. No product source,
new SWU, authority state, promotion, publication, deployment, cost/risk
acceptance, or unrelated path is admitted by closeout.

## Owner Validation And Receipt

The lifecycle owner validates exact files and commands from the task contract,
records the observed evidence ceiling, and writes only
`work-pack/owner-evidence/<SWU-ID>/owner-receipt.json`. The producer is always
the learner-view/navigation lifecycle owner; SWU-LGP-010 additionally binds a
browser-evidence review through `audit_reference`. Task Session and the browser
reviewer cannot self-issue this owner receipt. A pass may make
the unique declared successor eligible; it cannot select or execute it.
