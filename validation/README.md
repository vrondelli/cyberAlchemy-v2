# Validation

Status: active boundary
Owner: CyberAlchemy v2 validation route

Validation holds fixtures, harnesses, reports, and evidence snapshots. It
supports promotion but does not redefine the claim being tested.

Initial validation is lightweight: Markdown link checks, definition index sync,
constitution review, and public/private scrub when needed.

## Development Plans

- [Artifact admission validator](development/artifact-admission-validator/WORK-PACK.md) -
  governed Invoke plan for the candidate deterministic adapter to `CAV2-C18`;
  implementation and authority promotion remain separate owner routes.

## Open Questions

### OQ-1. What validator should be built first?

Context: most starter rules are review or hybrid. Recommendation: begin with a
deterministic source-map and local-link check before broader governance
validators. Status: OPEN.
