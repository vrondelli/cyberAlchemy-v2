# CC005 — candidate-aware campaign selection

Candidate SHA-256:
`739f85156574987fb0cb2721fa701d0540d16c6857aa408f1a81bcb874c4772f`.
Predecessor CC004 remains unchanged at
`34a1d1505ddf1f27262d1f29a896e42b3e299c7876414d31a5688b3f15c0e25c`.

CC005 retains all CC004 selected product/apparatus bytes and adds measurement-v2
plus candidate-aware collection. The legacy product change ledger is empty;
added_sources records the eight new selected apparatus/validator/test files.
No test or approval is inherited. Selection remains a source-inventory binding,
not transitive build provenance or product approval.

## Verification

48 tests pass: six candidate, 32 existing campaign, five selection and five loader
tests. Candidate preflight and WDIO configuration import passed against the
retained executable below. PREFLIGHT.json records exact identities and configured
measurement loader. No desktop session, full population, Rust/frontend rerun or
new executable build was performed for this successor in this step. The earlier
v2 native integration result remains repair evidence, not CC005 product approval.

## Explicit entry point

From repository root, read-only preflight:

```sh
node cyberAlchemy-v2/workspace/experiments/control-center/native-test/campaign/selected.mjs --preflight CC-005 739f85156574987fb0cb2721fa701d0540d16c6857aa408f1a81bcb874c4772f /tmp/cav2-cc004-native.GQ3Btz/essays-desktop 06178d533b30e2e2b162fe61c93d4c7513b4b60f675c3efdd9ffa8ad1cad23cb
```

Replace --preflight with --measure to intentionally launch the fixed-population
measurement campaign, or --smoke for repeated ordinary smoke. Measurement mode
uses v2 in WDIO runnerEnv; smoke mode does not install the measurement loader.
Both retain fixed mock provider, isolated storage, pre/post source and binary
checks, raw logs, host telemetry, failure stopping and evidence indexes. Existing
40-qualified/60-attempt limits and budgets are unchanged. Neither mode proves
live-provider conformance. A digest-verified executable is not automatically a
source-attested build; that stronger proof remains pending.

Only CC-005 is allowlisted in this new entry point. There is no default candidate,
arbitrary validator import, implicit latest selection or fallback to CC003. New
candidates require explicit registration and regression tests. Old collect.mjs
and all previous candidates/evidence are untouched. Candidate and executable
digests must both be supplied; worker configuration independently rechecks them.
Full campaigns create a fresh /tmp/cav2-selected-campaign.* directory and print
the retained evidence-index digest. Preserve that digest separately for comparison.

## Next product-test frontier

Run the exact CC005 candidate through its required frontend/Rust/build tests and
new selected native configuration, then collect the declared measurement population
on a qualified host. Do not count earlier rejected probes or substitute synthetic
results. Establish the prior-candidate population and full build/process identity
before claiming the required differential bundle. Candidate approval follows current
product-test evidence; commit, merge, publication and release remain separate.

Operational support this turn was read-only preflight plus temporary test fixtures.
No application was launched or production assets changed. The retained executable
was reused only for identity/configuration checking. Unrelated dirty bytes remain.
