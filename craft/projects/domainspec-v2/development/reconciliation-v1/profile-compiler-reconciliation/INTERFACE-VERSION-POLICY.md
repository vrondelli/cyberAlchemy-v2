# Versioned Interface eligibility policy

Date: 2026-09-09. PCR-06 Interface prerequisite. Status: bounded implementation
and verification pass. Authority effect: none. The complete Interface generator
and the full CLI goal are not complete.

## Selected meaning and implementation

The user selected [option A](INTERFACE-DECISION.md): in backward mode, the
provider must have the same major version and be at least the consumer's
required version. Exact mode requires equality. Thus provider `1.2.0` accepts
consumer `1.1.9` and `1.2.0`, but rejects `1.2.1`, `1.3.0` and `2.0.0`.
This is version eligibility, not proof of request/result compatibility.

The closed input contract is `domainspec.interface-version-policy/v1`.
[Definition](interface-version-policy-contract.json) SHA-256:
`15f8132055336ba19d64fb0bee59d8f8bc711600ab1aa159116d5a03d65d6526`.
The ontology scaffold is `../ontology/interface-version-policy-candidate.json`.
Both were authored before the implementation.

Versions contain three canonical nonnegative decimal components, each at most
64 digits, with no leading zeros except `0`. Ranges, prereleases, build labels,
whitespace and coercion are not accepted. Zero-major versions follow the same
explicit comparison rule. String-length and digit ordering avoid floating-point
precision loss. Malformed policies throw `MTCLI_INTERFACE_VERSION_POLICY`;
malformed consumer versions return false. Ordinary accessors, custom prototypes,
hidden fields and symbols are rejected; arbitrary Proxy isolation is not claimed.

- `impl/cli/src/typed-backend/interface-version-policy.ts`: owned frozen decoder
  and pure version eligibility evaluator.
- `impl/cli/src/generation/interface-version-policy-source.ts`: standalone
  native TypeScript emitter with readonly, definition-bound policy metadata.
- `impl/cli/test/generation/interface-version-policy.test.ts`: independent
  ordering oracle, native execution/type controls and compiling mutations.

The old integer CLI source and old factory same-major policy remain unchanged.
There is no implicit integer-to-three-part migration and no old fixture rewrite.
The emitter is a prerequisite for composition, not a public CLI entry point,
transport implementation, server, or class-based abstraction.

## Verification against current bytes

| Check | Result |
| --- | --- |
| Policy, project-model and configuration tests | 26 pass, 0 fail, 0 skip; 3.87 seconds |
| Policy plus static-backend and runtime compatibility | 30 pass, 0 fail, 0 skip; 8.45 seconds |
| Full 32-file shared regression including the policy | 371 pass, 0 fail, 0 skip; 274.07 seconds |
| Independent ordering oracle | 9,522 exact/backward comparisons, including precision and digit-order boundaries |
| Native generated modules | Eight policies strictly compiled with declarations and executed |
| Compiling behavioral mutations | Seven detected: reversed ordering, missing major check, ignored patch, lexical ordering, rejected equality, accepted whitespace, accepted leading zeros |
| Final source typecheck | Pass after temporary dependency-link removal |
| Frozen source checks | 39 catalog rows, 31 relationship signatures, five integration definitions across three languages; pass |

The first focused run exposed an incorrect factory-import path and a
semantically equivalent newline mutation witness; both test defects were
corrected before the reported focused result. An initial wider compatibility
run passed 29 and failed one because the existing B15 harness could not find
its expected `impl/node_modules/.bin/tsc`. A temporary symlink to the existing
locked dependency cache enabled the final 30/30 run. It was then removed;
cached dependencies and user-owned `impl/cli/node_modules` were preserved.
No assertion or skip was weakened to obtain the pass.

The full shared regression above is a distinct checkpoint from the focused
runs; it is not a 39-cell reconciled-generation result. The subsequent Interface
scope inspector has separate focused evidence in
[INTERFACE-MAPPING-SCOPES.md](INTERFACE-MAPPING-SCOPES.md). Previous State Machine
evidence remains a separately identified checkpoint.

## Task-session and continuation

Request: `ds-cli-continuation-20260909-051`; route `CA2-ROUTE-IMPLEMENT`.
Route receipt:
`82e3cfdf0162f497b3a6c75d03a9f1a5de32e1fd951f1761fdbfbd322cdb943f`.
Context result:
`80d9dd88ec94cd0bbb74d8b38b0e0634f09b1015514c8590267e5d6844611ec0`.
Ten-file effect assessment:
`8b22c518a6e9c141583e0d7d433638be1763fbe3b420839077116bbc3b29e416`.
The assessment was structurally admissible and consequential; it adds no
authority beyond the user's exact construction authorization.

The version-policy decision is resolved. Next: reconcile typed Interface
signatures, canonical exposure closure and explicit public/domain Mapping
bindings, then construct and independently verify structural TypeScript
generation. Workflow's separate DEC-08 choice and PCR-07..14 remain outstanding.
No admission, release, default cutover or AlchLang reconciliation occurred.
