# G02 Flipt validation-command pair: unscored control failure

## Result

The source-only Flipt task `SWE-Bench-Pro__go__maintenance__bugfix__1c69a463` was frozen for a matched ARE/DSH development pair. The ARE arm completed a valid final context selection in 184.54 seconds using 147,632 known model tokens. After both DSH attempts failed at the model transport, no matched native comparison exists and the strict four-gate result is **unscored**, not a pass or fail.

The first DSH attempt exited after 617.47 seconds and 34 model calls, with 596,093 known tokens plus one dispatched request of unknown usage. The one predeclared retry kept the same frozen task/config and archived the first attempt as `dsh-control-attempt-1`; it exited after 195.51 seconds and 12 calls, with 63,664 known tokens plus one dispatched request of unknown usage. Both transport receipts report `transport-or-persistence-failure`, poisoning cost completeness. No further retry is planned on this task.

After both control failures, the ARE prediction was scored only as an exposed diagnostic: native Span-F1 **0.32894**, File-F1 **0.40000**. This is not a prospective matched result. All receipts remain under `/opt/are-benchmark-runs/g02-cross-layer-flipt-validate-gofunc-pair-r1/`, including `FREEZE.json`, `CONTROL-RETRY.json`, both DSH attempt folders, ARE evidence, and native diagnostic score. The exited first-attempt containers were renamed with `-attempt-1` to allow the retry without deleting them.

## Open Questions

- Is the repeated GLM transport failure transient or workload-related? A shorter untouched control task is the next bounded test.
- Can Go cross-layer hints improve native quality on a valid matched pair outside the exposed import/export task?
