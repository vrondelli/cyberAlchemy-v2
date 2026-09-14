# Auth Foundation author completion

Status: PASS; independent replay in progress. Authority effect: none.

The fresh isolated Auth transfer epoch produced candidate
`3ed9cbef5a9e0eaec5158ed04c8c18221cb756b52ed49756cf5925cf1a41d9d3`.
It passed 64 Rust tests, all 48 product obligations, all six behavioral
mutants, both thirteen-stage EVF routes, all twelve hostile controls and ten
evidence regression tests.

The first run also found a real evidence-pipeline counterexample. The mutation
runner copied unrelated `.runtime` directories containing Unix sockets and
dangling links, so it crashed before producing the mutation denominator. The
failure was preserved, the isolated runner was repaired to exclude ephemeral
runtime state from both inventory and copying, a regression test was added,
and the complete run then passed.

The exact author boundary is
`../domainspec-core/projects/auth-foundation/development/auth-service-d65-r2-plan/repair-assurance-transfer-epoch-001/AUTHOR-MANIFEST.json`
with SHA-256
`64c93f2e8d31cc7c51ff412b721d41462979075724186ba6af4f6bccc5099f9a`.
The historical `completion-v1` runner and evidence were not modified.

The real defect is in the evidence pipeline. The six Auth product defects are
seeded calibration mutants, so this author result does not claim discovery of
an unseeded Auth product defect.

## Open Questions

- Will the separate reviewer reproduce the counterexample, repair, and bounded
  PASS result from the sealed author manifest?

