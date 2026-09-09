# G1 — Hosted D65 Owner Decisions

Status: G1.1 through G1.5 historical target accepted; replacement G1.5r stale after preacceptance  
Date prepared: 2026-09-03  
Authority effect: none

## Gate purpose

This packet presents the serial human decisions required before hosted
implementation conformance can be evaluated. It records candidates and choices;
it does not make a choice, update a lifecycle status, or authorize a successor.

```text
G1.1 definitions acceptance
  -> G1.2 Product Capability adoption
  -> G1.3 business-ontology admission
  -> G1.4 DomainSpec and generated-system-ontology admission
  -> G1.5 exact implementation-binding acceptance
  -> E2 refinement construction and evaluation
```

G1.1 and G1.2 are accepted; G1.3 and G1.4a are admitted. The DomainSpec source
decision binds the exact source and candidate-record digests without changing
the candidate itself. The deterministic generated preview is now frozen in a
fresh G1.4b candidate envelope, passed two identical validations, and is
admitted by an exact owner decision. Later successors must bind each preceding
immutable decision.

## G1.1 — Hosted definition-set acceptance

| Field | Exact value |
| --- | --- |
| Candidate ID | `KEP-HOST-DEFINITION-SET-001` |
| Selected definitions | `KEP-HOST-D1` through `KEP-HOST-D6` |
| Canonical source | `definitions/DEFINITIONS.md` |
| Canonical source SHA-256 | `2ccf51e0dfd6d4456d0cbef9eb9969a46f1455d5ead726721960fbdd24a7638a` |
| Candidate record | `definitions/candidate.json` |
| Candidate record SHA-256 | `50d57e4275fa9ca72feca03fb8da00ba89004399946eee10b378c5c3697ad60a` |
| Current validation | PASS, six IDs, three definition voices, synchronized index |
| Current posture | `authored-candidate-awaiting-owner-acceptance` |

### Available owner choices

- **Accept**: accept exactly the six definitions in the source digest above.
- **Reject**: reject this candidate and provide the semantic conflict.
- **Defer**: leave the candidate unchanged and stop the D65 chain.
- **Stop**: abandon this hosted capability stream.

Exact acceptance phrase:

```text
Accept hosted definition set KEP-HOST-DEFINITION-SET-001 with source digest
2ccf51e0dfd6d4456d0cbef9eb9969a46f1455d5ead726721960fbdd24a7638a
and candidate-record digest
50d57e4275fa9ca72feca03fb8da00ba89004399946eee10b378c5c3697ad60a.
```

This choice would authorize authoring the definition acceptance record only.
It would not adopt the Product Capability, admit ontology or DomainSpec,
accept implementation, establish conformance, deploy, transact, or publish.

### Recorded result

- Choice: **Accept**
- Decision ID: `CA2-DECISION-KEP-HOSTED-DEFINITION-ACCEPTANCE-001`
- Decision SHA-256:
  `e44fa53b2b87c035ac6f52a5fc6fd6dfbacda5f756a36a9db994b8ddfda1d25e`
- Exact definition and candidate closure validation: PASS

## Successor candidates

### G1.2 Product Capability

- Capability: `CA2-CAP-HOST-DEVNET-KNOWLEDGE-EXCHANGE`
- Capability source SHA-256:
  `600713ae7f95ed3c999cb6b97f492fc36e49dcf5e1c63496a711d7221e6c1de9`
- Rebound candidate record SHA-256:
  `065c991bb167e5e8d57633a53d8e3866c65c2484c107ad0bed1b9f1bea2f06b8`
- Accepted definition decision SHA-256:
  `e44fa53b2b87c035ac6f52a5fc6fd6dfbacda5f756a36a9db994b8ddfda1d25e`
- Validation: PASS; definition predecessor accepted; separate adoption decision current.
- State: adopted by exact owner decision.

Exact adoption phrase:

```text
Adopt hosted Product Capability CA2-CAP-HOST-DEVNET-KNOWLEDGE-EXCHANGE with
capability digest
600713ae7f95ed3c999cb6b97f492fc36e49dcf5e1c63496a711d7221e6c1de9
and rebound candidate-record digest
065c991bb167e5e8d57633a53d8e3866c65c2484c107ad0bed1b9f1bea2f06b8.
```

Recorded result:

- Choice: **Adopt**
- Decision ID:
  `CA2-DECISION-KEP-HOSTED-DEVNET-PRODUCT-CAPABILITY-ADOPTION-001`
- Decision SHA-256:
  `cd3e3f41e95aac623bbaf29ef96af78c67e82db788c8af16db75a932756f82f7`
- Exact capability and rebound-candidate closure validation: PASS

### G1.3 Business ontology

- Ontology: `CA2-ONTOLOGY-KEP-HOSTED-DEVNET-EXCHANGE`
- Profile SHA-256:
  `6e34328ab4a6e867a71298c002b417d7574fc5fcb62fb48b3dd7332f5b13482a`
- Material digest:
  `561fa9497a13a3b011908d703dbea5ebd4e21919a382ef2b408e6e8cc56a8c1d`
