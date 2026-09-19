# KELD + ARE security completion audit

Date: 2026-09-18. Route: `CA2-ROUTE-IMPLEMENT`. Authority effect: none.
Source requirement: [SECURITY-REVIEW-HANDOFF.md](SECURITY-REVIEW-HANDOFF.md).

## Conclusion

Every locally executable source, package, image, browser, and synthetic-runtime
obligation in the handoff has current passing evidence. The full public-release
objective is **not complete** because the remaining requirements are owner
decisions or execution against the real target environment and provider control
planes. Local validation does not grant those effects.

## Deliverables

| Requirement | Evidence | Audit result |
| --- | --- | --- |
| Threat model and surface inventory | [Findings](PUBLIC-CHAT-SECURITY-FINDINGS.md#threat-model-and-completed-surface-inventory) | Proven for reviewed local sources; remote VPS and provider control planes excluded explicitly |
| Findings with severity, prerequisites, impact, remediation, and regression evidence | [Findings F-01 through F-11](PUBLIC-CHAT-SECURITY-FINDINGS.md#findings) | Proven |
| Dependency-ordered implementation plan | [Implementation DAG](PUBLIC-CHAT-SECURITY-IMPLEMENTATION-DAG.md#dependency-dag) | Proven |
| Pass/fail/blocked matrix and exact artifacts | [Boundary matrix](PUBLIC-CHAT-SECURITY-FINDINGS.md#boundary-matrix) and [exact artifacts](PUBLIC-CHAT-SECURITY-FINDINGS.md#exact-artifacts-and-validation) | Proven |
| Durable unresolved-question ownership | Findings and DAG Open Questions sections | Proven |

## Target architecture requirements

| Handoff requirement | Current evidence | State |
| --- | --- | --- |
| 1. Standalone immutable chat closure | 93-file package manifest and closure verifier; no executor, secret provider, tool runtime, or generic agent implementation | PASS locally |
| 2. Separate unprivileged runtime | Non-root, read-only, all capabilities dropped, bounded resources, custom seccomp active on all four exact images | PASS locally; target runtime acceptance pending |
| 3. Secret outside the visitor path | Chat and broker have no secret; gateway alone receives the dedicated UID 65532/mode 0400 file; broker read probe denied | PASS locally; real rotation pending |
| 4. Independently enforced egress | Chat and broker lack external networks; gateway fixes host, port, path, TLS name, DNS answers, actual connection, and rejects private/metadata/reserved ranges and redirects | PASS locally; target firewall/runtime acceptance pending |
| 5. No tools or fallback execution | Closed package and response protocol; executable response variants, extra fields, alternate roles, and tool calls fail closed | PASS |
| 6. Inert untrusted rendering | Firefox proof preserves hostile user/model strings as exact text with no executable nodes or external requests | PASS locally |
| 7. Minimal isolated state | Capability-separated memory state, cross-session denial, reset/rotation/cancellation tests; configured idle expiry; missing/invalid production retention blocks startup; deployment preflight enforces canonical bounded input | PASS technically; owner retention value and provider-handling policy pending |
| 8. Deployment-wide abuse limits | Durable broker concurrency/call/token/hourly-cost/monthly-cost reservations and durable webhook admission survive restart; absent monetary configuration blocks broker startup; deployment preflight rejects malformed/out-of-range values without printing them | PASS technically; access identity and owner-approved ceiling/provider-rate values pending |

## Required negative-test matrix

| Boundary | Strongest current proof | State |
| --- | --- | --- |
| Model output to execution | Static closure plus adversarial protocol fixtures and runtime child-process denial | PASS |
| Runtime containment | Network/metadata/secret/write denials; fixed gateway; custom seccomp `ptrace` and `process_vm_readv` return `EPERM` | PASS locally; production acceptance pending |
| Secret isolation | No chat/broker mount; gateway-only metadata verification; zero-value-exposure evidence | PASS locally; real rotation pending |
| Conversation ownership | Cross-session read/reset denial, rotated capabilities, active-turn reset/cancellation, bounded history, and exact-boundary idle expiry | PASS locally; owner duration pending |
| Untrusted rendering | Exact-image Firefox DOM/network/console proof | PASS locally |
| Abuse and resources | Durable call/concurrency/token/hourly-cost/monthly-cost reservations and webhook gates; explicit temporary anonymous-public edge mode; broker startup fails without monetary configuration; chat startup fails without retention configuration | PARTIAL: source/abuse identity, numeric ceiling/provider-rate values, and idle-retention value still need owner decisions |
| Authentication and commerce | 91/91 synthetic integration tests | PASS synthetic; real OIDC and merchant sandbox acceptance pending |
| Webhooks and recovery | Signature, replay, merchant/amount, durable inbox, lease, archive, and recovery tests | PASS synthetic; genuine provider delivery pending |
| Downloads | Ownership, grant, path, hash, stream, corruption, and cancellation tests | PASS synthetic |
| Operations | Integrated synthetic KELD+ARE full stack and merchant-free infrastructure smoke | PASS locally; BLOCKED remotely: deployment, public TLS, ports, rotation, restore, rollback, incident response, and coexistence pending |

## Scanner and artifact audit

| Evidence family | Scope and result |
| --- | --- |
| Trivy 0.74.0 | Four ARE and three custom KELD images: zero fixable High/Critical; source secret scan zero; three detected deployment Dockerfiles zero High/Critical misconfigurations. Keycloak raw: one Critical/one High; exact-topology OpenVEX-adjusted: zero, owner disposition pending. Compose behavior is covered separately by config validation and the integrated runtime smoke because this Trivy scanner does not report it as a detected config target. |
| Semgrep CE 1.177.0 | Community `p/default`: 193 ARE targets, 466 authored-source targets, and 469 unfiltered source targets, approximately 100% parsed, zero findings and zero parse errors. The owner-selected `/are/` route replaced all six generated loopback links before this scan. A focused deployment-file rerun also reports zero findings at approximately 100% parsed. Initial ambiguous patterns were structurally removed without suppression. |
| npm audit | ARE and KELD dependency locks: zero vulnerabilities in the recorded runs. |
| Browser | Rebuilt-image Firefox hostile-markup proof: exact text, zero created script/image/link/SVG nodes, zero execution globals, external requests, or console issues; 5,400 status seconds displays as 90 minutes. |
| Runtime | Four healthy exact ARE containers; non-root/read-only/capability drop; egress, metadata, secret, and syscall denial receipts; configured retention surfaced as a synthetic 1,800-second fixture. The integrated KELD+ARE smoke additionally passes the enforced production-input dependency, public-readiness denial, exact `/are/` routing, legacy/sibling separation, private network membership and absence of backend host ports using a separate synthetic 300-second value. The five-check infrastructure cold start remains independent of ARE and merchant inputs. Neither run invokes the model. |
| Production inputs | 7/7 preflight tests, real one-shot valid/invalid probes, and the integrated smoke pass. Mutable/malformed images, duplicate role-image digests, non-canonical/out-of-range numbers, and value disclosure fail closed. Every ARE service directly requires successful completion of the hardened, networkless preflight during ordinary Compose startup. Actual image digests and policy values remain owner inputs. |
| Reproducibility | [KELD evidence checksums](../evidence/security-review-2026-09-18/CHECKSUMS.sha256) and [ARE evidence checksums](../are-documentation/.runtime/security-evidence/CHECKSUMS.sha256) validate. |

## Remaining completion gates

1. Product owner has selected temporary **anonymous public** chat access. The
   remaining product decisions are the deployment-wide address/abuse key;
   hourly and monthly monetary ceiling values plus verified provider rates; the idle-retention value; provider-side handling;
   failure UX; and a review trigger for the temporary access mode.
   The public [Z.ai model API page](https://z.ai/model-api) currently offers
   usage bundles/contact-sales pricing rather than an exact GLM-5.3-Flash
   input/output token rate. Do not derive the enforcement rate from promotional
   token bundles; obtain it from the billing contract/account actually used.
2. Product/operator owner selected the root-relative `/are/` route. Generated
   prototype HTML, the ARE static base, API paths, hardened edge allowlist, and
   local browser/runtime evidence now agree on that prefix. The KELD Caddy and
   Compose candidate is integrated and passes its synthetic full-stack smoke;
   exact registry digests and owner values must pass the local preflight; target-host acceptance and deployment
   still require the operator.
3. Security owner accepts the exact-digest
   [Keycloak OpenVEX assessment](KEYCLOAK-26.7.4-VEX-ASSESSMENT.md) or selects a
   clean supported replacement.
4. Operator authorizes the target environment and accepts the exact images,
   public TLS/ports, gateway egress, seccomp architecture/runtime behavior,
   secret rotation, backup/restore, rollback, incident response, and coexistence.
5. Merchant and identity owners execute real OIDC-browser and sandbox-provider
   checkout/webhook acceptance without granting chat commerce privileges.

## Open Questions

The remaining gates above require owner input or external-state execution.
No local prompt, test, scanner, VEX statement, or route receipt can answer or
authorize them.
