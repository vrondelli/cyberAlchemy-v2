# CyberAlchemy Language Project

Status: private candidate Project and Project Space

Project: `CA2-PROJECT-LANGUAGE`

Project Space: `CA2-PROJECT-SPACE-LANGUAGE` at `cyberAlchemy-v2/language/`

Owner: CyberAlchemy v2 Language Project owner

Authority effect: none

## Why This Project Exists

CyberAlchemy expresses the same business meaning in several forms:

- ordinary business speech;
- canonical definitions;
- DomainSpec concepts and relations;
- FormalClaims and proof obligations;
- implementation names and behavior; and
- tests, observations, and evidence.

These forms should stay connected, but they are not identical. This Project
develops the language model and practices needed to preserve meaning while
keeping each representation and owner visible.

## Four Different Objects

The distinctions below are load-bearing.

| Object | ID | Job |
| --- | --- | --- |
| Language Project | `CA2-PROJECT-LANGUAGE` | Keeps goals, owners, evidence, decisions, and lifecycle under one stable identity. |
| Language Project Space | `CA2-PROJECT-SPACE-LANGUAGE` | The current folder that hosts the Project artifacts. Moving the folder does not change the Project identity. |
| Language | `CA2-CAND-LANGUAGE-001` | Candidate meaning for a context-governed system of expressions and interpretation rules. |
| Ubiquitous Language | `CA2-CAND-UBIQUITOUS-LANGUAGE-001` | Candidate Language specialization for one bounded context. |
| Ubiquitous Language Practice | `CA2-DISCIPLINE-UBIQUITOUS-LANGUAGE-PRACTICE` | Candidate recurring Discipline that maintains a language. It does not define the language. |

A glossary can display terms from a Language. An ontology can formally relate
its concepts. A Definition Pack can carry one bounded slice to one consumer.
None of those artifacts is the Language itself or the canonical definition
store.

## First Example

The first language asset is the
[CyberAlchemy Governance Ubiquitous Language](languages/governance-ubiquitous-language.json).
It is bounded to the Governance context.

The first exercise is
[Governance Policy resolution](examples/governance-policy-resolution.json). It
currently examines three expressions:

- `Governance Policy`;
- `Rule Review Recommendation`; and
- `Rule Review Action`.

The exercise is deliberately `in-progress`. `Governance Policy` currently maps
to the DomainSpec `Policy` candidate because it selects a strategy. `Rule Review
Action` currently maps to `Enum`. The owner has not yet decided whether `Rule
Review Recommendation` is an immutable `Value Object` or an identity-bearing
`Entity`.

The unresolved DomainSpec type does not leave the business concept unnamed.
The [meaning registry](meaning-bindings.json) records it as `Recommendation` in
business language, `Rule Review Recommendation` in the Governance domain, and
`Decision Support Output` in product language. The
[realization registry](realization-bindings.json) keeps `Value Object` and
`Entity` as system candidates rather than pretending either is a direct
business translation.

The [edge vocabulary](edge-vocabulary.json) proposes `offers` and `informs`.
Each proposal carries a business sentence, a product consequence, and a witness
that its endpoints must not collapse. The existing `produces` spelling conflict
between product language and DomainSpec DS-D2 remains open.

## Governance Kernel Input Language

The second exercise is
[Governance kernel input language](examples/governance-evaluation-kernel-language.json).
It defines four candidate Governance expressions:

- `Governance Program` — the named, versioned evaluation instructions;
- `Governance Request` — one exact proposed consequence;
- `Governance Fact` — one scoped proposition admitted by a named verifier; and
- `Governance Fact Set` — the bounded facts supplied for one Program and Request.

The same preferred expressions are used across business, Governance-domain, and
product language because the meanings are intended to remain the same. The
[system realization registry](realization-bindings.json) separately maps the
Program to DomainSpec `Entity` and Request, Fact, and Fact Set to `Value Object`.
Those mappings are semantic realizations, not direct translations or runtime
acceptance.

