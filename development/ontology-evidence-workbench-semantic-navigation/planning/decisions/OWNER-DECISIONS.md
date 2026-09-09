# Body War Semantic Navigation Owner Decisions

Status: PASS; all four owner decisions resolved and validated, with no
implementation authority granted

| ID | Question | Allowed values | Current |
| --- | --- | --- | --- |
| OD-01 | Which exact project-owned contexts and mapping evidence define the Body War entry home? | explicit ordered IDs plus source evidence | resolved: all 12 context portals over the full ontology source |
| OD-02 | How should Path present routes? | `comparator` or `route_local_presentation` | resolved: relation-bearing comparator |
| OD-03 | How should zero-count projection values behave? | `hide`, `disable`, or `retain` | resolved: visible and disabled after current values |
| OD-04 | Which versioned relation-encoding tables cover every admitted exact predicate and presentation relation? | complete `sourcePredicate -> color token` plus `presentationRelation -> pattern token` tables, system fallbacks and redundant text rules | resolved: semantic-family v1 candidate confirmed |

Invoke Refresh may freeze answers incrementally in
`BODY-WAR-PROFILE-APPROVED.json`, bound to the prior review profile/baseline,
and revalidate only the dependent gates. SWU-OEWSN-004 requires OD-04; Home,
Path and projection-count behavior require OD-01, OD-02 and OD-03
respectively. This planning file does not choose for either owner.

## Decision Gate run 2026-08-01

- Target: `ontology-evidence-workbench-semantic-navigation`
- Current gate: none
- Classification: no owner decision blocker remains
- State: OD-01 through OD-04 resolved; no implementation is authorized
- Admissibility request: `admissibility/OD-04-request.json`
- Admissibility receipt: `admissibility/OD-04-receipt.json`
- Override: not requested

The first OD-04 question selects an encoding strategy. The selected strategy
must then be expanded into and explicitly confirmed as a complete versioned
table covering all 23 currently admitted `sourcePredicate` values and both
`presentationRelation` values before OD-04 can pass.

### OD-04 strategy selection

- Selected option: `OD04-B-SEMANTIC-FAMILIES`
- Source: user answer `2`
- Timestamp: `2026-08-02T00:07:09Z`
- Rationale: user-selected semantic families; no rationale was inferred beyond
  the explicit option choice
- Candidate table: `OD-04-SEMANTIC-FAMILIES-CANDIDATE.json`
- Validation receipt: `OD-04-SEMANTIC-FAMILIES-VALIDATION.json`
- Confirmation: user answer `1` at `2026-08-02T00:16:33Z`
- Approved profile: `BODY-WAR-PROFILE-APPROVED.json`
- Current state: resolved; selection of or mutation by SWU-OEWSN-004 remains a
  separate Invoke Refresh and Task Session route

### OD-01 Home selection

Status: superseded by the owner amendment below

- Selected option: `OD01-A-TESTED-FOUR`
- Source: user answer `1`
- Timestamp: `2026-08-02T00:20:07Z`
- Ordered contexts: Identity and Consent; Suggested Track Route Expansion;
  Candidate Geometry Evidence; Score Preview
- Evidence: exact source-node digests, presentation-graph tour order, and the
  prior automated focus A/B four-node set
- Ceiling: no human comprehension or preference claim
- Current state: resolved in `BODY-WAR-PROFILE-APPROVED.json`

## Decision Gate result

- Result: PASS
- Decisions resolved: 4
- Blockers remaining: 0
- Approved profile: `BODY-WAR-PROFILE-APPROVED.json`
- Consolidated receipt: `DECISION-GATE-RESULT.json`
- Override: not requested
- Selected SWU: none
- Mutation authorized: false
- Observability run: `decision-gate-20260802T011338Z-oew-semantic-navigation`
- Next route: Invoke Refresh, followed by one explicit Task Session preflight

### OD-03 zero-count policy

- Selected option: `OD03-B-DISABLE`
- Source: user answer `2`
- Timestamp: `2026-08-02T01:09:42Z`
- Ordering: current positive-count values first, zero-count values afterward
- Zero values: visible, disabled, labeled `0` and `Not in this area`
- Scope: counts describe only the current projection
- Non-color recovery: native disabled state plus literal count and availability
  text
- Current state: resolved in `BODY-WAR-PROFILE-APPROVED.json`

### OD-02 Path presentation

- Selected option: `OD02-A-COMPARATOR`
- Source: user answer `1`
- Timestamp: `2026-08-02T01:07:10Z`
- Presentation: deterministic relation-bearing route comparator with optional
  selected-route projection
- Exactness: every hop retains predicate, source/projected/traversal direction,
  evidence, and authority boundaries
- Language: route alternative, never cluster or ontology branch
- Current state: resolved in `BODY-WAR-PROFILE-APPROVED.json`

### OD-01 owner amendment

- Timestamp: `2026-08-02T00:59:02Z`
- Source scope: full admitted Body War ontology, currently 237 nodes and 231
  relations
- Usage profile: single-owner local prototype
- Validation policy: human/novice A/B is not required; deterministic unit,
  integration, generation, and browser validation remains required
- Prior four-card selection: withdrawn by the user
- Remaining distinction: all 12 bounded contexts as portal cards over the full
  source, or an Invoke redesign that makes all 237 nodes the default entry

### OD-01 full-ontology entry confirmation

- Selected option: `OD01-FULL-A-TWELVE-PORTALS`
- Source: user answer `1`
- Timestamp: `2026-08-02T01:04:12Z`
- Source: full admitted Body War ontology, 237 nodes and 231 relations
- Home: all 12 bounded contexts as portal cards
- Full graph: explicit `Show all loaded graph` escape
- Ordering assumption: label-lexicographic v1; reversible and not an ontology
  sequence or priority claim
- Human/novice A/B: not required
- Deterministic validation: required
- Validation receipt: `OD-01-FULL-ONTOLOGY-HOME-VALIDATION.json`
- Current state: resolved in `BODY-WAR-PROFILE-APPROVED.json`
