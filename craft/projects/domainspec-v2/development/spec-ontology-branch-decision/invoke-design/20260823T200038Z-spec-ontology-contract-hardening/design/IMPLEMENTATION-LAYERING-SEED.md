# Implementation Layering Seed

Status: Design seed only; no Plan, tasks, SWUs, implementation, or migration.

| Layer | Responsibility | Depends on | Must not decide |
| --- | --- | --- | --- |
| `L0 authority` | current primary roles, verifier role, definitions, lifecycle, promotion | existing owner-native evidence | semantics through validation |
| `L1 candidate contracts` | schemas for roles, levels, policy, responses, receipts, manifest | L0 decisions and prior Design | admission or canonicality |
| `L2 package freeze` | exact artifact inventory, digests, OAR scopes, floors, invalidation | L1 schemas | owner acceptance |
| `L3 owner responses` | Rondelli's exact role-scoped decisions | L0 assignment and L2 package | another role's meaning |
| `L4 structural verification` | V1 checker or direct V2 Victor receipts | exact L1 policy/schema and L2/L3 bytes | semantic approval, discharge, promotion |
| `L5 join and lifecycle` | prove exact current response/verification coverage and route separately | L2–L4 | inferred admission or publication |

Physical schema homes, checker language/runtime, receipt transport, principal
authentication implementation, canonical integration, and migration are
unselected. A later Plan must start from accepted exact package and role bytes,
not from this seed alone.
