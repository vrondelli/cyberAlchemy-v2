Definitional-soundness verdict: **REVISE**

The synthesis preserves the major authority boundaries, but it is not yet definitionally closed. Its strongest rows distinguish source, generated read model, execution, receipt, owner decision, and release. Its weakest rows introduce new capitalized nouns and bridge predicates without a tracked owner, and its legend re-collapses axes that the constitution requires to remain separate.

## Challenged rows and exact repairs

| Synthesis row | Decision | Definitional defect | Exact evidence | Required repair |
|---|---|---|---|---|
| `DomainSpec language boundary` | **RENAME** | This is an Atlas heading, not a tracked DomainSpec term. “Language boundary” may be mistaken for a canonical definition. | Current owner calls the surface an “executable typed graph,” carefully limited to derivable/checkable rather than self-running: `projects/domainspec-v2/definitions/DEFINITIONS.md:144-170`. The constitution assigns canonical language ownership to root definitions: `authority/constitutions/domainspec-v2-CONSTITUTION.md:47-53`. | Label it **“What authors may write”**. Detail may cite D4/D5/D6/D8/D9/D19. `owner=Atlas projection`; `use=newcomer orientation`; `failure=mistaken as canonical term`; `evidence_class=explanatory projection over current definitions`; `claim ceiling=summary only`. |
| `ConsumerIntent --authored-as--> NodeSource` | **KILL** as a typed semantic bridge; **RENAME** as explanatory prose | Neither `ConsumerIntent` nor `authored-as` is established by the cited source contract. The schema has an `intent` string field, not a `ConsumerIntent` entity. | `impl/spec/minted-project/node.schema.json:4-16,36` defines a consumer-owned node record with `intent`; it does not define the proposed source type or predicate. | Replace with **“A consumer writes a node source containing an intent statement.”** If rendered as an edge, make it projection-only and non-semantic. Do not allocate canonical IDs to `ConsumerIntent` or `authored-as`. |
| `NodeSource --declares-outgoing--> Connection` | **KEEP**, with controlled name | This has a distinct owner and failure mode, but the displayed predicate must not be admitted as a new DS-D2 verb. | `connection.schema.json:4-14` says the outgoing connection is authored by its source node and `from` is derived; `minted-project/INDEX.md:47-54` gives the normalization rule and generated-artifact boundary. | Ordinary label: **“Source node declares an outgoing connection.”** Mark `relation_class=source-record containment`, not DomainSpec semantic relationship vocabulary. Claim ceiling: source ownership and direction only. |
| `MetaType + Formation + Profile --admits/rejects--> NodeSource` | **DEFER** as one bridge; split now | It combines three owners and three failure modes into one apparent decision. Kind status, formation validity, and profile membership are explicitly distinct. | Meta-type identity/status: `DEFINITIONS.md:229-264`; formal criterion checks shape only: `DEFINITIONS.md:301-337`; profile membership is separate from kind existence and relationship status: `impl/spec/minted-project/INDEX.md:47-54`. | Replace with three checks: **“kind is currently admitted,” “record satisfies that kind’s shape rule,” “selected profile supports that kind/layout.”** Each needs its own owner, verdict, failure, and evidence. |
| `RelationshipSignature --admits/rejects--> Connection` | **RENAME** | “Admits/rejects” hides the difference between endpoint typing and edge-law admissibility. | `DEFINITIONS.md:339-379` explicitly separates endpoint signature, relationship verb, and admissibility. | Use **“Endpoint signature accepts/rejects this source-kind and target-kind pair.”** Add a separate row for semantic edge-law admissibility if shown. Claim ceiling: legal endpoints, not usefulness, behavior, or code conformance. |
| `SourceSet + RegistryDigests + Profile --normalizes-to--> SemanticGraph` | **KEEP**, scoped and renamed | Sound only for the experimental minted-project contract; “SemanticGraph” risks universalization. | `graph.schema.json:4-23,39-54` defines a generated, layout-neutral read model with exact digests; `INDEX.md:14-28` identifies the profile as experimental. | Label **“Minted source pack compiles to a generated graph read model.”** Scope to the named profile. Failure: invalid source/profile/digest or normalization failure. Claim ceiling: deterministic representation, not semantic correctness or universal DomainSpec compilation. |
| `SemanticGraph --derives-structural--> ObligationUniverse` | **RENAME** and scope | Both capitals look universal, while the evidence is a bounded implemented derivation family. | Constitution requires expected obligations to come from the spec and says passing derived tests prove build-time fidelity only: `authority/constitutions/domainspec-v2-CONSTITUTION.md:74-79`. | Label **“This bounded graph derivation produces a catalogue of structural checks.”** Name the exact derivation owner and profile in every instance. Avoid a universal `ObligationUniverse` node unless an owner artifact defines it. |
| `FormalClause --semantic-origin-of?--> Obligation` | **KEEP** only as explicit gap | The question mark is not a typed relationship. It is honest gap notation, not semantics. | Research evidence records no P4→FS-POST-001 identity: `research.md:212-233`; synthesis itself lists it as unresolved. | Render ordinary text: **“No source-backed identity links clause P4 to check FS-POST-001.”** `evidence_class=absence from enumerated bindings`; `authority_effect=none`; no predicate ID. |
| `DefinitionSnapshot --projects-to--> ArchitectureRealizationSpec` | **DEFER** generic form | The synthesis admits only one bounded Enum family. The generic nouns inflate that mechanism into a general lifecycle connection. | Synthesis definition matrix calls architecture realization a bounded Enum implementation/candidate; open gap 7 says no general realization compiler. | Use exact instance labels: **“The pinned Enum definition/profile/binding inputs produce this TypeScript Enum realization specification.”** No generic bridge until a general owner contract exists. |
| `ArchitectureProfile --constrains--> ArchitectureRealizationSpec` | **KEEP**, profile-local | Sound if it names the exact profile and never turns language policy into semantic meaning. | Constitution requires spec, implementation, and governance to stay separate: `authority/constitutions/domainspec-v2-CONSTITUTION.md:67-72`. | Require exact profile owner, target family/language, rejected case, and “does not redefine DomainSpec meaning.” |
| `ArchitectureRealizationSpec --lowers-to--> LanguageIR --emits--> GeneratedSource` | **DEFER** generic form | `LanguageIR` and both predicates are load-bearing terms without demonstrated tracked definitions in the synthesis. | Constitution requires every load-bearing term to resolve to a tracked definition ID or explicit candidate entry: `authority/constitutions/domainspec-v2-CONSTITUTION.md:163-169`. | Use exact implementation artifact names and operation names from the realization compiler, or mark the whole chain **candidate implementation vocabulary**. Do not present it as canonical DomainSpec terminology. |
| `GeneratedSource --compiled-as--> CompileResult` | **RENAME** | Understandable technically, but needlessly ontologized for newcomers. | FPR says generated tests/programs are not execution evidence or their own oracle: `development/first-production-release/ROADMAP.md:52`. | Say **“The generated source compiled successfully/failed to compile.”** Owner is the compiler run; failure is compile failure; evidence is execution output; ceiling is syntactic/type acceptance only. |
| Observation/evaluation/mutation/replay rows | **KEEP**, exact-run only | These are sound only when each denotes a named artifact and process, not a universal DomainSpec lifecycle. | FPR’s production rule rejects any component result as independent production proof: `ROADMAP.md:159-161`. | Every row must name exact adapter, input, observation, obligation key, mutant, replay process, and receipt. Use ordinary labels in the overview; technical artifact names belong in detail. |
| `Evaluation + KilledMutation + Replay --bound-into--> ProofReceipt` | **RENAME** | “ProofReceipt” overstates unless scoped; the synthesis itself distinguishes candidate-local and lifecycle-joined states. | Constitution: claim must not exceed evidence, `...CONSTITUTION.md:55-65`; local status cannot create proof or authority, `:146-152`. | Label **“These three bounded results are recorded in this technical receipt.”** Add `receipt_scope`, `lifecycle_join`, `authority_effect`, and a one-sentence ceiling. Never call it proof-complete without “inside this named technical state machine.” |
| `ExecutionFrontier --requires--> SWUTerminalReceipt` | **DEFER** as Atlas ontology | This is governance workflow vocabulary, not DomainSpec meaning, and the synthesis has no exact terminal receipt for the highlighted run. | `research.md:288` identifies the missing `SWU-ARE-004.json`/closeout join; synthesis lists it as unresolved. | Render as a gate annotation: **“Governed task closeout is missing.”** Do not create semantic nodes `ExecutionFrontier` or `SWUTerminalReceipt` in the DomainSpec graph. |
| `DriftFinding --routes-to--> Definition/Profile/BindingOwner` | **DEFER** generic edge | The synthesis admits this is only partly modeled and generally unautomated. A slash-separated target is not a distinct type or owner. | Constitution makes drift a separate governance axis and forbids modeling surfaces from writing promotion status: `...CONSTITUTION.md:89-95`. | Split into three candidate handoff patterns, each naming its actual finding owner and next owner. Label **“Suggested owner for investigation,”** never “routes” unless an executable owner route exists. |
| `ProofReceipt --requires-separate--> ClaimAcceptance` | **KEEP**, rename nouns | The separation is definitionally necessary and source-backed. | FPR requires separate claim acceptance before external authorization: `ROADMAP.md:25,75,159-161`. | Ordinary label: **“A technical receipt does not accept its own claims; a separate claim owner must decide.”** |
| `ClaimAcceptance --requires-external--> ReleaseAuthorization` | **KEEP** | Distinct owner, use, failure, evidence, and ceiling are present. | `ROADMAP.md:25,49,75,159-161`. | Preserve as a gate, not a semantic relationship. Name claim owner and external authorization owner when known. |
| `ReleaseAuthorization --records--> ImmutablePrivateRelease` | **RENAME** | Authorization does not itself record the release; the release operator does. The current bridge collapses owners. | `ROADMAP.md:159-161` distinguishes claim owner, independent verifier, external owners, and release operator. | Split: **“External owners authorize the exact bits and boundaries”** then **“Release operator records the immutable private release.”** |
| “Formal learning” feedback loop | **DEFER** as lifecycle connection | Conjecture→counterexample→restriction→theorem is a useful explanatory pattern, not a proved DomainSpec workflow or runtime path. | Current mathematical ceiling explicitly denies general category-law proof: `DEFINITIONS.md:1013-1043`. | Keep only inside the optional formal-depth route, owned by the cited formal artifacts. Label **“One formal research pattern,”** never a DomainSpec feedback loop. |
| “All routes operate over one canonical source-addressable read model” | **DEFER** | It contradicts the synthesis’s own open gap: no generic learner/navigation projection contract or witnessed semantic-hash invariance. | `research.md:381` describes this as candidate layering synthesis; synthesis open gap 3 says it is unwitnessed. | Say **“Target route contract: routes should reuse source-addressed records where exact bindings exist.”** Do not claim a current canonical cross-family read model. |

