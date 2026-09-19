# BMC-REL-D07 Projection Decisions

Status: `canonical-vocabulary-and-p02-candidate-projection-applied`

Authority effect: `canonical-domain-vocabulary-only; candidate-packet-projection-only`

## D07 owner selection

Selected option: `BMC-REL-D07-C-ONE-DIRECT-MEMBERSHIP-PER-GOVERNED-KIND`

Decision owner: `user`

Decision source: exact `C` response in the active conversation.

Decision timestamp: `2026-08-23T16:17:11+01:00`

Exact gate binding:

- Candidate SHA-256: `18ed4c699c53924bb054050a741efa857c1fe8b256d21868748d0387e402cbda`.
- Request raw SHA-256: `fa90d189baca57ac6cc6d8e6c8b983b6da68fe210eefdb21d62aa4ff5b8fc1b8`.
- Canonical request digest: `b74624d515c7052eb5b5bcc56a2f783b182eac28a424db64636c0152a337c7c7`.
- Receipt raw SHA-256: `94bac73b0d7746d5c5d2e8651b80bce1cd83fb6a686ae848d279c857ee2e83b0`.
- Pre-selection parent record SHA-256: `44aed4cd2db88f094a02d6cce267f320360df68967ada3c130e1dafc9b29a307`.

Formal selection boundary:

```text
Let K_admitted be the membership kinds admitted later by Definitions Governance.
Let belongs_to_k(e, p) classify a direct canonical belongs-to fact under k without deciding representation.

For every Entity e, k in K_admitted, and parent Entities p1 and p2:
  belongs_to_k(e, p1) and belongs_to_k(e, p2) implies p1 = p2.

There is no existence condition. Different parents in distinct admitted kinds are permitted but not required.
```

The prose words membership, classification, and home assignment are illustrative only. D07 does not infer numeric bounds, mandatory membership, self/cycle/transitive/closure/duplicate/inverse/representation/runtime behavior, or any equivalence with `owns`.

## P01 — Membership-kind vocabulary governance model

Status: `selected`

Question: Which governed vocabulary model should make the admitted membership-kind set finite, stably referenceable, and fail-closed, while leaving every concrete label and meaning to an exact three-voice Definitions Governance package?

Fresh Decision Gate evidence:

- Candidate: `../candidates/BMC-REL-D07-P01-DEFINITIONS-CANDIDATE.md`, raw SHA-256 `012068ac18dcaced1d5fbcbacb4a1a8505a3d2eed1cae7e1583914b2c01eec04`.
- Request: `../decision-gate/BMC-REL-D07-P01-OPTION-ADMISSIBILITY-REQUEST.json`, raw SHA-256 `a96864ea845824e6374e53cda7b66adb0030c3dbfd06000d0d225d4046604915`, canonical request digest `e25fb8791a4ff3c76c899c48d533e5510d347d9b1843f9569b81422ce24d2ae6`.
- Receipt: `../decision-gate/BMC-REL-D07-P01-OPTION-ADMISSIBILITY-RECEIPT.json`, raw SHA-256 `a8b820d60b12b5c67b47c6f24c1a99f27926b626949a127931146d41b8177623`.
- Prefilter result: `gate`; two action options plus defer and stop are structurally admissible. Four unsafe constructions are rejected. No option is selected.

### `BMC-REL-D07-P01-A-FIXED-CLOSED-ENUMERATION`

Use one owner-accepted complete finite ID enumeration. Benefit: smallest lifecycle and simplest reference validation. Risk: every evolution requires replacement of the complete enumeration through fresh owner acceptance.

### `BMC-REL-D07-P01-B-GOVERNED-EXTENSIBLE-REGISTRY` — selected

Use a finite active-ID registry with exact digest binding and owner-gated add, revise, deprecate, and remove operations. Benefit: controlled evolution without an eternally exhaustive claim. Risk: more lifecycle, migration, and drift-audit machinery.

### `BMC-REL-D07-P01-C-DEFER`

Leave vocabulary unresolved and keep D07 projection plus P02 blocked.

### `BMC-REL-D07-P01-D-STOP`

End the D07 projection route without admitting vocabulary or representation.

Rejected constructions: free-text or implicitly aliased kinds; prose-derived tokens; reuse of the ownership-dimension registry; and an unknown-to-`other` catchall.

The candidate carries an aligned hypothetical low/medium/complex comparison of A and B. Every design label is explicitly non-authoritative and the ladder has `decision_effect: none`.

### P01 owner disposition

Selected option: `BMC-REL-D07-P01-B-GOVERNED-EXTENSIBLE-REGISTRY`

Decision owner: `user`

