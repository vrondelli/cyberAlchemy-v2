# EVF Postimage Authoring Patch Proposal

## Current result

No canonical or staged postimage patch is proposed yet. The requested set is
not closed under the current material-package contract: two of the proposed
outputs are the package being validated and the receipt generated from its
digest.

## Blocked target subset

- `work-pack/MATERIAL-PACKAGE.candidate-a.json`
- `work-pack/MATERIAL-PACKAGE.candidate-a.producer-receipt.json`

Their topology determines the denominators and evidence paths in the other 23
planning postimages. Authoring those 23 first would create acceptance-bound
bytes against an unresolved package model and likely force immediate rework.

## Candidate repairs

1. **Two-envelope model:** preserve 36 canonical writes by validating 34
   substantive outputs in an inner package, then carrying its package and
   receipt as two payloads in a run-local 36-target outer envelope.
2. **Run-local evidence model:** remove package and receipt from canonical
   targets, leaving a conventional 34-target package and a target-35 audit
   receipt.

The public-schema-extension route is rejected as out of scope. Defer and stop
remain available. Exact target postimages will be authored only after the
owner selects a topology.

## Preserved boundaries

- 26/26 declared planning preconditions still match.
- 11/11 owner-material canonical targets remain absent.
- 11/11 owner-material postimages still match declared digests and sizes.
- No canonical target, implementation file, Arcanum source, Git state,
  publication, or deployment was changed.
