# R17 user documentation and installed acceptance qualification

Status: **pass**  
Date: 2026-09-15  
Authority effect: **none**

The current local archive contains the corrected user guide, reconciled CLI
help, compatibility boundary, compilation ontology, and a complete installed
commerce example. A clean consumer installed that archive and used only its
shipped binary, public API, documentation, source graph, and selections.

## Installed result

The example contains 38 source files, 21 nodes, 14 relationships, two features,
all 13 meta types, and 22 documented behavior scenarios. Its exact selected
plans contain 36 TypeScript, 81 Python, and 37 Rust artifacts. The installed CLI
built all three targets, verified their exact artifact currentness, and the
native toolchains compiled and executed generated cross-feature calculations:

| Language | Build | Exact verify | Native compile | Executed result |
| --- | --- | --- | --- | --- |
| TypeScript | pass | pass | pass | net 93, fee 5 |
| Python | pass | pass | pass | net 93, fee 5 |
| Rust | pass | pass | pass | net 93, fee 5 |

Appending one byte to a generated TypeScript artifact made `verify` exit 1. The
command did not repair or rewrite the changed file. Restoring the caller-owned
byte was an explicit test action.

## User surface

The shipped guide covers installation, environment inspection, selected builds,
artifact currentness, application layout, stronger native verification, the
source and relationship model, closed selection files, migration helpers,
diagnostics/effects, and the runtime boundary. The shipped user surface contains
no open-question section, internal development link, TypeScript-only selection
claim, or obsolete statement that application layout and `verify-project` are
unsupported.

The installed example is intentionally executable rather than only illustrative.
R13 remains the exact owner of the wider 22-scenario runtime corpus; R17 proves
that the packaged user path reaches real generated code outside the checkout.

Rust reports non-fatal unused-import, unused-variable, and dead-code warnings for
generated surfaces the small execution harness does not consume. Native
compilation and execution pass; the warning residue is visible for R18 review.

This is local candidate evidence. It does not publish, admit, release, or deploy
the package.
