#!/usr/bin/env bash
set -uo pipefail
export PATH=/opt/rust/bin:/opt/node-toolchain/node_modules/.bin:/work/tools/node_modules/.bin:$PATH
ln -sf /opt/node-toolchain/node_modules/.bin/tsc /work/tools/node_modules/.bin/tsc
export CARGO_HOME=/work/cargo-home
export DOMAINSPEC_RUSTC=/opt/rust/bin/rustc
export DOMAINSPEC_CARGO=/opt/rust/bin/cargo
export DOMAINSPEC_TSC=/opt/node-toolchain/node_modules/.bin/tsc
export ALCHLANG_TEST_TSX=/work/tools/node_modules/.bin/tsx
export ALCHLANG_TEST_TYPESCRIPT=$DOMAINSPEC_TSC
export ALCHLANG_TYPESCRIPT_COMPILER=$DOMAINSPEC_TSC
export ALCHLANG_DOMAINSPEC_PACKAGE_ROOT=/work/domainspec-core/projects/domainspec-v2/impl/cli
export CARGO_TARGET_DIR=/work/cargo-target
ln -sfn /work/tools/node_modules /work/domainspec-core/projects/domainspec-v2/impl/node_modules
alch=/work/cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/implementation
ln -sfn /work/tools/node_modules "$alch/node_modules"
run_check() {
 local label=$1
 shift
 "$@" > "/work/logs/$label.log" 2>&1
 local result=$?
 printf '%s %s\n' "$label" "$result" | tee -a /work/logs/results.txt
 return "$result"
}
run_check versions bash -c 'node --version; npm --version; tsc --version; rustc --version; cargo --version; cc --version'
run_check toolchain-validation node /opt/node-toolchain/scripts/validate-toolchain.mjs
cd "$ALCHLANG_DOMAINSPEC_PACKAGE_ROOT"
run_check domainspec-typecheck npm run typecheck
run_check domainspec-build npm run build || exit 1
run_check domainspec-native node --import /work/tools/node_modules/tsx/dist/loader.mjs --test test/generation/project-composition.test.ts test/l1-project.test.ts test/generation/declarative-function.test.ts test/generation/plan-instantiation.test.ts test/generation/publish-instantiation.test.ts test/input/project-model.test.ts test/typed-operation/rust.test.ts
cd "$alch"
run_check alchlang-build /opt/node-toolchain/node_modules/.bin/tsc -p tsconfig.build.json
run_check alchlang-templates node scripts/copy-event-templates.mjs
run_check alchlang-focused node --import /work/tools/node_modules/tsx/dist/loader.mjs --test test/compilation-reconciliation.test.ts test/domainspec-parity.test.ts test/domainspec-lowering.test.ts test/domainspec-cli.test.ts test/source-file.test.ts
run_check default-build node dist/cli.js build examples/domainspec-order.alch --out /work/default-build
