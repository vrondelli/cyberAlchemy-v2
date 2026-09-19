# Exact reviewer commands

All commands ran on 2026-09-12 in America/Sao_Paulo. `$EPOCH` below denotes
`/home/vrondelli/projects/domainspec-core/projects/auth-foundation/development/auth-service-d65-r2-plan/repair-assurance-transfer-epoch-001` and `$REVIEW` denotes `$EPOCH/reviewer-attempt-001`.

## Structural evidence verification

```sh
/usr/bin/time -v -o "$REVIEW/structural-verification-final.time.log" /usr/bin/python3.14 -B "$REVIEW/verify_author_evidence.py" > "$REVIEW/structural-verification-final.json" 2> "$REVIEW/structural-verification-final.stderr.log"
```

## Package-bound mutation replay

The full environment and tool digests are in `replay-metadata.log`.

```sh
env PATH=/home/vrondelli/.cache/auth-completion/build-tools/bin:/home/vrondelli/.rustup/toolchains/stable-x86_64-unknown-linux-gnu/bin:/usr/bin:/bin CC=/home/vrondelli/.cache/auth-completion/build-tools/bin/cc AR=/home/vrondelli/.cache/auth-completion/build-tools/bin/ar RUSTC=/home/vrondelli/.rustup/toolchains/stable-x86_64-unknown-linux-gnu/bin/rustc RUSTFMT=/home/vrondelli/.rustup/toolchains/stable-x86_64-unknown-linux-gnu/bin/rustfmt CARGO_HOME=/home/vrondelli/.cargo PYTHONDONTWRITEBYTECODE=1 /usr/bin/python3.14 -B "$EPOCH/mutations.py"
```

## Mandated-toolchain mutation replay

```sh
/home/vrondelli/projects/cyberAlchemy-v2/tools/toolchain/run env PYTHONDONTWRITEBYTECODE=1 /usr/bin/python3.14 -B "$EPOCH/mutations.py"
```

Both mutation invocations were wrapped with `/usr/bin/time -v`; stdout and
stderr are stored beside their `.time.log` files. Source inventory was captured
before and after each with:

```sh
find /home/vrondelli/projects/domainspec-core/projects/auth-foundation/implementation -type f ! -path '*/target/*' ! -path '*/__pycache__/*' ! -path '*/.runtime/*' -print0 | sort -z | xargs -0 sha256sum
```

## Package evidence regression tests

```sh
cd "$EPOCH"
/usr/bin/time -v -o "$REVIEW/regression-tests-final.time.log" /usr/bin/python3.14 -B -m unittest discover -v -s . -p 'test_*.py' > "$REVIEW/regression-tests-final.stdout.log" 2> "$REVIEW/regression-tests-final.stderr.log"
```

The failed attempt-001 used:

```sh
/usr/bin/python3.14 -B -m unittest -v "$EPOCH/test_mutations.py"
```

## Fresh EVF verification

```sh
/home/vrondelli/.cache/auth-completion/auth-evf-target/debug/evf-independent-verifier --repo-root /home/vrondelli/projects/domainspec-core --evidence /home/vrondelli/projects/domainspec-core/projects/auth-foundation/development/auth-service-d65-r2-plan/repair-assurance-transfer-epoch-001/evf/runs/sha256/b38ae49ae8a441260852f8659753513e83c06549ae84fea7c774b05c6794caae/executable-3ed9cbef5a9e0eae/EVIDENCE.json
/home/vrondelli/.cache/auth-completion/auth-evf-target/debug/evf-independent-verifier --repo-root /home/vrondelli/projects/domainspec-core --evidence /home/vrondelli/projects/domainspec-core/projects/auth-foundation/development/auth-service-d65-r2-plan/repair-assurance-transfer-epoch-001/evf/runs/sha256/0d3fa72d32204ba7e29d579b84527b4fd89a259b4a71cf2cf8033b5311a9d4a3/theorem-3ed9cbef5a9e0eae/EVIDENCE.json
```

## Causal copy-boundary replay and final join

```sh
/usr/bin/time -v -o "$REVIEW/copy-counterexample-replay.time.log" /usr/bin/python3.14 -B "$REVIEW/reproduce_copy_counterexample.py" > "$REVIEW/copy-counterexample-replay.json" 2> "$REVIEW/copy-counterexample-replay.stderr.log"
/usr/bin/python3.14 -B "$REVIEW/verify_fresh_replay.py" > "$REVIEW/fresh-replay-verification-final.json" 2> "$REVIEW/fresh-replay-verification-final.stderr.log"
```

## Open Questions

Command preservation is complete for this reviewer attempt. Reproduction on a
different host would require that host's separately validated tool identities.