Decision timestamp: `2026-08-23T16:35:24+01:00`

Decision source: exact `B` response to the P01 option set in the active conversation.

Selection effect: P01 selects only a finite digest-bound membership-kind registry governance model with
owner-gated add, revise, deprecate, and remove operations. It does not create the definition card, IDs, meanings,
aliases, initial active set, registry bytes, digest, packet representation, or enforcement.

Selection receipt: `../receipts/BMC-REL-D07-P01-SELECTION-RECEIPT.json`.

## BMC-REL-D07-P01-CONTENTS — Initial active membership-kind package

Status: `selected`

Question: Which exact initial active-ID package should seed the governed membership-kind registry while remaining
pairwise non-overlapping, fail-closed, and faithful to canonical `belongs-to` semantics?

The fresh candidate supplies complete formal, plain-language, and DomainSpec-context voices for every proposed ID.
Those voices are candidate content only and do not become canonical until a later accepted definitions package is
written to the canonical definitions/index/registry surfaces.

Fresh Decision Gate evidence:

- Candidate: `../candidates/BMC-REL-D07-P01-CONTENTS-DEFINITIONS-CANDIDATE.md`, raw SHA-256
  `cd612231118dd8352bbc78921ba0d75c57284756d21fc28c008b2ecafe1c0afb`.
- Request: `../decision-gate/BMC-REL-D07-P01-CONTENTS-OPTION-ADMISSIBILITY-REQUEST.json`, raw SHA-256
  `8ff4bd8c5c504d968dd02bdf3ff948b119537fba448eff5c2b4444de17b4baf4`, canonical request digest
  `b1db2f8f3c4f5afa97e1e06ab9a19a6104fdfbf8c9d5da4de66a8eb9aff2ce47`.
- Receipt: `../decision-gate/BMC-REL-D07-P01-CONTENTS-OPTION-ADMISSIBILITY-RECEIPT.json`, raw SHA-256
  `682beb6cbe08ebed7713a285efd3f37914f289db97f18f7f2b21bc763dde1df6`.
- Prefilter result: `gate`; two action packages plus defer and stop are structurally admissible. Six unsafe
  constructions are rejected.

### `BMC-REL-D07-P01-CONTENTS-A-MINIMAL-TWO-KIND` — selected

Initial IDs: `classification`, `home-assignment`.

Trade-off: smallest package directly illustrated by Title/Branch examples, but a distinct collection-membership
fact fails closed until a later owner-gated registry addition.

### `BMC-REL-D07-P01-CONTENTS-B-DISJOINT-THREE-KIND`

Initial IDs: `collection-membership`, `classification`, `home-assignment`.

Trade-off: covers the explicit “member of” semantic pressure without a generic catchall, but adds an unproven third
example need, overlap pressure, and hostile-fixture obligations.

### `BMC-REL-D07-P01-CONTENTS-C-DEFER`

Leave initial contents unresolved and keep canonical definitions, registry, and P02 blocked.

### `BMC-REL-D07-P01-CONTENTS-D-STOP`

End D07 projection without initial registry contents or P02.

Rejected: generic `membership` catchall, free text or aliases, unknown-to-`other`, ownership-registry reuse,
overlapping meanings, and mandatory membership.

Owner choices originally presented: `A`, `B`, `C`, `D`, or `Explain`. The exact `A` response resolved that gate;
the Explain path retained `decision_effect: none`.

### Contents owner disposition

Selected option: `BMC-REL-D07-P01-CONTENTS-A-MINIMAL-TWO-KIND`

Decision owner: `user`

Decision timestamp: `2026-08-23T16:58:14+01:00`

Decision source: exact `A` response to the contents option set in the active conversation.

Selection receipt: `../receipts/BMC-REL-D07-P01-CONTENTS-SELECTION-RECEIPT.json`, SHA-256
`fa17a79ddedbd822b912a3c59eb90b79c9664b43d615009018042c7a41bc2b31`.

Selection effect: admit exactly `classification` and `home-assignment` as the selected initial candidate contents,
using the already presented three-voice meanings, pairwise non-overlap, zero/multiple-match fail-closed rules, D07
uniqueness within each kind, no existence condition, and independence from `owns`. Generic `membership` and
`collection-membership` remain inactive. The selection does not apply canonical bytes or decide representation.

## BMC-REL-D07-P01-CONTENTS-APPLY — Exact canonical package acceptance

Status: `selected-and-applied`

Question: Should Definitions Governance accept the exact digest-bound D30, index, and membership-kind registry
package for a separate atomic apply, defer that exact package, or stop projection?

Exact package bindings:

