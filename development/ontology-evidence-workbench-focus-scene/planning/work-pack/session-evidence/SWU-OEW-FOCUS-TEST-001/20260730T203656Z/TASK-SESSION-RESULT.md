# Task Session result — SWU-OEW-FOCUS-TEST-001

Result: **PASS**

The bounded automated A/B test ran against the accepted immutable Body War
preview in a fresh Playwright 1.59.1 Chromium context at 1440×1000.

## Proven

- Baseline: 237 rendered nodes, 231 rendered edges, Start Tour visible.
- Focus: the exact four business-context nodes, zero internal edges, and six
  deterministic labeled portals.
- Literal portal: `related` presentation over source relation `owns`, forward
  direction, evidence present, and authority effect `none`.
- Pointer, Enter, and Space reach the same observable pivot state.
- Back restores a non-empty source focus containing Identity and Consent.
- No outbound requests, failed responses, console errors, or page errors.
- Page, context, browser, and gateway closed; the loopback port was released.
- The three 1440×1000 PNGs were visually inspected and hashed.

## Still pending

The three-person novice comparison has not been run. The protocol remains
explicitly pending and contains no simulated observations.

Visual inspection also found two things the human test should watch: the portal
panel covers part of the lower canvas at 1440×1000, and the accepted build shows
a graph-freshness warning.

## Evidence

- Automated result:
  `cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/BODY-WAR-ONTOLOGY-FOCUS-AB-001/20260730T203656Z/result.json`
- Captures: `baseline.png`, `focus-scene.png`, and `portal-pivot.png` beside the
  automated result.
- Validation: `validation.json`
- Human protocol: `NOVICE-TEST.md`
- Terminal receipt: `receipt.json`

No successor is selected. This pass proves one local automated A/B evidence
run; it does not prove improved comprehension, accessibility, ontology
promotion, release, deployment, or production readiness.
