# Glossary Consistency

- Status: `pass-with-candidate-terms`
- Canonical or package-owned definitions mutated: no
- Candidate terms promoted: no

| Term | Meaning preserved from source | Conflict check |
| --- | --- | --- |
| obligation | deterministic EVF consequence with identity, source anchor, rule type, and canonical parameters | no conflict |
| adapter | thin versioned translation boundary between EVF meaning and factory contracts | candidate local term; not a lifecycle owner |
| factory request | explicit input naming proof nodes and source inputs; exact adapter construction schema owner-gated | no conflict |
| run lock | factory-owned immutable closure over request, nodes, inputs, components, tools, policies, ceilings, and digest | no conflict |
| provider | explicitly registered implementation of `FactoryNodeProviderV1`; solver meaning remains with provider owner | no conflict |
| semantic verdict | provider-owned total solver interpretation represented through the common result seam | no conflict |
| semantic receipt | factory-owned verified semantic record of request/lock, ordered nodes, accounting, ceilings, and authority none | no conflict |
| evidence handle | immutable EVF-owned consumer reference to the exact joined evidence | candidate exact schema remains owner-gated |
| currentness | evidence that the consumed verified factory run and bindings match the exact requested obligation; not inferred from an unrelated receipt | candidate relation, exact handle owner-gated |
| proof accounting | declared/passed positives and declared/killed mutants, optionally with verified proof evidence | no conflict |
| claim ceiling | strongest claim the evidence may support; adapter output takes the narrowest applicable ceiling | no conflict |
| authority effect | always `none` for this evidence path | no conflict |

The design uses “provider below EVF” as a consumption topology, not an ownership hierarchy. It keeps obligation translation, factory lifecycle evidence, and provider semantic verdict as three different meanings.
