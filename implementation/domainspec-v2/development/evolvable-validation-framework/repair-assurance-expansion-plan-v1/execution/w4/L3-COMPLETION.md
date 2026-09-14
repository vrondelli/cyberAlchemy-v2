# Auth Foundation L3 completion

Date: 2026-09-12. Decision: **promote** the exact bounded Auth transfer into
private service-candidate assembly. Authority effect: none.

The author and separate fresh-context technical reviewer agree on `PASS` for
candidate digest
`3ed9cbef5a9e0eaec5158ed04c8c18221cb756b52ed49756cf5925cf1a41d9d3`.
The result binds 48 required product checks, 64 recorded Rust tests, six seeded
behavioral mutants with two neutral passes each, twelve hostile controls, two
EVF routes with stages S0 through S12, and ten evidence regression tests.

The campaign also produced one natural evidence-pipeline counterexample:
`AUTH-TRANSFER-PIPELINE-COPY-001`. Copying the full implementation tree into a
mutation workspace encountered ephemeral `.runtime` sockets and dangling
links, raised `shutil.Error`, and produced zero mutation observations. The
isolated repair uses one shared ignore set for inventory and copying and adds
`.runtime`. A causal reviewer replay reproduced the old failure and verified
that the repair excludes the ephemeral state while preserving equal source
inventories.

The six Auth implementation failures remain deliberately seeded calibration
mutants. They are not six discovered product defects. The reviewer independently
replayed both mutation campaigns with unchanged source, verified all sealed
evidence, and returned `AGREE` with one correction: the author incorrectly said
the required toolchain launcher was absent. It exists in the routed
CyberAlchemy checkout, and the reviewer replay through its absolute path passed.
The author evidence remains sealed; this correction is additive.

The [structured promotion decision](l3-promotion-decision.json), [author
completion](AUTH-AUTHOR-COMPLETION.md), and [independent reviewer
report](/home/vrondelli/projects/domainspec-core/projects/auth-foundation/development/auth-service-d65-r2-plan/repair-assurance-transfer-epoch-001/reviewer-attempt-001/REVIEW.md)
retain the evidence and limitations.

Promotion opens only private service-candidate assembly. It grants no product
approval, admission, certification, publication, release, deployment, customer
claim, price, SLA, or external contact.

## Open Questions

- A natural pre-repair Auth product counterexample has not been recovered.
- Independent-host replay and full regeneration of all hostile campaigns remain
  possible future strengthening steps.
