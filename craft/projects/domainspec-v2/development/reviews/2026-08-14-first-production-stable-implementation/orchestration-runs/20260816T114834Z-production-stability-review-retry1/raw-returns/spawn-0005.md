# Bounded verifier receipt: spawn-0005 — FIX

- Identity: Popper, Karl.
- Status: pass for the review action, not for the product.
- Target drift: none. Live aggregate matched
  6d208f20bacc39e124709fd18b2fe93147ccb52bf625833c1efd92afe09afa1a;
  added, removed, and changed were empty.
- Dispositions: 10 KEEP, 7 FIX, 0 DROP.
- Repository mutation: none.
- Temporary residue: /tmp/domainspec-counterexample-verifier.xXhlxe.

## Disposition ledger

- CR-01 FIX. Production remains unauthorized and profile release admission is
  not granted. Absence from the frozen manifest does not prove repository-wide
  absence of G0/R2 because the ledger references a release-contract artifact.
  Replace the absolute absence claim with: no reviewed exact G0/R2 binding
  establishes the proposed slice.
- CR-02 KEEP. Manifest census independently confirms 666 changed, 5,117
  ignored-untracked, and 405 tracked-clean files. Repair-B live rehash found 27
  changed of 549 accepted entries and zero missing. A dirty frozen snapshot is
  not reconstructable release evidence.
- CR-03 KEEP. current-validation still says pass while the state machine defines
  drift-to-stale and the queue is empty. All seven current RMT validators exited
  1, including both Enum routes.
- CR-04 KEEP. verify-run-root trusts the run-authored index, checks only narrow
  terminal/semantic material, and string-coerces lock/run identity. A fresh
  isolated three-file forged run passed factory verify.
- CR-05 KEEP. The W3 contract gives state to writes but represents external
  effects only as strings; atomic state-plus-outbox is not observable.
- CR-06 KEEP. W4 compensates persisted state after later exceptions while W3
  describes atomic settlement/outbox. A discriminating probe exited 1 with
  published=true, persisted=false, and rollback-settlement.
- CR-07 FIX. W3/W4 providers directly parse JSON and cast members without
  closed decoding. The larger factory-lock, replay, formation, and migration
  bundle was not independently exercised. Split or narrow to the proven decoder
  boundary pending separate malformed/future-version tests.
- CR-08 FIX. The profile advertises four formation schemas, but this pass did
  not independently execute schema/compiler decision equivalence. Retain it as
  a required equivalence test, not a fully reverified compiler contradiction.
- CR-09 FIX. The reviewed profile is experimental and release admission is
  denied. The exact UI-loader census was not independently rerun. Retain the
  explicit-profile requirement; remove the census until reproduced.
- CR-10 KEEP. W3/W4 validate only nonempty IDs and 64-hex binding strings.
  Current validators and the Repair-B rehash demonstrate why syntax-only
  binding trust is unsafe.
- CR-11 FIX. Incoherence is supported by seven failing validators and 27 drifted
  entries. Ontology counts, zero relations, self-bound enforces, and
  produces/emits details were not independently checked here; split those
  subclaims or add direct checks.
- CR-12 KEEP. TypeScript enforces exact-major compatibility; Python checks only
  contract/exposure; Rust has no version/policy input. The cross-language
  surface is materially non-equivalent.
- CR-13 KEEP. npm/tsx scripts conflict with pnpm packageManager, dependencies
  use carets, npm and nested pnpm locks coexist, workspace files retain an
  unresolved placeholder, and the CLI has sibling fallback.
- CR-14 FIX. The missing external anchor is executable under CR-04. Crash
  stranding, environment exposure, secret copying, sandboxing, and retention
  remain unexecuted risk hypotheses. Keep them as a test campaign rather than
  verified defects until SIGKILL and secret-canary controls run.
- CR-15 FIX. No reviewed artifact binds the proposed CLI operator envelope, but
  corpus absence is not repository-wide absence. Say not evidenced by this
  frozen corpus and retain the release block.
- CR-16 KEEP. Repair-B claim ceilings limit PASS to generic-factory validation
  and deny integration selection, promotion, release, deployment, or
  production authority.
- CR-17 KEEP. The manifest includes 4,825 cargo-target files and 1,340,635,926
  bytes. They remain in this run; future exclusion needs a newly confirmed
  boundary.

## Minimum stable slice — FIX

The two-command compiled CLI is a plausible candidate direction, but minimum
coherent is not proved and it is not current behavior:

- stdout receipt returns 0 unconditionally before checking violations;
- target resolution silently falls back to a sibling checkout;
- execution is source/tsx based;
- the available profile is experimental and release admission is denied.

Retain lint <explicit-directory> and stdout-only receipt <explicit-directory>
as a candidate shortlist. Require explicit-directory rejection, corrected
receipt exits, a ratified profile, compiled packaging, closed receipt and
diagnostic schemas, and clean-root reproduction before calling it coherent or
stable.

## Command evidence

- Frozen-corpus verifier: exit 0, aggregate equal, no drift.
- Seven RMT validators: seven exits 1.
- Repair-B live rehash: 549 entries, 27 changed, 0 missing.
- Fresh forged factory run: exit 0 and false PASS.
- Timeout-after-success invariant probe: exit 1, published=true,
  persisted=false.
- Not run after the bounded checkpoint: full factory rerun, native W3/W4 suites,
  SIGKILL matrix, malformed/future-version campaign, clean-root build, operator
  pilot, or 41-file integration replay.

Claim ceiling: independent frozen-corpus review verification only. No
implementation acceptance, semantic admission, production readiness,
publication, release, or deployment.
