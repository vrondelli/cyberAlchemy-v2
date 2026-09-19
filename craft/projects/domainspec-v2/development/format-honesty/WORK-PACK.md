# WP-FMT-001 — Format honesty and generated meta-type cards

**Status: non-executed plan. No unit selected. No byte changed.**

- Work pack id: `WP-FMT-001`
- Origin: refine run `20260819T000000Z-serialization-format-normalization`
- Route: R5 (operator-authored), repaired into four layers
- Authority effect: none
- Hard dependency: **`WP-SMO-001` G1 apply must land or be explicitly re-frozen before L2.**

## Why this exists

Two defects of the same class were found on 2026-08-19:

1. A validator mis-derived a meta-type count because `.yml` did not predict the parser.
2. Eight of thirteen meta-type cards disagree with the live relationship authority, three
   asserting relationships that do not exist.

Both are hand-maintained copies of derived facts. This pack removes the copies.

## Layer L0 — truth checks (no byte changes)

| SWU | Delivers | Acceptance |
| --- | --- | --- |
| `SWU-FMT-001` | `check:format-honesty` — every file's parser matches its extension | runs **red** naming exactly the 49 JSON-in-`.yml` files; green on a fixture where names are honest |
| `SWU-FMT-002` | `check:derived-fact-agreement` — every card's edge lists equal the authority projection | runs **red** naming exactly the 8 drifted cards and the 3 false claims; rejects a seeded wrong edge |
| `SWU-FMT-003` | `check:generated-view-fresh` — scaffold only; asserts nothing until L3 exists | passes vacuously; proves the harness wires up |

L0 changes no repository content. Its value is that every later layer is verified by a check
that was red before the fix and green after.

## Layer L1 — factual corrections

| SWU | Delivers | Acceptance |
| --- | --- | --- |
| `SWU-FMT-004` | correct the 3 false claims (`calculation.md` ×2, `rule.md`, `enum.md`) | each correction reviewed individually; `check:derived-fact-agreement` moves from red to green for those cards |
| `SWU-FMT-005` | correct the 5 incomplete cards (`event`, `interface`, `state-machine`, `query`, `mapping`) | check green for all 13 cards |

Corrections land while cards are hand-written, so the diff is readable prose, not generator
output. **Requires human review per card — three of these are factual claims about the
system, not formatting.**

## Layer L2 — format honesty

| SWU | Delivers | Acceptance |
| --- | --- | --- |
| `SWU-FMT-006` | re-pin transaction plan: every one of the 391 pin sites classified and assigned | no pin site unclassified; oracle-class sites carry a named discrimination proof |
| `SWU-FMT-007` | rename the 49 JSON-in-`.yml` files to `.json`, updating all references | `check:format-honesty` green; all pins resolve; no dangling reference |
| `SWU-FMT-008` | convert population B (comment-free real YAML) to JSON | check green; excluded: 33 comment-bearing files (L3 handles them), 3 tool-owned, 176 experiment records |
| `SWU-FMT-009` | oracle-pin discrimination proof | for each of the 25 oracle/derived fixtures, the negative controls still **fail** after regeneration |

`SWU-FMT-009` is the unit that prevents "regenerate until it passes" from disarming the
conformance corpus.

**After L2 the operator's original request is satisfied.** L3 is optional.

## Layer L3 — generated human view

| SWU | Delivers | Acceptance |
| --- | --- | --- |
| `SWU-FMT-010` | decide Q1 (embedded doc block vs sibling `*.doc.json`) and Q2 (how much authored prose the JSON holds) | owner decision recorded before any generator exists |
| `SWU-FMT-011` | doc fields populated from today's comments **and** today's card prose | round-trip: every line of every current card is either a field value or explicitly marked as dropped-by-approval |
| `SWU-FMT-012` | the card generator; edge participation derived from relationship authority | generated card is byte-identical to the reviewed target for all 13 |
| `SWU-FMT-013` | generator negative controls | seeded wrong edge list, seeded missing field, seeded hand-edit of a generated file — each rejected |
| `SWU-FMT-014` | `check:generated-view-fresh` becomes real | regenerate-and-diff is clean; hand-editing a generated card fails the build |

`SWU-FMT-011`'s round-trip proof is the guard against "generation" quietly producing a
thinner card than the one it replaced.

## Explicitly excluded

| Excluded | Why |
| --- | --- |
| 176 `ui-meta-type-formalization` experiment records | operator instruction: note that the experiments worked; do not rewrite their provenance |
| `.craft/ledger.yml` | named source-of-truth by the Craft storage contract; converting it is a contract amendment |
| `pnpm-lock.yaml`, `pnpm-workspace.yaml` | owned by the package manager |
| any criterion's semantic meaning | shape stays shape; the engine moat is untouched |

## Sequencing

```
L0 (no dependency)  ->  L1  ->  L3
                     \-> L2 -/
L2 blocked until WP-SMO-001 G1 applies or is explicitly re-frozen.
```

L0 and L1 can start immediately — they need no Arcanum, no Task Session admission, and do
not touch any file staged in the frozen package.

## Stop conditions

Stop and return to the owner if: any pin site cannot be classified; any oracle fixture stops
discriminating after regeneration; the round-trip proof shows unapproved prose loss; or
`WP-SMO-001` G1 changes any file in L2's scope.
