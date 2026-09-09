# Verified UX/UI Findings and Change Requests

Status: verifier-corrected baseline disposition

`FIX` is a supported request; `KEEP` is bounded positive evidence; `UNEXERCISED` is a required but unobserved cell; `OWNER DECISION` is a product or authority choice. No finding contributes to a universal UX score.

The comparable baseline is bound by [BASELINE-COVERAGE.json](BASELINE-COVERAGE.json) to the unchanged scenario, frozen Body War profile, target/fixture digests, runtime, task/control/state/mode rows, and fresh locators. Every finding below is linked from one or more manifest rows; missing cells remain explicit residue.

## Severity-ordered change requests

### CR-01 — Recover exact relation semantics without color

- **FIX · critical · `hard_gate`.** Current: edge instances omit visible/accessibly named exact predicate, marker/pattern, and adequate named graphical contrast ([C-02](attacks/contrast.md), [R-04](attacks/readability.md), [N-02](attacks/navigation.md)).
- Acceptance: each instance exposes source, exact `sourcePredicate`, source-record direction, target, provenance, and authority ceiling. Projected direction and Path traversal orientation are separately labeled. The same exact predicate has one stable color across every declared scene; `presentationRelation` has one stable pattern; exact text/direction survive without color; required graphics reach `3:1`.
- Impact: contrast—repairs named strokes and makes color redundant; readability—supports exact retell; navigation—gives an actionable relation identity.
- Ceiling/boundary: presentation establishes no semantics, membership, causality, execution, promotion, or authority. Deterministic recovery proves no comprehension. Body War owns predicate vocabulary/mapping; the redundant relation-record contract is reusable.

### CR-02 — Make graph keyboard behavior role-sensitive

- **FIX · critical · `hard_gate`.** Current: 489 stops include 231 inert edges before the first node; focused edges lack focus treatment and Enter action ([C-03](attacks/contrast.md)).
- Acceptance: inert edges leave sequential focus. Actionable edge instances use a documented direct or roving model, show focus in declared color modes, expose exact identity, and perform their declared Enter/Space action on the selected instance.
- Impact: contrast—visible focus; readability—same identity as visual relation; navigation—removes inert burden.
- Ceiling/boundary: activation selects a projected edge instance only. Operability proves no ease/workload/task success. Reusable role-sensitive invariant; roles/actions remain profile data.

### CR-03 — Default to an approved projected context home

- **FIX · high · profile `hard_gate`; hierarchy is `screenshot_review`.** Current: whole 237-node graph is the entry surface, with no portal or explicit full-graph escape ([C-04/C-06](attacks/contrast.md), [R-01](attacks/readability.md), [N-01](attacks/navigation.md)).
- Acceptance: entry contains only the owner-approved projected context set; each portal card enters a projected cluster; full graph requires `Show all loaded graph`.
- Residue: portal activation, Back, selection/direction/focus restoration are UNEXERCISED; density, whitespace and icon treatment need screenshot review.
- Impact: contrast—retain non-color role/state/relation cues; readability—removes miniature all-graph entry; navigation—explicit entrances and escape.
- Ceiling/boundary: clusters/focus scenes are not ontology branches or Bounded Context membership. No orientation/comprehension claim. Body War must resolve four designed contexts versus twelve ontology Bounded Context nodes; the home/portal state contract is reusable.

### CR-04 — Make Path semantically complete under either presentation choice

- **FIX · high · `hard_gate`.** Current: populated results omit complete predicate/direction/provenance; endpoints lack names; activation is unannounced; one Escape trace loses trigger focus ([C-05](attacks/contrast.md), [R-05/R-06](attacks/readability.md), [N-06](attacks/navigation.md)).
- Acceptance: label From/To and result surface; every hop exposes source, exact predicate, source-record direction, projected direction where applicable, traversal orientation, target, and provenance; state non-membership/non-authority; independently assert activation, result, cancel, dismissal, and restoration.
- Residue: comparator versus route-local presentation is OWNER DECISION; reverse traversal and full parity are UNEXERCISED.
- Impact: contrast—semantics survive color; readability—separates route from cluster/branch; navigation—named endpoints/state/recovery.
- Ceiling/boundary: routes establish no membership, causality, execution, promotion, or authority. Structural completeness proves no route comprehension. Presentation choice is project-owned; hop/non-authority contract reusable.