- Candidate record SHA-256:
  `d70444430addaf592efac682273898ce7d8856e0a9599c08a8d95a48b6c2f1a4`
- Validation: two byte-identical PASS runs; 12 nodes, 14 relations, 10 rules,
  two resolved predecessor residues and six open successor residues.
- State: admitted by exact owner decision.

Exact admission phrase:

```text
Admit hosted business-system bridge ontology
CA2-ONTOLOGY-KEP-HOSTED-DEVNET-EXCHANGE with material digest
561fa9497a13a3b011908d703dbea5ebd4e21919a382ef2b408e6e8cc56a8c1d
and candidate-record digest
d70444430addaf592efac682273898ce7d8856e0a9599c08a8d95a48b6c2f1a4.
```

Recorded result:

- Choice: **Admit**
- Decision ID: `CA2-DECISION-KEP-HOSTED-DEVNET-ONTOLOGY-ADMISSION-001`
- Decision SHA-256:
  `409015aefa426abd0ceeb7438fa96b434a7e15e7d58c3feeb8209012ca2d6706`
- Exact candidate, material-artifact, selector, graph, rule, and residue closure: PASS

### G1.4a DomainSpec v2 source

- Binding: `CA2-D65-KEP-HOSTED-DEVNET-DOMAINSPEC-001`
- DomainSpec binding SHA-256:
  `aeba9e7e0ea1c48a6a6acef0ad09d20f3602349185ba16601b423fb9a3fb9788`
- Authored project SHA-256:
  `ac75239f085f975b75eecebfa6a993c250cfdb0097a373f372ce4663b7842764`
- Source material digest:
  `0df6308ca5b32a273ca0798ca624491dc1fe44c4607e3f0d55e663f1e4fd314b`
- Candidate record SHA-256:
  `4a14ac7c158376a3db13f55b2dc828ea1c3ec83e40d4ec0d7bd70a69a68650e4`
- Source manifest SHA-256:
  `ae9eaf31bc2bc1dc36abcf07866c75e4ab276a91f6e38bb494c4a20c9c6774b5`
- Validation: two byte-identical PASS runs; 28 source files, one feature,
  12 nodes, 13 edges, and ten selected ontology dependencies.
- State: admitted by exact owner decision; the candidate remains immutable and
  does not self-admit.

Exact admission phrase:

```text
Admit hosted DomainSpec v2 source candidate
CA2-CANDIDATE-KEP-HOSTED-DEVNET-DOMAINSPEC-SOURCE-001 with source material digest
0df6308ca5b32a273ca0798ca624491dc1fe44c4607e3f0d55e663f1e4fd314b
and candidate-record digest
4a14ac7c158376a3db13f55b2dc828ea1c3ec83e40d4ec0d7bd70a69a68650e4.
```

Recorded result:

- Choice: **Admit**
- Decision ID:
  `CA2-DECISION-KEP-HOSTED-DEVNET-DOMAINSPEC-SOURCE-ADMISSION-001`
- Decision SHA-256:
  `9df4785c383cb8fe22854c1070d6966bc7217a2f2545ad9fee256179019d191f`
- Exact 28-file source, ten-dependency, feature, node, edge, candidate, and
  predecessor closure: PASS

### G1.4b Compiled graph and generated system ontology

- Compiled graph SHA-256:
  `e115614c13296199605e2ded2145d891309816100043caa8a2d8c85d6b8ec8cd`
- System ontology SHA-256:
  `80874014ec165d6cf9fc48e919aac00a504a51965c66d6888f4bacd4de1cc57d`
- Generated preview-set digest:
  `8aa30019a659b5131c9f524e7bcdb3b7679b7ea5712e3e8e6ebd28a46d281c1f`
- Candidate ID:
  `CA2-CANDIDATE-KEP-HOSTED-DEVNET-SYSTEM-ONTOLOGY-001`
- Candidate record SHA-256:
  `37b5b8531e13058bc39a61ee7572ea3059376cd54851f9717f19e02de2359aa4`
- Preacceptance receipt SHA-256:
  `d878a45d4e5c698d9aec6f308be8fb8872b5a2a36ad11540bd8963dd0628d488`
- Validation: two byte-identical PASS runs; output SHA-256
  `9d96d599243043154078c42da57a58f37ce281abd1ef23aeeb11286f4b59c1ad`.
- State: admitted by exact owner decision; the candidate remains immutable and
  does not self-admit.

Exact admission phrase:

```text
Admit hosted system ontology candidate
CA2-CANDIDATE-KEP-HOSTED-DEVNET-SYSTEM-ONTOLOGY-001 with candidate-set digest
8aa30019a659b5131c9f524e7bcdb3b7679b7ea5712e3e8e6ebd28a46d281c1f
and candidate-record digest
37b5b8531e13058bc39a61ee7572ea3059376cd54851f9717f19e02de2359aa4.
```

Recorded result:

- Choice: **Admit**
- Decision ID:
  `CA2-DECISION-KEP-HOSTED-DEVNET-SYSTEM-ONTOLOGY-ADMISSION-001`
- Decision SHA-256:
  `7b16adbccae027686cc7316699c9a45985e0fdc0fba628063c85d10f358b5677`
