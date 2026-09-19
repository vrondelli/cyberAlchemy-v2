# DomainSpec Language Category Contract Research Strategy

## Purpose

Map what DomainSpec Core and Arcanum already provide for a generic DomainSpec
language, then refine a first language model before implementing a parser.

The working hypothesis is that the language can start as a small
category-theory-oriented contract language:

- objects: contracts, schemas, rules, examples, validators, lifecycle states,
  taxonomies, handoffs, work packs, and iteration records
- morphisms: implements, validates, refines, projects, composes, gates,
  promotes, blocks, supersedes, and hands off
- composition: a contract can require schemas and validators; a schema can bind
  examples; an iteration record can transform one versioned artifact state into
  another; a taxonomy can type the objects and morphisms
- identity: every artifact keeps a stable owner, authority boundary, lifecycle
  state, and validation surface

This framing is exploratory until every formal term maps to concrete
repository evidence.

## Dispatch Artifact

Route:
`projects/domainspec-language/research/domainspec-language-category-contract-research.dispatch.json`

Validation:

```bash
python3 arcanum/formulae/dispatch-spec/scripts/validate-dispatch.py \
  projects/domainspec-language/research/domainspec-language-category-contract-research.dispatch.json \
  --json
```

Result: `pass` with no blocks or flags.

## Research Lanes

1. DomainSpec Core evidence
   - contracts, taxonomies, relationships, constitutions, templates, validators
   - likely roots: `implementation/domainspec/`, `docs/`, project-local
     `domainspec/` folders

2. Arcanum capability evidence
   - sigils, spells, formulae, invoke, refine, task-session, dispatch-spec,
     inventory, ontology, glossary, governance packages
   - likely roots: `arcanum/arcana/`, `arcanum/spells/`,
     `arcanum/formulae/`, `arcanum/framework/`

3. Contract/schema/ledger evidence
   - Craft interface and interaction contracts
   - dispatch-spec schema and validator
   - invoke handoff and task-session work-pack surfaces
   - example fixtures and validation notes

4. Formal model critique
   - keep useful category vocabulary
   - reject formal terms that do not clarify validation, composition,
     authority, or traceability
   - preserve contract/schema/iteration separation

## First Design Questions

- What are the minimum document kinds?
- How do contracts refer to schemas, examples, validators, and iteration
  records?
- Which morphisms are essential for the first useful language?
- Which lifecycle states are primitive versus derived?
- Is the first syntax YAML-first, DSL-first, or dual-surface?
- What validates semantics versus structure?
- What makes a language artifact promotable from candidate to canonical?

## Guardrails

- Do not implement a parser before the design package and decision gate exist.
- Do not make Craft the canonical scope.
- Do not collapse semantic contracts into structural schemas.
- Do not promote Inventory, Ontology, glossary, sigil, spell, or language
  knowledge from research receipts alone.
- Do not use category theory vocabulary unless it maps to concrete DomainSpec
  or Arcanum artifacts.

## Next Route

Run the validated dispatch route as a research pass. Subagent fanout is
recommended but remains permission-gated in the dispatch artifact. The parent
route should synthesize the lanes into:

- reusable evidence inventory
- category contract model frame
- DomainSpec/Arcanum taxonomy crosswalk
- language design package outline
- syntax and authority decision record
- first fixture validation plan
- implementation work-pack handoff
