# Compatibility

DomainSpec v2 CLI 1.x preserves the documented root exports, stable commands, JSON schema identifiers, and exit behavior within the major version.

- Exit `0`: requested check or deterministic materialization succeeded.
- Exit `1`: a check ran and reported a negative result, or an unexpected/toolchain failure occurred.
- Exit `22`: invalid input, unsupported arguments, source drift, or another fail-closed contract violation.
- Structured failures include `result`, `code`, `pointer`, `message`, and `authority_effect`.

The `run` command and the `@domainspec-v2/cli/experimental/runtime` subpath are outside the 1.x compatibility promise. Generated TypeScript, Python, and Rust are stable only for the exact source, compiler version, language, and receipt digest that produced them.

`recipe-plan`, `recipe-generate`, and `recipe-verify`, the
`domainspec.deployment-recipe-{request,manifest,receipt}/v1` schemas, and target
ID `aws-ecs-fargate-postgres-v1` are part of the stable 1.x surface. Generated
recipe bytes are reproducible only for the exact source graph, recipe request,
consumer application and migration inventories, integration binding digests,
compiler version, and target implementation digest recorded by the receipt.
A changed target implementation changes that digest and must be reviewed as a
new recipe output. The 1.x promise does not cover cloud-provider behavior,
consumer entrypoint semantics, image registries, Terraform state backends, or
deployment environments.
