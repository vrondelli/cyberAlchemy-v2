# Source record

Labels follow the Research Tower evidence vocabulary.

## Primary local sources

| ID | Label | Source | Use |
|---|---|---|---|
| S01 | primary-source | `projects/domainspec-v2/definitions/meta-types/current-implementation.json` (`sha256:84dccd7682a94b7d27df4346bd1ced24d1a31aa4b88c89998313c712934818f4`) | Current owner-admitted frozen baseline pointer: 13 backend meta-types and 39 language realization rows. |
| S02 | primary-source | `projects/domainspec-v2/definitions/meta-types/meta-types.yml` (`sha256:bc800afdca36fa701a13ec611e7ee0ef928a4c8d259d48dfac2880a3cc8cbbc4`) | Canonical meta-type criteria and owner gates. |
| S03 | primary-source | `projects/domainspec-v2/development/meta-type-instantiation-cli/CANONICAL-IMPLEMENTED-BASELINE.v10.json` (`sha256:4e8c72e3c59308bf7f476a2365d0ba66e149534b8dfddb4ad8b555e454edbf59`) | Immutable implemented baseline closure. |
| S04 | primary-source | `projects/domainspec-v2/impl/architecture-conformance/factory/README.md` | Factory lifecycle, kit initialization, proof planning, replay, and authority ceiling. |
| S05 | primary-source | `projects/domainspec-v2/impl/architecture-conformance/factory/contracts/factory-node-provider-v1.ts` | Explicit provider contract. |
| S06 | primary-source | `projects/domainspec-v2/impl/architecture-conformance/factory/contracts/factory-run-request-v1.ts` | Proof-node and dependency request contract. |
| S07 | primary-source | `projects/domainspec-v2/impl/architecture-conformance/factory/registry/factory-node-registry-v1.ts` | Explicit provider registration and fail-closed lookup. |
| S08 | primary-source | `projects/domainspec-v2/impl/cli/README.md` | Canonical instantiation and system-integration claim ceilings. |
| S09 | primary-source | `projects/domainspec-v2/impl/cli/src/generation/plan-instantiation.ts` | One-node, one-realization deterministic plan. |
| S10 | primary-source | `projects/domainspec-v2/impl/cli/src/generation/publish-instantiation.ts` | Contained, create-only, atomic publication. |
| S11 | primary-source | `projects/domainspec-v2/impl/system-integration/profiles/provider-neutral-v1/profile.json` (`sha256:b3d29e53172b8ba81600c6e1944cb96f9778e4fedadaacf1ccd5ca4022483e9b`) | D45-D49 formation profile and unimplemented runtime boundary. |
| S12 | primary-source | `projects/domainspec-v2/impl/system-integration/profiles/provider-neutral-v1/typescript.json` (`sha256:7584b11536b2b55cda5b2bd1ac4e53d90a93c9662f29d382f7ad9a68ff60e1e6`) | Target-specific callable and composition restrictions. |
| S13 | primary-source | `cyberAlchemy-v2/language/capabilities/alchlang/product-capability.json` | AlchLang product meaning; compiler implementation is explicitly a separate concern. |
| S14 | primary-source | `cyberAlchemy-v2/language/capabilities/alchlang/define/initial-language-terms/ALCHLANG-INITIAL-LANGUAGE.md` | Initial terms, typed edges, and open handoff to DomainSpec. |
| S15 | primary-source | `cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/carrier-v2.contract.json` (`sha256:85a317d3c4af2a66b78557728c22be15fa47c1a4f36094db6ce47195c4f4f46a`) | Parser-independent carrier and extension hooks. |
| S16 | primary-source | `cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/{parser,lower,render-typescript,registry-compiler,pattern-registry}.ts` | Current compiler and pattern-registry behavior. |
| S17 | primary-source | `cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/generatable-operation-patterns-v1/` | Current Operation-only pattern candidate and SQLite Outbox slice. |

## External precedents

| ID | Label | Source | Bounded lesson |
|---|---|---|---|
| S18 | related-source | [TypeScript Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API/0bd3ddeb8308a3e9670b7325bb06aea0dcd633a4) | A parser can produce an AST for static inspection; parsing need not execute authored code. |
| S19 | related-source | [Protocol Buffers plugin protocol](https://protobuf.dev/reference/cpp/api-docs/google.protobuf.compiler.plugin/) | Multiple generators can share one parsed request and emit a response through a stable plugin boundary. |
| S20 | related-source | [Terraform Plugin Framework providers](https://developer.hashicorp.com/terraform/plugin/framework/providers) and [schemas](https://developer.hashicorp.com/terraform/plugin/framework/handling-data/schemas) | Provider registration, schema, configuration, resources, and migrations are distinct responsibilities. |
| S21 | analogy | [AWS CDK App](https://docs.aws.amazon.com/cdk/api/v2/dotnet/api/Amazon.CDK.App.html) | Executable authoring can synthesize a graph, but arbitrary execution is unsuitable for AlchLang's fail-closed build boundary. |

## Source limitations

- The local AlchLang pattern package is candidate evidence, not canonical
  DomainSpec provider admission.
- Stored PASS rows are not reinterpreted as current authority.
- External precedents supply architectural comparisons, not normative
  requirements.

