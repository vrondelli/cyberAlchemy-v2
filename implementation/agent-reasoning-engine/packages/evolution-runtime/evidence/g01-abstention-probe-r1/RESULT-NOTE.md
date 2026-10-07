# G01 explicit-abstention scorer probe

Status: completed diagnostic on the already exposed clap Rust task `Multi-SWE-Bench__rust__maintenance__bugfix__1cec09c7`. The completed distinctive-source campaign is unchanged.

The pinned `are-contextbench-scorer:g01-r1` rejected [an empty prediction](empty-prediction.json) with `instrument.no-steps`. It also rejected [one empty step with no final files](empty-step-prediction.json) with `instrument.no-final-context`. Thus the current native scorer **does not** assign a zero score to explicit abstention. A future intention-to-treat analysis would require a separately declared wrapper metric and validity policy; it must not be described as a native-scored four-task result or applied retroactively to the completed campaign.

## Open Questions

- Should the benchmark protocol distinguish explicit model abstention from infrastructure or receipt failures and assign a predeclared zero only to the former?
- How should timing and token accounting include an abstention when no native score file exists?
