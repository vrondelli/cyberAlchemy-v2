# Paper Validation Receipt

> **Superseded 2026-08-07.** This receipt describes an intermediate full-paper
> rewrite that was reverted at the user's direction. The current paper restores
> the original bytes and adds research detail through a controlling §10. Use
> `PRESERVATION-ADDENDUM-VALIDATION.md` for current validation evidence.

## Result

PASS for the bounded local edit and browser-validation contract.

This receipt does not authorize or evidence commit, push, publication,
deployment, promotion, release, production use, accessibility conformance, or
independent reproduction.

## Identity

- Public Arcanum checkout commit before the edit:
  `a5c8bc5c010711721063e258ee92559f02dfc504`.
- Pre-edit `docs/paper.html` SHA-256:
  `cb430f8d5f15c917fef70fae5e0e7fc1ee3533cfb2d7f6bc044c26d473620e73`.
- Edited `docs/paper.html` SHA-256:
  `6d75e8684abfacf2d64db37c245502d3a2ff834cbdb2138233b3660bf348dde6`.
- Scope: `arcanum/docs/paper.html` only. Pre-existing unrelated Arcanum
  working-tree changes were not modified.

## Static Validation

- Python 3 standard-library `HTMLParser`: PASS.
- Local file and fragment resolution: 32 checked, 0 missing before the favicon
  addition; the final favicon points to the same existing SVG asset.
- Private-path lint: PASS; no private repository path or internal research path
  appears in the public HTML.
- Required claim-boundary phrases: 12 of 12 present.
- External link inventory: 11 link instances.
- `git -C arcanum diff --check -- docs/paper.html`: PASS.
- Stale authorship and `DomainSpec is open-source` wording: absent.

## Managed Preview

- Mode: `open`.
- Root policy: containing directory.
- Host: `127.0.0.1`.
- URL: `http://127.0.0.1:43015/paper.html`.
- Server: started, then reused after the responsive repair.
- Final HTTP status: 200.
- Content type: `text/html; charset=utf-8`.
- Served SHA-256:
  `6d75e8684abfacf2d64db37c245502d3a2ff834cbdb2138233b3660bf348dde6`.
- Exact served-byte equality: PASS.
- Server remains running until an explicit stop request.

## Browser Validation

- Playwright: `1.59.1`.
- Chromium executable:
  `/home/vrondelli/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome`.
- Desktop viewport: 1440 × 1000.
- Mobile viewport: 390 × 844.
- Expected title and H1: PASS on both viewports.
- Main sections: 11; tables: 4.
- Horizontal overflow: absent on both viewports after the long-digest wrap
  repair.
- Console errors: 0 after adding the existing SVG as the favicon.
- Page exceptions: 0.
- Failed requests: 0.
- HTTP responses at or above 400: 0.
- Mobile navigation opens, reports `aria-expanded=true`, follows the selected
  primary-navigation link, then closes and reports `aria-expanded=false`.
- Screenshots were inspected at desktop and mobile sizes; no acceptance-critical
  visual defect was observed.

## Claim And Authority Boundary

The edited paper carries the approved public-safe thesis and explicitly keeps
the following unestablished: positive output determinism, semantic and
implementation completeness, independent replication, general conformance,
theorem-backed governance behavior, release readiness, and operational fitness.
It identifies Arcanum as the public source-available artifact, DomainSpec as
private, and Saturn as unshipped.
