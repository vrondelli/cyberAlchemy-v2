# Reconciled commerce example

This installed example contains one two-feature DomainSpec graph using all 13
meta types. `source/` is the authored JSON graph. `selections/` contains exact
TypeScript, Python, and Rust compiler selections. `values.json` and
`scenarios.json` document the behavior exercised by the product qualification.
`scenarios/` contains the executable installed-package signed-webhook startup
checks used for all three generated languages.

## One-command TypeScript smoke test

From this CLI checkout, choose a new output directory and run:

```bash
npm run smoke:reconciled-commerce:typescript -- \
  --output /tmp/domainspec-typescript-smoke
```

The command builds the CLI, generates the TypeScript provider application,
checks exact currentness, installs locked dependencies in a disposable copy,
natively compiles that copy, and exercises the signed loopback webhook. It
leaves the generated application and JSON observations under the requested
output directory for inspection. It refuses to overwrite an existing path.

The smoke receipt proves native compilation, listener startup, invalid
signature rejection (`401`), valid signature acceptance (`202`), one handler
invocation, and an unchanged generated target. PostgreSQL, NATS, outbound HTTP,
transport delivery, consumer completion, and production guarantees remain
explicitly unobserved.

From a consumer project with the package installed, the equivalent packaged
example command is:

```bash
node node_modules/@domainspec-v2/cli/examples/reconciled-commerce/test-typescript.mjs \
  --output /tmp/domainspec-typescript-smoke
```

From a consumer that installed `@domainspec-v2/cli`, resolve this directory:

```bash
package_root="$(node -p "require('path').resolve(require.resolve('@domainspec-v2/cli'),'../..')")"
example_root="$package_root/examples/reconciled-commerce"
run_root="$(mktemp -d)"
```

Then build one language, for example Rust:

```bash
npx domainspec-v2 build "$example_root/source" \
  --language rust \
  --target-root "$run_root/rust" \
  --compilation-selection "$example_root/selections/rust.json" \
  --integration-source "$example_root/integrations/application.json" \
  --provider-selection "$example_root/providers/rust.json"
```

The target must not already exist. Use the matching language and selection for
TypeScript or Python. See the installed `USER-GUIDE.md` for currentness checks,
application layout, stronger native verification, diagnostics, and migration.
