---
task: SWU-FPR02-001
mode: standard
strict: true
coverage: 12/12
status: pass-for-decision-gate
evidence_date: 2026-07-17
repository_revision: fdd8279dab37726a3187a19b68a1fdef6f09104f
session_evidence: true
---

# Context Pack: SWU-FPR02-001 Profile Decision Envelope

## Identity And Selection

- Target: `SWU-FPR02-001` under `TASK-FPR-02-SUPPORTED-PROFILE`, W2/L1.
- Selection evidence: the user instructed Task Session to start the next ready tasks
  until a blocker; the Work Pack has exactly one ready next unit.
- Runtime: local Codex Task Session; no runtime adapter and no subagents.
- Expected output: one accepted Decision Gate artifact under
  `development/first-production-release/decisions/`, or a blocked Decision Gate
  receipt if owner choices remain unresolved.
- This pack is session evidence, not continuation or semantic authority.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
|---|---|---|---|
| `O1` | resolve exactly one ready SWU | Work Pack; layering; manifest | covered |
| `O2` | verify FPR-01 dependency and exact ratification | refresh receipt; ratification | covered |
| `O3` | decide literal admitted backend types and relationship signatures | ratified baseline; EGI findings | covered-to-decision |
| `O4` | decide UI candidate/deferred admission without collapsing formation and signature states | baseline; `EGI-003`; `GAP-SH-UI11-MIGRATE` | covered-to-decision |
| `O5` | decide required documents, obligation kinds, exercised subsets, and negative classes | EGI findings; manifest; traceability | covered-to-decision |
| `O6` | decide supported source roots, languages, commands, writes, and generated-artifact boundary | accepted product contract; FPR findings; manifest | covered-to-decision |
| `O7` | decide Body War provider, callback/deployment/origin, consent/CSRF, and allowed-redaction boundary | FPR findings; Craft frontier | blocker-owner-choice |
| `O8` | bind exact claims and prevent full-language or universal-equivalence overclaim | accepted product contract; EGI findings | covered-to-decision |
| `O9` | decide rollback/revocation and accountable roles without placeholder owners | accepted contract; Body War witness; task | blocker-owner-choice |
| `O10` | preserve decision-only write scope; no schemas or implementation | task; wave; layering | covered |
| `O11` | validate one owner/disposition per required field and disjoint admitted/exercised/deferred sets | task; manifest | covered |
| `O12` | preserve authority split and production unauthorized | accepted contract; Craft; refresh receipt | covered |

Strict context coverage is complete for a Decision Gate. It is intentionally not
complete for implementation because `O3` through `O9` require owner decisions.

## Decision Inputs

### Ratified denominator

- Backend node types: the ratified baseline contains 13 active IDs,
  `DS-D1.1..9`, `DS-D1.11..14`; `DS-D1.10` is superseded.
- Relationships: 30 active signatures from the canonical relationship registry.
- UI: nine candidate IDs `DS-D1.15..23`; `DS-D1.24` and `DS-D1.25` are deferred.
- Formation, signature availability, profile admission, and positive exercise remain
  separate states.

### Evidence-supported narrow route

- `EGI-003` explicitly permits a backend-only profile while UI formation remains
  deferred; it blocks a full-language claim, not necessarily a backend profile.
- `EGI-012` observes positive exercise of only 11/13 backend types and 9/30 verbs.
  The admitted set may be wider only if unexercised entries remain explicitly
  unexercised and no exercised/completeness claim is made for them.
- `EGI-007/008` require distinct empty-content, unknown/absent-schema, missing-source,
  and zero-obligation failures rather than clean empty success.
- Body War application UI is a pilot boundary, not a DomainSpec UI product.

### Body War decision boundary

- The pilot witness is the SuggestedTrack/Parque Taquaral slice, not all TROQAR.
- The minimal API journey authenticates a consenting runner, loads only allowed
  redacted fields, creates `volta-do-taquaral` under `CT-1`, attaches an
  ActivityEvidenceCandidate satisfying `EC-3/EC-4`, permits only
  `needs_evidence -> evidence_submitted`, and proves revocation.
- Real-provider evidence is absent. The callback/deployment/origin route and field
  allowlist remain open; fake-only is valid only with an explicitly narrower claim.
- No current evidence supports `source_backed`, verified geometry, scoring,
  leaderboard, accepted/rejected, or pilot-ready promotion claims.

## Hard Constraints

1. Decision Gate must resolve profile breadth, claims, provider/origin/redaction,
   rollback, and owner roles before any schema authoring.
2. Backend admission cannot promote UI formation or imply full-language support.
3. Admitted, exercised, candidate, deferred, excluded, and superseded are distinct
   dispositions; exercised must be a subset of admitted.
4. Every required field must have one accountable governed owner role and no
   placeholder value.
5. A fake-only Body War route must narrow the real-provider/end-to-end claim.
6. DomainSpec semantic authority cannot accept implementation or authorize release.
7. No output may set or imply `production_authorized: true`.

## Write Scope

