# Minimal repair proposal: explicit postimage content kinds

## Problem

The accepted EVF candidate has nine exact postimages. Eight are JSON and one is the required JavaScript validator. The canonical preacceptance manifest requires lifecycle JSON-pointer assertions for every postimage, and `preacceptance_closure.py` calls `load_json` for every postimage. The ninth target therefore cannot enter the immutable closure graph even though its exact digest, UTF-8 hygiene, staged execution, deterministic repeat, and hostile tests pass.

## Proposed option A

Extend `finalPostimage` with required `content_kind`:

- `json-object`: preserve the current behavior. Require one or more lifecycle assertions, parse the postimage as a JSON object, and evaluate every assertion.
- `opaque-text`: require an empty lifecycle-assertion array. Validate exact path/digest/size, UTF-8 and repository hygiene, but do not JSON-parse the postimage. Semantic behavior remains the responsibility of the exact declared consumer rehearsal.

Add focused regressions that:

1. preserve existing JSON postimage behavior;
2. admit a digest-bound UTF-8 `.mjs` postimage with `content_kind: opaque-text` and no JSON assertions;
3. reject an unknown or missing content kind;
4. reject JSON assertions on opaque text;
5. reject invalid JSON labeled `json-object`;
6. preserve two-run determinism and request-emission gating.

The historical stage order, exact consumer identities, one-request budget, write partitions, owner/review/adoption gates, and requested target bytes do not change.

## Excluded construction

JSON-wrapping the JavaScript is not a repair. It changes the accepted target bytes and requires a new decoder/materializer that is absent from the Work Pack and preacceptance graph.

## Authority ceiling

This proposal does not alter canonical Arcanum bytes, freeze the EVF graph, emit an owner request, authorize Task Session, apply the EVF candidate, publish, deploy, or reopen D06. Canonical repair requires the Arcanum governance owner's exact selection of option A.
