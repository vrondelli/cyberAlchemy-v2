# Repair analysis and plan-review subagent sheet (candidate)

Status: user-authorized read-only dispatch on 2026-09-27. The A-role helper
returned earlier; B and C were dispatched after the user said to continue
without governance or further confirmations. This sheet names roles,
dependencies, scopes, gates, join and close conditions. All helpers remain
read-only through independent plan review. The parent keeps final synthesis
and implementation decisions.

| Role | Depends on | Exact scope and output | Gate / close condition |
| --- | --- | --- | --- |
| A — AlchLang/evidence analyst | Candidate PLAN P0/P1 | Inspect current AlchLang FormalClaim, EVF, ORODI, outbox, HTTP and UI target bytes/tests and dirty overlaps; produce file-level implementation analysis for tracks A/B/E, separating semantic decisions from mechanical fixes. | Returned read-only; the parent recorded its matrix in `ANALYSIS.v1-candidate.md`. Re-baseline only if target bytes change. |
| B — DomainSpec/TDE analyst | Candidate PLAN P0/P1 | Inspect current Craft catalog, TDE/BTE, formalization, minted fixture, ontology and certify target bytes/tests; produce analysis for C/D/F2/G, preserving sibling provenance-only status. | Returned read-only; exact file/test matrix and conditional W3-04 ceiling joined into `ANALYSIS.v1-candidate.md`. |
| C — docs/package/validation analyst | Candidate PLAN P0/P1 | Reconcile F1/F2 documentation, package inputs, validation commands and cross-package currentness; identify existing dirty edits and package/fixture dependencies. | Returned read-only; validator DAG and stale-input inventory joined into `ANALYSIS.v1-candidate.md`; no receipt generated. |
| D — independent plan reviewer | A+B+C joined | Challenge coverage of every accepted ID, deduplication, dependencies, decision gates, race/crash controls, dirty-work preservation and D65 two-lane fields. | No target writes; return ACCEPT/REVISE with concrete omissions. |
| Parent / final plan auditor | A+B+C+D | Integrate only supported edits to this candidate plan, resolve disagreements from source evidence where possible, and freeze an exact implementation sheet for the separate implementation phase. | Do not call the plan admitted or any finding fixed; start target edits only after independent review and file-scope selection. |

Dispatch order: B/C run concurrently under the user's continuation instruction;
A's existing return is retained. D begins only after A's
return and B/C's returns are preserved. The parent's provisional B/C analysis
is context, not a substitute for the proposed independent returns. If one
analyst is missing or incomplete, the join remains open; the parent does not
substitute another analyst's silence for acceptance. If D requests revision,
repair the candidate plan and ask D to re-review the changed bytes. Completion
of this sheet means a reviewed, current-byte implementation work pack exists;
it does not mean any accepted finding is fixed.

Implementation will be a **separate phase after plan review**, with an exact-file
work sheet, selected semantic decisions, dirty-work preservation, and
predicate-specific tests. The user waived the repository governance/ARE workflow
and additional confirmation requests for this work; the read-only review does
not itself fix any target.

## Open Questions

- Which P1 decisions can be derived from existing source contracts, and which
  need a documented design choice before an analyst can specify a concrete patch?
