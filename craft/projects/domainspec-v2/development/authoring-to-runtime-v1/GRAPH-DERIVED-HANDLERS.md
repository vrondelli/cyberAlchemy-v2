# Graph-derived application request handlers

Status: TypeScript candidate implementation. Authority effect: none.

## Responsibility

A request handler connects an existing checked request Mapping to its selected
Operation. It is generated from the compiled application graph, not authored as
an imperative business program and not inferred from an example's field names.
This is an implementation of existing Mapping/Operation Request contracts, not
a new domain meta-type or canonical relationship.

The generated `src/integrations/application-request-handlers.ts` exports a
registry keyed by Mapping binding identity. Each entry accepts the incoming body
and the exact dependency type of its selected native Operation. The Operation
module and callable come from checked generated-module metadata.

## Preserved distinctions

- Each Mapping input reads its declared source path. Different bindings of the
  same Operation keep different payload paths and identities.
- Mapping-result parameters receive the checked Mapping result. Explicit
  source-body parameters, including Event inputs, retain their separate paths.
- Missing paths, inherited properties and accessor properties are rejected;
  the handler does not execute getters to obtain required request data.
- The Mapping runs before the Operation. A successful connection calls the
  selected Operation once and returns its awaited outcome unchanged.
- Rejection, known failure, committed outcome and indeterminate settlement are
  not reclassified. No retry, compensation or acknowledgement is introduced.

The handler does not select HTTP status codes, response Mapping policies,
subscription acknowledgement behavior, storage semantics, provider credentials
or transaction guarantees. Those remain with their existing contracts and
provider implementations. Native type checks and runtime argument checks are
not FormalClaim proof or an admission grant.

## Integration and remaining scope

The existing TypeScript reference adapter now delegates its inbound request
Mapping/Operation connections to this generated registry. Its response mapping,
reference transport routes, persistence implementation and other provider
assumptions are still separately bounded reference code. Python and Rust handler
generation is not claimed by this TypeScript implementation.

This is one prerequisite for generic provider composition. The composed v2
project join, complete graph-derived provider bodies, remaining source-authored
integration choices and the full application loopback scenario remain I07 work.
The execution frontier and unresolved implementation work are tracked in
[EXECUTION-STATUS.md](EXECUTION-STATUS.md).
