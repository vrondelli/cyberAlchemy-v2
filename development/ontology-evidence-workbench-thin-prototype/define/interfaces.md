# Interfaces: OEW Thin Prototype

## Internal: EvidenceGateway Interface

**Protocol:** local HTTP on `127.0.0.1`  
**Consumers:** Chromium runner and the existing OEW dashboard

| Route | Maps to | Contract |
| --- | --- | --- |
| `/` | immutable retained Vite dist | query token required on bootstrap; set run-scoped `HttpOnly; SameSite=Strict; Path=/` cookie |
| dashboard assets | immutable retained Vite dist | bootstrap cookie or explicit token required; containment checked |
| `/oew-data/presentation-graph.json?token=…` | admitted adapter graph | explicit token; exact bytes and digest; `credentials: "omit"` compatible |
| `/oew-data/evidence-sidecar.json?token=…` | admitted sidecar | explicit token; exact bytes and digest; `credentials: "omit"` compatible |
| `/oew-data/adapter-receipt.json?token=…` | verified adapter receipt | explicit token; exact bytes and expected receipt digest; `credentials: "omit"` compatible |

All other `/oew-data/*`, traversal, non-GET/HEAD, non-loopback bind, bad token,
or outbound target requests fail closed. Missing or invalid bootstrap
authentication receives HTTP 401/403 and cannot rely on an in-app alert. A
valid bootstrap followed by bundle identity, digest, or schema failure renders
the in-app fail-closed alert and no graph. Responses set
`Referrer-Policy: no-referrer`; durable evidence contains only the token digest.
The cookie intentionally omits `Secure` because this bounded gateway is local
HTTP; the fresh browser context is destroyed at teardown.

## Internal: BrowserWitnessRunner Interface

Input: retained build handle, gateway handle, exact absolute Playwright API
entry/version, Chromium executable path/digest, token, port, and assertion
contract.

Output: one browser-acceptance receipt with assertion results, request log,
console log, browser identity, source/build digests, and teardown proof.

## Runtime ownership

These interfaces are implemented inside the existing
`cyberAlchemy-v2/implementation/ontology-evidence-workbench/` package. This
development package owns only their specification and plan.