- Manifest: `../staged/BMC-REL-D07-P01-CONTENTS-CANONICAL-PACKAGE-MANIFEST.json`, SHA-256
  `e7b1753cb0abb0bd05d9709e309d52c2967c4ff4c5471f7a8e389bf8989f8269`.
- Proposed `DEFINITIONS.md` postimage SHA-256: `f075568feed8d9918762efe99bb228602da32b760ae7b023aad770187c70fb4a`.
- Proposed `DEFINITIONS-INDEX.md` postimage SHA-256: `d0c8032b45fb371d26b8b80eac9f9e576bec10a6ed2a63d275558212bc1a6bfb`.
- Proposed `membership-kinds/membership-kinds.json` postimage SHA-256:
  `854ff80f309e38f48f3f278d13d661983652b6809bf3f2bf0e06688b9bf37d5c`.
- Candidate: `../candidates/BMC-REL-D07-P01-CONTENTS-APPLY-CANDIDATE.md`, SHA-256
  `6331cf3056e959cd77abc7a60da2c676824548aa8c844ce72e37456a0f5c3859`.
- Request: `../decision-gate/BMC-REL-D07-P01-CONTENTS-APPLY-OPTION-ADMISSIBILITY-REQUEST.json`, SHA-256
  `45341c8115132667eb55c4b70c120f15c8859c11a7733120229a792c4605e0a5`, canonical request digest
  `bc274e58c4cb412d7bd9f865eda92920d9d92c5376e0f04385fc5953773fff6b`.
- Receipt: `../decision-gate/BMC-REL-D07-P01-CONTENTS-APPLY-OPTION-ADMISSIBILITY-RECEIPT.json`, SHA-256
  `368748c34d35f9fdc5b7ece027342df3f594a62fdf92be4d8b2ea9c03fb2d4e4`.

### `BMC-REL-D07-P01-CONTENTS-APPLY-A-APPLY-EXACT-CANONICAL-PACKAGE`

Accept only the exact three paths and postimage digests as one atomic authority package. Benefit: synchronized
human, index, and machine vocabulary surfaces. Risk: stale or partial application would drift, so any preimage or
postimage mismatch blocks and requires regeneration plus renewed owner acceptance.

### `BMC-REL-D07-P01-CONTENTS-APPLY-B-DEFER-EXACT-PACKAGE`

Keep the exact package non-authoritative and P02 blocked. Any later canonical drift invalidates this acceptance
surface and requires a fresh package.

### `BMC-REL-D07-P01-CONTENTS-APPLY-C-STOP-PROJECTION`

End D07 projection without changing canonical definitions, index, registry, or packet authority.

Rejected: partial package, stale preimage, modified/substituted bytes or paths, and bundled package-plus-P02.

Recommendation without selection: choose A only if every path and digest is accepted as one atomic package.
Otherwise choose B to retain the package without authority, or C to stop. The aligned low/medium/complex examples
in the candidate have `decision_effect: none`.

Owner choices presented: `A`, `B`, `C`, or `Explain`. The exact `A` response resolved the gate; Explain retained
`decision_effect: none`.

### Exact package owner disposition and atomic application

Selected option: `BMC-REL-D07-P01-CONTENTS-APPLY-A-APPLY-EXACT-CANONICAL-PACKAGE`

Decision owner: `user`

Decision timestamp: `2026-08-23T17:41:04+01:00`

Decision source: exact `A` response to the package acceptance gate in the active conversation.

Selection receipt: `../receipts/BMC-REL-D07-P01-CONTENTS-APPLY-SELECTION-RECEIPT.json`.

Atomic apply receipt: `../receipts/BMC-REL-D07-P01-CONTENTS-ATOMIC-APPLY-RECEIPT.json`.

Applied canonical postimages:

- `projects/domainspec-v2/definitions/DEFINITIONS.md`: `f075568feed8d9918762efe99bb228602da32b760ae7b023aad770187c70fb4a`.
- `projects/domainspec-v2/definitions/DEFINITIONS-INDEX.md`: `d0c8032b45fb371d26b8b80eac9f9e576bec10a6ed2a63d275558212bc1a6bfb`.
- `projects/domainspec-v2/definitions/membership-kinds/membership-kinds.json`:
  `854ff80f309e38f48f3f278d13d661983652b6809bf3f2bf0e06688b9bf37d5c`.

Application effect: the exact accepted postimages were written atomically, but post-apply link validation failed
because D30 named two nonexistent local anchors. The accepted atomic/fail-closed contract authorized exact rollback:
definitions/index now match `cdbe2510...`/`ad41200...`, the canonical registry is absent, and accepted staged copies
remain recoverable. No relationship, packet, schema, or main-validator authority changed.

## BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY — Renewed repaired-package acceptance

Status: `selected-and-applied`

Question: accept the fresh exact package that changes only D30's two stale local anchor fragments, defer it, or
stop projection?

Exact repair evidence:

- Governance-defect receipt SHA-256: `923d54a2c2c34d5220ec985cdd5b4cffaf2b79276d8d69c507cb21537755dad6`.
- Rollback receipt SHA-256: `b71a2a7e23115e79e4213fdb5eb06f8a45eba4be17d22c30a7b51052974a2691`.
- Fresh manifest SHA-256: `c18bda5be46cdd9d2e366c5c12add44619f8f2fe38d93fd76f12040cd7b010dc`.
- Repaired definitions SHA-256: `92f31e0a888ff0e6bfadd6d0d79dbb7894b88c6ca435672ca57409989dd51bdf`.
- Repaired index SHA-256: `d0c8032b45fb371d26b8b80eac9f9e576bec10a6ed2a63d275558212bc1a6bfb`.
- Repaired registry SHA-256: `854ff80f309e38f48f3f278d13d661983652b6809bf3f2bf0e06688b9bf37d5c`.
- Independent review binding SHA-256: `0918bb72a0fd218494d715a74a26a52b6d39847bfa2133a90c72f8a51c1c0fd4`.
- Candidate SHA-256: `434216549cbf4ece1af6c3481d055ecf91297a61eaf3ef6da3606604fcc8cfec`.
- Request SHA-256: `454b82dd478b365a066bf5fd4b1f1bfa2f62a8a536fba8c72d19cc9900185096`;
  canonical digest `c810e4ca7fbddd63e0efc03d9af364de9ca1346a717812c29fdb07a088b4e364`.
- Prefilter receipt SHA-256: `407d8e48f0685a808cc493fa82a79263166753e2f52d5c0b5f8711ac69f199b1`.

### `BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-A-APPLY-EXACT-REPAIRED-PACKAGE`

Accept only the fresh manifest-bound package for a later separate atomic apply. Benefit: same selected semantics,
with all staged D30 local anchors resolving. Risk: any preimage, path, postimage, or heading drift blocks and
requires regeneration plus renewed acceptance.

### `BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-B-DEFER-REPAIR`

Retain the repaired candidate without canonical authority; P02 remains blocked.

### `BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-C-STOP-PROJECTION`

End D07 projection in the restored canonical state.

Recommendation without selection: choose A only if every fresh path/digest and the exact two-anchor delta are
accepted. The candidate's low/medium/complex ladder has `decision_effect: none`.

Owner response choices presented: `A`, `B`, `C`, or `Explain`. Exact `A` selected
`BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-A-APPLY-EXACT-REPAIRED-PACKAGE`.

### Renewed repair owner disposition and atomic application

Decision owner: `user`

Decision timestamp: `2026-08-23T18:17:44+01:00`

Decision source: exact `A` response to the renewed repair acceptance gate in the active conversation.

Selection receipt: `../receipts/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-SELECTION-RECEIPT.json`, SHA-256
`2e2f3307442f740c0bc6199763e43c9c0ff4f1a83fe92027673f1f8700ab7a47`.

Atomic apply receipt: `../receipts/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-ATOMIC-APPLY-RECEIPT.json`, SHA-256
`9c7cfa75dc7f6cf027659e0130ba7ab62789239df8930abc8a7cd789e0dd47df`.

Canonical postimages:

- definitions: `92f31e0a888ff0e6bfadd6d0d79dbb7894b88c6ca435672ca57409989dd51bdf`;
- index: `d0c8032b45fb371d26b8b80eac9f9e576bec10a6ed2a63d275558212bc1a6bfb`;
- membership-kind registry: `854ff80f309e38f48f3f278d13d661983652b6809bf3f2bf0e06688b9bf37d5c`.

Application effect: local D30/index/registry vocabulary authority only. Exact local anchors resolve and canonical
docs/content/registry checks pass. No packet, schema, main-validator, relationship, implementation, or P02
authority changed.

## BMC-REL-D07-P02-TYPED-PACKET-REPRESENTATION — Selected and applied to candidate packet

Status: `selected-and-applied-candidate-only`

Question: represent exact policy `one-parent-per-admitted-membership-kind` as a generic row facet, a
`belongs-to`-scoped typed extension, or a top-level typed projection—or defer or stop?

Canonical registry binding:

- path: `projects/domainspec-v2/definitions/membership-kinds/membership-kinds.json`;
- SHA-256: `854ff80f309e38f48f3f278d13d661983652b6809bf3f2bf0e06688b9bf37d5c`;
- active IDs: `classification`, `home-assignment`.

