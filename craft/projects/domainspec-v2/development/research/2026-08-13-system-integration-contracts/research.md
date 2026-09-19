# Verbatim Explorer Returns

This file preserves the three explorer final returns verbatim. It is research evidence, not DomainSpec authority or implementation proof.

## Agent 1 — Tarski, Alfred — current DomainSpec

{
  "schema_version": "bounded-explorer-receipt/v1",
  "action_id": "spawn-0001",
  "role": "current-domainspec-explorer",
  "status": "complete",
  "completed_at": "2026-08-13T04:53:20Z",
  "repository_commit": "3fe0d8399de8f8e75aebea4bf5e88a64f8b38184",
  "mutation": {
    "policy": "read-only",
    "writes_performed": [],
    "output_persistence": "delegated-to-parent because helper write scope was empty",
    "selected_evidence_files_clean_relative_to_head": true,
    "overall_target_worktree": "dirty and preserved"
  },
  "execution": {
    "product_tests_run": false,
    "external_sources_used": false,
    "evidence_mode": "current-byte inspection, exact hashing, bounded keyword search"
  },
  "direct_answer": "DomainSpec v2 currently defines logical domain and application concepts that can describe an integration's meaning: Interface, Event, Mapping, Workflow, Operation, Query, State Machine, Entity, and Rule. DS-D8 supplies typed logical edges including exposes, maps, produces, triggers-cross, transitions, orchestrates, queries, emits, creates, and produces-for. It does not currently define canonical database, persistence, repository, ORM, migration, transaction, consistency, concurrency, retry, idempotency, webhook, broker, topic, queue, outbox, inbox, or delivery contracts. The only canonical minted-project profile is experimental, release admission is not granted, and it admits only Entity, Event, Operation, Rule plus enforces, performs, and produces. The compiler implements structural profile, formation, endpoint, scope, multiplicity, digest, graph, provenance, and receipt checks; it does not implement or prove storage, transport, delivery, consistency, or runtime behavior.",
  "stage_distinctions": [
    {
      "stage": "DS-D1 concept",
      "owner": "definitions/meta-types plus definitions-governance owner gate",
      "meaning": "Logical concept identity and formation criterion.",
      "non_claim": "Active membership does not imply minted-profile admission or implementation."
    },
    {
      "stage": "DS-D8 relationship",
      "owner": "definitions/relationships",
      "meaning": "Permitted logical source-kind, verb, target-kind tuple with declared structural fields.",
      "non_claim": "An Event edge is not broker delivery; produces does not establish atomic publication."
    },
    {
      "stage": "profile admission",
      "owner": "definitions/minted-project",
      "meaning": "Selects which kinds and relationships a consumer compiler may admit.",
      "non_claim": "The current profile omits Interface, Mapping, Query, Workflow, and State Machine and has no release admission."
    },
    {
      "stage": "formation schema",
      "owner": "impl/spec",
      "meaning": "Checks bounded source-body shape for an admitted kind.",
      "non_claim": "Shape validity is not semantic, infrastructure, or runtime conformance."
    },
    {
      "stage": "compiler enforcement",
      "owner": "impl/tools/minted-project",
      "meaning": "Checks registry/profile digests, profile membership, formation, edge class, endpoints, feature scope, and multiplicity; emits generated read models.",
      "non_claim": "Generated graphs and manifests are not implementations or authority."
    },
    {
      "stage": "runtime evidence",
      "owner": "missing for the integration concerns in scope",
      "meaning": "Would need to observe storage commits, isolation, delivery, retries, deduplication, failure recovery, and provider behavior.",
      "non_claim": "No current selected fixture supplies this evidence."
    },
    {
      "stage": "owner acceptance",
      "owner": "separate definitions, profile, implementation, and release owners",
      "meaning": "Admits or promotes exact bytes after evidence.",
      "non_claim": "A build receipt cannot grant authority, release, deployment, or production readiness."
    }
  ],
  "concern_matrix": [
    {
      "concern": "Database or data store",
      "define": "absent",
      "declare": "absent",
      "bind": "absent",
      "implement": "absent from selected generic DomainSpec surfaces",
      "validate": "absent",
      "observe": "absent",
      "govern": "blocked on layer and owner decision",
      "current_overlap": "Entity describes identity-bearing domain objects; its descriptive persisted-row code pattern is not a database contract."
    },
    {
      "concern": "Persistence",
      "define": "logical write/read concepts only",
      "declare": "Operation, Query, Entity, creates, queries, produces-for",
      "bind": "no persistence binding",
      "implement": "no generic durable-store realization",
      "validate": "logical formation and edge shape only",
      "observe": "no commit, durability, recovery, or data-loss witness",
      "govern": "missing contract owner",
      "current_overlap": "produces-for describes a cross-feature write or projection but not storage mechanics."
    },
    {
      "concern": "Repository",
      "define": "absent",
      "declare": "absent",
      "bind": "absent",
      "implement": "consumer code may use repositories, but no generic DomainSpec owner was found",
      "validate": "absent",
      "observe": "absent",
      "govern": "missing application-port or implementation-profile owner"
    },
    {
      "concern": "ORM or data mapper",
      "define": "absent",
      "declare": "Mapping exists only as a direction-bearing shape transform",
      "bind": "no ORM or mapper binding",
      "implement": "absent",
      "validate": "Mapping criterion checks direction, not field correctness or persistence mapping",
      "observe": "absent",
      "govern": "likely profile-local unless a distinct invariant and owner are proven"
    },
    {
      "concern": "Database schema and migration",
      "define": "absent",
      "declare": "minted formation schemas are DomainSpec source schemas, not database schemas",
      "bind": "absent",
      "implement": "absent",
      "validate": "no migration ordering, compatibility, rollback, or drift validator",
      "observe": "absent",
      "govern": "missing migration-contract owner"
    },
    {
      "concern": "Transaction",
      "define": "absent",
      "declare": "Operation and produces express logical mutation and successful-completion causality only",
      "bind": "no transaction boundary or unit-of-work binding",
      "implement": "absent",
      "validate": "no atomicity, rollback, or partial-commit evaluator",
      "observe": "absent",
      "govern": "missing runtime-guarantee owner"
    },
    {
      "concern": "Consistency and concurrency",
      "define": "absent",
      "declare": "Rule, Workflow, and State Machine can express domain constraints or order without selecting a consistency model",
      "bind": "no isolation, lock, version, compare-and-swap, or coordination binding",
      "implement": "absent",
      "validate": "no race, lost-update, stale-read, or invariant-under-interleaving evaluator",
      "observe": "absent",
      "govern": "blocked on distinct local versus distributed guarantee owners"
    },
    {
      "concern": "Idempotency, retry, and failure policy",
      "define": "absent",
      "declare": "Workflow and Event do not currently carry these guarantees",
      "bind": "absent",
      "implement": "explicitly deferred by implementation-structure research",
      "validate": "absent",
      "observe": "absent",
      "govern": "missing policy and evidence owners"
    },
    {
      "concern": "External API",
      "define": "observed logical Interface with external or internal kind",
      "declare": "Interface exposes Operation or Query; Mapping maps boundary shapes",
      "bind": "no HTTP, OpenAPI, client, provider, auth, method, path, timeout, or version binding",
      "implement": "not realized by the canonical minted profile",
      "validate": "Interface boundary presence and DS-D8 endpoints only; no protocol conformance",
      "observe": "absent",
      "govern": "profile admission and binding owner decisions required"
    },
    {
      "concern": "Webhook",
      "define": "absent",
      "declare": "an Interface/Event composition could describe meaning but not webhook semantics",
      "bind": "no signature, replay-window, endpoint, or acknowledgment binding",
      "implement": "absent",
      "validate": "absent",
      "observe": "absent",
      "govern": "missing transport-profile owner"
    },
    {
      "concern": "Event or message bus, broker, topic, or queue",
      "define": "logical Event exists; infrastructure objects are absent",
      "declare": "produces and triggers-cross express cause and cross-feature activation",
      "bind": "no broker, channel, topic, queue, serialization, ordering, or delivery binding",
      "implement": "absent",
      "validate": "endpoint shape only",
      "observe": "no publish, consume, duplicate, reordering, poison-message, or replay witness",
      "govern": "missing transport and runtime-guarantee owners"
    },
    {
      "concern": "Outbox, inbox, and delivery semantics",
      "define": "absent",
      "declare": "absent",
      "bind": "absent",
      "implement": "absent",
      "validate": "no atomic outbox, deduplication, divergence, or replay evaluator",
      "observe": "absent",
      "govern": "missing persistence-transport coordination owner"
    },
    {
      "concern": "Validators and implementation conformance",
      "define": "partial: existing structural tools and relationship obligations; candidate framework research is non-authority",
      "declare": "schemas, profile entries, relationship obligations, fixtures, and expected diagnostics",
      "bind": "compiler binds exact registry/profile/schema digests",
      "implement": "observed structural compiler and content validator",
      "validate": "shape, profile, formation, endpoint, scope, multiplicity, digest, and generated-artifact consistency",
      "observe": "generated graph, provenance manifest, build receipt, and stored fixture expectations",
      "govern": "receipts remain evidence; profile, runtime, and authority decisions remain separate",
      "gap": "no end-to-end TestCase to evaluator to typed ReceiptEnvelope path; validate-content still silently skips missing registries, malformed headers, empty rows, and unknown schemas"
    }
  ],
  "owner_artifact_dependency_gate_map": [
    {
      "owner": "DS-D1 definitions",
      "artifact": "definitions/meta-types/meta-types.yml plus criterion schemas",
      "dependency": "distinct invariant and discriminating fixtures",
      "gate": "definitions-governance owner approval and fixture rerun"
    },
    {
      "owner": "DS-D8 relationships",
      "artifact": "definitions/relationships/relationships.yml",
      "dependency": "canonical endpoint types, lifecycle, scope, multiplicity, and obligations",
      "gate": "relationship owner decision plus exact positive and negative witnesses"
    },
    {
      "owner": "minted-project profile admission",
      "artifact": "definitions/minted-project/supported-profiles.yml",
      "dependency": "exact DS-D1 and DS-D8 digests plus formation schemas",
      "gate": "explicit profile admission; current release_admission is not-granted"
    },
    {
      "owner": "formation",
      "artifact": "impl/spec/minted-project/node.schema.json and formations",
      "dependency": "profile-admitted kind",
      "gate": "positive and one-field negative formation fixtures"
    },
    {
      "owner": "compiler",
      "artifact": "impl/tools/minted-project/compiler.ts",
      "dependency": "matching profile and registry digests, admitted formations and relationships",
      "gate": "fail-closed compile and exact diagnostic"
    },
    {
      "owner": "generated evidence",
      "artifact": "graph, source manifest, Markdown view, build receipt",
      "dependency": "successful structural compilation and digest closure",
      "gate": "artifact-schema and digest verification; never an authority gate"
    },
    {
      "owner": "runtime integration",
      "artifact": "missing generic bindings, provider adapters, harnesses, and operational receipts",
      "dependency": "owner-approved binding and guarantee contracts",
      "gate": "finite positive flow plus hostile storage and network failures"
    },
    {
      "owner": "human or designated authority",
      "artifact": "separate acceptance or promotion record",
      "dependency": "fresh exact-byte evidence",
      "gate": "explicit owner acceptance; no automatic promotion from receipts"
    }
  ],
  "classifications": {
    "observed": [
      "13 active non-contiguous backend DS-D1 members; selected integration-relevant logical types are active.",
      "31 active DS-D8 signatures in the current registry.",
      "Canonical profile admits four kinds and three relationships, is experimental, and lacks release admission.",
      "Compiler enforces profile and registry digests, kind admission, formation, relationship class, endpoints, feature scope, and multiplicity.",
      "Generated graph and receipt schemas explicitly label outputs as generated read model and generated verification evidence."
    ],
    "designed_or_proposed": [
      "ImplementationConformanceProfile, ImplementationBinding, StateMachineRuntimeContract, and EvaluationReceipt from implementation-structure research.",
      "Generic Constraint, Obligation, TestCase, evaluator, and ReceiptEnvelope layering from validation-framework research.",
      "These proposals are non-authority and do not establish execution."
    ],
    "absent": [
      "Canonical database, persistence, repository, ORM, migration, transaction, consistency, concurrency, retry, idempotency, webhook, broker, queue, outbox, inbox, or delivery contract.",
      "Generic infrastructure binding registry and provider realization.",
      "Runtime or operational evidence for the named integration guarantees."
    ],
    "blocked": [
      "Which layer owns each distinct integration concern.",
      "Profile admission for Interface, Mapping, Query, Workflow, and State Machine.",
      "Any new vocabulary or relationship without a distinct invariant, owner, and hostile witness.",
      "Implementation, promotion, release, deployment, and production claims."
    ],
    "stale": [
      "The July language and evolvable-validation findings cite 30 signatures; current authority contains 31.",
      "Their architectural claim ceilings remain useful, but historical counts must not be reused as current facts."
    ]
  },
  "strongest_current_fixtures": {
    "positive": {
      "name": "key-and-door",
      "source": "impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door",
      "shape": "four nodes and three edges: Entity performs Operation, Rule enforces Operation, Operation produces Event",
      "evidence": "compiler test compares two compilations byte-for-byte and compares graph and provenance with exact stored expectations",
      "claim_ceiling": "finite deterministic structural compilation and provenance fixture only; not a persistence, transport, transaction, delivery, or runtime fixture",
      "current_action_execution": "not run"
    },
    "negative_discriminators_present": [
      "KIND_UNSUPPORTED",
      "FORMATION_INVALID with criterion ID and machine code",
      "NODE_ID_DUPLICATE",
      "EDGE_ID_DUPLICATE",
      "EDGE_TYPE_UNKNOWN",
      "EDGE_TYPE_GENERATED",
      "EDGE_TYPE_UNSUPPORTED_PROFILE",
      "EDGE_TYPE_DEPRECATED",
      "EDGE_TYPE_DEFERRED",
      "EDGE_ENDPOINT_MISSING",
      "EDGE_ENDPOINT_KIND_MISMATCH",
      "EDGE_FEATURE_SCOPE_MISMATCH"
    ],
    "meta_type_fixtures": "The selected Interface, Event, Mapping, Workflow, Operation, Query, and State Machine schemas each reference positive and negative structural fixtures; these were not executed in this action."
  },
  "load_bearing_sources": [
    {
      "path": "projects/domainspec-v2/definitions/meta-types/meta-types.yml",
      "sha256": "4394968327b785d50cd323ad58a799feb71b9debf7e06b650b4fd1e4008f9ede",
      "selectors": ["$.members[id=DS-D1.4]", "$.members[id=DS-D1.5]", "$.members[id=DS-D1.9]", "$.members[id=DS-D1.11..14]"],
      "lines": "99-278"
    },
    {
      "path": "projects/domainspec-v2/definitions/relationships/relationships.yml",
      "sha256": "ffc97f2c358e4bebeebd8ceeb25aef59628be9c970cf6a7e510f7a37c9876d9f",
      "selectors": ["$.signature_count", "$.signatures[id=produces]", "$.signatures[id=triggers-cross]", "$.signatures[id=transitions]", "$.signatures[id=exposes]", "$.signatures[id=orchestrates]", "$.signatures[id=maps]", "$.signatures[id=queries]"],
      "lines": "17-240"
    },
    {
      "path": "projects/domainspec-v2/definitions/minted-project/supported-profiles.yml",
      "sha256": "0868785499944ce2b21b915962cba48f8b21d627b840c24d81c77194e8864478",
      "selectors": ["$.authority", "$.registry_bindings", "$.profiles[0].kinds", "$.profiles[0].relationships", "$.profiles[0].non_goals"],
      "lines": "3-67"
    },
    {
      "path": "projects/domainspec-v2/impl/spec/minted-project/node.schema.json",
      "sha256": "0504fcc12b9a0026e812d73541df83a798d18421a5a127dd510ff7ebc5f7192f",
      "selectors": ["$.allOf", "$.x-domainspec"],
      "lines": "18-36"
    },
    {
      "path": "projects/domainspec-v2/impl/tools/minted-project/compiler.ts",
      "sha256": "6b21ac8091f564e7bcefd07637e111ea46ddc665275246d7eb051d5bd2bf9073",
      "selectors": ["loadProfileSelection", "classifyRelationshipType", "compileMintedProject"],
      "lines": "291-363,366-650"
    },
    {
      "path": "projects/domainspec-v2/impl/tools/validate-content.ts",
      "sha256": "ec6e7127226862c621132682f48298aa366e48cf4ec209fa0f1f8018a7fc1f07",
      "selectors": ["main validation loop", "silent skip branches", "verdict emission"],
      "lines": "86-160"
    },
    {
      "path": "projects/domainspec-v2/impl/spec/minted-project/graph.schema.json",
      "sha256": "698e044ef7fcbea275049a5712eb398696c0e353492006b3368523457e923e10",
      "selectors": ["$.properties.authority", "$.properties.language", "$.x-domainspec"],
      "lines": "7-54"
    },
    {
      "path": "projects/domainspec-v2/impl/spec/minted-project/build-receipt.schema.json",
      "sha256": "4ac235b78e55a7e6279962a6b07b7bac55255f4f73e3320f041c0ba8dd3f6bd4",
      "selectors": ["$.properties.authority", "$.properties.language", "$.properties.artifacts", "$.x-domainspec"],
      "lines": "7-40"
    },
    {
      "path": "projects/domainspec-v2/impl/tools/tests/minted-project-compiler.test.ts",
      "sha256": "821423fd397c0f8f7c6e57d14a445a522df2d82499fd5167d7eb09d8725f4ead",
      "selectors": ["Key and Door deterministic test", "independent negative tests"],
      "lines": "52-258"
    },
    {
      "path": "projects/domainspec-v2/development/research/2026-07-30-implementation-structure-enforcement/findings.md",
      "sha256": "ba6f3a537cf4abd408aedf46eb308f8d8e0574fc56adb6331a41a45ab7550027",
      "selectors": ["#answer-and-current-state-classification", "#blind-spots-and-typed-residue", "#claim-ceiling"],
      "lines": "3-38,498-512,625-630"
    },
    {
      "path": "projects/domainspec-v2/research/evolvable-validation-framework/findings.md",
      "sha256": "d5d55cb53c419d8074a2ee4528e206440244d7217b5f7835eefd426837ff9fe5",
      "selectors": ["#real-structural-witnesses", "#typed-negative-witnesses", "#residue-and-next-gates"],
      "lines": "368-475,567-586"
    }
  ],
  "canonical_keyword_check": {
    "files": [
      "projects/domainspec-v2/definitions/meta-types/meta-types.yml",
      "projects/domainspec-v2/definitions/relationships/relationships.yml",
      "projects/domainspec-v2/definitions/minted-project/supported-profiles.yml"
    ],
    "terms": [
      "database",
      "persistence",
      "orm",
      "repository",
      "migration",
      "transaction",
      "consistency",
      "concurrency",
      "idempotency",
      "external api",
      "webhook",
      "event bus",
      "message bus",
      "broker",
      "topic",
      "queue",
      "outbox",
      "inbox",
      "retry"
    ],
    "result": "no matches",
    "rg_exit_code": 1
  },
  "gaps": [
    "No consumer-local machine Inventory; direct current-source inspection was required.",
    "No canonical infrastructure concern owner or binding vocabulary.",
    "Existing logical integration types are outside the only canonical minted profile.",
    "The node schema still contains four hard-coded formation branches.",
    "The content validator can return green after silent omission of missing registries, malformed headers, incomplete rows, or unknown schemas.",
    "No finite fixture crosses domain graph, durable storage, external transport, messaging, failure policy, runtime evaluator, and typed claim-limited receipt.",
    "No hostile evidence for rollback, partial commit, uniqueness race, lost update, timeout-after-success, duplicate or reordered delivery, poison message, replay, signature failure, schema incompatibility, or outbox/inbox divergence.",
    "No acceptance, promotion, release, deployment, or production gate has been crossed."
  ],
  "claim_ceiling": "This receipt supports a current-source architecture and gap map only. It does not define new DomainSpec vocabulary, admit a profile, execute product tests, implement an integration, prove persistence or consistency, validate runtime delivery, accept authority, publish, release, deploy, or establish production readiness.",
  "input_bindings": {
    "strategy_inventory_packet_sha256": "669cd99d5771d0e041e0a6a4b8b3c924829f31bfc2f18f91398cda334804f3cf",
    "dispatch_sheet_sha256": "49d3a4682b0c388501a7f344dc827382fecab36ce4be701db3e12fd112fe1c96"
  }
}

