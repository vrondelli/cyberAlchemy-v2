# CC-003 native test entry

Product construction/test: explicitly select the CC-003 legacy binding subsection
for the existing frontend manifest assertions; preserve every assertion and all
other tests. Verify CC-003 before selection. Add a focused native control-center
smoke, then run the existing unified smoke separately with budgets unchanged.

Operational support (current agent): temporary WDIO Vite assets, SQLite database,
receipt journal and app-data roots; cached Cargo compilation with copied test
binary. No running user desktop is stopped. Restore ordinary Cargo build after
the WDIO attempt. Production frontend dist is not touched.

Scope: files in this native-test directory only. CC-003 is a selected-source
candidate; this runner is separately identified test apparatus, not an implicit
new approved product. Mock Codex and protocol-drift tolerance mean local native
IPC evidence only. Any failure stops its dependent successor run. Full cold-session
host qualification/differential campaign, approval and delivery remain deferred.
