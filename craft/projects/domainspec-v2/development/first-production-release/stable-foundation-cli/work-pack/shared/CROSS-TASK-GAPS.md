# Cross-task prerequisites and gaps

| ID | First affected SWU | Gap | Required owner/evidence | Failure effect |
| --- | --- | --- | --- | --- |
| SFC-PR-001 | 004 | no current owner-ratified P2 registry receipt | profile owner exact receipt | block profile acceptance; do not mutate registry |
| SFC-PR-002 | 009 | exact locked build-script allowlist not reviewed | build/security owner receipt | block supported build migration |
| SFC-PR-003 | 014 | benchmark corpus/runner evidence absent | validation/performance owner | block resource claim |
| SFC-PR-004 | 019 | operator/support/verifier identities late-bound | release owner manifest inputs | block pilot/readiness closure |
| SFC-PR-005 | outside WP | release authorization absent | DomainSpec-v2 Owners | stop before tag/release/publication/deployment |

These are typed future prerequisites, not unresolved product choices. A Task
Session may implement fail-closed readers or fixtures before an owner receipt
exists, but it cannot mark the corresponding acceptance boundary pass using a
self-issued substitute.

