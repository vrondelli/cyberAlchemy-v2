# Verified UX/UI Attack Ledger

Status: verifier-corrected review deliverable

This ledger indexes the fresh contrast, readability, and navigation attacks. Browser observations establish measured or structural behavior only. They do not establish comprehension, trust, complete accessibility, ontology validity, promotion, release, or production readiness. No aggregate UX score is warranted.

## Consolidated evidence

| ID | Sources | Surviving observation | Disposition and verifier boundary |
| --- | --- | --- | --- |
| A-01 | C-02, R-04, N-02 | 231 edges omitted visible exact predicate, markers, and patterns; accessible names omitted predicate; named strokes failed captured contrast checks. | FIX critical `hard_gate`. Every edge instance exposes endpoints, exact `sourcePredicate`, and source-record direction. Projected and traversal directions are separate. Predicate color and `presentationRelation` pattern are redundant; cross-scene stability remains unproven. |
| A-02 | C-03 | 489 focus stops included 231 inert edges before the first node; focused edges had no visible focus and Enter did nothing. | FIX critical `hard_gate`. Remove inert edges from sequential focus; actionable edge instances get visible focus and role-appropriate keyboard action. |
| A-03 | C-04, C-06, R-01, N-01 | Entry rendered `ALL / 17 layers`, 237 nodes and 231 edges at scale `0.157981`; no bounded home, portal, or explicit full-graph escape. | FIX high profile `hard_gate`. Context clusters are owner-approved projected scope; portal cards enter them. Neither creates ontology branches or Bounded Context membership. Portal/Back recovery is unexercised. |
| A-04 | C-05, R-05, R-06, N-06 | Path outputs omitted complete predicates, direction boundaries, and provenance; endpoint selects lacked names; state and one Escape restoration trace failed. | FIX high `hard_gate`. Comparator versus route-local presentation is owner-decided; either exposes complete hop semantics, separate source/projected/traversal direction, non-authority language, and deterministic recovery. |
| A-05 | N-03 | Startup modal declared modality while focus stayed on body, including after dismissal. | FIX high `hard_gate`. Move initial focus inside and restore the declared graph-entry control. |
| A-06 | C-01 | Enabled 16px Overview, Deep Dive, and Semantic controls measured `2.807:1`; named boundary token was below `3:1`. | FIX high `hard_gate`, scoped to named tokens/states. Require `4.5:1` text and `3:1` required component boundaries. |
| A-07 | R-03 | Prominent warning instructed unavailable `/understand`, beside qualified Overview provenance. | FIX high profile `hard_gate`. Remove the dead instruction and retain qualified build/adapter provenance without claiming freshness, authority, trust, or correctness. |
| A-08 | R-08, N-04 | Modes lacked programmatic selected state; Overview and Deep Dive shared captured statistics headings. | FIX medium. Selected state/owned region is `hard_gate`; heading duplication is `soft_flag`; meaningful distinction remains human study. |
| A-09 | N-05 | Filter/Export restored trigger focus on Escape but lacked sufficient exposed state and owned-surface semantics. | FIX medium `hard_gate` with recovery KEEP. Use a pattern-appropriate accessible relationship; `aria-controls` is not universal. |
| A-10 | R-02 | Onboarding called the artifact extracted code/a codebase while Overview described a candidate-local business-meaning graph. | FIX medium `soft_flag`. Name a candidate-local presentation projection derived from the ontology, not the source ontology or a branch. |
| A-11 | R-07 | Filter exposed 54 choices including zero-count values while only Claim and Source were loaded. | FIX medium `soft_flag`. Counts describe the projection; zero-count treatment is owner-selected and may legitimately communicate coverage. |

Detailed evidence: [contrast](attacks/contrast.md), [readability](attacks/readability.md), [navigation](attacks/navigation.md). Independent corrections: [proxy](verifications/proxy.md), [semantic](verifications/semantic.md).

## Bounded positives

- KEEP: same computed color within the captured default scene for 72 `builds_on` and 159 `related` edges; cross-scene stability is unproven.
- KEEP: reduced-motion transitions collapsed; top-level controls had visible cyan focus; selected detail exposed `authority:none`; 390x844 had no document-level horizontal overflow.
- KEEP: Filter/Export Escape recovery restored trigger focus; no captured console errors or failed requests.
- KEEP: cards retained adjacent `CLAIM`/`SOURCE` text; selected SuggestedTrack retained authority, candidate status, summary, and source file. Preserve these if icons are added.

## Coverage residue

Portal/Back restoration, approved context composition, complete keyboard traversal, Path recovery across states, narrow recovery, complete grayscale/forced-colors matrices, cross-scene relation encoding, reverse traversal, and every human comprehension/trust/workload/preference claim remain unexercised—not passes or observed failures. Fresh follow-up evidence classifies Theme as partial, search reachability as KEEP, and keyboard help as partial; theme application, search/help dismissal and restoration, and their complete behavior matrices remain residue ([coverage witness](runs/20260731T184158Z/baseline/missing-controls.json)).