- Session context:
  `foundation-execution/runs/SWU-FPR02-001/context/CONTEXT-PACK.md` and
  `context-pack.json`.
- Blocker Decision Gate artifact:
  `development/first-production-release/decisions/2026-07-17-fpr02-supported-profile-decision.md`.
- Task Session receipt after the decision resolves or blocks:
  `foundation-execution/runs/SWU-FPR02-001/TASK-SESSION-RESULT.md` and
  `task-session-result.json`.
- No Work Pack, Craft, roadmap, schema, profile, pilot, implementation, or production
  state mutation is authorized inside this blocked gate entry.

## Validation Surface

- Parse this context JSON and the eventual decision artifact frontmatter/structure.
- Verify all 14 selected source SHA-256 preimages.
- Verify the selected unit is uniquely ready and its predecessor receipt is present.
- Verify each FPR-02 required decision field has one disposition and owner.
- Verify admitted/exercised/deferred/excluded sets are disjoint as applicable and
  traced to ratified FPR-01 IDs.
- Verify origin, callback/deployment, redaction, claims, and rollback contain no
  unresolved or placeholder value before PASS.
- Verify no schema/profile implementation files changed and production remains false.

## Blocker And Route

`PLAN-B3-PROFILE`, `GAP-SH-UI11-MIGRATE`, and `FR-FPR-BW-ORIGIN-ROUTE` supply one
consequential owner-choice boundary. Invoke `decision-gate` now. If any choice remains
unresolved, return `BLOCK` and stop before profile implementation.

## Selected Sources

| Source | Selectors | Obligations | SHA-256 |
|---|---|---|---|
| `foundation-execution/WORK-PACK.md` | control fields; FPR02 rows; gates | O1,O10,O12 | `8db055b02c9dbc52424b17b013fa3a28171a6f450e95a82f1401c969424b33e4` |
| `work-pack/tasks/TASK-FPR-02-SUPPORTED-PROFILE.md` | objective; SWU-001; synchronization | O1,O3-O11 | `80aedd0073f88dc016bb433f8ff53251d1eba22ee2be665709fdc0da8a4a0dfa` |
| `work-pack/waves/W2-SUPPORTED-PROFILE.md` | order; entry; promotion | O1,O2,O10 | `30c392ba4823160af48e34e0a9008b555026586d52b02873450bce2c809c2af8` |
| FPR01-004 `REFRESH-REPORT.md` | result; authority boundary; next route | O1,O2,O12 | `5e6d42c89043bdfbc5fab7c4723783a9bc8fe7db4e84047b0a94502038927fc4` |
| `decisions/2026-07-12-product-release-contract.md` | claims; boundary; exclusions; owners; deferred | O6-O9,O12 | `a5852275365563fc2378e3b6a86d9f4da03cc9efbaef249ffa41f329c3bf5b43` |
| `authority-baseline.yml` | meta-types; relationships; source homes | O3,O4,O11 | `7accea7412228999575e9c6a566c01c4cfa3424ece03451fd8a8721dcdacc63a` |
| `evidence/authority-baseline-ratification.json` | result; bindings; authority boundary | O2,O3,O12 | `beeb8c5bd8c289c73123411630ac01752e3530849a1910c475b70e0606257f8c` |
| engine-gap inventory `findings.md` | EGI-003/007/008/012; FPR-02 package | O3-O6,O8,O11 | `0f315b1a90c4207fb4ba8a051ff7fa4be3bd1a168c8ccc903aa97f349a8a2f76` |
| expanded-capability `findings.md` | FPR-02; Body War API/critical steps; risks | O5-O9,O12 | `5f98c5a8ee2aa414240ac731fed0c7e1bbb7ed23cbd0690cab4ae30444869ded` |
| `projects/body-war/docs/features/parque-taquaral-online-mvp/SPEC.md` | ownership; capabilities; concepts; graph; non-goals | O5-O9,O11 | `3e69b9dae13bd35bc1eb119c46944634a91ce45e6ed6cddf26db8a172b17a22e` |
| `projects/body-war/docs/features/parque-taquaral-online-mvp/states.md` | allowed and future lifecycle transitions | O5,O8,O9,O11 | `400772f889ba3663f770eaeb03be88e106742a99643c140b44116083eaff373e` |
| `.craft/ledger.yml` | FPR context; UI/origin frontiers | O1,O4,O7,O12 | `eedf80c34c6dfceb3124dfcaa6a82459927eec3a96ce8ff45f232161237e951e` |
| `craft/expected-node-edge-manifest.yml` | FPR-02 node; artifacts; negatives; exit | O1,O5-O7,O10-O12 | `53c01ee5068e0ed62d12392e22894b561f4621e697daf9b33a90c5d119bc1dfa` |
| `foundation-execution/IMPLEMENTATION-LAYERING.md` | L1 boundary; guardrails; next route | O1,O3,O10,O12 | `a1d3c787539acf100c8f89b23f1df8778280eac8f7be44effaedccccd34bd47e` |

Fallback exploration: named gaps only; none remain uncovered for Decision Gate.
