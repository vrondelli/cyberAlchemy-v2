# W2: L0 Build Producer

- Layer question: after this wave, can the exact current inputs reproducibly
  produce an immutable Vite dashboard dist without another package root?
- Task: [TASK-OEWTP-02](../tasks/TASK-OEWTP-02-BUILD-PRODUCER.md)
- SWU: SWU-OEWTP-002
- Dependency: W1 source and owner receipts
- Parallelism: none

## Exit gate

- one fresh retained build handle validates;
- source/tool/command/test/output/cleanup bindings are complete;
- negative build fixture bank passes;
- retained Vite dist path/tree digest/file count/size exist and survive scratch
  cleanup;
- zero new or changed package manifests.

This closes L0. Promotion to L1 requires an explicit passing closeout.
