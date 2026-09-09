# TDE to EVF L0 candidate

Status: prototype candidate; unapproved
Authority effect: none

This candidate implements the smallest ownership-correct handoff:

```text
current financial-settlement project and node sources
  -> TDE neutral reachability obligation and fact manifest
  -> EVF-owned Souffle translation
  -> bounded provider execution
  -> provider receipt
  -> bounded EVF join
```

TDE says what must be checked. It does not name Souffle, contain Datalog, or
select a runtime. EVF owns the provider translation, execution policy, result
mapping, and join.

The selected property is the existing candidate graph law encoded by the v9
TDE L2 source: both `NoDuplicateMakeupRule` and `PayoutEligibilityRule` must
reach `PayoutCreatedEvent` through one or more directed `enforces` or `produces`
edges in the exact closed-world graph snapshot.

The committed generated graph and source manifest are stale relative to two
selected node sources. L0 therefore derives its bounded fact set directly from
the exact live project and node bytes and records their hashes. It does not
rewrite or silently trust the stale generated views.

## Validate

From this directory:

```bash
python3 validate.py
```

The default validation uses an explicitly labelled test double to prove the
adapter, process, parser, replay, positive-case, and deliberate-violation flow.
Its aggregate product result remains `BLOCK` because fixture output is not
Souffle evidence.

Run against an exact Souffle 2.5 executable only when that runtime is available:

```bash
python3 validate.py --souffle /absolute/path/to/souffle
```

No result grants product approval, admission, publication, release, deployment,
or external-effect authority.