The [authority bindings](authority-bindings.json) make their CyberAlchemy fit
explicit. A Program declares required authority but grants none; a Request
describes an effect but authorizes none; a Fact references evidence or authority
without inheriting it; and a Fact Set is a bounded denominator rather than a
repository snapshot or lifecycle hash.

## Define Integration

Define is the first consumer of this Project. The
[Ubiquitous Language Practice](disciplines/ubiquitous-language-practice.json)
uses Define's existing concept dispositions:

```text
reuse | specialize | propose | open
```

The current integration does not add a `language_ref` field to the Definition
Pack. Instead, each concept keeps its exact source, context, disposition, and
owner. A versioned pack-level language binding may be proposed later only if
the first exercise shows it is necessary.

## Goal

The first Goal is
[Establish Ubiquitous Language as the first Language Project example](goals/ubiquitous-language-first-example.goal.json).
It is active and not proved. Package structure supports only the first two
conditions and part of Define integration. Owner-reviewed concept resolution,
FormalClaim definition closure, and implementation mapping remain open.

## Machine Artifacts

- [Package profile](profile.json)
- [Project record](project.json)
- [Candidate concepts](concepts.json)
- [Meaning bindings](meaning-bindings.json)
- [Candidate edge vocabulary](edge-vocabulary.json)
- [System realization bindings](realization-bindings.json)
- [CyberAlchemy authority bindings](authority-bindings.json)
- [Governance language](languages/governance-ubiquitous-language.json)
- [Ubiquitous Language Practice](disciplines/ubiquitous-language-practice.json)
- [First exercise](examples/governance-policy-resolution.json)
- [Governance kernel exercise](examples/governance-evaluation-kernel-language.json)
- [Business ontology](ontology/language-project.json)
- [Source registry](sources.json)
- [Residue](residue.json)
- [JSON Schema](schemas/language-project.schema.json)
- [Meaning package schema](schemas/meaning-package.schema.json)
- [Validator](scripts/validate.py)
- [Craft ledger](.craft/ledger.yml) and [human view](CRAFT.md)

JSON artifacts are the machine-readable package state. This README explains
them for people and must not redefine their candidate meanings.

## Validate

From the repository root:

```bash
python3 cyberAlchemy-v2/language/scripts/validate.py
python3 cyberAlchemy-v2/language/scripts/validate.py --write-receipt
```

Check-only mode does not write. Receipt mode writes one append-only receipt for
the current material digest. Validation checks closed shapes, source currency,
stable IDs, Project/Goal closure, Project/Project-Space non-collapse, language
and Discipline separation, meaning/realization non-collapse, earned-edge
evidence shape, ontology endpoints and relation signatures, authority ceilings,
Craft surface presence, and visible residue.

## Current Residue

The package is structurally testable, but these meanings and integrations are
not promoted:

- Language and Ubiquitous Language canonical definition review;
- Ubiquitous Language Practice discipline-catalog admission;
- the Governance Policy owner decision;
- canonical review of Governance Program, Request, Fact, and Fact Set;
- the Governance system-runtime ontology, verifier contracts, and Rust realization;
- the `produces` product/DomainSpec edge-vocabulary collision;
- optional Definition Pack language-version binding;
- root repository navigation for the new Project Space; and
- FormalClaim and implementation identity-reuse evidence.

See [residue.json](residue.json) for owner routes and next actions.

## Claim Ceiling

This package creates a private candidate Project, its current Project Space, a
Goal, two language concept candidates, one bounded language asset, one
Discipline candidate, one in-progress policy example, and one owner-reviewed
kernel-input language example. It does not create canonical definitions, admit
a Discipline, accept a Definition Pack, accept a Runtime Contract, prove shared
human understanding, admit a FormalClaim, authorize implementation or
enforcement, publish, or deploy anything.
