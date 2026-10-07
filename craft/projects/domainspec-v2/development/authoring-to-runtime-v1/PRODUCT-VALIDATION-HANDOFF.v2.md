# Current AlchLang product-owner test handoff

This private protocol is for exact candidate
`alchlang-domainspec-p03-4a53fe48cb6599bf`, P04 binding
`alchlang-domainspec-p04-3495f37795e6fea4`, and independent P05 review
`alchlang-domainspec-p05-review-5eb8be5236ad2455`. It prepares seven owner
tests; none is pre-filled or treated as product approval. The machine handoff
is `evidence/l4x-product-validation-handoff/successor-v2-candidate/handoff.json`.

Record each result as `PASS`, `FAIL`, or `NOT_EVALUABLE`. A missing identity,
unexpected output, or undocumented repair is not a pass. Preserve the logs and
return a discrepancy to P01–P04 instead of changing the candidate during the
test.

## PV01 — exact-candidate gate

From this repository root:

```bash
node language/capabilities/alchlang/plans/general-compiler-v1/implementation/scripts/run-toolchain.mjs \
  tsx language/capabilities/alchlang/plans/general-compiler-v1/implementation/scripts/p03-exact-candidate.ts --check
python3 craft/projects/domainspec-v2/development/authoring-to-runtime-v1/tools/p04_construction_binding_v2.py --check
python3 -m unittest craft.projects.domainspec-v2.development.authoring-to-runtime-v1.tests.test_p05_successor
```

Require P03 and P04 `result: pass`, three P05 tests passing, and the three
IDs above. The P05 record must still show fifteen passing obligations and zero
discrepancies. This gate checks construction evidence, not owner acceptance.

## Stage the current private archives

Use one disposable root for all products and logs. Do not publish anything.
The package commands may need the declared npm cache/registry; Rust native
checks need the repository-locked toolchain.

```bash
REPO_ROOT="$(git rev-parse --show-toplevel)"
L4X_ROOT="$(mktemp -d)"
ARCHIVE_ROOT="$L4X_ROOT/archives"
mkdir -p "$ARCHIVE_ROOT" "$L4X_ROOT/logs"

(
  cd "$REPO_ROOT/craft/projects/domainspec-v2/impl/cli"
  npm pack --json --ignore-scripts --pack-destination "$ARCHIVE_ROOT" \
    > "$L4X_ROOT/logs/domainspec-pack.json"
)
(
  cd "$REPO_ROOT/language/capabilities/alchlang/plans/general-compiler-v1/implementation"
  node --input-type=module -e \
    'import {packRelease} from "./scripts/package-release.mjs"; console.log(JSON.stringify(packRelease(process.argv[1])))' \
    "$ARCHIVE_ROOT" > "$L4X_ROOT/logs/alchlang-pack.json"
)

DOMAIN_ARCHIVE="$ARCHIVE_ROOT/$(node -e 'const fs=require("fs");const rows=JSON.parse(fs.readFileSync(process.argv[1]));process.stdout.write(rows[0].filename)' "$L4X_ROOT/logs/domainspec-pack.json")"
CORE_ARCHIVE="$(node -e 'const fs=require("fs");const plan=JSON.parse(fs.readFileSync(process.argv[1]));process.stdout.write(plan.artifacts.find(row=>row.id==="core").file)' "$L4X_ROOT/logs/alchlang-pack.json")"
RUST_ARCHIVE="$(node -e 'const fs=require("fs");const plan=JSON.parse(fs.readFileSync(process.argv[1]));process.stdout.write(plan.artifacts.find(row=>row.id==="rust").file)' "$L4X_ROOT/logs/alchlang-pack.json")"
LOCAL_HOST_ARCHIVE="$(node -e 'const fs=require("fs");const plan=JSON.parse(fs.readFileSync(process.argv[1]));process.stdout.write(plan.artifacts.find(row=>row.id==="local-host").file)' "$L4X_ROOT/logs/alchlang-pack.json")"

printf '%s  %s\n' '095668b7c58153c3869ddd70c4d70b3718d27589ac55d816e6f284664ea0c787' "$DOMAIN_ARCHIVE" | sha256sum -c -
printf '%s  %s\n' '0c18d7bd9edb5b2d391480886e29729e4b8036cafb663dbe11fd86b467cedc86' "$CORE_ARCHIVE" | sha256sum -c -
printf '%s  %s\n' '36d671b6499ddce5ce8395e9c5a5b7017c4e46562d3c7562ca62399d0050bde9' "$RUST_ARCHIVE" | sha256sum -c -
printf '%s  %s\n' 'e04ae996bc32401dd646eb298a7b2ea8236b47df8deb2fe18d8cd0eb8bf58e6c' "$LOCAL_HOST_ARCHIVE" | sha256sum -c -
```

All four hashes must say `OK`. The local-host archive is part of the exact
package set but is not installed by the three current P02 consumers; its
experimental host behavior is not silently promoted into this test.

## PV02–PV05 — installed consumers and shared graph

Run the same check/build/verify journey for each language. The source comes
from the installed core package, not a checkout import. Keep all targets under
`$L4X_ROOT`.

