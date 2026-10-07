# Pre-model candidate-arm whitelist repair

After the frozen GitHub CLI control completed, the first candidate process
stopped with `comparison-client.candidate-arm` after creating only an empty
attempt root (`runs/`), before creating a task run or dispatching a model
request. The shared live-client and transport-ledger
arm allowlists lacked the new cap-12 arm ID. Both allowlists now admit that
ID; the algorithm, cap, task, baseline, scorer, and predeclared decision rule
are unchanged. The GitHub CLI candidate freeze was updated before its first
model request, and the unrun zstd freezes were updated likewise. The completed
control freeze was not edited. GitHub CLI's original control source versions
remain available in the prior shortlist source snapshot. This is an
infrastructure retry, not a scored attempt.

## Open Questions

- Should future new-arm registration use one shared typed arm registry to
  avoid repeated allowlist omissions? Do not delay this cohort to redesign it.
