# E11 Source Pin Audit

- Experiment: E11-technique-specialization
- Recorded at (UTC): 2026-04-22T14:38:02Z
- Operator: vrondelli
- Objective: validate immutable source pins accepted by G2 policy

Pin policy used:
- URL-backed sources: `sha256-<content-digest>` when fetchable
- Book references: ISBN pin retained
- Unreachable URL during audit: `archive-YYYY-MM-DD-fallback` fallback (still immutable, lower confidence)

## Pin Capture Table

| Source ID | Version Pin | Capture Status |
| --- | --- | --- |
| `SRC-SAGA-MICROSERVICESIO` | `sha256-c42eac244bf94f8db7767ba131c1715066a2dd10beb1cd6f01e5f92e19d2f0b3` | fetched-content-pin |
| `SRC-SAGA-EVANS-BLUEBOOK` | `isbn-0321125215` | non-url-ref |
| `SRC-SAGA-CAMUNDA` | `sha256-474c2d2ec07ec909f4c5cc8b808e09f9c3d47b74fcd8a8666661f668d83d83fd` | fetched-content-pin |
| `SRC-OUTBOX-MICROSERVICESIO` | `sha256-0311303336376acb20c3f70729a67ea9e094546798a98276567257e6631122b0` | fetched-content-pin |
| `SRC-CQRS-FOWLER` | `sha256-11cf46ce308805e94e4b110016b09d004fbf8c47669a7041080f661c798b2f29` | fetched-content-pin |
| `SRC-CQRS-AZURE` | `sha256-16dbe140c59f759b061694fdaa3b7e37ff751cc8229566bb3f1aad08da238e89` | fetched-content-pin |
| `SRC-EVENTSOURCING-AZURE` | `sha256-c46df1f26347a8771f6debe85bf1430d88927e257cae7522b6c4da04d9aeaa5b` | fetched-content-pin |
| `SRC-COMPETING-CONSUMERS-AZURE` | `sha256-3adc94cd4dbda8afc4a678a34daedc017250e2098d046d991d3a0b33c34efc12` | fetched-content-pin |
| `SRC-QUEUE-LEVELING-AZURE` | `sha256-040d510a4eb11a21a538d46671286e01e1eb4546f4b0e196355921252e9eca3c` | fetched-content-pin |
| `SRC-LOAD-SHEDDING-AWS` | `sha256-47f400b895c797f38b12b27d12c4193001a2089bf4aed454f64069ff6f115cb3` | fetched-content-pin |
| `SRC-TIMEOUT-RETRY-JITTER-AWS` | `sha256-d31672f37514763b3f41c8e35318db6762c03bafa56485990da8741877ecbe37` | fetched-content-pin |
| `SRC-BATCH-EIP` | `sha256-dc85b74166b38c3432f7ef43820ecbd22e4e2ef0d7177fb1748db04b01f2bb90` | fetched-content-pin |
| `SRC-SPRING-BATCH` | `sha256-cec5ffbc4819b0ac7f9ebd67de45d578f5c2f7e040fb860b613df90fd826eea1` | fetched-content-pin |
| `SRC-KAFKA-SEMANTICS` | `sha256-b2b91911c4b7d2a464a5b9a168650b5f05cde58585f3145df47d8856b893bbf6` | fetched-content-pin |
| `SRC-OPTIMISTIC-OFFLINE-LOCK` | `sha256-0ce221d9b4712be954522988d1d70eb8dffa45199d254ef2a1d282d3f2083ae5` | fetched-content-pin |
| `SRC-PESSIMISTIC-LOCKING-POSTGRES` | `sha256-b6eda20b0b1de3c6da32ef3f54e235770a931cfdf55b2e2e4360588e27cb977e` | fetched-content-pin |
| `SRC-LEASES-ETCD` | `sha256-bd317148963180c28f27485a16ec4067237f844f9f6023071eabe7f7dc0d434e` | fetched-content-pin |
| `SRC-RETRY-AZURE` | `sha256-090dccda7a8399a656197e5765cecebfd7236a9c5d678216de00e7af61ab2a9a` | fetched-content-pin |
| `SRC-CIRCUIT-BREAKER-AZURE` | `sha256-cfad72be7581b3d9e0c044a9a5373368bf3c02e7111e71888e83ffa9417abee8` | fetched-content-pin |
| `SRC-IDEMPOTENCY-STRIPE` | `sha256-d32248417e893817a334826a8e68bb84acaaff6c9d7a06c169de991f56f132b7` | fetched-content-pin |
| `SRC-DLQ-AZURE-SB` | `sha256-b51c07fe0318d8613397f75d91292910b2e2e1141dfd07b1afd497a682ee4091` | fetched-content-pin |
| `SRC-HEXAGONAL-ALISTAIR` | `archive-2026-04-22-fallback` | archive-fallback |
| `SRC-STRANGLER-FOWLER` | `sha256-ac274ebe2a36e7553e9f1923e7fbfbc3ff52504c542eec5353127ffba335989e` | fetched-content-pin |
| `SRC-DDD-ACL-EVANS` | `isbn-0321125215` | non-url-ref |
| `SRC-VERNON-IDDD` | `isbn-0321834577` | non-url-ref |

## G2 Decision Snapshot

- g2_violations: 0
- decision: pass

