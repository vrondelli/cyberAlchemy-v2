# Independent repair-assurance review

Verdict: **AGREE**, with one toolchain correction. Status: pass with correction. Authority effect: none.

## Property and ceiling

The bounded product property is exact fail-closed authorization: return `ALLOW`
only when the request is admissible, session and authentication evidence are
current, resolved roles are complete and active, and an exact role grant matches
the required permission and trusted scope. Every other evaluated case returns
`DENY`.

The separate evidence-pipeline property is that the six declared behavioral
mutations can be applied in disposable source copies and each yields one typed
observation without ephemeral runtime state controlling whether the campaign is
evaluable.

This review establishes local evidence for sealed candidate
`3ed9cbef5a9e0eaec5158ed04c8c18221cb756b52ed49756cf5925cf1a41d9d3`
only. It grants no product approval, admission, publication, release,
deployment, runtime effect, universal compiler proof, or proof of arbitrary
authorization behavior.

## Sealed boundary and integrity

`AUTHOR-MANIFEST.json` retained SHA-256
`64c93f2e8d31cc7c51ff412b721d41462979075724186ba6af4f6bccc5099f9a`
before and after review. All 18 sealed refs matched both digest and byte size.
The independent walker then verified 333 distinct nested exact refs across the
candidate, product result, profiles, hostile controls, repository inputs and
host tools. The immutable candidate ref equals `PRODUCT-CANDIDATE.json`, and
the canonical candidate digest reproduces exactly.

Forty command-backed local-validation logs match their content addresses. Their
raw recorded counts total 64 Rust tests. The product result contains 48 unique
pass rows, and the reviewer independently reconstructed all 48 outcomes from
the raw Rust test logs, local checks, mutation evidence, hostile results,
candidate digest, exact refs and EVF denominators.

## Counterexample and repair

`AUTH-TRANSFER-PIPELINE-COPY-001` is a real evidence-pipeline defect. The sealed
trace records exit code 1 and `shutil.Error` before the first mutant, with Unix
sockets and dangling files under unrelated `.runtime` trees; zero mutation
observations were produced. The unchanged historical `completion-v1` runner
matches its recorded pre-repair SHA-256 and ignores only `target` and
`__pycache__`.

The repair addresses that cause. The isolated runner defines one shared set
containing `target`, `__pycache__`, and `.runtime`, and uses it for both source
inventory and `copytree`. The focused regression test checks the callback. A
fresh causal reproducer confirmed that the old boundary fails on a Unix socket,
while the repaired boundary omits `.runtime`, copies successfully, and leaves
the source inventory equal.

This defect is distinct from the six Auth product mutants. `second-connection`,
`caller-authority`, `relaxed-currentness`, `missing-authorization-revision`,
`duplicate-scope-evidence`, and `early-transaction-end` are deliberately seeded
calibration faults. They are not evidence of six previously existing product
defects.

## Fresh replay

The sealed mutation evidence contains six killed-for-declared-cause rows, two
passing neutral runs per row, successful mutant builds, and exact one-test Cargo
failures with the declared test and marker. All 24 content-addressed raw logs
match.

Two fresh no-write campaigns then passed against the current exact source. The
first used the author-declared package-bound identities and completed in 50.41
seconds. The required final replay used:

```text
/home/vrondelli/projects/cyberAlchemy-v2/tools/toolchain/run env PYTHONDONTWRITEBYTECODE=1 /usr/bin/python3.14 -B /home/vrondelli/projects/domainspec-core/projects/auth-foundation/development/auth-service-d65-r2-plan/repair-assurance-transfer-epoch-001/mutations.py
```

It used Cargo and Rust 1.98.1 plus the locked GCC 15.2.0 compiler wrapper,
completed in 59.04 seconds, killed all six mutants for their declared causes,
and passed twelve neutral runs. Exact inventories before and after both
campaigns are identical.

Corrected package-wide Python discovery passed all ten evidence regression
tests. Fresh invocations of the bound independent verifier passed the executable
and theorem evidence in 29.12 and 3.23 seconds respectively. Each result exactly
matches its sealed verifier result and lists `S0` through `S12` in order. All
twelve hostile-control profile and raw result refs match their recorded bytes;
each raw outcome has the expected blocked reason or failed aggregate.

## Correction

The author limitation saying the documented `tools/toolchain/run` launcher was
absent is incorrect for this routed repository context. The launcher exists at
`/home/vrondelli/projects/cyberAlchemy-v2/tools/toolchain/run`, predates the
author run, and the repository instructions explicitly permit its absolute path
from a sibling checkout. The successful second replay removes this as a result
limitation while preserving it as an author-report correction.

## Limitations

- The reviewer reconstructed all 48 checks from digest-bound raw evidence but
  did not rerun the entire 42-command local-validation construction suite.
- The reviewer verified all twelve hostile controls from their digest-bound
  profiles and raw results but did not regenerate all twelve hostile campaigns.
- The unmodified no-write mutation runner reports fresh semantic observations
  and content hashes but does not persist inner Cargo output. The sealed raw logs
  establish cause-specific output; the two fresh campaigns establish replay.
- The checkout already contained modified and untracked owner work. All exact
  candidate refs were current and before/after inventories were identical; this
  review makes no clean-tree claim.
- The first reviewer `unittest` command used an absolute filename where a module
  name was required and failed before executing tests. That diagnostic is
  preserved. Corrected discovery passed ten tests and is the accepted result.

## Open Questions

- A future transfer may choose to regenerate the twelve hostile controls and
  the full local-validation construction suite in a wholly separate writable
  epoch if independent regeneration, rather than raw-evidence verification, is
  required.
- Recovering a naturally occurring pre-repair Auth product counterexample
  remains separate work; none is claimed here.
