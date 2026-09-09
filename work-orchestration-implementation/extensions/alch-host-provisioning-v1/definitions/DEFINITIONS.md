# Provisioning prototype definitions

Status: package-local candidate vocabulary, authority effect none. These terms
do not amend the canonical CyberAlchemy definitions. Canonical construction and
evidence meanings remain CAV2-D65 and CAV2-D84 in
`cyberAlchemy-v2/authority/definitions/DEFINITIONS.md`.

## AHP-D01 ProvisioningTarget

Formal: one host-selected absolute private directory with exact owner and no
symlink or hardlink redirection; v1 permits only `/tmp/alch-provision-*`.

Plain language: the disposable place we are configuring.

Domain context: Ansible can create configuration and state directories here;
this is not a cloud account, VM, or activated Alch server.

## AHP-D02 ProvisioningRun

Formal: a source-bound DAG execution with one exclusive owner, persistent
deadline, and ordered accepted transitions. Each transition atomically contains
event, resulting cursor, and complete command batch. Effects occur outside that
transaction; uncertain completion requires observation before repetition.

Plain language: a recoverable record of the setup work and what remains.

Domain context: the host's SQLite journal owns acceptance; the existing Rust
DagEngine derives structure. Local locking excludes competing host processes.

## AHP-D03 AnsibleExecutionBinding

Formal: a fixed mapping from the configure operation to a source-pinned
playbook, localhost inventory, private variables, and bounded subprocess group.

Plain language: the exact Ansible job the platform is allowed to run.

Domain context: v1 uses installed Ansible Core through its CLI. No arbitrary
playbook, inventory, privileged operation, secret, or remote host is accepted.

## AHP-D04 LocalReadinessReceipt

Formal: a historical result released only after configuration verification and
storage write/fsync/read verification succeed. It grants no activation and
cannot establish service, network, sandbox, or cloud readiness.

Plain language: evidence that the local fixture passed its two checks.

Domain context: this is a future ORODI adapter input, not an admitted ORODI
observation or proof that Alch functions can already be hosted.

## Open Questions

See [package questions](../README.md#open-questions).
