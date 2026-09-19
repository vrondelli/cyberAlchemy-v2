# Corrected Ontology Validation Report

Date: 2026-07-31

Ontology verdict: `pass`

Sample architecture verdict: `fail` as expected

## What Passed

| Check | Result |
| --- | --- |
| canonical DS-D1 projection IDs | 25 unique: 24 staged + 1 superseded tombstone |
| canonical DS-D1 maturity | 13 active, 9 candidate, 2 deferred, 1 superseded |
| active DS-D1 coverage | 13 explicit dispositions |
| reciprocal candidate alignments | 5 exact pairs |
| architecture concept IDs | 12 unique |
| property definition IDs | 17 unique |
| relation definition IDs | 4 unique |
| generic constraint operators | 4 unique |
| language projection IDs | 3 unique |
| bound source digests | 7 current |
| CAV2-derived node contracts | complete for all concepts |
| concept inheritance | resolved |
| property applicability | resolved to valid node/relation types |
| relation endpoints, effects, and cycle policies | valid |
| profiles | portable + TypeScript + Python + Rust composed and validated |
| profile-qualified constraints | 42 unique across resolved profiles |
| TypeScript example assertions | 30 evaluated |
| expected TypeScript findings | exactly 8 reproduced |
| authority effect | `none` for ontology, profiles, facts, and evaluation |

All seven digest-bound sources are present in the committed tree. The two
experiment-owned design contracts resolve to `ONTOLOGY-MAP.md` and
`PROPERTY-EVALUATION-MODEL.md`; validation does not depend on adjacent
uncommitted design drafts.

The sample `fail` is the successful test outcome: the evaluator detected the
intentionally broken Rule's placement, binding, cardinality, naming, export,
callable-form, and dependency-directness properties while accepting the
conforming elements.

## Executed Command

```bash
node --check projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-ontology.mjs
node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-ontology.mjs
```

The initial corrected run exposed a profile-parent path-resolution bug. The
resolver was fixed to resolve extension paths relative to the experiment, and
the complete validation then passed. This correction is implementation rework,
not evidence against the ontology model.

## Claim Ceiling

This proves that a generic evaluator can verify the digest-bound canonical
DS-D1 projection, require an explicit coverage disposition for every active
meta-type, load the candidate architecture ontology, compose architecture
profiles, understand typed properties through inheritance, and produce
deterministic findings over a supplied observed fact graph.

It does not prove that real source code can yet be projected into those facts.
No native TypeScript, Python, Rust, architecture-provider, compiler, or runtime
adapter was executed.

## Interactive HTML Canvas

`architecture-ontology-view.html` was served from its containing directory
through the managed loopback preview server. Exact target bytes matched the
HTTP response.

Chromium browser validation passed for:

- loading the live meta-type projection, ontology, four profiles, observed
  facts, and evaluation;
- all five lenses: DomainSpec meta-types, architecture types, profile
  properties, observed facts, and violations;
- meta-type maturity filters: 13 active, 11 UI candidate/deferred, 24 staged,
  and 1 superseded tombstone;
- exact meta-type inspection with maturity, criterion, implementation coverage,
  owner route, review trigger, and authority boundary;
- plain-language meaning rendered for all 13 active meta-types and inside every
  architecture, profile, fact, and finding node (12, 13, 3, and 10
  respectively), with exact contracts preserved in the click-open Details
  drawer;
- Explore hidden by default, opened by click or `N`, and closed after choosing
  a lens; Details hidden by default, opened by a node click, and explicitly
  closable;
- canvas zoom, pan, fit, and draggable node positions;
- TypeScript/Python/Rust profile switching;
- node and finding inspection;
- text search and navigator filtering;
- 24 staged meta-type, 17 property, and 8 finding metric bindings;
- no intersecting type-node boxes at the validated 1440 by 900 viewport;
- zero browser console errors and zero failed requests.

## Beginner Explanation Addendum

The experiment now includes `BEGINNER-GUIDE.md` as its detailed text source and
`BEGINNER-GUIDE.html` as a dependency-free browser reader. The guide uses one
Rule example to separate canonical semantic type, candidate implementation
type, profile expectation, supplied observation, evaluation finding, and
external owner action.

A bounded read-only novice review identified and corrected three material
risks:

- canvas wording that implied a real adapter had already inspected code now
  says that the facts are hand-authored examples in the shape a future adapter
  should emit;
- canonical maturity, implementation coverage, and evaluation outcome are
  explained as three independent status systems;
- the guide explicitly preserves all 24 staged labels, the Saga tombstone, and
  the non-mapping between deferred `DS-D1.24 Adapter` and
  `architecture.AdapterImplementation`.

Live Chromium validation at 1440 by 900 passed for:

- the canvas Help modal's plain-language ontology model and visible guide link;
- Help modal containment within the viewport;
- the Observed facts lens's hand-authored-fixture boundary;
- HTTP 200 loading of the browser reader and its Markdown source;
- rendering 16 guide sections, five tables, 17 jump-menu choices, and the
  canonical DS-D1 registry link;
- zero browser console errors and zero failed requests.

The explanation transport remains `flag`, not `pass`, under the Whisper
contract: its structure and browser delivery are verified, but no representative
human reader has yet confirmed comprehension. The text and canvas remain
candidate explanatory surfaces with `authority_effect: none`.

This establishes local rendering and interaction for the supplied candidate
data. The meaning-first copy and DS-D1 projection have `authority_effect: none`
and do not change canonical meta-type identity or maturity. This does not
establish accessibility acceptance, remote deployment, or general product
readiness. It also does not establish that the beginner explanation succeeds
for its intended audience until a human comprehension review is recorded.