```bash
for LANGUAGE in typescript python rust; do
  CONSUMER="$L4X_ROOT/consumer-$LANGUAGE"
  mkdir -p "$CONSUMER"
  printf '%s\n' '{"private":true,"type":"module"}' > "$CONSUMER/package.json"
  INSTALL_ARCHIVES=("$DOMAIN_ARCHIVE" "$CORE_ARCHIVE")
  if [ "$LANGUAGE" = rust ]; then INSTALL_ARCHIVES+=("$RUST_ARCHIVE"); fi
  (cd "$CONSUMER" && npm install --offline --ignore-scripts --no-audit --no-fund "${INSTALL_ARCHIVES[@]}")
  SOURCE="$CONSUMER/node_modules/@cyberalchemy/alchlang/examples/application-v1/$LANGUAGE/commerce.alch"
  TARGET="$CONSUMER/generated-application"
  ALCHLANG="$CONSUMER/node_modules/.bin/alchlang"
  "$ALCHLANG" check "$SOURCE" | tee "$L4X_ROOT/logs/$LANGUAGE-check.json"
  "$ALCHLANG" build "$SOURCE" --out "$TARGET" | tee "$L4X_ROOT/logs/$LANGUAGE-build.json"
  "$ALCHLANG" verify "$SOURCE" --out "$TARGET" | tee "$L4X_ROOT/logs/$LANGUAGE-verify.json"
  sha256sum "$TARGET/.alch/manifest.json" "$TARGET/.domainspec/application-graph.json" \
    | tee "$L4X_ROOT/logs/$LANGUAGE-file-hashes.txt"
done
```

Require `valid`, `built`, and `verified` respectively. Expected exact file
SHA-256 values from the current P02 v4 installed-consumer evidence:

| Test | Language | `.alch/manifest.json` | `.domainspec/application-graph.json` |
| --- | --- | --- | --- |
| PV02 | TypeScript | `12ad0ea2cca27322241ad4eb7840fb5e1349932ce8539de2f0e8746bb6444204` | `79440629bf0b877bec392ec6c271fede5750f79970725993445f484607f0833d` |
| PV03 | Python | `4f956f1804e9347d83880862045b4c5e999af7242a5dd9a30ad96a08aa66f66e` | same |
| PV04 | Rust | `9f2e2f7ba22456d9df504a411b702a36b84f78089f8f025f703621ddba84bade` | same |

PV05 requires all three graph file hashes to match. Inspect the graph,
`.alch/whole/` and `.domainspec/providers/manifest.json`; byte equality is
not a substitute for understanding the generated behavior. Native compile
and HTTP scenario results remain P02 construction evidence until the owner
executes and records them separately.

## PV06 — deterministic tamper rejection

Use only the disposable TypeScript target. Change one byte of the generated
graph, require verify to fail, then restore and require verify to pass:

```bash
CONSUMER="$L4X_ROOT/consumer-typescript"
SOURCE="$CONSUMER/node_modules/@cyberalchemy/alchlang/examples/application-v1/typescript/commerce.alch"
TARGET="$CONSUMER/generated-application"
ALCHLANG="$CONSUMER/node_modules/.bin/alchlang"
GRAPH="$TARGET/.domainspec/application-graph.json"
cp "$GRAPH" "$L4X_ROOT/application-graph.backup.json"
printf '\n' >> "$GRAPH"
if "$ALCHLANG" verify "$SOURCE" --out "$TARGET"; then
  printf '%s\n' 'FAIL: tampered graph was accepted' >&2
else
  printf '%s\n' 'PASS: tampered graph was rejected'
fi
cp "$L4X_ROOT/application-graph.backup.json" "$GRAPH"
"$ALCHLANG" verify "$SOURCE" --out "$TARGET"
```

If tampering is accepted, mark PV06 `FAIL` even if the restored check passes.

## PV07 — owner judgment and result receipt

For this exact candidate, record whether you could discover and run the
installed path without undocumented repair; understand the authored intent,
provider choices, generated graph and evidence; distinguish the three target
differences; diagnose tamper rejection; and accept the limitations below.
Record the exact candidate ID, date, environment, seven test IDs, each
`PASS`/`FAIL`/`NOT_EVALUABLE` result, artifact/log locations, discrepancies,
and your judgment in a separate owner receipt. Do not edit this handoff to
retroactively pre-fill results. A later product approval is a separate owner
decision even if all seven tests pass.

## Limits, cleanup, and open questions

This is a synthetic local commerce fixture. It does not exercise live
PostgreSQL, NATS, external HTTP delivery, provider-native TDE execution,
credentials, customer workload, security, scale, reliability, deployment, or
production operation. An installed build or loopback pass is not a runtime
guarantee. No registration, governance admission, authority, activation,
publication, release, deployment or permission to operate is inferred.

Keep the task-owned root until you have copied any desired owner receipt and
logs to a separately selected location. Then remove only that exact disposable
root using your normal local cleanup process. The open question is whether
the product owner accepts the observed results and limitations for a later,
separate product decision.