## Zone decisions

- **KEEP** `Language Authority`, but rename for newcomers to **“Rules for what can be authored.”**
- **KEEP** `Consumer Authoring`, renamed **“Where a project writes its domain meaning.”**
- **MERGE visually only** `Admission and Normalization`. Inside it, preserve three separate admission checks plus a separate generated-output step. The zone must not become an owner or ontology node.
- **MERGE visually only** `Derivation and Realization`. Structural check derivation and code-shape realization have different owners, inputs, failure modes, and evidence.
- **MERGE visually only** `Observation and Evidence`. Execution, observation, evaluation, mutation, replay, and receipt must remain individually inspectable.
- **RENAME** `Drift and Owner Decisions` to **“Problems found and decisions still required.”** Drift evidence cannot own claim acceptance, promotion, or release.
- **KEEP** `Projection and Guided Learning` only as `authority_effect:none`; rename **“Views and guided examples.”**

No zone may be serialized as a canonical DomainSpec type. Zones are presentation groupings over multiple owners.

## Legend decision

The proposed legend needs reconstruction before writer use.

- **KILL** `generated` from `semantic_state`. Generation is artifact provenance/status, not semantic maturity.
- **KILL** `passing-receipt` from `artifact_status`. “Receipt” is artifact kind; “passing” is verdict.
- **KILL** `external-decision` from `artifact_status`. It is a decision stage/authority boundary.
- **MERGE with canonical axes**, not a new universal enum: the constitution already requires separate `source_posture`, `evidence_status`, `confidence_status`, `authority_effect`, `policy_effect`, `implementation_status`, and `lifecycle_stage` (`...CONSTITUTION.md:146-152`).
- **RENAME** `confidence` to `binding_confidence` if it concerns the Atlas edge; otherwise it may be confused with canonical `confidence_status`.
- **KEEP** `claim_ceiling`, but as mandatory explanatory text, not a lifecycle state.
- **DEFER** `local-ratification` unless an exact owner definition supports that value. “Ratified locally” on one axis cannot imply semantic admission, implementation, or release.
- **KILL** “solid = current source-backed or executable connection.” This merges semantic source relations with observed execution. Use separate encodings for `relation_basis` and `execution_status`.