## Agent 2 — Imieliński, Tomasz — persistence and local consistency

Status: `pass`. This is the inline payload for `receipts/explorer-persistence-consistency.json`; it was not written because `write_scope=[]`.

## Direct result

DomainSpec should not add `Database`, `Repository`, or `ORM` as DS-D1 meta-types. The smallest non-collapsing persistence architecture is:

```text
existing DomainSpec semantics
  -> internal Interface / Operation / Query application port
  -> PersistenceBinding
  -> technology profile and adapter
  -> TransactionPolicy + MigrationContract
  -> evaluator evidence and separate owner decision
```

Keep three candidate records: `PersistenceBinding`, `TransactionPolicy`, and `MigrationContract`.

- A repository port merges into an internal `Interface` exposing existing `Operation` and `Query` concepts.
- An ORM and database are technology-profile selections referenced by `PersistenceBinding`.
- A generic `ConsistencyPolicy` is too broad. Decompose it into the named domain invariant, write-side constraint, transaction/isolation policy, and projection-freshness policy.
- A `ValidatorBinding` would duplicate the existing `ImplementationConformanceProfile` → `Obligation`/evaluator → `EvaluationReceipt` chain, so merge it there.
- No new DS-D8 relationship is justified. Use typed fields inside the binding until a distinct graph-level validation consequence is demonstrated.

