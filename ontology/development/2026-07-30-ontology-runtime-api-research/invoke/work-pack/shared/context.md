# Shared Planning Context

## Objective

Implement only the accepted private fixture v0 after owner gates.

## Source anchors

- [SPEC.md](../../SPEC.md): ownership, capabilities, concepts, non-goals
- [ARCHITECTURE-BUNDLE.md](../../ARCHITECTURE-BUNDLE.md): components and
  deterministic snapshot scenario
- [OPERATIONS.md](../../OPERATIONS.md): ordered algorithms
- [INTERFACES.md](../../INTERFACES.md): HTTP/adapter boundary
- [`../../../../findings.md`](../../../../findings.md): accepted schemas,
  errors, caps, security, tests, and claim ceiling
- [DESIGN-SELECTION-RESULT.json](../../DESIGN-SELECTION-RESULT.json): exact
  selected Design concerns

## Constraints

Private path, loopback only, logical IDs only, create-only runtime store,
source-preserving, zero outbound, exact native-result wrapper, same-adapter
byte/local-ID diff only, draft bytes only, authority none.

## Candidate Root

`cyberAlchemy-v2/implementation/ontology-runtime/` is inactive until the
implementation owner ratifies it. Context Builder must treat this as a blocker,
not an admitted write scope, before execution.

