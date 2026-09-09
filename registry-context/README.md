# Registry Context

Status: candidate first vertical
Visibility: private
Product: CyberAlchemy v2
Project: `CA2-PROJECT-REGISTRY-CONTEXT`
First Vertical Goal Context: `CA2-CONTEXT-REGISTRY-CONTEXT-FIRST-VERTICAL`
Authority effect: none

Registry Context lets an agent or capability ask for one named CyberAlchemy
Context and receive one exact, current, bounded View of it. It keeps product,
Project, Goal, owner, source, and language meaning connected without asking the
consumer to rediscover the whole repository.

## Why It Is At The CyberAlchemy-v2 Root

Registry Context is shared product infrastructure. Define is its first intended
consumer, but Language, Project, Goal, and later CyberAlchemy capabilities can
use the same contract. Putting it under `product/` would make a reusable product
capability look like product documentation. Putting it under Define would make
one consumer appear to own it.

The folder does not create a Project or Context. Those identities are explicit:

- Project: `../goals/projects/registry-context/project.json`
- Goal: `../goals/projects/registry-context/goals/registry-context-first-vertical.goal.json`
- Context: `../context/contexts/registry-context-first-vertical.context.json`

The first vertical's Goal Context frames the work of building Registry Context. It is not the
same object as a Registry Context View produced by the runtime.

## Smallest Runtime

```text
named Context + expected Context digest + registered selection IDs
    -> resolve read-only
    -> deterministic immutable View, or fail closed
```

The first runtime is a local JSON CLI. It has no socket, daemon, network,
database, cache, container, event ledger, or arbitrary repository-path input.
Those mechanisms may be evaluated later only if a real consumer requires them.

Run the example:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/registry-context/scripts/registry_context_cli.py resolve --request cyberAlchemy-v2/registry-context/examples/registry-context-project.request.json
```

Validate package, determinism, schema instances, and hostile cases:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/registry-context/scripts/validate.py
```

## Compatibility

The former v1 candidate is preserved byte-for-byte under `compat/v1/`.
`migration.json` records the move and the non-equivalence between its broad
Define-oriented request and this Context-first v2 contract.

## Claim Ceiling

This package establishes candidate product and business meaning, one
development-profile DomainSpec graph, and one deterministic local read-only
prototype. It does not establish DomainSpec release admission, canonical
Registry Context definition promotion, runtime adoption, production security,
interactive CLI/chat behavior, publication, deployment, or external effect.