- Exact candidate, five-artifact set, DomainSpec predecessor, graph, system,
  bridge, and preacceptance closure: PASS

### G1.5 Exact implementation binding

- Binding: `CA2-D65-KEP-HOSTED-DEVNET-RUST-001`
- Binding record SHA-256:
  `50a0e5ce9cbc811c8e9d5249b28ae0c1bb4b19824d27a8b4adce7dd7afd2bf92`
- Bound implementation material SHA-256:
  `e96a517ca08db35294010db5002a02ae8ccc37e1d2b0d14bc834cc2eca92795f`
- Bound files: 29, plus two source-asset identities.
- Selector closure: all 12 graph nodes, 13 graph edges, and six runtime
  constraints map to one or more paths inside the exact bound material set.
- Candidate: `CA2-CANDIDATE-KEP-HOSTED-DEVNET-IMPLEMENTATION-BINDING-001`
- Candidate record SHA-256:
  `25e7afc5ab29cc9f52a4f63fc74b25db45d68e6853e4b11f540b4995d9d4d925`
- Preacceptance receipt SHA-256:
  `97fe92202ef0b3f89bb3061d8377254f7a6a776ace6baa86909b61d2cd8790e4`
- Validation: two byte-identical candidate checks PASS; Rust formatting, the
  local two-identity test, three browser tests, and bundle currentness PASS.
- State: accepted by exact owner decision; the immutable candidate remains
  `not-requested`, while conformance remains separately `not_evaluable`.

Exact owner phrase:

```text
Accept hosted implementation binding candidate
CA2-CANDIDATE-KEP-HOSTED-DEVNET-IMPLEMENTATION-BINDING-001 with binding-record digest
50a0e5ce9cbc811c8e9d5249b28ae0c1bb4b19824d27a8b4adce7dd7afd2bf92,
implementation-material digest
e96a517ca08db35294010db5002a02ae8ccc37e1d2b0d14bc834cc2eca92795f,
and candidate-record digest
25e7afc5ab29cc9f52a4f63fc74b25db45d68e6853e4b11f540b4995d9d4d925.
```

Recorded result:

- Choice: **Accept**
- Decision ID:
  `CA2-DECISION-KEP-HOSTED-DEVNET-IMPLEMENTATION-BINDING-ACCEPTANCE-001`
- Decision SHA-256:
  `993d8bb23435a0fe568b602f71f3988a2cf642ed5b529097499ca83f01991748`
- Two post-decision validations: byte-identical PASS, output SHA-256
  `6339aaa2195952b9dc422506dcdb763114be53aad0dc5f01d70fde7388462714`

### G1.5r Replacement exact implementation binding

- Binding: `CA2-D65-KEP-HOSTED-DEVNET-RUST-002`
- Immutable binding record SHA-256:
  `41c3bf98980d41efa4979856e72ccc7e2707f89ff4c94c41edfd66a95b3f76af`
- Bound implementation material SHA-256:
  `b48ab24d96eb5fd19144baf2bc0406bdd765fce646c80ee5ccc122e55ae6fb75`
- Candidate: `CA2-CANDIDATE-KEP-HOSTED-DEVNET-IMPLEMENTATION-BINDING-002`
- Candidate record SHA-256:
  `9288302121e4d86bdb72eec29296fc476693edc679f96f1a03a12f9bda780f00`
- Preacceptance receipt SHA-256:
  `2db1a82bf0cc27b887149ff3e982cbd8b15419915ff1b87abe0ff62501ac11f9`
- Coverage: 29 files, two source assets, 12 graph nodes, 13 graph edges,
  six runtime constraints, and 31 selector mappings.
- Validation: two byte-identical structural PASS runs; Rust formatting, the
  two-identity Rust test, three browser tests, and bundle currentness PASS.
- Historical continuity: acceptance decision `993d8bb2...` remains unchanged
  and valid only for its historical `50a0e5ce...` / `e96a517c...` target.
- Post-preacceptance drift receipt SHA-256:
  `a25a28dddf0256991a30ca0cddd568536d8a4678ea223c9cf4f267bead8872ed`
- Final-freeze result: `BLOCK`; `static/index.html` and `ui-src/app.js`
  changed after the passing preacceptance run, while the bundle and live
  binding were not regenerated.
- State: historical replacement candidate only; acceptance remains
  `not-requested`, conformance remains `not_evaluable`, and no acceptance
  phrase is available for stale bytes.

## Stop result

The original G1.5 decision remains historical. The separately authorized
post-acceptance hosted conformance assessment returned `BLOCK`: accepted record
`50a0e5ce...` and material `e96a517c...` no longer match the current binding
record `41c3bf98...` and material `b48ab24d...`. Upstream lifecycle checks pass,
but implementation-dependent checks are `not_evaluable`. The next owner choice
was to restore the accepted bytes or author and review a new binding candidate.
Replacement candidate 002 passed preacceptance but failed its final-freeze
currentness check after a second concurrent UI drift. It is not decision-ready.
A new stabilized frontier and candidate generation are required. No acceptance,
conformance, deployment, or external effect is inferred.
