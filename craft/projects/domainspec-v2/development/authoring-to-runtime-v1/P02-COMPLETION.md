# P02 completion — three clean installed-consumer flows

Date: 2026-09-20. Status: scoped complete. Authority effect: none.

## Completion statement

P02 is complete for the installed-consumer construction boundary. Three
separate task-owned consumer projects installed exact locally formed
`@domainspec-v2/cli` and `@cyberalchemy/alchlang` archives. The Rust consumer
also installed `@cyberalchemy/alchlang-rust`; the TypeScript consumer inspected
the separately bounded experimental `@cyberalchemy/alchlang-local-host`
archive without using it as a portable application dependency.

Every consumer resolved its source from the installed core package, never from
the checkout. TypeScript, Python and Rust each passed:

1. `.alch` source and exact-companion check;
2. DomainSpec lowering and provider-application build;
3. exact generated-output verification;
4. `.alch` and `.domainspec` evidence inspection;
5. native compilation with the generated lock;
6. loopback signed-webhook rejection and acceptance (`401`, then `202`, with
   exactly one handler invocation);
7. post-scenario output verification; and
8. deletion of the consumer, native work and all task-owned temporary roots.

## Language evidence

| Language | Generated artifacts | Native compiler | Scenario | Cleanup |
| --- | ---: | --- | --- | --- |
| TypeScript | 58 | TypeScript 7.0.2 | `http-listener`, pass | pass |
| Python | 91 | Python 3.14.4 | `asgi-http-listener`, pass | pass |
| Rust | 68 | Cargo 1.98.1 | `axum-http-listener`, pass | pass |

All three outputs carry byte-identical language-neutral application graph
evidence. TypeScript and Python use exact lock-bound registry dependencies in
disposable native copies. Rust uses the repository toolchain launcher and the
existing locked crate cache with `--offline`. The original generated targets
remain unchanged through the native scenarios.

## Validation

- Clean installed-consumer reports: 3/3 pass, zero skips.
- Check/lowering/build/verify/native/scenario/inspection/cleanup denominator:
  complete for all three languages.
- Cross-language application graph bytes: identical.
- P02 qualification validator: 2/2 pass, zero skips.
- Qualification: `evidence/p02-clean-consumers/qualification.json`, SHA-256
  `bdf05652d7b0e8a774f471a7b675512a066503ee506b1a797c7eec9044020ac7`.

## Claim ceiling

This closes P02 clean installed-consumer construction evidence only. It does
not freeze a candidate, grant D65 admission, validate or approve the product,
publish, release, deploy, prove production behavior or grant authority.
Product-owner validation remains deferred until L4X.

Progress is 33 of 37 scoped nodes. P03 is the next causal node and owns the
exact candidate manifest and its non-mutating currentness validator.

## Open Questions

P03 must bind the exact source, package files, tools, environments, reports,
receipts and claim ceiling. Any drift returns work to the responsible node.
