# Queries — Meta-Type Closure Epoch E1

| Query | Returns | Failure meaning |
| --- | --- | --- |
| GetBaselineStatus | per-path current digest, Git state, predecessor, type, freshness | missing or drifted path blocks preservation claim |
| GetTypeValidationStatus | per-type validator results and exact command exits | any acceptance-critical nonzero result blocks candidate |
| GetCandidateCoverage | 13-type denominator membership and evidence links | any duplicate, missing, or outside-denominator type blocks candidate |
| GetOwnerGateStatus | separate Rondelli and Victor response state | pending never means accepted |
