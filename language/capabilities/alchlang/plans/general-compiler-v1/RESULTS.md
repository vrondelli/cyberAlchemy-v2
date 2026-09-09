# AlchLang local runtime and CLI — execution results

The confirmed local envelope is implemented through the durable integration
layers. Markdown AlchLang can be parsed, compiled, written, packaged, and used
to execute a guarded action. An explicit SQLite transactional Outbox effect can
then be claimed by a durable worker and delivered through stdout or a
confirmation-gated HTTP transport.

## Delivered

- Bounded textual parser, typed predicates, deterministic compiler, atomic
  artifact writer, and guarded action runtime.
- Registry compiler exposing a pattern only when meta-type, binding, generator,
  and conformance dependencies close.
- Explicit `effect` and `performs` clauses and concrete
  `transactional-outbox/sqlite` generation.
- Exact binding resolver; effectful actions cannot fall back to memory.
- Atomic state-plus-Outbox commit with optimistic versioning and idempotent
  replay reconciliation.
- Exclusive expiring leases, restart reclaim, exponential retry, attempt
  ceiling, dead letter, explicit requeue, and bounded telemetry.
- Row-preserving SQLite v1-to-v2 migration and transactional consumer inbox.
- `domainspec outbox pending|status|dispatch|requeue-dead` operator commands.
- HTTP delivery with exact origin allowlist, explicit network confirmation, and
  stable `idempotency-key`; the evidence uses loopback only.
- Candidate package `@cyberalchemy/domainspec-cli-candidate@0.4.0-candidate.0`.

## Evidence

| Surface | Result |
| --- | --- |
| Extension D65 source | PASS — 38 nodes, 32 relationships |
| Deterministic source manifest | `4449c0c790a8fcdc0e981c15436bbce5ac18a795a1ae0312d295a8a8058b0f3a` |
| Registry closure | PASS — 2 available patterns; 0 blocked |
| Package tests | PASS — 48/48 under Node v26.8.1 |
| TypeScript typecheck/build | PASS |
| Runtime integration validation | PASS — 11 checks |
| Exact binding | See `evidence/construction-binding.candidate.json` |
| Local npm tarball | See the exact binding after documentation closure |
| Aggregate governed conformance | `not_evaluable` — stale accepted Work-Pack loader digest |

The source and packed CLI paths produce 11 byte-identical customer-approval
artifacts with tree SHA-256
`1a702a7160785ba2809551cdd4f07602a7799825a3de7127c7238b23ed9ad74f`.

## Limits

- This is a bounded formal grammar, not unrestricted natural-language parsing.
- SQLite uses the experimental built-in module in Node 26.
- The provider offers at-least-once delivery; it does not claim exactly once.
- Lease/recovery evidence is local SQLite evidence, not HA, multi-region, load,
  chaos, or production recovery evidence.
- HTTP evidence used only an ephemeral loopback endpoint. Credentials and
  remote endpoints were not exercised.
- `npm pack` was local; `npm publish` was not performed.
- The provider and architecture pattern remain candidates. No canonical
  admission, stable promotion, release, deployment, or product-value claim is
  implied.

## Reproduce

```bash
export PATH=/home/vrondelli/.nvm/versions/node/v26.8.1/bin:$PATH
package_root=cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1

npm --prefix "$package_root/implementation" test
npm --prefix "$package_root/implementation" run typecheck
projects/domainspec-v2/impl/node_modules/.bin/tsx \
  "$package_root/execution/scripts/validate-runtime-integration.ts"
```

Claim ceiling: source-local registry/compiler and durable SQLite Outbox provider
candidate with loopback-only integration evidence. Aggregate governed
conformance is not evaluable until the stale accepted Work-Pack binding receives
a new owner decision.
