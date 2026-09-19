# Initial request qualification R3

R3 preserves the R2 infrastructure and persistence fixes and rejects model receipts across all four client/result receipt families. Failed rows retain every family, including contradictory result-side evidence. The reported model count is the maximum observed family count, not a sum of mirrored receipts; any positive witness denies tokenizer-only qualification. This count is a lower bound, not reconciled billable usage.

Eight tests pass with actual prepared runners and scripted tokenizer measurements. The new regression injects a healthy model receipt in each result family after the real prepared runner returns: both variants fail qualification and preserve the witness. No actual model or provider calls occurred.

## Open Questions

Independent review is pending. [The process wrapper](COMPARISON-QUALIFICATION-PROCESS.md) owns deadline and local settlement. Actual tokenizer measurements, exact freeze and production admission remain pending. The original [qualification contract](COMPARISON-REQUEST-QUALIFICATION.md) retains scope limits.