## Concern taxonomy

| Concern | Correct layer and invariant |
|---|---|
| Data store | Technology-profile resource referenced by a binding; product identity is not domain semantics. |
| Logical schema | Application contract derived from Entity/Value Object identities and fields; must not become a second semantic source. |
| Physical schema | Infrastructure binding: tables, columns, streams, codecs, indexes, constraints. |
| Index/constraint | Write-side enforcement primitive and runtime guarantee. A Rule may name the invariant but cannot prove a concurrent race was serialized. |
| Repository port | Application contract represented by an internal Interface exposing Operations/Queries. |
| ORM/data mapper | Technology-profile mapping and unit-of-work mechanism. Existing Mapping may describe shape transformation, but not flush, identity-map, locking, or transaction behavior. |
| Unit of work | Application/infrastructure contract naming the exact atomic change set. |
| Transaction boundary | Candidate `TransactionPolicy`: participating operations/resources, commit/rollback, isolation, conflict mapping, retry. |
| Isolation/concurrency | Technology-bound runtime guarantee with explicit prohibited anomalies and retry behavior. PostgreSQL’s documented levels differ materially, and stronger modes may abort transactions requiring full retry. [PostgreSQL 18 isolation](https://www.postgresql.org/docs/18/transaction-iso.html) |
| Migration/compatibility | Candidate `MigrationContract`: exact source/target versions, compatibility window, preconditions, steps, backfill, rollback/roll-forward, verification. DDL can rewrite rows or immediately validate constraints. [PostgreSQL 18 table modification](https://www.postgresql.org/docs/18/ddl-alter.html) |
| Backup/recovery | Operational technology profile with RPO/RTO and restore-test evidence; defer from portable DomainSpec core. |
| Cache/projection | Infrastructure binding plus freshness/invalidity contract. Async state is advisory unless synchronously maintained inside the accepted write transaction. |
| Idempotency/uniqueness | Domain Rule plus application operation contract plus write-side key/constraint. Same-command deduplication and distinct-command uniqueness races are different invariants. |
| Secret/config ownership | Provider-neutral configuration/secret references only; secret material and rotation remain with the security/operations owner. |

Official SQLAlchemy documentation reinforces the boundary: its `Session` is a mutable unit-of-work/transaction mechanism, not a portable semantic guarantee; it is one session per thread/task, flushes within the database transaction, and depends on the database’s atomicity/isolation. Its version counter detects selected stale writes but does not cover bulk updates. [Session basics](https://docs.sqlalchemy.org/en/20/orm/session_basics.html), [version counters](https://docs.sqlalchemy.org/en/20/orm/versioning.html)

Migration generation is likewise candidate tooling, not migration truth: Alembic states generated revisions require review and cannot reliably infer operations such as renames. [Alembic autogenerate](https://alembic.sqlalchemy.org/en/latest/autogenerate.html)

## Candidate verdicts

| Candidate | Verdict | Reason |
|---|---|---|
| `Database` | `PROFILE-LOCAL` | Resource/product selection; no distinct portable domain invariant. |
| `Repository` | `MERGE` | Internal Interface plus exposed Operations/Queries; adapter selected by binding. |
| `ORM` | `PROFILE-LOCAL` | Mapping/unit-of-work implementation choice. |
| `PersistenceBinding` | `KEEP` | Distinct responsibility: bind semantic/application refs to one physical realization and its evidence limits. |
| `TransactionPolicy` | `KEEP` | Distinct atomicity, isolation, concurrency, retry, and conflict invariant. |
| `ConsistencyPolicy` | `MERGE` | Split into named Rule/invariant, transaction policy, constraint binding, and projection freshness. |
| `MigrationContract` | `KEEP` | Distinct version-transition lifecycle and failure surface. |
| `ValidatorBinding` | `MERGE` | Reuse conformance profile evaluator refs, Obligations, and EvaluationReceipt. |

## Existing-owner mapping

- `Entity`: identity/lifecycle owner, not a database table.
- `Operation`: state-changing business action, not proof of transactionality.
- `Query`: read-only retrieval, not proof of replica freshness or snapshot isolation.
- `Mapping`: field transformation, not an ORM.
- `Workflow`: ordered orchestration, not atomic commit.
- `Rule`: boolean invariant, not the concurrency-enforcement primitive.
- `Interface`: appropriate owner for an internal repository/application port.

Reuse DS-D8 `exposes`, `maps`, `enforces`, `orchestrates`, `queries`, `creates`, and `produces`. Binding-to-adapter and binding-to-schema references remain profile-local fields.

The experimental minted profile currently admits only `Entity`, `Event`, `Operation`, and `Rule`, plus `enforces`, `performs`, and `produces`; it does not currently admit the full repository-port shape and grants no release admission.

## Candidate shapes

`PersistenceBinding` should minimally carry:

```text
id, version, semantic_profile_ref
interface_ref, entity_refs, operation_refs, query_refs, mapping_refs
logical_schema_ref, technology_profile_ref, resource_ref, adapter_ref
transaction_policy_ref, migration_contract_ref
constraint_bindings[{invariant_ref, physical_ref, failure_code}]
projection_bindings[{query_ref, authority_ref, max_staleness, hard_gate:false}]
config_refs, secret_refs, evaluator_refs
source_digest, binding_digest, claim_limits
```

`TransactionPolicy`:

```text
id, operation_refs, resource_refs, atomic_change_set
isolation_level, prohibited_anomalies, concurrency_control
expected_version_ref
retry{retryable_codes,max_attempts,backoff,idempotency_key_ref}
timeout, conflict_mapping, nested_or_savepoint_policy
```

`MigrationContract`:

```text
id, from_schema_version, to_schema_version
compatible_application_versions
preconditions, ordered_ddl_and_data_steps
expand_contract_phase, backfill_checkpoint
rollback_or_rollforward_policy
lock_or_rewrite_limits
positive_and_negative_fixture_refs, expected_failure_codes
```

## Finite fixture

Use the existing `financial-settlement.P4.eligible-payout` fixture, SHA-256 `9c286c9e...`, as the frozen semantic/effect input. Existing evidence records `total_payout=400`, one payout write, and one event-handler call. That is useful executed effect evidence, but it does not prove a database transaction, durability, isolation, concurrency safety, or broker delivery.

Proposed persistence extension:

- Bind `GenerateSettlement` to a local transaction containing:
  - one `PAYOUT` row uniquely keyed by `(player_id, transaction_type, end_date)`;
  - any changed makeup row guarded by a version;
  - one outbox intent for `PayoutCreated`.
- Retry the same idempotency key and require the same logical result with row counts still equal to one.
- Record schema/binding digests, transaction isolation, exact before/after row digests, commit outcome, and raw adapter diagnostics.
- Treat the outbox row only as locally committed intent; delivery belongs to the distributed-integration lane.

Proposed hostile matrix:

| Failure | Required oracle / diagnostic | Evidence and ceiling |
|---|---|---|
| Injected failure before outbox insert | Zero payout, makeup, and outbox changes; `DSV2-PERSIST-ATOMICITY-ROLLBACK` | Before/after row digests and transaction trace; exact adapter/profile only. |
| Split-transaction partial commit mutant | Payout/outbox count mismatch fails `DSV2-PERSIST-PARTIAL-COMMIT` | Both transaction IDs and row digests; detects this mutant, not universal atomicity. |
| Stale migration | Binding expects schema v2 while store is v1; fail before DML with `DSV2-PERSIST-SCHEMA-VERSION-MISMATCH` | Schema identity plus zero-write proof. |
| Uniqueness race | Two distinct requests for the same business key: exactly one commit, one typed conflict, one row/outbox | Barrier schedule and both transaction results; one database/profile only. Unique constraints are actual enforcement primitives. [PostgreSQL 18 constraints](https://www.postgresql.org/docs/18/ddl-constraints.html) |
| Lost update | Competing expected versions: one success and one `DSV2-PERSIST-STALE-WRITE`, or an explicitly recorded serialization retry | Initial/final versions and retry trace. |
| Dirty read | A second transaction cannot observe an uncommitted payout | Synchronized read/write trace under the bound isolation level. |
| Non-repeatable read | If stable reads are required, two reads in one transaction remain equal or the transaction aborts/retries; a lower-isolation mutant must change the verdict | Snapshot values and isolation identity; no cross-database generalization. |
| Stale cache/projection | Projection says “absent,” but write-side constraint rejects duplicate; emit `DSV2-PERSIST-PROJECTION-STALE` without accepting the write | Cache timestamp/source and database conflict; projection remains advisory. |

The local email-claim precedent supplies the same essential oracle: all contenders must collide at one write-side primitive; process managers, idempotency keys, and asynchronous projections do not independently prove uniqueness.

## Exact local evidence

Repository HEAD observed: `3fe0d8399de8f8e75aebea4bf5e88a64f8b38184`. The wider worktree is dirty, but the listed load-bearing files had no scoped modifications; hashes bind the exact observed bytes.

- `definitions/meta-types/meta-types.yml`, SHA-256 `439496...`, selectors `/members[id=DS-D1.1|1.4|1.5|1.7|1.9|1.11|1.13]`.
- `definitions/relationships/relationships.yml`, SHA-256 `ffc97f...`, selectors `/signatures[id=produces|creates|enforces|exposes|orchestrates|maps|queries]`.
- `definitions/minted-project/supported-profiles.yml`, SHA-256 `086878...`, selector `/profiles/0`.
- Implementation-structure findings, SHA-256 `ba6f3a...`, selectors `#candidate-vocabulary-and-authority-map`, `#blind-spots-and-typed-residue`, and line 508’s explicit deferral of persistence/concurrency/retries/idempotency.
- Email uniqueness findings, SHA-256 `636947...`, selectors `#write-side-collision-contract`, `#concrete-create-race`, `#failure-compensation`, `#falsifiable-invariant`.
- WaveDB findings, SHA-256 `958ed1...`, selectors `#three-posture-verdict-matrix`, `#hold-and-kill-residue`, especially schema migration/downgrade `HOLD`.
- Financial Settlement `operations.md`, SHA-256 `af758d...`, lines 51–77; `workflows.md`, SHA-256 `b310c9...`, lines 25–60.
- Existing P4 effect evidence SHA-256 `6e31b7...`; proof receipt SHA-256 `59d03f...`; adoption report SHA-256 `5e83ad...`, whose claims explicitly leave full coverage, formal source approval, release, and production false.

One non-blocking locator defect was found: the strategy packet names `.arcanum/inventory/entries/entries-ddd-process-manager-email-uniqueness-strategy-result-synthesis.md`, but the actual entry omits the leading `entries-`. The packet’s underlying `source_ref` resolves correctly.

## Claim ceiling

This action establishes a source-grounded candidate architecture and finite test design only. It did not execute a database, ORM, migration, concurrency schedule, restore, benchmark, or product test. It does not admit vocabulary or profiles, select technology, implement persistence, prove consistency/durability, authorize secrets, promote authority, publish, release, deploy, or establish production readiness.

```json
{
  "schema_version": "arcanum.native-dispatch-runner.receipt.v0.1",
  "action_id": "spawn-0002",
  "dispatch_id": "2026-08-13-domainspec-v2-system-integration-contracts-route",
  "run_id": "dsv2sic-20260813T044615Z",
  "wave_id": "explorers",
  "step_id": "s1",
  "role": "persistence-consistency-explorer",
  "capability_ref": "research",
  "agent_id": "/root/orchestrate_acd76d90bf10cdef4653cc244d024f7e19502ccd0c6b1b7128fc490e9bcd988c_spawn_0002",
  "status": "pass",
  "artifacts": [
    "inline:persistence-consistency-research-result",
    "projects/domainspec-v2/definitions/meta-types/meta-types.yml",
    "projects/domainspec-v2/definitions/relationships/relationships.yml",
    "projects/domainspec-v2/definitions/minted-project/supported-profiles.yml",
    "research/ddd-event-sourcing/2026-06-30-process-manager-uniqueness/findings.md",
    "ops/development/2026-08-04-wavedb-craft-runtime-research/findings.md",
    "projects/domainspec-v2/impl/spec/features/financial-settlement/sfol/adoption/effect-evidence.json"
  ],
  "validation": "pass",
  "blockers": [],
  "started_at": "2026-08-13T04:48:16Z",
  "finished_at": "2026-08-13T04:58:26Z"
}
```

## Agent 3 — Hewitt, Carl — distributed integration

## Bounded action receipt

```yaml
receipt_version: host-native-research-action/v1
action: spawn-0003
role: distributed-integration-explorer
capability: research
mode: explore
status: complete
mutation: none
intended_output_ref: projects/domainspec-v2/development/research/2026-08-13-system-integration-contracts/receipts/explorer-distributed-integration.json
input_digests:
  strategy-inventory-packet.json: 669cd99d5771d0e041e0a6a4b8b3c924829f31bfc2f18f91398cda334804f3cf
  dispatch-sheet.json: 49d3a4682b0c388501a7f344dc827382fecab36ce4be701db3e12fd112fe1c96
execution:
  repository_mutation: false
  tests_or_product_execution: false
  external_effects: false
  evidence_status: local-sources-observed-and-primary-external-sources-verified
```

### Direct finding

DomainSpec v2 already owns the logical integration story:

- `Interface` is the boundary.
- `Operation` and `Query` are callable behavior.
- `Mapping` transforms boundary shapes.
- `Event` is a past domain fact.
- `Workflow` coordinates ordered operations.
- `State Machine` owns valid domain transitions.
- DS-D8 owns `exposes`, `maps`, `produces`, `triggers-cross`, `transitions`, and `orchestrates`.

Those concepts do not establish HTTP, webhook, broker, channel, serialization, retry, delivery, ordering, deduplication, outbox/inbox, or cross-system consistency. The smallest non-collapsing addition is a separate integration-binding stack plus scoped guarantee obligations, evaluators, and evidence—not new product-named DS-D1 meta-types.

The current minted-project profile cannot execute the proposed full fixture: it admits only `Entity`, `Event`, `Operation`, and `Rule`, with `enforces`, `performs`, and `produces`; release admission remains ungranted.

### Concern taxonomy and layer ownership

| Concern | Proper layer and owner | Required validation/evidence |
|---|---|---|
| Inbound API | Existing `Interface --exposes--> Operation\|Query`; request `Mapping`; separate transport binding | Static contract/schema compatibility; runtime request, mapping, response, and failure receipts |
| Outbound API / client-provider ports | Application port role attached to an `Interface`; provider/client implementation behind a binding | Provider conformance and finite remote-failure observations |
| Authentication | Security-scheme reference in API/operation contract; verifier configuration in implementation profile | Positive/negative auth evaluator; never infer identity from declared scheme alone |
| Secret ownership | Opaque `secret_ref` in deployment/binding layer only | Resolver-access receipt with redaction; never store secret material in DomainSpec |
| Request/response mapping | Existing `Mapping --maps--> Interface\|Entity` | Field-level mapping evaluator; current DomainSpec checks direction only |
| Versioning/compatibility | Contract-version and immutable schema reference in binding layer | Compatibility diff plus old/new consumer fixtures |
| Timeout | `FailurePolicy` scoped to one call/binding | Inject delayed/no response; record unknown outcome |
| Retry/backoff | `FailurePolicy`; retry eligibility must depend on idempotency or an outcome probe | Attempt timeline, backoff bounds, terminal verdict |
| Rate limit | Provider contract plus `FailurePolicy`; actual quota remains runtime/provider state | Limit response and recovery evidence |
| Circuit breaker | Technology-profile implementation of `FailurePolicy` | State-transition evidence under finite failures; declaration is not availability proof |
| Webhook | Inbound API binding; OpenAPI webhook/callback shape plus security binding | Signature, timestamp/nonce, schema, and replay negatives before mapping or mutation |
| Event/message envelope | Binding from existing `Event` to a versioned envelope profile such as CloudEvents | Required envelope attributes, payload schema, correlation, compatibility |
| Topic/queue/channel | `MessageChannel` in integration-binding layer | Address, allowed messages, publisher/consumer references, profile binding |
| Publisher/subscriber | Application roles referring to existing `Operation`, `Event`, and `triggers-cross`; transport realization stays separate | Publish, broker-acceptance, receive, application-commit evidence |
| Serialization | Transport/message profile | Encode/decode round trip plus incompatible payload cases |
| Ordering | `DeliveryPolicy`, explicitly scoped by key/partition/channel | Reordering mutant; never claim global ordering from partition-local evidence |
| Delivery semantics | `DeliveryPolicy` plus exact provider configuration | Ack/confirm/offset/application-commit boundaries; scoped failure injection |
| Deduplication/idempotency | Application contract plus inbox or write-side uniqueness owner | Repeated request/message yields one business effect |
| Outbox/inbox | Infrastructure implementation pattern bridging local transactions and messaging | Store rows, transaction boundaries, dispatcher/consumer receipts, reconciliation |
| Dead-letter handling | `FailurePolicy` plus technology profile and terminal route | Poison-message attempts, terminal routing, and DLQ publish outcome |
| Replay | Operational policy distinct from accidental redelivery | Original identity, replay run identity, side-effect mode, selected range, outcome |
| Observability | Evidence binding/profile, preferably trace/message correlation | Traces/logs/metrics prove observation only, not correctness |
| Workflow/compensation | Existing `Workflow`; compensation steps and triggers are application contracts | Reachability, invoked compensation, final residue; `Workflow` alone proves no distributed consistency |

### Mapping to current DomainSpec owners

- `Interface` remains the logical inbound/outbound boundary. Its current criterion only checks `interface_kind`; its card explicitly says request/response semantics are not checked.
- `Event` remains the past domain fact. A transported message or broker delivery is not an `Event` synonym.
- `Mapping` remains the shape-transform owner; transport codecs and envelope serialization are binding/profile concerns.
- `Operation`/`Query` own state-changing/read-only domain behavior, not client libraries or endpoints.
- `Policy` may express a domain strategy. A transport retry or breaker configuration must not silently become DS-D1 `Policy`.
- `Workflow` owns ordered coordination. Compensation can reference a Workflow, but runtime execution and consistency require separate obligations and evidence.
- `State Machine` owns valid domain-state transitions, not transport ordering.
- `produces` means successful operation → domain event; it does not mean broker publication.
- `triggers-cross` means event → cross-feature operation; it does not specify subscription, delivery, acknowledgement, or deduplication.
- Existing `Binding` is a candidate UI concept and the DS-D8 `fetches`/`mutates` signatures are explicitly UI-backend. A new integration binding must not overload that term or imply UI `Binding` promotion.

### Candidate verdicts

| Candidate | Verdict | Reason |
|---|---|---|
| `ExternalApi` | `MERGE` | Already represented by `Interface(interface_kind=external)` plus `exposes` and `Mapping`; HTTP realization belongs in a binding profile |
| `ApiBinding` | `MERGE` | Make it the request/response branch of `TransportBinding`; an independent type would duplicate lifecycle and ownership |
| `EventBus` | `PROFILE-LOCAL` | Product/topology role realized by servers, channels, and bindings; no domain invariant |
| `MessageChannel` | `KEEP` | Distinct shared routing/address and allowed-message invariant; AsyncAPI separates channel, operation, message, and protocol binding |
| `TransportBinding` | `KEEP` | Owns the exact bridge from logical Interface/Event to versioned protocol contract and provider profile |
| `DeliveryPolicy` | `KEEP` | Ack boundary, ordering scope, redelivery, and deduplication change observable failure verdicts |
| `FailurePolicy` | `KEEP` | Timeout, retry eligibility, backoff, breaker, terminal route, and unknown-outcome handling have a distinct lifecycle |
| `ConsistencyPolicy` | `KEEP` conditionally | Keep only when bound to exact invariants, participants, boundaries, and hostile witnesses; kill vague “strong/eventual” labels |
| `ValidatorBinding` | `MERGE` | Reuse the generic obligation → evaluator → fixture → receipt architecture; do not create an integration-specific validator meta-type |

No DS-D1 or DS-D8 addition is justified by this lane yet.

### Minimal candidate record shapes

`TransportBinding`

```text
binding_id
mode: request-response | webhook | message
logical_ref: Interface | Event
direction: inbound | outbound | publish | subscribe
contract_ref: {uri, version, sha256}
protocol_profile_ref
endpoint_ref | channel_ref
request_mapping_ref?
response_mapping_ref?
envelope_binding?
security_binding_ref?
failure_policy_ref?
delivery_policy_ref?
observability_profile_ref?
```

`MessageChannel`

```text
channel_id
address
transport_binding_ref
message_schema_refs[]
publisher_refs[]
consumer_refs[]
ordering_scope: none | channel | partition-key
partition_key_ref?
dead_letter_channel_ref?
compatibility_rule
```

`EnvelopeBinding`

```text
event_ref
envelope_spec_ref
type
source_ref
id_source
dataschema_ref
content_type
correlation_id_ref?
causation_id_ref?
serialization_ref
```

`DeliveryPolicy`

```text
scope_ref
declared_semantics: at-most-once | at-least-once | scoped-exactly-once
publish_acceptance_boundary
consumer_ack_boundary
application_commit_boundary
ordering_scope
dedupe_identity_ref
redelivery_limit
replay_mode
required_runtime_evaluators[]
```

Reject `scoped-exactly-once` unless every participant and destination lies inside a tested atomic/transactional boundary.

`FailurePolicy`

```text
scope_ref
timeout_ms
retry_eligibility
max_attempts
backoff_profile
jitter
rate_limit_response
unknown_outcome_probe_ref?
circuit_breaker_profile_ref?
terminal_route
compensation_workflow_ref?
```

`ConsistencyPolicy`

```text
invariant_refs[]
participants[]
consistency_mode
commit_boundaries[]
visibility_rule
staleness_bound?
outbox_ref?
inbox_ref?
reconciliation_rule
compensation_workflow_ref?
required_runtime_evaluators[]
```

`SecurityBinding` stores references only:

```text
auth_scheme_ref
secret_ref?
verification_key_ref?
signature_profile_ref?
required_covered_components[]
timestamp_window?
nonce_policy?
```

### Finite paper-executable fixture

Use existing DS-D1/DS-D8 example names:

```text
PaymentAPI --exposes--> ProcessPayment
RequestToTransaction --maps--> PaymentTransaction
ProcessPayment --produces--> PaymentCompleted
PaymentCompleted --triggers-cross--> ScheduleShipment
PaymentCompleted --transitions--> PaymentStatus
```

Candidate realization:

1. An inbound HTTP binding references OpenAPI 3.2.0, a request schema, an opaque auth/secret reference, `RequestToTransaction`, an idempotency key, and a bounded failure policy.
2. `ProcessPayment` commits `PaymentTransaction` plus an outbox entry for `PaymentCompleted` in one local transaction.
3. A dispatcher maps the Event to a CloudEvents 1.0.2 envelope and publishes it to a versioned `MessageChannel`.
4. Broker acceptance is recorded separately from application success.
5. The consumer validates envelope/schema compatibility, inserts `(consumer, source, id)` into an inbox, runs `ScheduleShipment`, and commits inbox plus application state atomically.
6. A receipt connects request, local commit, outbox, publish, broker acceptance, receive, inbox, application commit, and final state by immutable identities.

This fixture is proposed and unexecuted. The minted profile cannot currently admit `Interface`, `Mapping`, `Workflow`, `State Machine`, `exposes`, `maps`, `triggers-cross`, or `transitions`.

### Hostile cases

| Case | Expected diagnostic/verdict | Required evidence | Claim ceiling |
|---|---|---|---|
| Remote success followed by timeout | `UNKNOWN_REMOTE_OUTCOME`; retry only with same idempotency identity or outcome probe | Server state, request identity, retry trace, one resulting effect | One bounded recovery path |
| Duplicate delivery | `DUPLICATE_SUPPRESSED` | Same CloudEvents `source+id`, inbox uniqueness result, one application mutation | Consumer idempotency for this fixture |
| Reordering | `ORDER_SCOPE_VIOLATION` or policy-defined hold/quarantine | Sequence/key/partition data and unchanged invalid state transition | Ordering only within declared scope |
| Poison message | `TERMINAL_FAILURE_ROUTED` after finite attempts | Attempt ledger, negative ack, DLQ outcome, no application commit | Failure isolation, not delivery success |
| Deliberate replay | `REPLAY_APPLIED` or `REPLAY_SIDE_EFFECT_SUPPRESSED` | Original IDs, replay-run ID, range/purpose, selected side-effect mode | One controlled replay |
| Schema-version mismatch | `MESSAGE_SCHEMA_INCOMPATIBLE` before Operation execution | Envelope `dataschema`, consumer-supported versions, zero mutation | Compatibility rejection |
| Broken webhook signature | `WEBHOOK_SIGNATURE_INVALID` before Mapping | Covered components, key reference, timestamp/nonce decision, zero mutation | Verification for selected signature profile |
| Outbox committed, not published | `OUTBOX_PUBLICATION_PENDING` | Local commit plus unpublished row; later reconciliation/publish result | Local durability only until publish |
| Published, inbox/application not committed | `CONSUMER_APPLICATION_PENDING` | Broker delivery, absent/rolled-back inbox, redelivery, later atomic commit | Broker delivery only until application commit |
| Inbox recorded without business mutation | `INBOX_ATOMICITY_BREACH` | Divergent rows/state and failed invariant | Detects invalid consumer implementation |

### Exact local evidence

- [meta-types.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/meta-types/meta-types.yml:99), lines 99–206 and 207–278, SHA-256 `4394968327b785d50cd323ad58a799feb71b9debf7e06b650b4fd1e4008f9ede`.
- [relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:36), lines 36–49, 85–98, 133–210, SHA-256 `ffc97f2c358e4bebeebd8ceeb25aef59628be9c970cf6a7e510f7a37c9876d9f`.
- [supported-profiles.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/minted-project/supported-profiles.yml:1), lines 1–69, SHA-256 `0868785499944ce2b21b915962cba48f8b21d627b840c24d81c77194e8864478`.
- [interface.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/spec/meta-types/connective/interface.md:17), lines 17–32, SHA-256 `98d3a92e126b2fd1c33924bf3b4323297d6b762a9282c4c3bd0e4f59dd951559`.
- [event.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/spec/meta-types/connective/event.md:17), lines 17–32, SHA-256 `bd034f87074c93f2b9bc0453bfe617fe4d9ec93702c43d27a1fb0b68b71e587d`.
- [mapping.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/spec/meta-types/connective/mapping.md:17), lines 17–32, SHA-256 `dc6f1126fd07464dc6f2508b2fec5298d8145457e2eaeefd3b1a0b29549df879`.
- [workflow.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/spec/meta-types/behavioral/workflow.md:17), lines 17–34, SHA-256 `bfd271b471e6a4ceb60bc16af638f8ed27d57de0196a03674fb6ad6154e3d913`.
- [policy.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/spec/meta-types/behavioral/policy.md:17), lines 17–32, SHA-256 `d4121a7478a1a5b584b27d32d880c7f52eedd3eb815f37f55efa18eb8f634b11`.
- [Living Archive precedent](/home/vrondelli/projects/domainspec-core/development/resonantos-integration/findings.md:21), lines 21–32 and 64–81, SHA-256 `b013cf2fef7a9ac11c501b63cc67b928a55f942fbbd7c19a3f071c21438a2500`. This is consumer precedent, not DomainSpec authority.
- An exact canonical-ID scan across current definitions, meta-type schemas, minted-project specs, and minted-project tools returned no `Database`, `ORM`, `Repository`, `ExternalApi`, `ApiBinding`, `EventBus`, `MessageChannel`, `TransportBinding`, `DeliveryPolicy`, `FailurePolicy`, `ConsistencyPolicy`, `ValidatorBinding`, `Webhook`, `Broker`, `Outbox`, or `Inbox` owner. This is bounded absence evidence, not a whole-repository universal claim.

### Primary external evidence and limits

- [RFC 9110 §9.2.2](https://www.rfc-editor.org/rfc/rfc9110.html#name-idempotent-methods) defines HTTP method idempotency and restricts automatic retry of non-idempotent requests; [§10.2.3](https://www.rfc-editor.org/rfc/rfc9110.html#name-retry-after) defines `Retry-After`. It does not make an application operation idempotent or resolve unknown remote outcomes.
- [OpenAPI 3.2.0](https://spec.openapis.org/oas/v3.2.0.html) describes operations, responses, security requirements, callbacks, and incoming webhooks. It does not prove implementation, authentication success, signature verification, or runtime compatibility.
- [AsyncAPI 3.1.0](https://www.asyncapi.com/docs/reference/specification/v3.1.0) is protocol-agnostic and separately models operations, messages, channels, and protocol bindings. A valid document does not prove broker configuration or delivery semantics.
- [CloudEvents 1.0.2](https://github.com/cloudevents/spec/blob/ce%40v1.0.2/cloudevents/spec.md) distinguishes occurrence, Event, message, protocol, and protocol binding. It defines required `id`, `source`, `specversion`, and `type`; identical `source+id` may identify duplicates. It does not prescribe consumer processing or delivery.
- [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html) supplies HTTP message-signature construction and verification. Key trust, required covered components, timestamp windows, nonce/replay policy, and secret resolution remain application-specific.
- [Apache Kafka 4.1 design](https://kafka.apache.org/41/design/design/#message-delivery-semantics) demonstrates that ordering is partition-scoped and delivery/processing guarantees depend on offsets, idempotence, transactions, isolation, and destination cooperation. This is technology-profile evidence, not a DomainSpec default.
- [RabbitMQ 4.2 reliability](https://www.rabbitmq.com/docs/4.2/reliability) separates publisher confirms from consumer acknowledgements, documents possible duplicates and redelivery, and requires application idempotency; [dead-lettering](https://www.rabbitmq.com/docs/4.2/dlx) can itself fail. These are product-profile facts, not vendor selection.
- [OpenTelemetry 1.60.0](https://opentelemetry.io/docs/specs/otel/) and its [messaging semantic conventions](https://opentelemetry.io/docs/specs/semconv/messaging/messaging-spans/) provide observation/correlation vocabulary. Telemetry presence is not proof of business correctness, delivery, or consistency.

### Claim ceiling and next gates

This receipt supports a proposed non-collapsing contract architecture and finite hostile test design. It does not define or promote vocabulary, admit a profile, implement transport, validate product code, prove delivery or consistency, select a vendor, publish, release, deploy, or establish production readiness.

Before adoption, owners must decide:

1. The authority and namespace for integration-binding records.
2. Whether `MessageChannel`, `DeliveryPolicy`, `FailurePolicy`, and exact-invariant `ConsistencyPolicy` survive independent non-collapse fixtures.
3. How binding records connect to existing DS-D1/DS-D8 without overloading UI `Binding`.
4. Profile admission for the logical concepts and relations needed by the fixture.
5. Exact evaluator, evidence-schema, and human acceptance routes.
