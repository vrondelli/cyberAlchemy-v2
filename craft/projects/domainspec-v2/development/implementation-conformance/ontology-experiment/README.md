# Architecture Property Ontology Experiment

Status: current ontology read-model over a candidate architecture-property model; non-authoritative

Date: 2026-07-31

New to ontologies? Start with [A Beginner's Guide to the Architecture
Ontology](BEGINNER-GUIDE.md). It explains the model through one concrete Rule,
shows how to navigate the canvas, and separates canonical meaning, candidate
architecture, observed evidence, and enforcement.

## Purpose

Test whether the implementation-conformance package can load an ontology and
use it to understand an architecture's properties.

In this model, the ontology answers:

1. Which DomainSpec meta-types exist, and which are active, candidate,
   deferred, or superseded?
2. Which exact TypeScript, Python, and Rust realizations belong to the current
   owner-admitted implementation baseline?
3. What kind of architecture element is this?
4. Which properties and relations are valid for that kind?
5. Which constraints does the selected architecture profile place on them?
6. How does TypeScript, Python, or Rust project source into those properties?
7. Which expected and observed values disagree?

This supersedes the first version of the experiment, which centered the
business/system evidence bridge. That was a useful boundary analysis, but it
was not the ontology-driven architecture model requested.

## Execution Model

```text
canonical DS-D1 registry
  24 staged meta-types + superseded Saga tombstone
          |
          v
non-authoritative meta-type projection
  baseline @3 + 13 backend mappings + 39 exact realization rows
          |
          v
architecture ontology
  concept types + property definitions + relation definitions + operators
          |
          v
architecture profile
  portable constraints + language-specific constraints
          |
          v
language projection
  code/AST/module graph -> observed typed property graph
          |
          v
constraint evaluator
  expected property vs observed property -> explainable finding
```

The evaluator does not hardcode “Rule files use arrows” as package logic. It
loads that assertion from the selected TypeScript profile:

```json
{
  "applies_to": ["architecture.RuleImplementation"],
  "property_id": "callable.form",
  "operator": "equals",
  "expected": "arrow-function"
}
```

Python instead expects `function-definition`; Rust expects `function-item`.
The portable profile knows only that a Rule has one exact binding, one primary
callable, and boolean return semantics.

## Artifacts

| Artifact | Purpose |
| --- | --- |
| [BEGINNER-GUIDE.md](BEGINNER-GUIDE.md) | Detailed plain-language source: end-to-end Rule example, canvas tour, authority boundaries, FAQs, and safe extension path. |
| [BEGINNER-GUIDE.html](BEGINNER-GUIDE.html) | Dependency-free browser reader that renders the beginner guide beside the interactive canvas. |
| [architecture-ontology-view.html](architecture-ontology-view.html) | Meaning-first pan/zoom canvas with click-open Explore, Body War lifecycle, and Details drawers over one graph. |
| [implementation-architecture-types.html](implementation-architecture-types.html) | Guided canvas that projects Financial Settlement business, DomainSpec, proof-bridge, and system nodes from the candidate ontology. Part 7 now includes an ontology-owned six-stage promise-to-proof lifecycle plus its four-lane, four-step semantic box tour. |
| [implementation-architecture-types-model.mjs](implementation-architecture-types-model.mjs) | Deterministic source-derived projection for the minimal implementation-type view. |
| [financial-settlement-proof-lifecycle-model.mjs](financial-settlement-proof-lifecycle-model.mjs) | Validates and deep-freezes the candidate business-system bridge ontology, including lifecycle stage closure, planned-versus-current evidence, Rule architecture properties, cross-branch evidence, semantic tour order and membership, forbidden manufactured links, views, gaps, drift, and proof state. |
| [business-ontology-obligation-scene-model.mjs](business-ontology-obligation-scene-model.mjs) | Resolves the guided business-meaning → Obligation → graph-planes scene and derives the Part 7 tour from typed ontology identities rather than scene-authored tour data. |
| [examples/financial-settlement-proof-lifecycle.ontology.json](examples/financial-settlement-proof-lifecycle.ontology.json) | Candidate `business-system-bridge` ontology with 62 typed nodes, 155 typed edges, and four views. Its 41-node promise-to-proof view separates one business promise, seven proof concerns, eight evidence strategies, Rule and Operation architecture contracts, handwritten code, an unissued receipt, four evidence gaps, and two drift findings. Markdown is not used as node identity. |
| [examples/financial-settlement-business-to-obligation.scene.json](examples/financial-settlement-business-to-obligation.scene.json) | Presentation sequence for eleven Financial Settlement stages. It selects the ontology graph and semantic tour views but does not own tour meaning, order, lanes, or targets; the legacy Markdown anchor remains only as provenance for the 79-obligation constellation. |
| [validate-implementation-architecture-types.mjs](validate-implementation-architecture-types.mjs) | Model, negative-control, browser, interaction, and responsive checks for the minimal view. |
| [examples/body-war-suggested-track-lifecycle.scene.json](examples/body-war-suggested-track-lifecycle.scene.json) | Twelve-step, source-bound walkthrough of the real Body War `SuggestedTrackStatus` vocabulary and `NewSuggestionNeedsEvidence` Rule. |
| [domain-meta-types.projection.json](domain-meta-types.projection.json) | Digest-bound, non-authoritative DS-D1 inventory, canonical baseline binding, 13 backend mappings, and 39 exact realization rows. |
| [ontology.json](ontology.json) | Architecture types, 99 property definitions, 18 typed relations, operators, language projections, the current baseline binding, and the still-separate historical example-instance lifecycle. |
| [ONTOLOGY-MAP.md](ONTOLOGY-MAP.md) | Human-readable architecture meta-model. |
| [PROPERTY-EVALUATION-MODEL.md](PROPERTY-EVALUATION-MODEL.md) | How the package queries and evaluates ontology properties. |
| [profiles/base-domain.profile.json](profiles/base-domain.profile.json) | Portable constraints shared by all languages. |
| [profiles/typescript-strict.profile.json](profiles/typescript-strict.profile.json) | TypeScript placement, export, arrow, and direct-edge properties. |
| [profiles/python-strict.profile.json](profiles/python-strict.profile.json) | Python module, callable, naming, and direct-edge properties. |
| [profiles/rust-strict.profile.json](profiles/rust-strict.profile.json) | Rust module, callable, visibility, and direct-edge properties. |
| [examples/typescript-observed-facts.json](examples/typescript-observed-facts.json) | Example fact graph containing conforming and violating architecture elements. |
| [examples/typescript-evaluation.expected.json](examples/typescript-evaluation.expected.json) | Expected deterministic findings. |
| [validate-ontology.mjs](validate-ontology.mjs) | Dependency-free ontology validator and sample evaluator. |
| [validate-w3-effects-connections.mjs](validate-w3-effects-connections.mjs) | Validates the four W3 ontology types, 30 type-specific properties, typed relations, reciprocal projection, 12 language protocols/provider digests, and four exact descriptor joins. |
| [validate-w4-orchestration-lifecycle.mjs](validate-w4-orchestration-lifecycle.mjs) | Validates candidate State Machine and Workflow types, 16 type-specific properties, five graph relations, six language protocols/provider digests, and two exact descriptor joins. |
| [TRACEABILITY-AND-DRIFT.md](TRACEABILITY-AND-DRIFT.md) | Remaining design blind spots. |
| [VALIDATION-REPORT.md](VALIDATION-REPORT.md) | Executed test receipt. |

