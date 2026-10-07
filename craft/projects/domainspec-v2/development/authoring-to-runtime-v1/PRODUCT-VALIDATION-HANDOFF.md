# Product-owner validation handoff

This is the sole L4X product-owner test handoff for exact candidate
`alchlang-domainspec-p03-3ab76c2d9ee8bee4`. Construction checks through P05
are current, but product-owner validation has **not** been run and no result is
pre-filled.

Machine contract:
`evidence/l4x-product-validation-handoff/handoff.json`.

## What this protocol decides

The protocol decides whether a product owner can take the private candidate,
use the documented installed-product path for TypeScript, Python, and Rust,
understand its evidence, observe deterministic tamper rejection, and accept its
known limitations as a basis for a later product decision.

Use only `PASS`, `FAIL`, or `NOT_EVALUABLE` for every required test. Stop and
record the exact discrepancy if an expected identity or outcome differs; do
not repair the product or weaken the expectation during the review.

## 1. Candidate gate — `L4X-PV01-CANDIDATE-GATE`

From the repository root, run:

```bash
node language/capabilities/alchlang/plans/general-compiler-v1/implementation/scripts/run-toolchain.mjs \
  tsx language/capabilities/alchlang/plans/general-compiler-v1/implementation/scripts/p03-exact-candidate.ts --check

PYTHONDONTWRITEBYTECODE=1 python3 \
  craft/projects/domainspec-v2/development/authoring-to-runtime-v1/tools/p04_construction_binding.py --check

jq '{result,counts,scope,eligibility}' \
  craft/projects/domainspec-v2/development/authoring-to-runtime-v1/evidence/p05-independent-review/review.json
```

Expected: P03 and P04 print `result: pass`; P05 reports 15 passes, zero fail,
zero not-evaluable, and candidate ID
`alchlang-domainspec-p03-3ab76c2d9ee8bee4`.

## 2. Stage the exact private archives

This creates only a disposable validation root. The DomainSpec archive is
materialized from the exact P03-bound source because that archive is not
published or retained as a release artifact.

```bash
REPO_ROOT="$(git rev-parse --show-toplevel)"
L4X_ROOT="$(mktemp -d)"
ARCHIVE_ROOT="$L4X_ROOT/archives"
mkdir -p "$ARCHIVE_ROOT" "$L4X_ROOT/logs"

DOMAIN_PACK_JSON="$(
  cd "$REPO_ROOT/craft/projects/domainspec-v2/impl/cli"
  npm pack --json --ignore-scripts --pack-destination "$ARCHIVE_ROOT"
)"
DOMAIN_FILENAME="$(node -e 'const fs=require("fs");const v=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(v[0].filename)' <<<"$DOMAIN_PACK_JSON")"
DOMAIN_ARCHIVE="$ARCHIVE_ROOT/$DOMAIN_FILENAME"

CORE_ARCHIVE="$REPO_ROOT/language/capabilities/alchlang/plans/general-compiler-v1/implementation/package-artifacts/0.4.0-candidate.0/split-release/cyberalchemy-alchlang-0.4.0-candidate.0.tgz"
LOCAL_HOST_ARCHIVE="$REPO_ROOT/language/capabilities/alchlang/plans/general-compiler-v1/implementation/package-artifacts/0.4.0-candidate.0/split-release/cyberalchemy-alchlang-local-host-0.4.0-candidate.0.tgz"
RUST_ARCHIVE="$REPO_ROOT/language/capabilities/alchlang/plans/general-compiler-v1/implementation/package-artifacts/0.4.0-candidate.0/split-release/cyberalchemy-alchlang-rust-0.4.0-candidate.0.tgz"

printf '%s  %s\n' '3daab04220ac105671e6684df6fc76c8be8a47aca1551a0f121534d6feea010f' "$DOMAIN_ARCHIVE" | sha256sum -c -
printf '%s  %s\n' '6d55af8ed1982f2fa30d215fa418bc90e165389296575ddc437d2bd526cddbc0' "$CORE_ARCHIVE" | sha256sum -c -
printf '%s  %s\n' '8c378f745f16d23615d8e78bfb43d84e611150153aeac82f4479f7989b9a904d' "$LOCAL_HOST_ARCHIVE" | sha256sum -c -
printf '%s  %s\n' 'a0a13ab2dc236d992b2304e4380e85c8b395f3bac943653b7d849abf61334463' "$RUST_ARCHIVE" | sha256sum -c -
```

Expected: all four lines end in `OK`. A mismatch is `FAIL` for the candidate
gate and ends the run.

## 3. Installed consumer journeys

Run the same installed path once for each language. Dependency reads may use
the configured npm registry; no package is published by this command.

```bash
for LANGUAGE in typescript python rust; do
  CONSUMER="$L4X_ROOT/consumer-$LANGUAGE"
  mkdir -p "$CONSUMER"
  printf '%s\n' '{"private":true,"type":"module"}' >"$CONSUMER/package.json"

  INSTALL_ARCHIVES=("$DOMAIN_ARCHIVE" "$CORE_ARCHIVE")
  if [ "$LANGUAGE" = typescript ]; then INSTALL_ARCHIVES+=("$LOCAL_HOST_ARCHIVE"); fi
  if [ "$LANGUAGE" = rust ]; then INSTALL_ARCHIVES+=("$RUST_ARCHIVE"); fi

  (
    cd "$CONSUMER"
    npm install --ignore-scripts --no-audit --no-fund "${INSTALL_ARCHIVES[@]}"
  )

  PACKAGE_ROOT="$(
    cd "$CONSUMER"
    node --input-type=module -e "import{fileURLToPath}from'node:url';console.log(fileURLToPath(new URL('../',import.meta.resolve('@cyberalchemy/alchlang'))))"
  )"
  SOURCE="$PACKAGE_ROOT/examples/application-v1/$LANGUAGE/commerce.alch"
  TARGET="$CONSUMER/generated-application"
  ALCHLANG="$CONSUMER/node_modules/.bin/alchlang"

  "$ALCHLANG" check "$SOURCE" | tee "$L4X_ROOT/logs/$LANGUAGE-check.json"
  "$ALCHLANG" build "$SOURCE" --out "$TARGET" | tee "$L4X_ROOT/logs/$LANGUAGE-build.json"
  "$ALCHLANG" verify "$SOURCE" --out "$TARGET" | tee "$L4X_ROOT/logs/$LANGUAGE-verify.json"
  sha256sum "$TARGET/.alch/manifest.json" "$TARGET/.domainspec/application-graph.json" \
    | tee "$L4X_ROOT/logs/$LANGUAGE-file-hashes.txt"
done
```

