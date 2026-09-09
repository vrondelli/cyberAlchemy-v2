# Interfaces

## Input CLI

```text
oew adapt --run <verified-run-directory> --output <new-adapter-run>
oew verify --adapter-run <adapter-run-directory>
oew serve --adapter-run <adapter-run-directory> [--port <loopback-port>]
```

The concrete command names are plan-level intent, not implemented commands.

## Bundle Input

Required existing artifacts:

- `result.v1.json`
- `projection.v1.json`
- `digest-map.v1.json`
- `terminal-receipt.json`

The existing prototype verifier remains the admission gate.

## Adapter Output

```text
generated/runs/<oew-run-id>/
  presentation-graph.json
  evidence-sidecar.json
  adapter-receipt.json
```

## Viewer Boundary

The L0 compatibility proof targets the pinned Understand-Anything read-only
viewer contract. L1 may add OEW-specific endpoints for `evidence-sidecar.json`
and `adapter-receipt.json`; all endpoints remain GET/HEAD-only, token-gated,
loopback-bound, and path-contained.

## Compatibility Boundary

- Upstream pin:
  `Egonex-AI/Understand-Anything@2cda14e89535049e49120198886bc0b82e9e630f`
- License: MIT, to be retained with any vendored or adapted source.
- Upstream graph types are presentation vocabulary only.
- Any patch stack must be isolated under the OEW implementation root and
  validated against the pin.

## Forbidden Interfaces

- mutation APIs;
- promotion/admission buttons;
- arbitrary filesystem browsing;
- outbound model/provider calls in the L0 viewer;
- automatic whole-repository analysis;
- write-back to `.ua/`, candidate runs, Poker Team, IOLM, authority, or Craft.

## Open Questions

See [SPEC.md](SPEC.md#open-questions).