### CR-05 — Correct startup-modal focus management

- **FIX · high · `hard_gate`.** Current: modal is active while focus stays on body; dismissal also leaves body focused ([N-03](attacks/navigation.md)).
- Acceptance: initial focus enters the declared modal target; every dismissal returns the declared graph-entry control with visible focus.
- Impact: identifies active surface and repairs entry/recovery; no readability claim.
- Ceiling/boundary: no semantic effect or usability proof. Reusable modal invariant.

### CR-06 — Repair measured control and boundary contrast

- **FIX · high · `hard_gate`.** Current: named 16px enabled controls are `2.807:1`; named boundary token is below `3:1` ([C-01](attacks/contrast.md)).
- Acceptance: named text reaches `4.5:1`; each named required component boundary reaches `3:1` in every declared applicable state. Record colors, graphical role, state, runtime, and ratio.
- Impact: direct contrast repair; readability/navigation claims remain limited to measured surfaces.
- Ceiling/boundary: ratios do not prove complete visual accessibility. Thresholds reusable; tokens/palette project-owned.

### CR-07 — Remove the unusable freshness instruction

- **FIX · high · profile `hard_gate`.** Current: warning instructs unavailable `/understand` ([R-03](attacks/readability.md)).
- Acceptance: remove dead instruction; retain qualified build/adapter provenance, supported analyzed date, and authority ceiling without claiming freshness.
- Impact: removes a literal unavailable action and preserves bounded provenance.
- Ceiling/boundary: provenance proves no freshness, authority, trust, or correctness. Trust is human study. Body War copy; provenance ceiling reusable.

### CR-08 — Expose exactly one selected mode and owned result

- **FIX · medium · `hard_gate`.** Current: Overview/Learn/Deep Dive expose no programmatic selection ([R-08](attacks/readability.md), [N-04](attacks/navigation.md)).
- Acceptance: chosen pattern announces exactly one selected mode and associates it with a distinctly named result region; selected state is non-color-recoverable.
- Impact: structurally identifies mode/result; meaningful distinction remains human study.
- Ceiling/boundary: mode changes no source semantics/authority. Reusable state contract; mode content project-owned.

### CR-09 — Give disclosures pattern-appropriate ownership and state

- **FIX · medium · `hard_gate`; Escape recovery KEEP.** Current: Filter/Export lack sufficient owned-state semantics while Escape correctly restores focus ([N-05](attacks/navigation.md)).
- Acceptance: choose a disclosure pattern and expose its appropriate state and accessible relationship, labeled ownership, and preserved Close/Escape restoration. `aria-controls` is conditional on the pattern.
- Impact: state survives color; labels identify opened surface; recovery remains deterministic.
- Ceiling/boundary: no ontology effect or discoverability proof. Reusable disclosure contract.

### CR-10 — Identify the artifact as a candidate-local projection

- **FIX · medium · `soft_flag`.** Current: onboarding describes code/codebase instead of the candidate-local business-meaning projection ([R-02](attacks/readability.md)).
- Acceptance: required copy names a candidate-local presentation projection derived from the Body War ontology and states its authority ceiling.
- Impact: aligns literal description and entry-orientation hypothesis; no contrast finding.
- Ceiling/boundary: projection is neither source ontology nor branch and has no authority effect. Retell is human study. Body War copy; artifact-type profile field reusable.

### CR-11 — Make projection counts explicit and owner-select zero-count behavior