### Why the Part 7 tour is semantic

The scene stores only `ontology_tour_view_id: financial-settlement.box-tour`.
The ontology itself owns a `projection.SemanticTour`, four ordered
`projection.TourStep` nodes, four `projection.ViewLane` nodes, the 20 visible
box memberships, and every highlighted concept. Each visible box also owns a
`reasoning_sentence` explaining what inference the reader may make from it and
where that inference must stop. Each tour step owns three structured
`from → relation → to` integration sentences. The model derives the three
representative-pair edges, three supported-path edges, and two missing-link
edges by finding existing
proof-to-code edges between the highlighted nodes. No tour step can invent an
edge, and there is still no direct `P4 -> FS-POST-001` identity.

This makes the tour and its integration narrative reusable semantic data rather
than explanatory JavaScript. The active tour lists three sentences explaining
how its highlighted subjects integrate. Eleven statements resolve to typed
ontology edges; the final missing-by-design statement is required to resolve to
no edge. Individual box dialogs continue to show the node-owned reasoning
sentence. The browser is
one projection of that data. Passing browser checks prove that
the projection is operable and faithful; they do not prove that a reader
understood it.

## Demonstrated Result

The evaluator loaded the composed TypeScript profile, evaluated 12 constraints
as 30 assertions, and produced exactly eight expected findings for the broken
`LegacyLimitRule` and its non-direct dependency. The conforming Rule and
Operation passed their applicable assertions.

The meta-type projection also preserves all 24 staged DS-D1 labels and the
superseded Saga tombstone. Every one of the 13 active backend types is aligned
to the current canonical implementation baseline and has one exact TypeScript,
Python, and Rust realization, for 39 rows total. Candidate and deferred UI
labels remain visible without becoming active or entering the first CLI surface.

The six historical domain example implementation instances remain
`not-admitted`; the baseline does not create instance-level PromotionRecords.
Target instantiation and conformance remain unimplemented. The next product
frontier is the closed DomainSpec input decoder (`SWU-MTCLI-002`), followed by
selection, planning, guarded atomic writes, receipts, target observers, and
clean-root replay/package evidence.

This is an executable ontology test over supplied example facts and an exact
projection of admitted implementation evidence. It is not yet a generated-target
observer: the example observed graph is hand-authored, and no target project can
yet receive or prove the exact selected realization through the planned CLI.

## Body War Lifecycle Scene

Open the canvas and choose **Body War lifecycle**. The right-hand drawer walks
through twelve mechanisms without replacing the graph:

1. the real five-value `SuggestedTrackStatus` feature contract;
2. the missing complete DomainSpec Enum node;
3. the generic ontology/profile authority split;
4. TypeScript profile selection;
5. `ArchitectureRealizationSpec` projection;
6. proposed `defineEnum({...} as const)` generation;
7. the current `body-war.NewSuggestionNeedsEvidence` Rule;
8. Rule realization projection;
9. proposed one-file arrow Rule and direct Operation import;
10. independent source observation;
11. ontology-derived negative controls and conformance evaluation; and
12. digest-bound evidence, drift routing, and the external owner gate.

The scene deliberately distinguishes current Body War artifacts from proposed
generated artifacts. It exposes the complete Enum definition as a real blocker
instead of treating the current TypeScript union and PostgreSQL enum as proof of
one ontology-to-code pipeline. Its final step preserves the current bridge
boundary: `authority_effect: none` and `release_admission: not-granted`.
