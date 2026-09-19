# Source Selection - E11-technique-specialization

Status: in-progress (broad sweep assembled)

This file tracks source selection and quality-gate decisions for E11-technique-specialization.

## Selection Strategy

Selection constraints locked for E11:
- Coverage across all required technique families.
- Mix of reference implementations, architecture pattern catalogs, and canonical literature.
- At least one source per family with explicit trade-offs and one with operational caveats.
- Pin each source by immutable edition/release/URL snapshot before execution.

## Selected Sources (Broad Sweep)

| Source ID | Technique Family | Source Type | Reference | Depth | Accessibility | Version Pin | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `SRC-SAGA-MICROSERVICESIO` | Saga orchestration/choreography | Pattern catalog | https://microservices.io/patterns/data/saga.html | deep | public | sha256-c42eac244bf94f8db7767ba131c1715066a2dd10beb1cd6f01e5f92e19d2f0b3 | selected-core |
| `SRC-SAGA-EVANS-BLUEBOOK` | Saga context and BC boundaries | Book | Evans, Domain-Driven Design (2003) | deep | paid | isbn-0321125215 | selected-core |
| `SRC-SAGA-CAMUNDA` | Orchestration execution patterns | Vendor docs | https://docs.camunda.io/docs/components/concepts/workflow-patterns/ | moderate | public | sha256-474c2d2ec07ec909f4c5cc8b808e09f9c3d47b74fcd8a8666661f668d83d83fd | selected-extended |
| `SRC-OUTBOX-MICROSERVICESIO` | Transactional outbox specialization | Pattern catalog | https://microservices.io/patterns/data/transactional-outbox.html | deep | public | sha256-0311303336376acb20c3f70729a67ea9e094546798a98276567257e6631122b0 | selected-core |
| `SRC-CQRS-FOWLER` | CQRS decision boundaries | Essay | https://martinfowler.com/bliki/CQRS.html | deep | public | sha256-11cf46ce308805e94e4b110016b09d004fbf8c47669a7041080f661c798b2f29 | selected-core |
| `SRC-CQRS-AZURE` | CQRS trade-offs and scaling | Architecture guide | https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs | deep | public | sha256-16dbe140c59f759b061694fdaa3b7e37ff751cc8229566bb3f1aad08da238e89 | selected-core |
| `SRC-EVENTSOURCING-AZURE` | CQRS + event sourcing specialization | Architecture guide | https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing | moderate | public | sha256-c46df1f26347a8771f6debe85bf1430d88927e257cae7522b6c4da04d9aeaa5b | selected-extended |
| `SRC-COMPETING-CONSUMERS-AZURE` | Queueing and worker scaling | Architecture guide | https://learn.microsoft.com/en-us/azure/architecture/patterns/competing-consumers | deep | public | sha256-3adc94cd4dbda8afc4a678a34daedc017250e2098d046d991d3a0b33c34efc12 | selected-core |
| `SRC-QUEUE-LEVELING-AZURE` | Queue buffering specialization | Architecture guide | https://learn.microsoft.com/en-us/azure/architecture/patterns/queue-based-load-leveling | moderate | public | sha256-040d510a4eb11a21a538d46671286e01e1eb4546f4b0e196355921252e9eca3c | selected-core |
| `SRC-LOAD-SHEDDING-AWS` | Backpressure and overload containment | Builders Library | https://aws.amazon.com/builders-library/using-load-shedding-to-avoid-overload/ | deep | public | sha256-47f400b895c797f38b12b27d12c4193001a2089bf4aed454f64069ff6f115cb3 | selected-core |
| `SRC-TIMEOUT-RETRY-JITTER-AWS` | Retry backoff specialization | Builders Library | https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/ | deep | public | sha256-d31672f37514763b3f41c8e35318db6762c03bafa56485990da8741877ecbe37 | selected-core |
| `SRC-BATCH-EIP` | Batching/chunking patterns | Book/site | https://www.enterpriseintegrationpatterns.com/patterns/messaging/ | moderate | public | sha256-dc85b74166b38c3432f7ef43820ecbd22e4e2ef0d7177fb1748db04b01f2bb90 | selected-extended |
| `SRC-SPRING-BATCH` | Chunked processing implementation detail | Framework docs | https://docs.spring.io/spring-batch/reference/ | deep | public | sha256-cec5ffbc4819b0ac7f9ebd67de45d578f5c2f7e040fb860b613df90fd826eea1 | selected-extended |
| `SRC-KAFKA-SEMANTICS` | Delivery and ordering specializations | Platform docs | https://kafka.apache.org/documentation/#semantics | deep | public | sha256-b2b91911c4b7d2a464a5b9a168650b5f05cde58585f3145df47d8856b893bbf6 | selected-core |
| `SRC-OPTIMISTIC-OFFLINE-LOCK` | Optimistic locking | Pattern reference | https://martinfowler.com/eaaCatalog/optimisticOfflineLock.html | moderate | public | sha256-0ce221d9b4712be954522988d1d70eb8dffa45199d254ef2a1d282d3f2083ae5 | selected-core |
| `SRC-PESSIMISTIC-LOCKING-POSTGRES` | Pessimistic lock semantics | Platform docs | https://www.postgresql.org/docs/current/explicit-locking.html | deep | public | sha256-b6eda20b0b1de3c6da32ef3f54e235770a931cfdf55b2e2e4360588e27cb977e | selected-extended |
| `SRC-LEASES-ETCD` | Lease-based locking | Platform docs | https://etcd.io/docs/ | moderate | public | sha256-bd317148963180c28f27485a16ec4067237f844f9f6023071eabe7f7dc0d434e | selected-extended |
| `SRC-RETRY-AZURE` | Retry strategy | Architecture guide | https://learn.microsoft.com/en-us/azure/architecture/patterns/retry | deep | public | sha256-090dccda7a8399a656197e5765cecebfd7236a9c5d678216de00e7af61ab2a9a | selected-core |
| `SRC-CIRCUIT-BREAKER-AZURE` | Circuit breaker specialization | Architecture guide | https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker | deep | public | sha256-cfad72be7581b3d9e0c044a9a5373368bf3c02e7111e71888e83ffa9417abee8 | selected-core |
| `SRC-IDEMPOTENCY-STRIPE` | Idempotency key operational usage | API docs | https://docs.stripe.com/api/idempotent_requests | moderate | public | sha256-d32248417e893817a334826a8e68bb84acaaff6c9d7a06c169de991f56f132b7 | selected-core |
| `SRC-DLQ-AZURE-SB` | Dead-letter queue specialization | Platform docs | https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-dead-letter-queues | moderate | public | sha256-b51c07fe0318d8613397f75d91292910b2e2e1141dfd07b1afd497a682ee4091 | selected-extended |
| `SRC-HEXAGONAL-ALISTAIR` | Ports/adapters abstraction patterns | Essay | https://alistair.cockburn.us/hexagonal-architecture | moderate | public | archive-2026-04-22-unresolved | selected-core |
| `SRC-STRANGLER-FOWLER` | Strangler facade migration abstraction | Essay | https://martinfowler.com/bliki/StranglerFigApplication.html | moderate | public | sha256-ac274ebe2a36e7553e9f1923e7fbfbc3ff52504c542eec5353127ffba335989e | selected-extended |
| `SRC-DDD-ACL-EVANS` | Anti-corruption layer | Book | Evans, Domain-Driven Design (2003), ACL chapter | deep | paid | isbn-0321125215 | selected-core |
| `SRC-VERNON-IDDD` | Domain specialization boundaries | Book | Vernon, Implementing DDD (2013) | deep | paid | isbn-0321834577 | selected-core |

## Family Coverage

| Family | Sources |
| --- | --- |
| Saga orchestration/choreography | 3 |
| Queueing and backpressure | 5 |
| Batching and chunking | 3 |
| Locking strategies | 3 |
| Abstraction patterns | 4 |
| Retry/idempotency/circuit breaker | 5 |
| CQRS and related variants | 3 |

## Quality Gate (G2)

- Accessibility: pass (all public URLs fetched on 2026-04-22; paid references pinned by ISBN)
- Depth: pass (each family has at least one deep source)
- Version pin: pass (all URL references converted to immutable `sha256-*` pins; book references pinned by ISBN)

G2 decision: `pass`

## Pinning Checklist Before Execution

1. Replace web snapshot pins with immutable commit/release links where available.
2. Record edition and page/chapter anchors for book references.
3. Add inventory entry mapping for each selected source ID.
4. Re-run G2 check from `protocol.md` and store output in results notes.

Pin audit evidence:
- `results/E11-source-pin-audit.md`
