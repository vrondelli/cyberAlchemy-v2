# Attestation L1 — specimen + discriminating verify (RESULTS)

**Boundary (cite-results-withhold-mechanism):** this file shows verification *results*. The
*mechanism* (canon rule, hash construction, serialization) lives in `../../attest.py` —
INTERNAL/private; never copy to public `arcanum/`. **L2 external signature is NOT built** (deferred-moat).

## Specimen
Attestation over a real cav2 decision record:
- act: `decision / 2026-06-24-saturn-domainspec-public-disclosure`
- actor: `cav2-authority-owner` · canon_version: `attest.canon.v1`
- seal: `a2dff76befb0339a102d252350788d9e0c2973ddc7ae88fdf8edb517dd8eff93`
- artifact: [`attestation.json`](./attestation.json)

## Discriminating self-test (run via `python3 attest.py verify <artifact> <claimed>`)
| arm | claimed state | verdict | shows |
|---|---|---|---|
| A1 (positive) | the untampered decision record | **valid** | sound on the real state |
| A1b (control) | + trailing whitespace only | **valid** | canon does real work — cosmetic ≠ tampering |
| **A2 (negative — load-bearing)** | one *content* character flipped | **tampered** | the verifier distinguishes — NOT vacuous |
| A3 (control) | attestation's own stored hash swapped | **tampered** | the seal also catches attestation tampering |

## Verdict
**PASS — `verify` is non-vacuous and sound.** Both arms of the load-bearing test hold
(`valid` on untampered, `tampered` on a content mutation); plus canon-meaningfulness (A1b) and
attestation-integrity (A3). `verify` is decidable + total, recomputes from the claimed state, and
its `valid` condition is defined independently of `attest` (inherits the kernel's sound-verifier
discipline). claim ≤ proof: **L1 integrity-seal demonstrated; L2 external signature intended-not-shipped.**
