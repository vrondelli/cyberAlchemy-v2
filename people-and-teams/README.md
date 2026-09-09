# CyberAlchemy v2 People and Teams

Status: candidate
Ontology ID: `cav2.people-and-teams.business`
Ontology type: `business-domain`
Branch: `business`
Visibility: private
Authority effect: none

People and Teams gives CyberAlchemy first-class meaning for a human `Person`
and a purpose-bound `Team`. It keeps identity separate from accounts, roles,
memberships, responsibilities, permissions, ownership, and authority.

The package owns 21 business nodes, 13 relation types, 26 relation instances,
8 candidate obligations, and 6 explicit residue records. The JSON files are the
package state; this README is a derived human navigation view.

## Core Meaning

```text
Person -- participates through --> Team Membership -- binds --> Team
Team Membership -- may assign --> Team Role
Team Role -- may carry --> Responsibility

membership != role != responsibility != ownership != authority
account != Person
current members != Team identity
```

`Person` and `Team` are canonical CyberAlchemy definitions (`CAV2-D68` and
`CAV2-D69`). `Team Membership`, `Team Role`, and `Responsibility` are local
candidate terms owned here. Their reuse elsewhere does not make them canonical.

## Product Thesis

CyberAlchemy needs stable, privacy-minimizing human and collective identities
so work can move across Products, Projects, Goals, Contexts, and sessions
without turning logins into people or access groups into teams. Explicit
membership and responsibility make collaboration legible while separate
authority records preserve human control.

## Current Boundary

This package contains product meaning, a Product Capability candidate, a
business ontology, obligations, sources, schemas, validation, and residue. It
contains no Person or Team instances, personal data, DomainSpec v2 source,
compiled graph, system ontology, runtime, identity verification,
authentication, authorization, publication, release, deployment, or external
effect.

Validate from the repository root:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/people-and-teams/scripts/validate.py
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/people-and-teams/tests/test_negative_mutations.py
```
