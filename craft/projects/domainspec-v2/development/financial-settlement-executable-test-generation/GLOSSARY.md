# Glossary

| Term | Meaning In This Work |
| --- | --- |
| behavioral obligation | Existing document-derived expectation such as a calculation, transition, workflow step, postcondition, or contract. It may require an implementation binding or human-authored oracle. |
| structural obligation | BTE expectation about a declared kind, formation criterion, node instance, relationship family, or edge instance. |
| complete generation | Exact test membership for the declared source projection. It does not mean all generated tests pass. |
| declared subset | The non-empty backend kinds and relationships actually declared by one feature, each still constrained by the development profile's allowed sets. |
| feature projector | Deterministic adapter from the feature `SPEC.md` registry/graph plus linked aspect evidence to `DevelopmentProject`. |
| formation evidence | Source-anchored facts used to construct a node body, such as fields, equality, state change, query read-only status, states, workflow steps, or mapping direction. |
| instance conformance | Re-evaluation of a particular node's complete formation or a particular edge's relationship contract. |
| structural red | A generated executable test that fails because the source is incomplete or invalid. It is successful generation evidence, not a passing feature claim. |
| coverage gap | Existing behavioral obligation without a non-circular executable oracle. It remains an explicit `it.skip` in the hybrid emitter. |
| complete-profile mode | Existing development BTE mode requiring all 13 backend kinds and all 16 relationship families. |
| declared-subset mode | New mode requiring exact non-empty membership for only the kinds and families declared by the projected feature. |
