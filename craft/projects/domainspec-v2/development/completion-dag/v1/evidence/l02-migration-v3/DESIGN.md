# Directory-alias rejection boundary

Definition prototype: a supported changed-file validation path contains no symlink
components from the selected repository root through the selected file. Aliases
are unsupported and reject; containment alone does not establish scan coverage.
Agent-facing ontology scaffold: inherit L01 Retain, Adapt, Compatibility envelope
and Obligation correspondence; no new canonical definitions or ontology admission.

Product prototype: a broken document cannot gain a selected PASS through an alias
that the retained validator does not traverse. Business prototype: preserve usable
ordinary-path diagnostics while making unsupported input explicit. DomainSpec
prototype: L01-C04/T08/T09 plus review finding L04-F01. Compiled-system prototype:
wrap the retained selector and normal validator; reuse EVF and Markdown bridges.

Implementation checks each existing component with lstat, rejecting symlinks at
repository root, project/feature roots and selected file ancestors. The repository
root must resolve to its canonical absolute path. The same path checks run after
validation before a result is returned. Normal scan/diagnostic algorithms remain
unchanged. Deletion-only and out-of-scope records do not acquire success claims.

This is a local quiescent-working-tree validator, not an atomic filesystem snapshot
or defense against concurrent hostile path swaps. Historical bindings, results and
caller entry points remain unchanged. The successor CLI is explicit. Approval,
activation, retirement and publication remain separate decisions.
