# Authority Boundary

Authority is deliberately secondary in this corrected experiment. CAV2 is used
to make the architecture ontology safe and challengeable, not to make authority
the ontology's primary subject.

| Artifact | Role | Allowed use | Blocked use |
| --- | --- | --- | --- |
| `ontology.json` | candidate architecture meta-model | define local types, properties, relations, and operators | canonical DomainSpec or CAV2 vocabulary |
| `profiles/*.json` | candidate expected architecture | configure evaluation | admission, promotion, or universal architecture claim |
| observed fact graph | digest-bound projection | describe what an adapter observed | semantic identity or source authority |
| evaluation findings | evidence | explain property mismatches | owner decision, release, or production verdict |
| CAV2 node/relation/projection models | candidate modeling patterns | structure identity, challenges, edges, projections, and collapse guards | concrete architecture property source |

The architecture property owner chooses what `callable.form` means and which
profiles may constrain it. The TypeScript adapter owns how that property is
observed. The evaluator owns only typed comparison. A passing comparison has
`authority_effect: none`.
