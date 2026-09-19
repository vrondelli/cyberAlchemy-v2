# States — Meta-Type Closure Epoch E1

| State | Meaning | Allowed successor |
| --- | --- | --- |
| baseline-frozen | 13-type source and target inventory is exact | repair-in-progress |
| repair-in-progress | one declared binding seam is changing | validation-pending or blocked |
| validation-pending | staged bytes are frozen for the full matrix | candidate-frozen or blocked |
| candidate-frozen | exact postimages and requests exist | owner-pending |
| owner-pending | one or both distinct approvals absent | admitted or rejected |
| admitted | exact candidate accepted through the protected edge | terminal closeout |
| blocked | a semantic, validation, scope, or authority invariant failed | repaired baseline-frozen restart |
