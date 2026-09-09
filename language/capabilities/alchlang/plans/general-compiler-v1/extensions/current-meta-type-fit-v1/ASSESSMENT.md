# Existing meta-type fit: Medusa quantity pricing

Date: 2026-09-05. Status: research, not a replacement implementation or product approval.

The inspected existing meta-types can describe the pricing problem. No new meta-type is justified by the gaps found so far. The current executable contracts and Alch lowering do not yet realize the whole declarative function. Reuse and extend those layers before considering new meaning.

## Requirement fit

| Requirement | Existing owner | Current executable support and gap |
| --- | --- | --- |
| Price, request, and quote shapes | Entity / ValueObject; typed records, lists, optionals, sums | DomainSpec has structured types; the Alch DomainSpec profile remains narrower and primarily scalar. |
| Medusa DTO to price rows; quote response | Mapping | typed-mapping/v1 supports field copies and scalar defaults. Decimal-string conversion, nested collection transformation, and computed response fields are not expression forms in this contract. |
| Eligibility by currency and quantity | Query with predicates | typed-query/v1 filters, projects, orders by one field, and optionally limits. Existing exact UInt64 realization supports the pricing query. |
| No eligible price, cheapest price, ambiguity | Query plus boolean Rule predicates | Rich typed Rules support exists, exactly_one, negation and references. These can specify minimum and ambiguity. Returning the selected witness or constructing a collection of tied IDs needs a result-producing contract; a boolean proof alone does not produce it. |
| Subtotal | Calculation | Exact UInt64 multiply already exists. Decimal parsing is not an arithmetic expression opcode. |
| Exposed quote boundary | Interface and Query | Quoting is read-only: its outer behavior is Query. Operation requires state change; Workflow coordinates Operations and should not be introduced merely to sequence this quote. |
| Provider, transport and failure bindings | Existing system-integration profile, plus target realization | Provider-neutral binding contracts already compile. Their evidence ceiling explicitly excludes observed runtime guarantees and provider selection. The complete HTTP pricing deployment is not established by those contracts. |

The rich Query generator accepts an operation-shaped typed semantic closure and evaluates a guard before constructing success/failure results. That internal contract name does not make the domain behavior state-changing. It is also distinct from the filter/project/order typed-query/v1 contract. Neither is currently an arbitrary declarative collection pipeline.

## Expressing the loops as logic

For a finite price snapshot P and request r, define these specification predicates (mathematical notation, **not implemented Alch syntax**):

```text
eligible(p, r) = currency(p) = currency(r)
                and min(p) <= quantity(r) <= max(p)
cheapest(p, r) = eligible(p, r)
                and not exists q in P:
                  eligible(q, r) and amount(q) < amount(p)
no_price(r)    = not exists p in P: eligible(p, r)
quoted(r)      = exactly_one p in P: cheapest(p, r)
ambiguous(r)   = (exists p in P: cheapest(p, r)) and not quoted(r)
forall p in P: valid(p) = not exists p in P: not valid(p)
```

Null quantity bounds must first receive the existing pricing normalization semantics. Deleted rows and unsupported pricing features retain the predecessor's explicit boundary rules. Exactly-one counts records; duplicate identities require separate validation.

The structured Rule algebra already has the required boolean/quantifier building blocks. `all` and `any` combine predicates; they are not collection quantifiers. `unique` in the inspected generator checks distinct projected values and must not be substituted for `exactly_one`. Generated iteration is a legitimate implementation of bounded quantification; user-authored procedural loops are unnecessary for these predicates.

Two implementation caveats remain: the rich TypeScript Rule/Query generator checks numeric less-than using JavaScript `number`, and its stable equality uses JSON serialization. Do not compose it with full-range UInt64 bigint pricing without an exact realization and tests. Also, predicate composition inside a Query does not authorize inventing a Rule `enforces` Query ontology edge: the inspected Rule definition describes guarding Operations. Graph bindings need explicit closure validation.

## Construction frontier

Lane: product construction. Current frontier: reuse assessment and declarative contract design. Runnable next work is a bounded pricing contract prototype using existing meanings: typed Mapping, collection Query/Rule, Calculation, result construction, and explicit integration bindings. First establish exact UInt64 compatibility and lawful graph relationships; then expose these through a real Alch AST, resolution, type checking and DomainSpec lowering. Preserve the existing pricing fixtures as acceptance requirements.

Missing conversion/result-construction contracts and exact numeric support are causal implementation gaps. They are not evidence that a new meta-type is required. The existing procedural function-v1 remains a prototype, not the selected final language design.

Operational support: no task required for this assessment. Provider deployment and publication are deferred, affect the deployment/release stages, and require their respective owner and scope. They do not block local prototype work. Meta-Type Factory automation is separately deferred in FUTURE-DEVELOPMENT.md.

## Evidence and limits

Fresh focused validation: **22 tests passed, 0 failed**, recorded in `evidence/tests.log`. Command from `projects/domainspec-v2/impl/cli`, Node 26.8.1:

```sh
node --import tsx --test test/typed-operation/contracts.test.ts test/typed-operation/rust.test.ts test/generation/exact-uint64.test.ts test/system-integration/profile.test.ts
```

These test existing typed contracts/closures, Rust lowering, exact arithmetic realization and provider-neutral binding compilation. They do **not** execute the newly described cheapest-price quantified contract or prove end-to-end declarative pricing. No compiler files changed; no product approval, registry admission or deployment is claimed.

Source dependencies (relative to repository root):

- `projects/domainspec-v2/impl/spec/meta-types/behavioral/{query,operation,rule,calculation,workflow}.md` and inspected companion schemas: meaning and relationship boundaries.
- `projects/domainspec-v2/impl/spec/meta-types/connective/{mapping,interface}.md`: transformation and boundary meanings.
- `projects/domainspec-v2/impl/cli/src/typed-backend/contracts.ts`: query, calculation, mapping and policy expression limits.
- `projects/domainspec-v2/impl/cli/src/typed-operation/contracts.ts`: structured types, Rule operators and result constructors.
- `projects/domainspec-v2/impl/cli/src/generation/generators.ts`: actual TypeScript Rule and rich Query evaluation, quantification and numeric limits.
- `projects/domainspec-v2/impl/cli/src/system-integration/profile.ts` and `test/system-integration/profile.test.ts`: integration profile and explicit claim ceilings.
- `cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/domainspec-profile.ts`: current narrower Alch lowering.
- Sibling `medusa-quantity-price-v1` and `serverless-function-v1`: existing pricing requirements and procedural prototype context; their previous parity and candidate evidence was not refreshed by this assessment.
