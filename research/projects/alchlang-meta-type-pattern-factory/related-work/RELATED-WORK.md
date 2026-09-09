# Related work

## TypeScript compiler pipeline

The official Compiler API separates parsing/AST construction, binding, type
checking, and emission. AlchLang should reuse only the parser/AST idea for the
authoring boundary: parse a closed subset and lower it to owned semantic data.
TypeScript type checking may improve diagnostics but must not substitute for
DomainSpec semantic validation.

## Protocol Buffers plugins

Protobuf compilers parse the source once and provide a stable request to code
generation plugins, which return generated files. The useful pattern is a
shared semantic request plus explicit plugin response. For AlchLang, the
carrier/compilation graph is the shared request and realization providers are
the generators. DomainSpec adds stronger proof, replay, and authority
requirements than the precedent.

## Terraform provider framework

Terraform's provider model separates provider identity/configuration, schemas,
resources/data sources, and schema evolution. The useful lesson is that a
provider is not the domain model: provider registrations and migrations belong
to the integration/runtime layer, while meta-types retain domain semantics.

## AWS CDK

CDK demonstrates ergonomic executable-language authoring that synthesizes an
intermediate assembly. It is only an analogy here. Arbitrary user-code
execution introduces hidden control flow, I/O, nondeterminism, and ambient
dependencies that violate the desired AlchLang compile boundary. The static
arrow subset preserves the ergonomics without adopting executable synthesis.

## Distilled comparison

| System lesson | Adopt | Reject |
|---|---|---|
| Shared parsed IR | yes | target generators reparsing authoring source |
| Explicit providers/plugins | yes | ambient plugin discovery |
| Versioned schemas/profiles | yes | mutable current compatibility |
| Executable-language ergonomics | static subset only | arbitrary build-time execution |
| Generated files as evidence | yes, with receipts | generation as runtime proof or authority |

