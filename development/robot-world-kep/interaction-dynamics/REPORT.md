# Interaction v1 implementation report

Status: implemented local candidate; full legacy integration regression blocked.
Authority effect: none. Product approval: not requested.

## Delivered behavior

The successor implements four normalized preferences, scaled separation/alignment/
cohesion, previous-interval semantic velocity, bounded utility weights, and one
clock-owned decay-then-impulse update. Every action goes through the existing local
ownership/revision/resource/energy boundary. Duplicate receipts do not add impulses.
The shared reducer change is limited to an overridable legacy memory hook.

[CONTRACT.md](CONTRACT.md) fixes numerical choices; [PROFILE.json](PROFILE.json)
contains their versioned values. [MAPPING.md](MAPPING.md) and [DomainSpec source](domainspec/project.json)
link the local concepts to implementation. The installed local
`implementation/domainspec-v2/impl/tools/minted-project` compiler was selected,
with pinned compiler/formation/registry inputs, Node 26.8.1 and tsx 4.20.6.
Two builds produce identical graph and system-ontology bytes. This is structural
compilation of the prototype source, not Python code generation or a proof of
behavioral semantics.

The legacy 80-tick default retains the exact pre-change event and frame hashes.
The retained Godot, Unity, Babylon and Phaser candidates remain old recorded
sessions; this implementation does not update or serve their UI.

## Verification

- 19 focused dynamics tests pass: independent four-axis decisions, numeric
  oracles, metric scaling/capping, active alignment, saturation, impulse ordering,
  duplicate/rejection handling, contention, successor conservation, valid history,
  replay, deterministic ordering, trace shape and partial-tick failure behavior.
- 11 of the 17 original tests pass. Six require missing Rust binaries. Their
  locked Cargo build fails because the existing manifests reference the absent
  `projects/cyberalchemy-orchestrator/implementations/rwo-rust` directory in the
  former umbrella layout. Recorded old binaries and sources are also absent.
  These are unavailable integration checks, not passing regressions. No unrelated
  dependency manifest or checkout layout was changed to conceal the failure.
- The controlled experiment matrix contains 70 cases (five initial scenarios,
  seven policy variants, two requested horizons). Every case is repeated with
  identical result hashes; successor variants submit zero invalid policy intents.
- Pure-mechanics fixtures separately cover changing neighbor velocity and 1,000
  sustained impulse updates. They are explicitly not fabricated world events.
- Source/evidence hashes and all 557 protected project files are checked by
  [verify.py](verify.py). Captured test and experiment results are under
  [candidate-v1](evidence/candidate-v1/).

## Observations

| Full successor scenario | Requested horizon | Completed ticks | Items built | Remaining total energy | Stop |
|---|---:|---:|---:|---:|---|
| Ordinary | 80 | 80 | 3 | 75 | Horizon |
| Ordinary | 1,000 | 172 | 6 | 7 | Observed quiescence; window-censored |
| Construction-ready | 80 | 80 | 4 | 75 | Horizon |
| Construction-ready | 1,000 | 208 | 7 | 1 | Observed quiescence; window-censored |
| Partial load | 80 | 80 | 2 | 68 | Horizon |
| Partial load | 1,000 | 177 | 5 | 7 | Observed quiescence; window-censored |
| Low energy | 80 / 1,000 | 20 | 0 | 2 | Observed quiescence; window-censored |
| Changing memory | 80 | 80 | 3 | 75 | Horizon |
| Changing memory | 1,000 | 172 | 6 | 7 | Observed quiescence; window-censored |

Every ablation changes actions in at least one measured scenario. Aggregated
action-sequence differences from the full successor are: no steering 145,
no memory 631, no alignment 12, no cooperation utility 906, no caution utility
411. These counts aggregate both horizons, so they are not unique events or an
improvement score. State/trace hashes and per-axis weight differences are retained
for each case. Removing a mechanism changes the simulated trajectory; that does
not establish that the mechanism is beneficial outside these fixtures.

The low-energy case deliberately favors conserving energy by waiting. No recharge
occurs. Stopping after twenty all-wait ticks censors the run and cannot prove
permanent stasis: decaying memory could eventually change a preference. Ordinary
80-tick semantic saturation is about 23.9% of observed components. Saturation is
therefore a real limitation to monitor, despite passing independent axis tests.

## Construction and operational status

| Stage | State | Evidence / next action |
|---|---|---|
| D0 baseline | Complete locally | Original source snapshot, golden state/event/frame hashes, protected file inventory |
| D1 contract | Complete locally | Contract, profile, fixture/schema and mapping; plan IQ3 resolved for v1 |
| D1C compilation | Complete locally | Authored source, pinned local compiler/profile, deterministic generated outputs; plan IQ7 resolved |
| D2 mechanics | Implemented and tested | Numeric and mechanism tests |
| D3 world integration | Implemented and tested locally | Checked intents, traces, conservation, golden legacy behavior |
| D4 evaluation | Complete within fixtures | 70 repeated cases and separately labeled pure-mechanics probes |
| D5 candidate | Frozen; regression incomplete | Source/evidence manifest exists; six broader integration checks unavailable |
| R0 product review | Not eligible for complete-product approval | Restore/select exact RWO dependency and run full regression first |

Operational blocker: the environment/dependency owner must restore or separately
select the exact RWO source/binaries for the old marketplace/RWO tests. Affected
stage: D5 full regression only. Local dynamics execution needs Python/jsonschema
and is already runnable. GPU, renderer selection, inference, real KEP, dataset
selection and hosting remain deferred and are not causal blockers to these tests.
No parent W2/W3/W4/W5/M2 completion, runtime admission, deployment or publication
is claimed. The reviewed plan and review record remain historical planning bytes.

## Reproduce

From the repository root, verify recorded identities and rerun focused tests:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 development/robot-world-kep/interaction-dynamics/verify.py --tests
```

Run fresh controlled experiments into a new directory:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 development/robot-world-kep/runtime/run_interaction_experiments.py --output /tmp/robot-interaction-new-run
```

The runner writes state, history, replay and decision traces for ordinary/full/80,
plus the entire comparison report. It refuses an existing directory. A standalone
successor is `InteractionWorld` in `runtime/interaction_world.py`; the original
`runtime/run.py` deliberately continues to select the legacy policy.

## Open Questions

- How much saturation and low-energy quiescence is useful? v1 exposes both; new
  gains or utilities require a new profile and comparison epoch.
- Does stable-ID allocation create unacceptable bias? It is deterministic, not a
  fairness mechanism; no fairness outcome is established here.
- Which exact RWO source/binary should restore full legacy regression in this
  standalone checkout? Historical paths are absent; no replacement was inferred.
- Large populations, semantic-neighborhood indexing, physical collision handling,
  learned policies and browser diagnostics remain separately scoped follow-ons.
