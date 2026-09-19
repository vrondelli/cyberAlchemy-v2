---
dispatch_id: 2026-07-11-ui-compound-domain-structures
artifact: research-transcript
status: collected
authority_boundary: verbatim explorer returns; no DS-D1 or DS-D8 authority
---

# Research Transcript: UI Compound Domain Structures

## Agent 1: Fong, Brendan

# Initial Research Memo

**Dispatch:** `2026-07-11-ui-compound-domain-structures`\
**Researcher:** Fong, Brendan\
**Posture:** read-only initial synthesis; no authority, candidate, validator, or prior-evidence mutation; no promotion claim.

## Initial Verdict

**Yes, these concepts can be investigated as compound typed-graph structures, but not uniformly and not yet authoritatively.**

The strongest working interpretation is:

> A compound domain structure is a bounded, reusable typed subgraph with explicit boundary ports, an internal formation law, and a substitution rule preserving externally observable obligations.

This is more precise than treating every UI or processing label as an atomic DS-D1 type. It also remains weaker than claiming a full category: current DS-D8 supplies finite endpoint signatures, not identities, closure, or associativity. That boundary is explicit in `projects/domainspec-v2/definitions/DEFINITIONS.md:1111-1158`.

The open-system model is consistent with decorated-cospan work, where systems have typed interfaces and compose by joining compatible boundaries, but this is rationale only, not DomainSpec authority: [Fong, “Decorated Cospans”](https://arxiv.org/abs/1502.00872), [Fong, “The Algebra of Open and Interconnected Systems”](https://arxiv.org/abs/1609.05382).

## Evidence State

Current DS-D1 authority still records UI types `DS-D1.15..25` as formation-deferred:

- `projects/domainspec-v2/definitions/DEFINITIONS.md:1053-1065`
- `projects/domainspec-v2/definitions/meta-types/meta-types.md:17-22`

UIF provisionally found narrow separation laws for Page, Layout, Component, Hook, Guard, and Binding, but only as `candidate-schema-ready` hardening routes:

- `projects/domainspec-v2/development/ui-meta-type-formalization/adjudication/VERDICT-MATRIX.md`
- `projects/domainspec-v2/development/ui-meta-type-formalization/candidate-meta-types/ui/`

Replication then found zero independently replicated survivors. Validation proved authored shape, not identity; all nine remained deferred:

- `projects/domainspec-v2/development/ui-meta-type-formalization/replication/findings.md:45-86`
- `projects/domainspec-v2/development/ui-meta-type-formalization/replication/findings.md:138-143`
- `projects/domainspec-v2/development/ui-meta-type-formalization/replication/REPLICATION-MATRIX.md`

UIR adds the decisive requirement: formation needs independent positives, stable contrast, erasure tests, **changed downstream consequence**, closed negatives, portability evidence, and an owner firewall:

- `projects/domainspec-v2/development/ui-meta-type-repair/research/2026-07-11-findings-repair-architecture/findings.md:140-158`
- Rejected shortcuts appear at `:187-203`.

## Proposed Compound Formation Laws

Let a proposed structure be:

```text
C = (V, E, B_in, B_out, r, P)
```

Where `V` contains DS-D1-typed nodes, `E` contains DS-D8-admissible edges, `B_in/B_out` are exposed ports, `r` is an optional distinguished root role, and `P` is a structure-wide invariant.

A compound interpretation should require:

1. **Typed interior:** every member has an independently meaningful type.
2. **Edge admissibility:** every internal edge satisfies active DS-D8 endpoint rules.
3. **Explicit boundary:** external dependencies cross only named input/output ports.
4. **Global invariant:** the formation law cannot be localized to one node, edge, field, or metadata flag.
5. **Non-collapse:** replacing the compound with an atomic node, role label, or relation loses a checkable consequence.
6. **Substitution:** one instance may replace another only when boundary signatures and observable obligations are preserved.
7. **Changed consequence:** formation changes validation, composition, projection, tests, derivation, or generated code.

These strengthen the existing first-class boundary rubric in `projects/domainspec-v2/research/2026-07-02-first-class-category-boundary/findings.md`.

## Identity And Substitution

**Structural identity:** two compounds are equivalent up to internal identifier renaming only when graph isomorphism preserves:

- node types;
- edge labels and directions;
- distinguished roles;
- boundary port types;
- multiplicity/order where meaningful;
- owned obligations and negative constraints.

**Named-instance identity:** `PaymentsPage` and `PlayersPage` remain different instances even if structurally isomorphic because route, feature, and source identity differ.

**Valid substitution:** `DashboardLayoutA` may replace `DashboardLayoutB` when both expose compatible Page/content slots and preserve shell obligations.

**Invalid substitution:** a hook returning equivalent data is not substitutable if lifecycle, effects, cache invalidation, or mutation behavior differs. Shape equality is insufficient.

## Concept Dispositions

| Label | Best initial interpretation | Compound boundary |
| --- | --- | --- |
| Page | Compound structure with distinguished route-root role | Route/access inputs; rendered Component inventory output. Formation pressure: `candidate-meta-types/ui/page/page.md`. |
| Layout | Compound shell pattern | Named content slots in; wrapped Pages/chrome out. Page-specific primary content is forbidden. |
| Component | Recursive role plus optional compound | Leaf Component may be atomic; composite Component is a bounded Component subgraph. The umbrella interpretation remains unsound. |
| Hook | Behavioral role or compound reactive contract | Typed parameters in; values/handlers out; lifecycle/effect dependencies exposed. “Hook” alone risks framework vocabulary. |
| Guard | Projection-oriented compound | Rule/identity context in; allow/block/redirect behavior out. It must preserve Rule authority outside the compound. |
| Binding | Split interpretation | A pure connection is a relation; a durable endpoint/mapping/cache/invalidation record may be a node or small compound. |
| Importer | Architecture pattern or named compound instance | External Interface/source in; Mapping, Rules, Operations, Events or records out. `Arcanum Importer` is currently a named architecture component, not a demonstrated atomic type: `implementation/domainspec/docs/features/domainspec-arcanum-superset/ARCHITECTURE.md:117`. |
| Processor | Architecture pattern or runtime compound | Event/stream input; Calculation/Rule/Operation/Workflow interior; Event/projection/checkpoint output. “Background worker” is implementation runtime; “Stream Processor” remains only a possible distinction in `implementation/domainspec/vault/discovery/domainspec-types-and-edges-validation/research/domainspec-research.md:223`. |

## Interpretation Comparison

- **Atomic type:** appropriate only when one formation law and one changed consequence belong to the node itself. Weak fit for Page/Layout and umbrella Component.
- **Role:** describes what a node does inside a larger graph. Strong for route root, shell, visual unit, reactive contract, and gate.
- **Relation:** best when no durable independently addressable record exists. Strong for edge-only Binding.
- **Projection:** best when UI behavior reflects another authority without owning it. Strongest for Guard mirroring Rule.
- **Architecture pattern:** reusable implementation topology and dependency guidance. Existing UI concept cards currently function primarily this way under `implementation/domainspec/architecture/pattern-library/concepts/ui/`.
- **Compound domain structure:** appropriate when the bounded subgraph itself carries invariant, boundary, substitution, and changed-code consequences.
- **Named instance:** a concrete structure such as `PaymentsPage` or `ArcanumImporter`; recurrence of instances does not establish a new type.

## Examples And Counterexamples

**Positive Page compound**

```text
Layout --wraps--> Page(route root) --renders--> Component
Guard --protects--> Page
Guard --mirrors--> Rule
Component --consumes--> Hook
Binding --fetches--> Query
```

The structure has a route boundary and changes navigation, access, rendering, and test obligations.

**Positive importer analogue**

```text
External Interface -> Mapping -> Operation -> Event
                         |
                         -> Rule
```

The importer is the bounded orchestration, not necessarily another atomic node.

**Counterexamples**

- A `page.tsx` filename with no proven route/content boundary.
- A React function called `Component` whose only property is framework syntax.
- A Hook label attached to an ordinary helper.
- A Guard that owns authorization instead of projecting a Rule.
- A Binding that is merely `Hook --calls--> Query`.
- A Processor label around one Operation with no stream, checkpoint, ordering, or output obligations.

## Changed-Code Consequences

Adopting this model later would require a different implementation surface than adding six scalar DS-D1 schemas:

1. A structure declaration format containing members, edges, boundary ports, distinguished roles, and invariants.
2. Subgraph validation layered over DS-D1 node formation and DS-D8 edge admissibility.
3. Structure-level fixtures testing boundary closure, erasure, invalid substitution, and graph rewrite behavior.
4. Code generation capable of producing coordinated modules and dependency contracts rather than one artifact per concept.
5. Code tags carrying structure-instance membership and boundary-role identity.
6. Drift analysis that detects topology or boundary changes, not only node-attribute changes.
7. Framework-portability tests proving that the same structure can be realized by materially different code organizations.

## Research Conclusion

The compound model is promising chiefly as a **third layer**:

```text
atomic DS-D1 nodes
+ DS-D8 relations
+ bounded compound structures over them
```

It should not replace atomic types or relations wholesale. Page and Layout are the strongest compound candidates; Component needs leaf/composite separation; Guard is primarily a projection-bearing compound; Hook is vulnerable to framework collapse; Binding must preserve the node-versus-relation split. Importer and Processor are stronger analogues of architecture patterns or named compound instances than of atomic domain types.

This memo supplies a research hypothesis and falsification conditions only. It does not alter or settle DS-D1, DS-D8, UIF, UIR, candidate status, validation behavior, or promotion eligibility.



## Agent 2: Alexander, Christopher

## Initial Research Memo

**Dispatch:** `2026-07-11-ui-compound-domain-structures`\
**Researcher:** Alexander, Christopher\
**Posture:** read-only; no authority, candidate, validator, or prior-evidence mutation; no promotion claim.

### Initial Thesis

Recurrence alone does not create a type. The evidence supports three distinct phenomena:

1. **Architecture pattern:** a repeatable arrangement solving a recurring problem in context.
2. **Contextual role:** an existing artifact temporarily plays a function without acquiring new identity.
3. **Governed compound kind:** a bounded assembly whose composition, invariants, lifecycle, substitution rules, and downstream consequences remain stable across implementations.

None of the eight labels currently satisfies the third standard. Several are useful patterns; most appear to be roles played by existing typed structures. This is compatible with, but stricter than, the current architecture library, which calls its cards patterns while also presenting them as taxonomy concepts: `implementation/domainspec/architecture/pattern-library/README.md:12-24`.

### Classification Matrix

| Label | Initial classification | Decisive local evidence |
|---|---|---|
| **Page** | Pattern plus contextual composition-root role | The card defines a routable composition root combining Layout, Guard, and Components, not an atomic unit: `implementation/domainspec/architecture/pattern-library/concepts/ui/page.md:3-35`. The admitted Savvy specimen lacks a non-label-derived route/content identity witness: `projects/domainspec-v2/development/ui-meta-type-formalization/replication/REPLICATION-MATRIX.md:17`. |
| **Layout** | Pattern plus shell role | Its law is shared chrome plus slots and exclusion of page-specific logic: `implementation/domainspec/architecture/pattern-library/concepts/ui/layout.md:3-34`. The observed `children` slot does not establish finite slots, Page targets, or content exclusion: `.../replication/REPLICATION-MATRIX.md:18`. |
| **Component** | Framework-local structural role or fallback category | The card covers broadly reusable visual units: `implementation/domainspec/architecture/pattern-library/concepts/ui/component.md:3-37`. UIF explicitly rejects the umbrella meaning, while replication still lacks a non-React identity witness: `.../adjudication/VERDICT-MATRIX.md:14`; `.../replication/REPLICATION-MATRIX.md:19`. |
| **Hook** | Framework pattern and reactive role | The supposedly general card explicitly depends on React lifecycle and `useQuery`: `implementation/domainspec/architecture/pattern-library/concepts/ui/hook.md:3-30`. UIF requires a framework-neutral contract, while local replication found only a React counterpart: `.../baseline/CANDIDATE-HYPOTHESIS-MATRIX.md:41`; `.../replication/REPLICATION-MATRIX.md:21`. |
| **Guard** | Projection pattern plus access-gate role | The card says it mirrors backend authority without replacing it: `implementation/domainspec/architecture/pattern-library/concepts/ui/guard.md:3-32`. The local specimen does not attest a separate authoritative-rule projection: `.../replication/REPLICATION-MATRIX.md:24`. |
| **Binding** | Durable integration role when recorded; otherwise relationship | The card combines typed fetch/mutate contracts with hook implementations: `implementation/domainspec/architecture/pattern-library/concepts/ui/binding.md:3-38`. UIF expressly distinguishes a durable record from a pure connection, while the observed auth fetch lacks mapping/cache/invalidation structure: `.../baseline/CANDIDATE-HYPOTHESIS-MATRIX.md:45`; `.../replication/REPLICATION-MATRIX.md:25`. |
| **Importer** | Boundary pattern and contextual adapter role | The Arcanum importer has a concrete source, output, read-only boundary, provenance, lifecycle-owner, and validation obligations: `implementation/domainspec/docs/features/domainspec-arcanum-superset/ARCHITECTURE.md:117`, `:198-208`. But GoldenQuill treats an importer as one interchangeable adapter-producer source: `implementation/domainspec/docs/features/goldenquill-promotion-governance/architecture.md:313-318`; `.../domain.md:315-327`. |
| **Processor** | Broad pipeline-stage role; possibly several narrower patterns | Owned uses include deterministic post-processing, span processing, and redaction processing, with materially different contracts: `implementation/domainspec/docs/features/gitops-assessment/SPEC.md:74`; `implementation/domainspec/internal_tools/graph_retrieval/features/observability/spec/domain.md:30`; `projects/goldenquill/pipeline/architecture/v0.1/architecture_v7_0_4_amendment.md:368`. “Consumes and transforms something” is too weak to establish one kind. |

### When Recurrence Means Pattern

Treat recurrence as a pattern when all of the following are finite and observable:

- At least three independent occurrences exhibit the same **problem, context, forces, and solution arrangement**.
- One explicit negative context shows when the arrangement should not be used.
- Implementations may vary while preserving consequences.
- The pattern can overlap other patterns and does not claim an identity principle.

This matches Fowler’s primary pattern-writing criterion: a pattern is a recurring, useful solution that others can reproduce in an appropriate context ([Writing Software Patterns](https://martinfowler.com/articles/writingPatterns.html)). Fowler’s Gateway also shows why recurrence need not create a type: the same boundary solution is frequently called Gateway, Adapter, or anticorruption layer depending on context ([Gateway](https://martinfowler.com/articles/gateway-pattern.html)).

### When It Is a Role

Apply the **gain/loss test**:

> Can the same underlying artifact begin or cease playing the label without being destroyed or replaced?

If yes, the label is role-like. A component becomes a Page by being installed as a routable terminal; an adapter becomes an Importer when assigned an ingestion source; an operation becomes a Processor when installed in a pipeline. Their underlying identity survives reassignment.

This follows the OntoUML finite criterion: a role supplies no identity, is anti-rigid, and depends on a relational context ([OntoUML Role](https://ontouml.readthedocs.io/en/latest/classes/sortals/role/index.html)).

### Governed Compound-Kind Admission Test

A future compound-kind proposal should pass every gate:

1. **Label erasure:** independent reviewers recover the same boundary and obligations without seeing the proposed name.
2. **Typed boundary:** finite entry, exit, owned parts, cardinalities, and allowed substitutions.
3. **Invariant surplus:** at least one invariant cannot be assigned cleanly to an existing part or relationship.
4. **Lifecycle:** creation, activation, replacement, failure, and retirement differ from those of the parts.
5. **Whole substitution:** replacing the compound has predictable consequences not reducible to replacing one component.
6. **Cross-context recurrence:** two frameworks or domains preserve the same law.
7. **Changed-code consequence:** recognition changes generation, validation, tests, ownership, observability, or deployment.
8. **Collapse test:** an existing type, projection, relationship, or architecture pattern cannot produce the same consequences.
9. **Closed negatives:** include both the same graph with different behavior and different graphs carrying the same colloquial label.

Failure at gates 3, 4, or 7 should normally leave the construct as a documented pattern or role.

### Challenge to a Graph-Only Account

A typed graph is necessary evidence, but insufficient identity evidence.

The same `wraps/renders/protects/consumes` motif can describe a Page, nested Component, test harness, or route shell. Conversely, a Page implemented through server routing, static HTML, or client composition may have different local graphs while retaining the same contextual function. Importers and processors additionally depend on temporal ordering, idempotency, checkpointing, failure policy, provenance, and ownership, none of which follows from topology alone.

The repository already forbids this shortcut: raw edge differences are insufficient (`.../baseline/CANDIDATE-HYPOTHESIS-MATRIX.md:20-27`), and later review states that authored shape validates structure rather than identity (`.../replication/findings.md:72-78`). SHACL offers the right formal analogy: it validates focus nodes against graph conditions, but conformance is not an independent identity principle ([W3C SHACL](https://www.w3.org/TR/shacl/)).

### Initial Disposition

Preserve all eight labels as useful research vocabulary. Model **Page, Layout, Hook, Guard, Importer, and Processor** first as contextual patterns/roles; treat **Component** as a framework-scoped fallback; and test **Binding** first for durable-record versus relationship collapse. A compound-kind layer remains a hypothesis requiring the admission dossier above, not a present classification or promotion route.



## Agent 3: Simon, Herbert

**Initial Research Memo**

**Dispatch:** `2026-07-11-ui-compound-domain-structures`\
**Role:** Simon, Herbert\
**Mode:** read-only empirical research\
**Boundary:** No DS-D1, DS-D8, candidate, validator, or prior-evidence mutation. No promotion claim. No external sources used.

## Initial Position

A **compound domain structure** is most plausibly an owned, finitely testable graph contract whose internal roles may be replaced while its identity, lifecycle, and operational consequences remain stable.

That differs from:

- **Stable domain kind:** survives implementation substitution and changes what must be generated, validated, owned, or executed.
- **Replaceable role:** one participant in a larger structure; another implementation can occupy the same role.
- **Convenient bundle:** a useful name for co-located behavior with no independent identity, lifecycle, or downstream consequence.

Recurrence and naming are insufficient. The existing review already establishes that shape validation does not prove semantic identity and leaves all examined UI labels deferred: `projects/domainspec-v2/development/ui-meta-type-formalization/replication/findings.md:72-86` and `projects/domainspec-v2/development/ui-meta-type-formalization/replication/REPLICATION-MATRIX.md:27-32`.

## Operational Comparisons

| Structure | Observed operational effect | Initial classification |
|---|---|---|
| Body War activity importer | Spans permission check, provider adapter, summary retrieval, redaction boundary, receipt, consent, and eventual evidence persistence. | Compound application contract, but “Importer” itself remains a role/bundle in this specimen. |
| GoldenQuill deterministic processor | Has typed input/result, substrate dispatch, normalization law, closed failure modes, tests, and a fixed pre-queue lifecycle position. | Stable gate kind composed from replaceable processing roles; generic “Processor” is not the stable kind. |
| Page | Savvy’s `Page` owns state, navigation, persistence, guards, chrome, and screen selection. No independently attested route/content contract. | Application orchestrator bundle or framework role. |
| Layout | Root wrapper supplies one `children` slot, chrome, analytics, and document shell. | Framework composition role/pattern. |
| Component | `Screen4Inputs` has typed props and rendering behavior, but no separate lifecycle or authority boundary. | Broad implementation role. |
| Hook | `useHasMounted` is a replaceable wrapper over `useSyncExternalStore`. | Framework lifecycle role. |
| Guard | `guardStep` computes navigation permission and fallback but does not attest a separately owned authoritative source rule. | Projection/gate role; compound identity unproven. |
| Binding | `submitAuth` performs fetch, mapping, state updates, and error handling but owns no durable cache/invalidation record. | Procedure plus relationships, not an admitted compound. |

## Worked Examples

**1. Activity import**

Observed graph:

```text
authenticated request
  -> Strava adapter
  -> activity summaries
  -> public redaction/receipt
  -> response
  -> consented evidence selection
  -> redacted persistence
```

The adapter exposes a replaceable provider boundary at `projects/body-war/app/src/auth/strava-oauth.ts:36-50` and `:172-190`. The route enforces permission and emits an import receipt at `projects/body-war/app/server.ts:529-557`. The receipt fixes redaction and authority limits at `projects/body-war/app/server.ts:305-329`. A separate path validates consent and persists a redacted evidence candidate at `projects/body-war/app/server.ts:687-720`.

Calling all this an “Importer” helps decomposition only if the name requires those boundaries. Today, summary retrieval does not itself persist an import, while persistence happens later. Therefore the label currently bundles multiple operations; it does not identify one stable executable object.

**2. Deterministic processor**

GoldenQuill’s post-processor has stronger non-label identity:

- Immutable mode/substrate dispatch keys: `projects/goldenquill/pipeline/logician/gates/f_extractor_fabrication.py:80-114`.
- Symmetric normalization and substrate-specific behavior: `:127-179`.
- Typed result and closed rejection outcomes: `:117-124`, `:321-351`.
- Fixed execution position before pending-fact construction: `projects/goldenquill/pipeline/orchestrator/seats/intake.py:1411-1465`.
- Mutation-like negatives for OCR substitution and locator mismatch: `projects/goldenquill/tests/logician/gates/test_f_extractor_fabrication.py:110-149`.

Replacing normalization or document readers is possible while preserving the gate contract. Removing or bypassing the gate changes execution and admitted outputs. Thus the stable structure is the **fabrication gate**, not the generic role “processor.”

**3. Savvy Page compound**

`Page` combines hydration, session persistence, workflow transition, guard invocation, chrome, and screen dispatch: `projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/app/page.tsx:417-515` and `:575-710`.

Splitting these into a state store, router, guard adapter, and screen host could preserve behavior without preserving a Page object. The name therefore does not yet determine decomposition, generated code, validation, lifecycle, or ownership. The accepted replication record reaches the same empirical limit: `projects/domainspec-v2/development/ui-meta-type-formalization/replication/REPLICATION-MATRIX.md:17`.

**4. Guard and Binding**

`guardStep` has finite inputs and fallback behavior at `projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/lib/savvy-fsm.ts:126-162`, but the specimen does not separate decision authority from UI enforcement. Treating it as a stable kind would risk reifying a projection as an authority owner.

`submitAuth` at `projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/components/screens/screen-login.tsx:40-74` is replaceable imperative integration code. Without a durable endpoint/mapping/cache/invalidation record, “Binding” adds no operational identity.

## Failure Cases

1. **Filename ontology:** `page.tsx` or `layout.tsx` is accepted because the framework names it.
2. **Role reification:** any `useX` function becomes Hook despite being inlineable utility code.
3. **Relation reification:** a fetch edge becomes Binding without a durable owned record.
4. **Projection capture:** Guard becomes owner of authorization instead of enforcing another owner’s decision.
5. **Bundle inflation:** “Importer” covers fetch, parse, redact, persist, and receipt despite no single lifecycle joining them.
6. **Generic processor collapse:** every input-to-output function qualifies as Processor.
7. **Orchestration blob:** Page qualifies because it happens to contain many responsibilities.
8. **Circular validation:** authored fields restate the proposed name and then validate that name.

## Finite Admission Tests

A proposed compound passes only if all mandatory tests succeed:

1. **Closed graph:** enumerate required node roles, edge kinds, boundary inputs, outputs, and forbidden edges.
2. **Non-label witness:** identify the structure without filenames, class names, framework symbols, or self-declared tags.
3. **Role substitution:** replace one internal implementation while preserving compound identity and observable contract.
4. **Identity-breaking mutation:** remove one required role or edge and observe a specific validation or execution failure.
5. **Generation delta:** naming the structure deterministically changes generated modules, interfaces, wiring, or configuration.
6. **Validation delta:** it introduces checks not reducible to validating each constituent independently.
7. **Lifecycle delta:** it has creation, execution, versioning, retirement, or state transitions owned at the compound boundary.
8. **Ownership delta:** one owner is accountable for the whole contract without absorbing constituent authority.
9. **Portability:** reproduce the graph in two owned corpora without framework-name inference.
10. **Closed negatives:** demonstrate at least one role, relation, projection, and convenient bundle that must reject.

Failure of tests 1-4 collapses the proposal immediately. Passing only recurrence, naming, or structural-shape tests leaves it a role, pattern, or bundle.

## Research Disposition

The evidence supports investigating **compound domain structure as a non-atomic architecture-contract layer**, represented as an owned graph template over existing kinds, roles, and relationships. It does not support treating Page, Layout, Component, Hook, Guard, Binding, Importer, or Processor uniformly as stable kinds.

The next bounded route should test three contrasts:

1. GoldenQuill fabrication gate as a likely compound-contract positive.
2. Savvy `useHasMounted` and Body War summary retrieval as role/bundle negatives.
3. Savvy Page and Body War end-to-end import as disputed compounds subjected to the ten admission tests.

No authority or evidence state was changed.



## Agent 4: Turing, Alan

**Initial Research Memo: Turing, Alan**

**Scope And Method**

Read-only inspection for dispatch `2026-07-11-ui-compound-domain-structures`. Empirical claims remain bounded to the UIF-010 Body War and Savvy corpora. For these six labels, UIF-010’s exact specimens are all in Savvy; Body War supplies no additional admitted specimen. No external sources were used.

Mechanical commands included:

```bash
rg -n --glob '*.md' --glob '*.json' --glob '*.yml' \
  'UIF-010|\b(Page|Layout|Component|Hook|Guard|Binding)\b' \
  projects/domainspec-v2/development

jq '[.candidates[] | select(...six labels...)]' \
  projects/domainspec-v2/development/ui-meta-type-formalization/candidate-meta-types/ui/candidates.json

nl -ba <bounded-source> | sed -n '<admitted-range>p'
```

The governing review says candidate validation establishes authored shape, not semantic identity, and all candidates remain deferred ([findings.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/ui-meta-type-formalization/replication/findings.md:72), [REPLICATION-MATRIX.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/ui-meta-type-formalization/replication/REPLICATION-MATRIX.md:27)).

**Observed Graphs**

| Label | Parts, edges, nesting, lifecycle | Substitution and consequence | Initial classification |
|---|---|---|---|
| **Page** | `Page()` owns `SessionState`, step/navigation state, effects, callbacks, and conditionally nests twelve screen components ([page.tsx](/home/vrondelli/projects/domainspec-core/projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/app/page.tsx:417), [page.tsx](/home/vrondelli/projects/domainspec-core/projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/app/page.tsx:579)). Graph motif: root coordinator → state; coordinator → guard call; coordinator → selected child component. | A different default React component could occupy the framework entrypoint while preserving routing. Replacing its orchestration changes the journey, persistence, guards, and rendered subtree, but this demonstrates an architectural root role, not the candidate’s unattested terminal-route record. | **Local compound architectural role.** One strong coordinator motif, but “Page” identity remains partly Next vocabulary. Existing `renders` captures its principal outgoing graph edge ([relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:276)). |
| **Layout** | `RootLayout({children})` wraps one open content slot with HTML/body context, shared background, fonts, and production analytics ([layout.tsx](/home/vrondelli/projects/domainspec-core/projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/app/layout.tsx:58)). | Any wrapper preserving `children: ReactNode` can substitute. The consequence is global context/chrome, not page-specific behavior. | **Wrapper pattern/context role.** Stable unary wrapping motif, but the specimen does not attest finite named slots or content exclusion required by the candidate card ([layout.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/ui-meta-type-formalization/candidate-meta-types/ui/layout/layout.md:15)). Its core graph consequence already collapses to `wraps` ([relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:292)). |
| **Component** | `Screen4Inputs` is a typed function over session and callbacks, nests `StepShell`, cards, controls, and icons, and emits changes through callbacks ([screen-4-inputs.tsx](/home/vrondelli/projects/domainspec-core/projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/components/screens/screen-4-inputs.tsx:17)). | A prop-compatible visual function can replace it. Downstream consequences are rendered structure and callback behavior. Page and Layout are themselves React components, so framework membership does not separate this label. | **Framework vocabulary plus broad visual-unit role.** The narrow fallback may be useful, but no stable identity follows from React componenthood. Nesting collapses to `composes`; input behavior is ordinary typed function composition ([relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:308)). |
| **Hook** | `useHasMounted(): boolean` delegates entirely to `useSyncExternalStore`; lifecycle snapshots are supplied by three ordinary functions ([page.tsx](/home/vrondelli/projects/domainspec-core/projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/app/page.tsx:392)). | It can be inlined or replaced by any boolean supplier preserving hydration semantics. That changes implementation mechanics, not the surrounding domain graph. | **Framework vocabulary/implementation role.** The specimen lacks typed inputs, independently owned effects, and a portable lifecycle contract required by the candidate law ([hook.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/ui-meta-type-formalization/candidate-meta-types/ui/hook/hook.md:15)). |
| **Guard** | `guardStep(requested, session) → GuardResult` checks authentication and workflow completion, then returns allowed/fallback step and reason ([savvy-fsm.ts](/home/vrondelli/projects/domainspec-core/projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/lib/savvy-fsm.ts:126)). `Page.go` invokes it before state transition ([page.tsx](/home/vrondelli/projects/domainspec-core/projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/app/page.tsx:489)). | Any same-signature decision function can substitute; downstream consequences are reachable step, fallback, and notice. | **Contextual predicate/control role.** It has a stable gate motif but no separately attested authoritative `Rule` projection, matching UIF-010’s rejection ([REPLICATION-MATRIX.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/ui-meta-type-formalization/replication/REPLICATION-MATRIX.md:24)). `protects`/`mirrors` already express the proposed relational consequences ([relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:372), [relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:484)). |
| **Binding** | `submitAuth` performs an inline `fetch`, request serialization, response decoding, session mutation, and error handling inside `ScreenLogin` ([screen-login.tsx](/home/vrondelli/projects/domainspec-core/projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/components/screens/screen-login.tsx:40)). No separate binding record, cache key, invalidation rule, or durable mappings exist. | Endpoint or transport can change without introducing a new graph node. Consequences remain at the call edge and session update. | **Current specimen collapses to call relation plus local operation.** A durable integration-record motif remains conceivable, but is not observed. The candidate itself distinguishes such a record from an edge-only connection ([binding.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/ui-meta-type-formalization/candidate-meta-types/ui/binding/binding.md:17)). |

**Cross-Label Finding**

No single six-label graph family survives label erasure:

- Page and Layout show compound nesting patterns.
- Component is an overbroad host-language category.
- Hook is lifecycle implementation vocabulary.
- Guard is a replaceable decision role.
- Binding is presently an edge-shaped call site.

The strongest compound-structure hypothesis is therefore not “these six are one new kind.” It is narrower: **some named UI artifacts may instantiate reusable typed graph motifs, while their familiar framework labels do not establish those motifs.**

**Finite Admission And Collapse Tests**

1. **Label-erasure:** classify from parts and edges after removing filenames, exported names, and framework conventions.
2. **Graph replication:** require the same finite typed motif in at least two admitted corpora and two implementation styles.
3. **Residual-law:** subtract existing types, roles, and relationships. No remaining invariant means collapse.
4. **Substitution:** replace the artifact with a signature-compatible implementation. A claimed kind must predict what remains invariant and what must fail.
5. **Lifecycle ownership:** distinguish owning lifecycle state/effects from merely calling a framework primitive.
6. **Downstream delta:** the classification must change validation, decomposition, generation, ownership, or execution.
7. **Negative witness:** provide a near-neighbor with the same label that fails the motif, and an differently labelled artifact that passes it.

**Initial Position**

Page is the best compound-pattern lead; Layout is a smaller wrapper pattern. Guard may justify a governed contextual role if its source-rule projection is evidenced. Component and Hook presently collapse into framework vocabulary. Binding’s current evidence collapses into relations, while a future durable-record motif remains an unverified possibility.

This is research evidence only. It makes no DS-D1, DS-D8, candidate, validator, or prior-evidence mutation and no promotion claim.

## Agent 5: Ashby, W. Ross

## Initial Research Memo

**Dispatch:** `2026-07-11-ui-compound-domain-structures`\
**Mode:** Read-only, adversarial cross-domain comparison\
**Authority posture:** Research evidence only. No DS-D1, DS-D8, candidate, validator, or prior-evidence mutation; no promotion claim.

### Initial Position

Neither attacked assumption survives:

1. **Recurrence does not create a type.** The same label can denote a framework callback, UI component, replaceable protocol implementation, pipeline operation, or durable configuration record.
2. **Not all compounds are mere roles.** A compound becomes operationally stronger than a role when its boundary owns invariant composition, sequencing, lifecycle, state transition, failure behavior, or generated consequences that cannot be assigned to any interchangeable part alone.

The useful provisional distinction is:

- **Role:** identified principally by a substitutable input/output contract.
- **Compound structure:** parts plus relations plus a boundary-owned invariant or lifecycle.
- **Pattern:** recurrent arrangement without a stable identity or required operational consequence.
- **Projection:** derives behavior from another authority without owning the decision.
- **Durable record:** persists configuration or correspondence that changes later execution.
- **Named instance:** a locally named implementation whose label supplies no general formation law.

These are analytical classifications, not proposed authority changes.

## Cross-Domain Evidence

### Pipeline and stage

`house_project/domains/documents_validation/domain/extraction/pipeline_step.py:9-20` defines `PipelineStep` as a protocol with a name and typed state transformation:

`FolderState × RerunScope -> FolderState`.

Implementations are replaceable under that contract. The enclosing `ExtractionPipeline`, however, owns the ordered step list, scope filtering, and state threading (`house_project/domains/documents_validation/domain/extraction/pipeline.py:10-27`). Its default composition is explicit and order-sensitive (`house_project/domains/documents_validation/use_cases/extraction_pipeline_factory.py:36-57`).

That composition has consequences beyond naming:

- Operators can rerun one stage without repeating OCR or matching.
- Multiple selected stages retain pipeline order.
- Empty scope executes nothing.
- Unscoped execution runs every stage.

These are executable assertions in `house_project/domains/documents_validation/tests/test_extraction_pipeline_scoped_rerun.py:1-9,45-112`.

**Finding:** a stage is predominantly a replaceable role; the pipeline is a compound structure because sequencing and scoped lifecycle belong to the enclosing boundary.

### Guard

The backend `MultipleCCBGuardStep` conforms to the pipeline-stage role but also mutates persistent statuses and aborts subsequent processing (`house_project/domains/documents_validation/domain/extraction/steps/multiple_ccb_guard.py:8-40`).

Savvy’s `guardStep` instead maps requested UI step plus session state to an allow/reroute result (`domainspec-core/projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/lib/savvy-fsm.ts:111-162`). Its consumer changes the displayed step and notice from that result (`.../app/page.tsx:489-500`).

**Finding:** “Guard” recurrence identifies a family resemblance, not one type. One guard is a stateful aborting pipeline operation; the other is a decision function consumed by navigation. The UI form is best treated provisionally as a **Rule projection or contextual role**, unless a separately identifiable lifecycle-owning compound is demonstrated.

### Importer and component

`ArchiveLibraryImporter` is named “Importer” but is structurally a React component: typed props, local form state, preflight gating, and callback emission (`workspace-resonant/2.0.0-alpha/src/modules/archive/ArchiveLibraryImporter.tsx:13-54,56-73`). The actual operation is delegated through `onImportLibrary`; the component does not itself import files.

**Finding:** label recurrence is particularly unsafe. “Importer” here describes the user workflow presented by a component, not an operational importer type. It is a direct counterexample to filename/name-based type formation.

### Assembler

GoldenQuill defines several assembler protocols with incompatible but explicit signatures (`domainspec-core/projects/goldenquill/pipeline/orchestrator/tracks/report_mode.py:307-340`). They are injected through a frozen dependency bundle and replaced by stubs in tests (`.../report_mode.py:380-408`).

Conversely, `audit_assembler.py` parses files, normalizes fields, clusters findings, ranks them, and emits a deterministic synthesis; its own description calls it the reproducible run spine (`domainspec-core/projects/goldenquill/pipeline/orchestrator/audit_assembler.py:2-17,120-187,279-331`).

**Finding:** “Assembler” may be a replaceable role or a lifecycle-significant compound. The separating evidence is boundary-owned invariants and result semantics, not the label.

### Binding

The test-derivation binding sidecar is a durable correspondence record linking formal obligations to modules, symbols, strategies, arguments, and result fields (`domainspec-core/projects/domainspec-v2/impl/test-derivation-engine/bindings/financial-settlement.json:1-23`). Its contents change emitted assertions and preserve explicit coverage gaps (`.../financial-settlement.json:99-128`).

This defeats “all compounds are roles”: the record is not interchangeable behavior. It persists mappings that alter generation and coverage.

It also sharpens the UI Binding question. A pure endpoint connection can remain a relationship, while a persisted mapping with trigger/cache/invalidation could be a durable compound. The current UI card states exactly that hypothesis but explicitly remains candidate evidence only (`domainspec-core/projects/domainspec-v2/development/ui-meta-type-formalization/candidate-meta-types/ui/binding/binding.md:15-38,53-60`).

## Counterexample Pairs

| Pair | False inference defeated | Separating evidence |
|---|---|---|
| `ArchiveLibraryImporter` vs `ExtractionPipeline` | A recurrent workflow noun identifies one structural type. | The former renders and delegates; the latter executes ordered state transformations and owns reruns. |
| Savvy `guardStep` vs `MultipleCCBGuardStep` | Every Guard has the same parts and lifecycle. | Pure reroute result versus persistent mutation plus pipeline abort. |
| assembler protocols vs `audit_assembler.py` | Every Assembler is either always a role or always a compound. | Injected callable contracts versus deterministic multi-stage synthesis spine. |
| edge-only binding vs derivation binding sidecar | Every Binding is merely a relation. | A durable mapping record changes generated tests and coverage reporting. |
| Savvy `RootLayout` vs `Page` | Shared React composition makes Layout and Page equivalent. | Layout owns document shell and child placement; Page owns session state, effects, and journey control. |

## Cross-Domain Classification Matrix

| Structure | Typed parts and relations | Replaceability | Lifecycle ownership | Operational consequence | Provisional classification |
|---|---|---|---|---|---|
| Page | Route-facing render, state, effects, child units | Internal units replaceable; whole boundary less so | Session and interaction lifecycle in observed Savvy instance | Persistence, transitions, rendering | Framework-local compound pattern; type identity unproved |
| Layout | `ReactNode` child plus document shell/chrome | Chrome replaceable under child contract | Cross-page shell lifecycle | Global metadata, fonts, background, analytics | Compound shell pattern or role |
| Component | Typed props, local state, callback outputs | High | Usually local render lifecycle | Presentation and event delegation | Contextual role / broad pattern |
| Hook | Typed return plus reactive snapshot/effects | Replaceable if consumer contract holds | Reactive lifecycle | Hydration and subscription behavior | Framework role; compound only with independent invariant |
| Guard | Requested target, source state/rule, allow/reroute result | Often replaceable | Usually borrows source-rule lifecycle | Blocks, reroutes, aborts, or explains | Projection or operation role |
| Binding | Endpoints/mappings; optionally trigger/cache/invalidation | Record can be replaced, but identity may persist | Configuration and invalidation lifecycle | Alters integration or generation | Relation when edge-only; durable compound when reified |
| PipelineStep | Named state transformation | High under protocol | Per-invocation only | One bounded transformation | Role |
| ExtractionPipeline | Ordered steps, shared state, rerun scope | Parts replaceable within invariant | Owns sequence, abort propagation, reruns | Changes execution order and work repeated | Compound structure |
| Assembler protocol | Typed callable | High | Caller-owned | Produces one required input | Role |
| Audit assembler | Parsers, clustering, ranking, rendering | Parts not independently exposed | Owns complete synthesis run | Reproducible artifact | Compound process |
| Importer-named UI | Props, form state, callbacks | Replaceable as UI unit | UI interaction only | Initiates delegated operation | Named Component instance |

## Admission and Collapse Tests

A recurring structure warrants further compound-kind research only if all are witnessed:

1. **Boundary test:** finite typed parts and permitted relations can be identified independently of its label.
2. **Invariant test:** the enclosing boundary owns at least one invariant no individual part owns.
3. **Substitution test:** permitted part replacement preserves identity; forbidden replacement breaks a stated invariant.
4. **Lifecycle test:** creation, execution, rerun, invalidation, or teardown differs from that of isolated parts.
5. **Consequence test:** recognizing the compound changes decomposition, generated code, validation, execution, or ownership.
6. **Cross-context test:** the law survives at least two implementations without depending on framework filenames.

Collapse it to a role, relation, projection, pattern, or named instance when any claimed identity reduces to label recurrence, framework convention, authored attributes, or an input/output signature with no boundary-owned invariant.

**Initial verdict:** the owned evidence supports the existence of operationally meaningful compound structures, especially pipelines and durable binding records. It does not support treating recurrence itself as type formation, nor does it support a universal compound classification for the six UI labels.