Minimum non-collapsing fields:

1. `artifact_kind`
2. `source_posture`
3. `semantic_or_definition_status`
4. `implementation_status`
5. `execution_verdict`
6. `evidence_status`
7. `authority_effect`
8. `lifecycle_stage`
9. `release_admission`
10. `binding_confidence`
11. `claim_ceiling`

## Tautological or re-skinned additions

- **KILL** new canonical node types for the seven Atlas zones.
- **KILL** `ConsumerIntent`, `ExecutionFrontier`, and generic `ImmutablePrivateRelease` as DomainSpec ontology nodes.
- **KILL** question-mark predicates such as `semantic-origin-of?`; gaps are gap records, not relationship vocabulary.
- **KILL** generic slash-types such as `Definition/Profile/BindingOwner`.
- **DEFER** `LanguageIR`, `DefinitionSnapshot`, `ArchitectureRealizationSpec`, and `ObligationUniverse` until exact owner definitions are cited; use exact artifact-local names meanwhile.
- **KEEP** “missing link,” “claim ceiling,” and negative controls as projection fields, not canonical semantic types.
- **KEEP** consumer scenes as bounded guided examples, never universal meaning.

Final claim ceiling: the synthesis is suitable as an owner-preserving research blueprint after these repairs. It does not yet supply a definitionally sound universal Atlas vocabulary or a canonical end-to-end lifecycle model.
