# DomainSpec CLI user guide

DomainSpec turns one validated domain graph into deterministic TypeScript,
Python, or Rust source. The reconciled compiler is explicit: supplying a
compilation-selection file chooses it; omitting that option preserves the
existing 1.0 build and instantiation behavior.

## Install and inspect

Install the local archive or the equivalent published package in a Linux x64
Node 26.8.1 environment:

```bash
npm install /absolute/path/domainspec-v2-cli-1.0.0.tgz
npx domainspec-v2 --version
npx domainspec-v2 capabilities
npx domainspec-v2 doctor
```

`doctor` checks Node, platform, architecture, TypeScript, Python, Rust, Cargo,
and Lean. PostgreSQL, Docker, and Terraform are reported separately and are not
required for ordinary compilation.

## Run the installed example

The package includes a two-feature commerce model with all 13 DomainSpec meta
types and one selection per target language. Resolve its installed path and
create a caller-owned output parent:

```bash
package_root="$(node -p "require('path').resolve(require.resolve('@domainspec-v2/cli'),'../..')")"
example_root="$package_root/examples/reconciled-commerce"
run_root="$(mktemp -d)"
```

Build each target. Every output path must be absolute and must not already
exist:

```bash
npx domainspec-v2 build "$example_root/source" \
  --language typescript \
  --target-root "$run_root/typescript" \
  --compilation-selection "$example_root/selections/typescript.json"

npx domainspec-v2 build "$example_root/source" \
  --language python \
  --target-root "$run_root/python" \
  --compilation-selection "$example_root/selections/python.json"

npx domainspec-v2 build "$example_root/source" \
  --language rust \
  --target-root "$run_root/rust" \
  --compilation-selection "$example_root/selections/rust.json"
```

Check exact artifact currentness with the same language and selection:

```bash
npx domainspec-v2 verify "$example_root/source" \
  --language typescript \
  --target-root "$run_root/typescript" \
  --compilation-selection "$example_root/selections/typescript.json"
```

Repeat that command with `python` or `rust` and the matching selection/output.
`verify` checks exact planned paths, bytes, receipt, and source identity. It does
not claim that a native compiler was run.

## Output layouts

Add this option to a whole-project `build`, `verify`, or stronger
`verify-project` call:

```text
--output-layout domainspec.application-layout/v1
```

The selected language remains inside the selection file and must match
`--language`. Application layout changes only the output envelope: domain code
is under `domain/<language>/src`, application composition under `app`, runtime
support under `runtime`, provenance under `provenance`, and receipts/traces under
`evidence`. Omitting `--output-layout` keeps the reconciled flat view. A node-only
instantiation cannot use application layout because the application envelope is
a whole-project contract.

To generate a coherent native project instead, use:

```text
--output-layout domainspec.project-layout/v1
```

This layout has one executable source root rather than a separate `src` folder
inside every feature. TypeScript emits `src/features` and `src/shared/domain`.
Python emits the same feature and shared-domain structure inside
`src/<package>`. Rust emits a Cargo package with `src/features` and complete
module declarations. Within each feature, `domain` contains domain types and
decisions while `application` contains queries, mappings, interfaces,
operations, and workflows according to their generated role.

Use the same layout value for `build`, `verify`, and `verify-project`. The
project layout requires a reconciled compilation selection and whole-project
output. Its `.domainspec/project-build.json` receipt covers the exact paths and
bytes. Omitting the option preserves the current flat output; choosing the
application layout preserves its existing envelope.

## Strong native verification

`verify-project` accepts one explicit selection and language-specific absolute
tool paths. It also requires an already built target root.

TypeScript:

```text
domainspec-v2 verify-project <source> --target-root <target> \
  --typescript-root <typescript-package-root> \
  --node-type-root <node-types-root> \
  --lean-executable <lean> \
  --compilation-selection <typescript-selection>
```

Python:

```text
domainspec-v2 verify-project <source> --target-root <target> \
  --python-executable <python3> \
  --temporary-parent <existing-private-temp-parent> \
  --lean-executable <lean> \
  --compilation-selection <python-selection>
```

Rust:

```text
domainspec-v2 verify-project <source> --target-root <target> \
  --cargo-executable <cargo> \
  --temporary-parent <existing-private-temp-parent> \
  --compilation-selection <rust-selection>
```

Add the exact `--output-layout` value used by `build` when the target was built
with either structured layout.
Verification creates only an owned private workspace under the supplied
temporary parent and removes that workspace on success or failure.

## Source model

A source root contains `project.json`, one `specs/<feature>/feature.json` per
feature, node files under `specs/<feature>/nodes`, feature-edge files under
`specs/<feature>/edges`, and optional project edges under `edges`. A node keeps
its domain role: Entity, Value Object, Enum, Rule, Calculation, Query, Mapping,
Policy, Event, Operation, State Machine, Workflow, or Interface. These roles are
not interchangeable records.

Relationships are explicit graph edges. For example, a Query `reads` an Entity,
a Mapping `maps` to an Entity or Interface, a Rule `enforces` an Operation, an
Operation `produces` an Event, an Event `transitions` a State Machine, and a
Workflow `orchestrates` Operations. The compiler validates endpoint kinds,
scope, multiplicity, inverse distinctions, and generated projections before it
plans output.

The installed commerce example is a complete reference for nested fields,
references, exact integers, tagged sums, Rule calls, explicit Calculation values,
Queries, pure Mappings, Policy selection, atomic Operations, Event time,
State Machine transitions, Workflow occurrences/recovery intent, Interfaces,
and cross-feature identity.

## Selection files

A reconciled selection is closed versioned JSON. It names exactly one language,
profile, module root, internal layout version, field/reference bindings, factory
validators, Operation action bindings, and Workflow occurrence bindings. Unknown
fields, versions, profiles, languages, paths, incomplete bindings, duplicates,
and source drift fail. The CLI never retries an invalid explicit selection using
the legacy compiler.

Use the installed example selections as working shapes. Do not copy their
ontology selectors or bindings into a different graph; selections are checked
against the exact source identities they describe.

## Migration

The package root exports three pure helpers:

```js
import {
  migrateTypedPolicyV1,
  migrateLegacyStateMachine,
  planWorkflowOccurrenceMigration,
} from '@domainspec-v2/cli';
```

They require explicit Rule names, transition bindings, or occurrence IDs where
the old source does not contain enough meaning. Their return value is a candidate
for review. They never rewrite files or graph edges. After applying a reviewed
candidate in caller-owned source, run `lint` and the selected build/verification
flow normally. See `MIGRATION.md` for the compatibility boundary.

## Diagnostics and effects

- Exit 0 means the requested materialization or check passed.
- Exit 1 means a check ran and found a negative result, or a tool execution
  failed.
- Exit 22 means invalid arguments, unsupported input, source drift, unsafe paths,
  or another fail-closed contract violation.

Structured errors include `result`, `code`, `pointer`, `message`, and
`authority_effect`. Build and instantiation publish only to a new target. They do
not replace or repair an existing target. Planning and migrations are pure.

## Runtime boundary

Generated Operations and Workflows expose explicit provider contracts; the
compiler does not choose a database, transport, clock, or dependency container.
The `run` command and `@domainspec-v2/cli/experimental/runtime` remain
experimental and are outside the stable root compatibility promise. A Policy
selects a target identity without executing it, a State Machine returns ordered
Event intents without publishing them, and Workflow recovery output is intent,
not automatic compensation execution.

Compilation, verification, and candidate evidence do not by themselves publish
a package, admit a profile, deploy infrastructure, or prove production runtime
behavior.
