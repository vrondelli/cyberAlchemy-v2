# Shared demonstration implementation

Status: implemented; local browser validation recorded in evidence/explanation-paths-proof.json.
Basis: [presentation research](PRESENTATION-RESEARCH.md).
Objective: make the contribution of ARE visible through concrete task-state changes,
while preserving direct access to all six capabilities.

## Construction order

1. Preserve the scoped capability descriptions and implementation references.
2. Replace the separate story and capability sections with one shared stage.
3. Start at context management; show an explicit action selecting the new invitation
   requirement and expiry checks while saved pricing notes stay outside the window.
4. Add independently resettable term-confirmation, failed-test, and resume moments.
5. Synchronize task selection and capability selection; retain applied state per moment.
6. Verify before/after content, reset, selection mappings, keyboard activation, reduced
   motion, and widths 1440, 331 and 240 pixels. Check existing explanation/docs navigation.

## Boundaries

Current product frontier: a local illustrative landing-page demo, not a live runtime.
Runnable work: the existing Vite prototype and its browser scripts.
Operational prerequisites: none. No model, credentials, deployment, or data retention.
Deferred operational work: a future real trace requires a separately scoped integration.
Owner: existing owner-directed prototype work. Test evidence is not release approval.

## Open Questions

- Does this improve a new reader's understanding versus the previous landing page?
- Which real trace can replace an illustration without overstating supported behavior?
- Should capability selection also deep-link to a stable URL?

The research document owns the proposed comprehension evaluation. Browser assertions
verify interactions; they do not establish user comprehension or engine-quality gains.
