# Interrogation Result — Design Review

## Question

Does the selected relation-reference model remain coherent when attacked across
scene composition, static output, digest integrity, migration, and every downstream
consumer?

## Dialectic

- Semantic-owner view: keep SourceGraph as the only semantic owner and reuse exact
  admitted scene bindings in the runtime index.
- Interaction view: keep scene-bound references for Portal, Path, navigation,
  geometry, renderer, inspector, and index; typed failures replace tuple fallback.
- Serialization/accessibility view: keep a detached snapshot, but require endpoint
  labels, exact predicate, source direction, contextual traversal, and nullable cues.
- Migration view: a legacy scene is not authority; migration must compare it with the
  exact SourceGraph and ViewPack before producing new v1.2 evidence.

## Findings accepted

`NF-01` through `NF-04` are accepted. The design has been repaired with an actual
compositional scene schema, reusable reference definitions, self-contained snapshot
fields, normative digest laws, and source-bound migration.

## Findings refuted

- Candidate C does not imply a second facet payload; it names the immutable
  revision/index behavior over the existing SourceRelationBinding objects.
- The bare-Node loader error is not runtime failure evidence.

## Convergence

The repaired model satisfies one semantic owner, self-contained detached output,
revision-bound lookup, typed failure, compatibility without receipt rewriting, and
project-neutral recomposition. It advances to the cross-component toy game.

## Residue

- implementation and repository-owned runner remain future work;
- one authoritative Body War denominator still requires owner selection;
- static-output size budget remains unmeasured;
- no browser or accessibility behavior has been proven.
