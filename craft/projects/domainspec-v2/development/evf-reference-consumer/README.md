# EVF reference consumer

This is an intentionally separate, read-only consumer of finalized EVF evidence.
It has no dependency on the EVF producer kernel or independent verifier. It
accepts only the exact multi-provider reference profile, recomputes the evidence
and stage-chain digests, requires every S0-S12 stage to pass, preserves the
producer claim ceiling, and emits its own append-only receipt with
`authority_effect: none`.

Its acceptance means only that one exact EVF evidence handle satisfies this
consumer's bounded input contract. It grants no product approval, authorization,
publication, release, deployment, or other operational authority.