Exact gate binding:

- Candidate SHA-256: `16ea98d8fdb4d84430bc76133433a7cab1ae9797f5f919be5b95ec5201df925b`.
- Request SHA-256: `187d9e1478ac0a987021f303dfec9b6ca4b9573f16d5101acb983ed204e0d3f2`.
- Canonical request digest: `c9e44f49fa84fc890494954d0c1cb736e56750dfdcfc87a797ac5769774ce1ab`.
- Receipt SHA-256: `c0fdc792deca1d8d2734a558310f41277d4a2d35c8df67bd7f192ade0f29f7ec`.

### `BMC-REL-D07-P02-A-GENERIC-FIRST-CLASS-FACET`

Add required `membership_topology` to every row, with exact policy/registry binding on `belongs-to` and
`not-applicable` elsewhere. Benefit: first-class uniform-row facet. Risk: unrelated-row churn and token-copy
pressure.

### `BMC-REL-D07-P02-B-BELONGS-TO-SCOPED-TYPED-EXTENSION` — selected

Add a closed schema-discriminated `belongs-to`-only object. Benefit: smallest unrelated-row surface at the
semantic locus. Risk: conditional schema and validator invariants.

### `BMC-REL-D07-P02-C-TOP-LEVEL-TYPED-PROJECTION`

Add one closed packet-level projection keyed to `belongs-to`. Benefit: preserves row uniformity. Risk: lookup,
uniqueness, and cross-reference invariants.

### `BMC-REL-D07-P02-D-DEFER`

Retain canonical vocabulary but leave packet representation unresolved.

### `BMC-REL-D07-P02-E-STOP`

Terminate D07 projection without typed packet representation.

Rejected: facet overloading; untyped evidence; missing digest/free text; mandatory membership or numeric
inference; ownership collapse; packet application in this gate; and the token or object on non-`belongs-to` rows.

The candidate's aligned low/medium/complex ladder has `decision_effect: none`. Owner choices were `A`, `B`, `C`,
`D`, `E`, or `Explain`.

### P02 owner disposition and candidate application

Selected option: `BMC-REL-D07-P02-B-BELONGS-TO-SCOPED-TYPED-EXTENSION`

Decision owner: `user`

Decision timestamp: `2026-08-23T18:38:33+01:00`

Decision source: exact `B` response to the P02 option set in the active conversation.

Selection receipt: `../receipts/BMC-REL-D07-P02-SELECTION-RECEIPT.json`, SHA-256
`5a680b76fa8eef8fe4676e4deeae67c59e22f2ae0a1d825b92a55262643ff65c`.

Applied candidate postimages:

- packet: `a9f659fc847f7cbfe87d7f68d02f0f996dcae9daa196275042a4e1b7ec9e62c0`;
- packet schema: `d68616768f5018b1023481a6cb507f8fd1b4eb0df656b518bc101cd1315508e7`;
- main validator: `69681598b58529d64037335e6f47935cce769c79a95fc7140daa9f77dd74b975`.

Application effect: add one closed `membership_topology` object to `belongs-to`, require and forbid it through a
schema discriminator, and enforce exact status, policy, registry path/digest, rationale, evidence, closed keys,
and scope in the main validator. It does not declare kind instances or storage, require membership, resolve
numeric or any ordinary topology facet, conflate `belongs-to` with `owns`, or accept the packet as a whole.

## P01 preparation artifact bindings

- README SHA-256: `c0de05ba58aaca1173c01f78a6a332f26926818761f0fd711dc16462213f9fc6`.
- P01 candidate SHA-256: `012068ac18dcaced1d5fbcbacb4a1a8505a3d2eed1cae7e1583914b2c01eec04`.
- P01 request SHA-256: `a96864ea845824e6374e53cda7b66adb0030c3dbfd06000d0d225d4046604915`.
- P01 receipt SHA-256: `a8b820d60b12b5c67b47c6f24c1a99f27926b626949a127931146d41b8177623`.
- Sidecar validator SHA-256: `9fc8c6a2d54243fbe004a8408beb2299f11e5d847ef8c5560b51bd1e8cc4853f`.

## Claim ceiling

This record proves the exact D07, P01 governance-model, minimal two-kind contents, first rollback, exact repaired
canonical D30/index/registry application, and selected P02 candidate-packet projection. It does not declare kind
instances or storage, require membership, resolve numeric or ordinary topology facets, change relationship
authority, implement enforcement, accept the packet as a whole, decide D08, or authorize promotion, publication,
release, deployment, or production use.
