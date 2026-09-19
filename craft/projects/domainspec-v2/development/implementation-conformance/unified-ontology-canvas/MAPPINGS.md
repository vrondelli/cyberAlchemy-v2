# Presentation Mappings

These are view-local transformations. They do not define canonical ontology
relations.

| Source | Canvas family | Stable ID rule | Band |
| --- | --- | --- | --- |
| `meta_types[]` | `meta-type` | `meta:${meta_type_id}` | Meaning |
| `concept_types[]` | `architecture-type` | `type:${concept_id}` | Realization |
| all loaded profiles | `profile` | `profile:${profile_id}` | Expectation |
| all constraints from loaded profiles | `constraint` | `constraint:${constraint_id}` | Expectation |
| property definitions | `property` | `property:${property_id}` | Expectation |
| supplied elements | `fact-element` | `fact:${element_id}` | Observation |
| supplied relations | `fact-relation` | `fact-relation:${relation_id}` | Observation |
| expected findings | `finding` | `finding:${constraint_id}:${subject_id}:${property_id}` | Explanation |

## Bridge Derivation

| Edge kind | From | To | Derivation |
| --- | --- | --- | --- |
| `candidate-aligns-to` | meta-type | architecture type | exact `architecture_type_id` / reciprocal `canonical_meta_type_ref` agreement |
| `extends` | architecture type | architecture type | exact ontology `extends` field |
| `profile-inherits` | language profile | base profile | exact profile inheritance field |
| `constrains` | profile/constraint | property | exact constraint `property_id` |
| `applies-to` | constraint/property | architecture type | exact subtype-aware `applies_to` evaluation |
| `instance-of` | fact element | architecture type | exact fact `type` field |
| `observed-relation` | fact element | fact element | exact supplied relation endpoints |
| `explains` | finding | fact element/relation | exact finding `subject_id` |
| `checks` | finding | property/constraint | exact finding `property_id` and `constraint_id` |
| `observed-under` | fact element/relation | language projection and unique language profile | facts `projection_id` -> ontology language projection `language` -> unique profile `language` |
| `evaluated-under` | finding | profile | exact evaluation `profile_id` |

If a bridge cannot be derived exactly, the graph preserves a named gap instead
of synthesizing an edge from matching text.

## Evaluation-Context Fields

- Every observation node/relation carries the exact `fixture_projection_id` and
  the derived `fixture_profile_id`. Derivation is allowed only through the exact
  language-projection record and exactly one profile with the same language.
- Every finding carries the exact `evaluation_profile_id` from the expected
  evaluation plus its constraint's independent `constraint_origin_profile_id`.
- A finding attached to a portable base constraint therefore remains evaluated
  under `architecture.typescript-strict`; base origin does not make it Python or
  Rust evidence.
- Profile emphasis may activate a fixture/finding path only when its emphasized
  profile equals the stored fixture/evaluation profile ID.