Expected outcomes:

| Test | `check` | `build` | `verify` | manifest file SHA-256 |
| --- | --- | --- | --- | --- |
| `L4X-PV02-TYPESCRIPT-CONSUMER` | `valid` | `built` | `verified` | `9ec0fbb5089c98e2d60b26148f6487f284e3149b0c5b1122f007c2d7511162d1` |
| `L4X-PV03-PYTHON-CONSUMER` | `valid` | `built` | `verified` | `5518b0734c00ed5ac51defeba73656681b31fe8581bb48a92f8231dc413c3417` |
| `L4X-PV04-RUST-CONSUMER` | `valid` | `built` | `verified` | `7524b6d1aadbb04b21caf5ce668c09d801372847a6837019e8a35aa4b01bf501` |

For `L4X-PV05-CROSS-LANGUAGE-EVIDENCE`, every
`.domainspec/application-graph.json` file must have SHA-256
`79440629bf0b877bec392ec6c271fede5750f79970725993445f484607f0833d`.
Inspect the graph, `.alch/whole/`, and provider manifest before continuing.

## 4. Tamper rejection — `L4X-PV06-TAMPER-REJECTION`

Use the disposable TypeScript target as the representative deterministic
failure check:

```bash
LANGUAGE=typescript
CONSUMER="$L4X_ROOT/consumer-$LANGUAGE"
PACKAGE_ROOT="$(cd "$CONSUMER" && node --input-type=module -e "import{fileURLToPath}from'node:url';console.log(fileURLToPath(new URL('../',import.meta.resolve('@cyberalchemy/alchlang'))))")"
SOURCE="$PACKAGE_ROOT/examples/application-v1/$LANGUAGE/commerce.alch"
TARGET="$CONSUMER/generated-application"
ALCHLANG="$CONSUMER/node_modules/.bin/alchlang"
GRAPH="$TARGET/.domainspec/application-graph.json"

cp "$GRAPH" "$L4X_ROOT/application-graph.backup.json"
printf '\n' >>"$GRAPH"
if "$ALCHLANG" verify "$SOURCE" --out "$TARGET"; then
  printf '%s\n' 'FAIL: verify accepted tampered bytes' >&2
  false
else
  printf '%s\n' 'PASS: verify rejected tampered bytes'
fi
mv "$L4X_ROOT/application-graph.backup.json" "$GRAPH"
"$ALCHLANG" verify "$SOURCE" --out "$TARGET"
```

Expected: the tampered verification fails and the restored verification is
`verified`. Any silent acceptance is a product-validation failure.

## 5. Owner judgment — `L4X-PV07-OWNER-JUDGMENT`

Answer each question with evidence from this run:

1. Could you discover and execute the installed path without checkout-only
   imports or undocumented repair?
2. Did the `.alch` source and companion inputs make the application intent and
   provider choices understandable?
3. Were TypeScript, Python, and Rust differences explicit without changing the
   language-neutral application graph?
4. Were the manifest, whole-application, graph, and provider records useful for
   understanding what was produced and what was not proven?
5. Was tamper failure clear enough to diagnose without weakening verification?
6. Are the known limitations below acceptable for the next product decision?

The owner receipt must name the exact candidate and include one result for all
seven required test IDs. `PASS` requires all seven to pass with no undocumented
repair. Preserve `FAIL` and `NOT_EVALUABLE` literally and return the discrepancy
to its owning construction node.

## Known limitations

- This is a private local candidate; nothing is published.
- The commerce examples are synthetic fixtures, not customer acceptance or a
  production workload.
- Native signed-loopback behavior is current P02 construction evidence. This
  protocol does not relabel it as an owner observation or live-provider proof.
- PostgreSQL, NATS, outbound HTTP, transport delivery, consumer completion,
  credentials, deployment, security posture, scale, reliability, and
  production operation are outside this handoff.
- Dependency installation may require declared npm/Python registry reads; Rust
  depends on the repository-locked toolchain and available locked cache.
- P03 freezes selected working-tree bytes; it does not claim that unrelated
  repository work is clean.
- The qualified environment is Linux/WSL x64 with P03-recorded tools. Other
  platforms remain unqualified.

## Forbidden inferences

- A passing protocol is not product approval.
- It is not D65 registration, governance admission, authority, activation,
  cutover, publication, release, deployment, or permission to operate.
- Compilation, verification, and loopback evidence do not prove live-provider,
  customer, security, scale, reliability, or production behavior.
- A missing, failed, stale, or not-evaluable observation never becomes PASS.

## Cleanup

Copy any owner receipt to a separately selected location, then remove only the
task-owned root created above:

```bash
rm -rf -- "$L4X_ROOT"
```

## Open Questions

- The product owner must decide whether to execute this handoff and where a
  resulting receipt should be retained.
- A later product-approval request, if any, requires a separate owner decision
  over current PASS evidence for this exact candidate.
