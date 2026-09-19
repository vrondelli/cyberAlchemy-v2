# Auth EVF round 02

Round 02 closes the two independent branches made ready by `AUTH-EVF-01`:

```text
                         R2-00 exact preflight
                                  |
                   +--------------+--------------+
                   |                             |
          executable provider              Auth theorem
          R2-10 -> R2-11                   R2-20 -> R2-21
             |         |                              |
             +-> R2-12 +                              v
                   |                                R2-22
                   v                                  |
                 R2-13 -------------------------------+
                                  |
                                  v
                         R2-30 readiness join
                                  |
                                  v
                  AUTH-EVF-04 remains separate
```

## Product frontier

- `AUTH-EVF-02`: replace the pinned raw-Cargo structural route with a canonical EVF JSON provider, implement all six scoped mutations, prove one authorization-state evaluation epoch is observed, and emit independently verified content-addressed observations.
- `AUTH-EVF-03`: create the Auth-specific theorem instance and `FormalClaimLeanBinding` against exact Auth source-graph and Rust-projection digests. The foundation reference theorem is a provider fixture, not Auth proof.

The branches may proceed independently after the common rehash preflight. They join only after each has a current independently verified receipt. That join proves readiness to begin `AUTH-EVF-04`; it does not freeze or approve an Auth product candidate.

## Decisions before implementation

The implementation owner must resolve two existing residues at `R2-10`:

1. Either implement a database-enforced read-only SQLite transaction capability or narrow the product wording to the behavior actually enforced.
2. Either replace `saturating_add` for epoch identifiers or bind a tested lifetime constraint that makes identity reuse unreachable.

Changed acceptance-bound bytes invalidate the current epoch and stop both branches until a new exact input decision is recorded.

## Validation boundary

Round 02 must reject malformed provider output, extra JSON fields, crashes, truncated output, wrong-cause mutant deaths, stale PASS receipts, wrong-domain theorem inputs, foundation-theorem reuse, and stale Rust projections. A generic Cargo failure is never a successful mutation result.

Operational enforcement, activation, cutover, rollback, publication, release, and deployment remain deferred to the protected human-owned `AUTH-EVF-05` decision. This plan grants none of those effects and grants no implementation authority by itself.
