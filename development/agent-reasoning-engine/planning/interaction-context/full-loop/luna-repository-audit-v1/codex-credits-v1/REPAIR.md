# Zero-dispatch startup repair

Attempt v1 stopped with zero model calls because Codex 0.153.1 rejects configuration
under the reserved built-in openai provider. Preserve RESULT.json and RUN.lock.
The v2 runner removes only those unsupported retry overrides and writes distinct
result/lock files. The runner never retries a failed model turn; Codex transport
retry behavior remains its built-in default, so a turn is not asserted to equal
exactly one backend request. Credit telemetry and reported token totals remain
the accounting basis. The 50-credit check is a client-side stop with a margin,
not a server-enforced account-wide cap. Same task, sources, rubric and model.
