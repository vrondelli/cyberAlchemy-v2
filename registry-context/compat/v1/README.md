# Registry Context

Status: candidate package
Visibility: private
Package owner: CyberAlchemy v2 product owner
Authority effect: none

Registry Context gives one consumer a bounded, source-current view of records
and explicit bindings from several existing registries. It exists so Define or
another CyberAlchemy capability can ask, "Which product, thesis, Project, Goal,
Language, definitions, bindings, and unresolved differences apply to this work
right now?" without loading every registry or inventing missing relationships.

The machine-readable package is the primary candidate model. This README is a
human navigation view.

## Core Meaning

```text
Registry Context Request
  + exact registry selections
  + intended consumer and purpose
  + selection-currency and binding policies
    -> Registry Context resolution
    -> Registry Context View
         digest-bound selected content + explicit bindings + source epoch
         + visible residue
```

A Registry Context View is a projection. It does not copy source authority,
promote a definition, accept a Product Thesis, decide a Project or Goal state,
choose an open Language realization, or authorize work.

## Registry, Binding, Ledger, Selection, And View

- A **registry** makes typed records addressable. This package does not define
  generic `registry` as a new canonical primitive.
- A **binding** is an explicit typed relationship with named endpoints and
  evidence. Registry membership alone is not a binding.
- An **append-only event ledger** records what happened over time. A Registry
  Context View is a bounded projection, not an event history.
- A **source selection** identifies the exact JSON value, ID-selected record, or
  Markdown section relied upon and binds its digest.
- A **Registry Context View** carries the exact selected content and selection
  digest for every source-epoch entry, plus explicit bindings for one declared
  consumer and purpose. A consumer does not need to reopen upstream sources to
  recover the selected meaning. Stale, missing, ambiguous, conflicting, open,
  or owner-unresolved material remains visible as residue.

## Selection Currency

The candidate contract uses selection-level currency:

- a changed selected value blocks the view;
- a changed whole file with the selected value unchanged is diagnostic;
- no missing or ambiguous record may be inferred from a nearby label;
- only explicit source-backed bindings may enter the resolved binding set.

This is the generalized continuation of the selector-bound Definition Snapshot
idea. It retains each owning source instead of creating a second authority
source inside this package.

## Current Example

[`examples/define-context-request.json`](examples/define-context-request.json)
requests the Product, Product Thesis, Define Project and Goal, Define capability,
Language context sources, and the canonical definitions needed to interpret
their relationships.

[`examples/define-context-view.json`](examples/define-context-view.json) is the
deterministic candidate result. It deliberately preserves open Language
realization and unresolved runtime ownership as residue.

## Validate

Check without writing:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/product/registry-context/scripts/validate.py
```

Run hostile mutations:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/product/registry-context/tests/test_negative_mutations.py
```

Materialize one append-only validation receipt explicitly:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/product/registry-context/scripts/validate.py --write-receipt
```

## Claim Ceiling

This package establishes candidate Registry Context business meaning, a
candidate request/view contract, a source-selection algorithm, and a
business-system bridge. It does not establish a canonical definition, accepted
runtime contract, runtime implementation, source mutation, owner decision,
Product Thesis acceptance, Project or Goal transition, CLI or chat integration,
publication, release, deployment, or external effect.
