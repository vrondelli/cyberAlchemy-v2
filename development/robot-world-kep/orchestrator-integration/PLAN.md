# Bounded Robot World orchestration

Status: implementation plan; owner-directed local candidate.
Authorization: user “plan and implement”, 2026-09-11. Authority effect: none.

## Outcome and construction boundary

Implement `robot-world.run/v1` followed by `robot-world.verify/v1` through the
standalone CyberAlchemy Orchestrator product. Run the scripted interaction world in a fresh
instance, preserve checked actions, and expose verified replay artifacts. No
neural policy, shared-world resume, deployed service or publication is included.

The D65 chain is local: this plan and CONTRACT.md define the prototype; MAPPING.md
owns concept/implementation relationships; authored DomainSpec source compiles
into graph and system-ontology scaffolds before runtime implementation; tests and
a digest-bound candidate report complete the local evidence. No construction
registry admission or product approval is inferred.

## Product stages

| Stage | Work | Evidence |
| --- | --- | --- |
| C0 | Freeze contract, source bindings, budgets and DomainSpec scaffold | Reproducible compilation and source manifest |
| C1 | Repair legacy kernel paths and reusable ICU 74 launcher; close ARE result-validation defect | Legacy tests; malformed ARE result rejection |
| C2 | Closed run/verify payloads, isolated Python worker and independent action/clock verification | Boundary, tampering, duplicate and cancellation tests |
| C3 | Register two-node graph and execute via new orchestrator leases, fences, receipts and accepted events | Real process integration; durable replay; no redispatch of uncertainty |
| C4 | Produce a bounded demonstration, replay view and exact evidence | Direct/orchestrated equality; regression tests; candidate manifest |
| C5 | Rebind the same contracts to `orchestrator/` Strategy and Run Templates plus its durable runtime | Product-native driver; 16 domain tests; no live sibling dependency |

Current frontier: C0–C5 implemented and validated; original candidate details are in REPORT.md and M8 migration evidence is under `orchestrator/migration/m8/`.
Each stage depends on the preceding stage. All stages are
authorized for native local construction by the user. Goals admission remains
separate from this runnable prototype work.

## Exact scope

- New files under `development/robot-world-kep/orchestrator-integration/` and its
  documented runtime integration entrypoints; additive parent README navigation.
- The two existing local Cargo kernel dependency paths; `tools/toolchain/run-rwo`
  and its documentation. Do not rewrite historical source receipts or runs.
- `orchestrator/examples/robot-world/`: product-native templates, driver, and
  consumer tests; historical sibling code remains migration provenance only.
- New run-local output and candidate evidence only; no credentials, network model
  calls, service configuration, frozen renderer sessions or unrelated dirty files.

## Selected v1 limits

Default initial world only, with exact initial-state/profile/engine hashes and
host-owned actor identities. One to 100 ticks; two actors; 32 MiB artifact ceiling;
120-second overall wall deadline; one attempt; no checkpoint resume. Stop at the
horizon or the pinned profile's quiescence window. These are bounded fixture
limits, not performance or large-world claims.

The new executor uses the standalone Orchestrator runtime owner and capacity model
through a local driver. The resulting replay view is run-local; registering
arbitrary world tasks through deployed dashboard controls is deferred. The
existing gateway, native text and research contracts retain their own executors.

## Operational support and residue

| Task | Owner | Stage | Posture |
| --- | --- | --- | --- |
| Resolve verified vendored RWO source and installed ICU 74 | Implementer | C1–C4 | Exact build prerequisite; use existing compiler and library installation |
| Fresh run directories and durable writes | Implementer | C2–C4 | Required for replay/dedup evidence |
| Installed web service, dashboard launch control and authentication | Runtime owner | None | Deferred; local driver and replay view suffice for v1 |
| Admission/product approval | Product/governance owner | After C4 | No operational effect granted by tests |
| Shared-world service, checkpoint resume, inference | World/runtime owner | None | Separate later contract versions |

## Open Questions

Future shared-world fencing, authenticated actor delegation, model proposals and
deployed dashboard registration remain in the research proposal. No missing owner
decision blocks the selected isolated default-world implementation. Completion
state and measured limits will be recorded in REPORT.md.