- **FIX · medium · `soft_flag`.** Current: 54 filter choices include zero-count generic types without verified count-scope explanation ([R-07](attacks/readability.md)).
- Acceptance: label counts as current-projection counts; owner records whether absent values are hidden, disabled, or retained for coverage. Disabled/absent state does not rely on color.
- Impact: distinguishes projection coverage from source ontology kinds and explains inactive choices.
- Ceiling/boundary: counts do not enumerate/redefine ontology kinds. Preferred density/usefulness is human study. Count semantics reusable; policy project-owned.

### CR-12 — Treat matching mode headings as a soft observation

- **FIX · medium · `soft_flag`.** Current: captured Overview and Deep Dive regions share the statistics heading set ([R-08](attacks/readability.md), [N-04](attacks/navigation.md)).
- Acceptance: owner defines intended purpose and distinct accessible region name; screenshot review compares hierarchy.
- Impact: flags possible duplication without inferring equivalence; distinct names support orientation.
- Ceiling/boundary: modes are presentation only. Meaningful difference/understanding requires human study. Evidence discipline reusable; content project-owned.

## Baseline disposition

| Target | Disposition | Current evidence | Residue |
| --- | --- | --- | --- |
| Exact edge predicate/direction | FIX | Predicate absent visually/accessibly. | Projected/traversal direction; cross-scene matrix |
| Edge keyboard sequence/action | FIX | Inert stops, invisible focus, no Enter action. | Complete keyboard traversal |
| Default projected home/portal | FIX | Whole graph default; portal absent. | Context decision; Back/restoration UNEXERCISED |
| Path semantics/endpoints | FIX | Predicate, directions, provenance, labels incomplete. | Presentation choice; reverse-traversal matrix |
| Startup modal | FIX | Focus stayed on body. | None for stated deterministic assertion |
| Named control contrast | FIX | `2.807:1` text; named boundary below `3:1`. | Other tokens/states not inferred |
| Freshness instruction | FIX | Unavailable `/understand`. | Trust/freshness unproved |
| Mode selection | FIX | No announced selection. | Meaningful distinction human study |
| Filter/Export dismissal | KEEP | Escape restored trigger focus. | Ownership/state still FIX |
| Default-scene edge colors | KEEP | Consistent within captured scene. | Exact mapping and cross-scene stability unproved |
| Reduced motion | KEEP | Captured transitions collapsed. | Complete parity UNEXERCISED |
| Selected authority display | KEEP | `authority:none` exposed. | Does not validate authority correctness |
| Narrow overflow | KEEP | None at 390x844. | Narrow recovery/comprehension UNEXERCISED |
| Theme | PARTIAL | Menu choices and missing exposed trigger state observed. | Theme application, dismissal/restoration and color-mode matrix |
| Search | KEEP | `SuggestedTrack` returned five visible structural candidates. | Empty-state, selection/restoration and human orientation |
| Keyboard help | PARTIAL | Help surface and declared shortcuts observed. | Shortcut behavior, dismissal and restoration matrix |
| Human comprehension/trust/workload | UNEXERCISED | Outside browser ceiling. | Separately authorized human protocol |

## Body War versus reusable boundary

| Body War/project profile owns | Reusable audit core owns |
| --- | --- |
| Context set and four-versus-twelve reconciliation | Clusters are projected scope; portals are entrances; neither creates membership |
| Predicate vocabulary, presentation mapping, palette | Exact predicate keys stable color; presentation relation keys stable pattern; both redundant |
| Path comparator versus route-local presentation | Complete hop semantics and non-authority language either way |
| Onboarding, freshness, provenance and mode copy | Artifact type, provenance ceiling, selected-state contract |
| Portal ordering, density, whitespace, icons | State matrix and screenshot-review classification |
| Zero-count policy | Counts describe current projection, not ontology kinds |
| Human terminology/preference questions | Human-study residue and abstention from proxy claims |
