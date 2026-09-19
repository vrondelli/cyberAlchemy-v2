---
decision_id: DEC-UCFE-001
target_scope: SWU-UCFE-005 corpus-B evidence strategy
state: resolved
created_at: 2026-07-12T19:25:46Z
resolved_at: 2026-07-12T19:46:10Z
authority: user-decision
---

# DEC-UCFE-001 - Corpus-B Evidence Strategy

## Blocker Question

How should the Form pilot resolve the missing real, independently authored
corpus B in a second implementation style?

## Consequential Work Blocked

- SWU-UCFE-005 corpus-B admission;
- SWU-UCFE-006 separating experiments;
- SWU-UCFE-007 independent review;
- a possible `distinct-supported` disposition in generation 001.

## Options

### Option 1 - Supply A Known Corpus

- Benefit: strongest and fastest route when a suitable source is already known.
- Cost/risk: requires repository, revision, source selectors, author identity,
  and independence/style evidence from the user or source owner.
- Choose when: a real non-Body-War Form implementation can be named now.
- Downstream impact: rerun SWU-005 directly; if accepted, continue SWU-006.

### Option 2 - Authorize Bounded Discovery

- Benefit: actively searches for a valid candidate without weakening the
  evidence policy.
- Cost/risk: requires a separately declared finite repository universe; may
  return no candidate, and author independence may still need human evidence.
- Choose when: no source is known, but a bounded local search is worthwhile.
- Downstream impact: create a discovery-only evidence package first. SWU-005
  remains blocked until one nominated source is explicitly accepted and pinned.

### Option 3 - Close This Generation As Defer-Missing

- Benefit: truthful immediate closure without manufacturing evidence.
- Cost/risk: generation 001 cannot support Form distinction; the empirical lane
  stops before corpus B, separating experiments, and review.
- Choose when: obtaining a second corpus is not worth the current cost.
- Downstream impact: create explicit not-applicable receipts for SWU-005 through
  007 and route SWU-008 to an immutable `defer-missing` disposition. A later
  successor generation may reopen evidence collection.

## Recommendation

Option 2. It preserves the full formalization process and fixed evidence bar,
while keeping discovery finite and fail-closed. Option 1 is preferable only if
a suitable corpus is already known.

## Selection

- Selected option: Option 2 - Authorize Bounded Discovery
- Rationale: preserve the full evidence process while keeping source discovery finite and fail-closed
- Source of decision: explicit user selection `2` on 2026-07-12
- Remaining decision blockers: 0

## Dependent Decision - Discovery Universe

Which finite repository universe should the discovery-only pass inspect?

### Universe Option 1 - Current Checkout Application Projects

- Scope: application-facing directories under `domainspec-core/projects/`,
  excluding Body War, previously evaluated Savvy, DomainSpec/Arcanum governance
  packages, research packages, and generated/test fixtures.
- Benefit: smallest useful bounded pass; local sources and revisions are easy to
  inspect.
- Cost/risk: may return no candidate and may not establish author independence.
- Downstream impact: stop and return to this gate if no source qualifies; no
  automatic expansion.

### Universe Option 2 - Entire Local Projects Workspace

- Scope: all top-level repositories under `/home/vrondelli/projects` plus the
  current checkout's application projects, with Body War and generated fixtures
  excluded.
- Benefit: highest chance of finding a second implementation style locally.
- Cost/risk: materially larger/noisier pass; repository ownership and author
  independence may remain ambiguous even when Form behavior is found.
- Downstream impact: produces a larger candidate/rejection ledger; SWU-005 still
  requires explicit acceptance and author-independence evidence.

### Universe Option 3 - User-Named Repository Set

- Scope: only repositories explicitly named by the user.
- Benefit: strongest relevance control and lowest unrelated inspection.
- Cost/risk: discovery cannot begin until the finite list is supplied and may
  miss viable local sources outside it.
- Downstream impact: inspect exactly the named set and stop.

### Dependent Recommendation

Universe Option 1. It is the smallest reversible discovery pass and respects
the task contract's prohibition on indefinite search. Expansion can be decided
later if it returns no valid candidate.

## Dependent Selection

- Selected universe: Universe Option 1 - Current Checkout Application Projects
- Source of decision: explicit user selection `1` on 2026-07-12
- Rationale: run the smallest reversible local pass and stop before expansion
- Remaining decision blockers: 0

## Exact Finite Universe

The discovery-only pass may inspect exactly these 16 directories:

1. `projects/alpha-grant`
2. `projects/auth-user-management`
3. `projects/autoads`
4. `projects/cyberAlchemy-website`
5. `projects/equalizator`
6. `projects/gb10-team-budget`
7. `projects/goldenquill`
8. `projects/ide-extension`
9. `projects/industrial-bid-brasil`
10. `projects/ontologize`
11. `projects/poker-agent-arena`
12. `projects/pos-multilevel`
13. `projects/sonar-loop`
14. `projects/ui-prototyping-studio`
15. `projects/whisky-doses`
16. `projects/zrig`

Explicit exclusions:

- `projects/body-war` - corpus A;
- `projects/savvy_legal-studio-ai` - previously evaluated, no accepted Form corpus;
- `projects/domainspec-v2`, `projects/framework-unification`, `projects/ontology`,
  `projects/arcanum-journey`, and `projects/ide-ergonomics` - governance,
  framework, ontology, research, or planning surfaces rather than the selected
  application universe;
- generated fixtures, tests, vendor trees, build outputs, and dependency trees.

The pass must stop after these directories. Expansion requires a new decision.
Discovery may nominate candidates but cannot satisfy author independence by
inference or admit corpus B automatically.

## Final Result

- Decision Gate: PASS
- Decisions resolved: 2
- Decision blockers remaining: 0
- Empirical task blocker remaining: corpus B is not yet discovered, accepted,
  or independently authored by evidence
- Next owner: `invoke` for a discovery-only define/design/plan package

## Standing Context Option

`Explain / more context` expands the evidence and downstream trade-offs but
does not resolve this gate.
