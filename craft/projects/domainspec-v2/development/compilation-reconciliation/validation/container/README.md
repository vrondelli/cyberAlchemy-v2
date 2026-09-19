# Container validation evidence

The final run passed 47 DomainSpec and 24 AlchLang tests with no skips. All
checks in `evidence.json` passed. `first-test-logs/` and `initial-setup-logs/`
retain failed setup diagnostics; they are not final results.

The base image is built from the repository Node/TypeScript Dockerfile and
pinned Node digest. The local validation Dockerfile adds CA certificates and
jsonschema 4.26.0 with its dependencies. Rust 1.98.1 is mounted read-only.
Image IDs and source/tool hashes bind this run; rebuilding apt/pip dependencies
later is a new environment and requires recording its identity again.

To prepare a replay, run `python3 prepare.py /home/vrondelli/projects <new-dir>`.
It verifies all 659 recorded checkout inputs before copying them. Mount that
new directory at `/work` in the validation image, and run `npm ci` from
`/work/tools` to install the recorded dependency lock. `run.sh` selects the
image's TypeScript 7.0.2 executable. Use the Docker command recorded in
`evidence.json`, supplying the recorded Rust toolchain; compare its bin/lib
hashes with `rust-inputs.json` before running. Run the additional focused
AlchLang typecheck command recorded there as well. Read every exit code in
`logs/results.txt`; a successful last command alone is not suite success.

The original run used the existing locked temporary npm dependencies, with
executable links restored after copying. No product source fix was necessary.
The fixture directory names, source format, hashes, and certificates remain
part of the tests: equivalent behavior does not imply identical provenance.

## Open Questions

Unresolved toolchain adoption and product scope questions belong to
[the reconciliation plan](../../../PLAN.md#open-questions).
