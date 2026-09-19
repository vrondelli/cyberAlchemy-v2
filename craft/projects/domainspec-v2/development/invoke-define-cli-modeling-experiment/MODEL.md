# Invoke Define CLI Domain Model

## Feature Boundary

The feature is the artifact-producing part of one deterministic Invoke Define
invocation. It begins with semantic-context materialization and ends with an
independent bundle-admission receipt. The boundary is a private projection of
WIR-WP-001 / SWU-WIR-006, not a second lifecycle plan.

## Selected-Profile Mapping

| CLI concern | DomainSpec kind | Model |
| --- | --- | --- |
| Stage eligibility | Rule | one rule per artifact-producing stage |
| Five artifact-producing stages | Operation | one operation per stage |
| Stage outputs | Event | one past-fact event per stage |

The positive graph uses only enforces and produces. It intentionally omits an
Entity because neither the semantic-context request nor the source request has
an authored identity. Derived context_id and source_id outputs do not justify
inventing an identity-bearing request entity.

## Active Stage Mapping

| CLI stage | Operation | Event |
| --- | --- | --- |
| semantic-context | AuthorSemanticContext | SemanticContextAuthored |
| semantic-closure | ProduceSemanticClosure | SemanticClosureProduced |
| source | AuthorDefineSource | DefineSourceAuthored |
| bundle | ProduceDefineBundle | DefineBundleProduced |
| admission | AdmitDefineBundle | DefineBundleAdmitted |
| status | not modeled | Query is unsupported by the selected profile |

## Known Expressivity Boundary

The current profile can state that a rule gates each artifact-producing
operation and that the operation produces an event. It cannot structurally
encode:

- the total order between the six stages;
- the exact prior receipt required by each later stage;
- read-only describe, check, or status behavior as Query nodes;
- the CLI boundary as an Interface;
- the stage/admission digest equality needed by status;
- separate artifact-authored, registry-released, and runtime-ready axes.

The source-shortcut hostile fixture is therefore expected to compile even
though its rule intentionally permits source authoring without current,
independent ready-for-define closure. That result is a deliberate flag and the
first experiment's central finding.
