# DomainSpec Language

This project seed is for designing a generic DomainSpec language for writing
contracts, schemas, and iteration records in a form that can be validated.

Craft is one use case and evidence source for this language. It is not the
language boundary. The language should also support Arcanum routes, sigil and
spell contracts, work-pack definitions, refinement outputs, future DomainSpec
systems, and any project that needs explicit, machine-checkable agreement
between intent, structure, behavior, and evolution.

## Starting Point

- Handoff: `DOMAINSPEC-LANGUAGE-HANDOFF.md`
- Context pack: `CONTEXT-PACK.md`
- Source index: `context-index.json`

Recommended first command:

```sh
$invoke define /home/vrondelli/projects/domainspec-core/projects/domainspec-language/DOMAINSPEC-LANGUAGE-HANDOFF.md
```

## Core Distinction

- Contract: the semantic agreement. It names obligations, allowed behavior,
  authority boundaries, lifecycle rules, invariants, gates, and validation
  expectations.
- Schema: the structural representation. It names fields, types, enums,
  references, nesting, required keys, and machine validation shape.
- Iteration: the governed evolution record. It names what changed, why it
  changed, which examples and validations moved, and what remains unresolved.

The first successful language design should keep these three layers separate
while making them easy to compose.
