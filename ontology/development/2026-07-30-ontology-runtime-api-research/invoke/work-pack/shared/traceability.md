# Traceability

| Requirement | Design | Task/SWU | Evidence |
| --- | --- | --- | --- |
| configured registration, no discovery | SPEC / authority extension | CORE / 001 | schema + zero-write receipt |
| lossless adapter, no snapshot authority | low-level view | CORE / 002 | adapter contract receipt |
| immutable deterministic snapshot | workflow/persistence views | CORE / 003 | replay/identity receipt |
| bounded logical-ID reads | interface view | CORE / 004 | query/curl receipt |
| exact native-result separation | decision flow | OPERATIONS / 005 | native matrix receipt |
| same-adapter diff only | operation flow | OPERATIONS / 006 | diff receipt |
| draft bytes, no owner lifecycle | authority/integration views | OPERATIONS / 007 | artifact receipt |
| loopback/path/child/outbound isolation | security extension | HARDENING / 008 | negative security receipt |
| every cap measured and enforced | quality recommendation + validation | HARDENING / 009 | resource receipt |
| complete identity under race | persistence/failure views | HARDENING / 010 | race receipt |
| exact-owned zero-residue lifecycle | state/failure views | TEARDOWN / 011 | teardown receipt |
| no authority/production overclaim | all views | AUDIT exemption | authority audit |

