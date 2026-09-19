# Independent final consumer-source review

**Result: PASS for the exact selected consumer source and execution dependency lock.** Reviewer: `/root/e04_source_reviewer`, the same one user-authorized native reviewer. Route: `CA2-ROUTE-VALIDATE`. Authority effect: none. This is bounded independent source-review evidence; it does not approve the product, establish E04 closure by itself, certify current runtime state, or authorize publication, activation, release, deployment or other effects.

## Exact reviewed candidate

Candidate: `DSV2-E03-OWNS-REACHABILITY-003`, under `e03-reachability-v3`. The candidate's eight file hashes match actual bytes; both consumer manifest entries match actual hash and size. The pure consumer hashes to `2c6f5a35e8960bfa8fc81f022fa4db2451d26b2f48534ff7d9c89d602a095f78`. Its manifest file hashes to `38b0fed8bc9a0313dd70b4e907c9cc50e568a3a403eb2f8fc089000030e737de`, which is the source identity bound by review.json. The exact execution dependency lock remains `d2d627f0d34156c12f9fd6ee48644a95d85cfec0f9967bada4231b216815f9ea`.

The implementation diff from v2 only closes the verifier receipt's nine fields and requires authority_effect none and empty reason_codes. Earlier F1/F2 repairs remain. consume.py, producer.py, adapter.py and compile_bridge.mjs are byte-identical to the original candidate. Original and v2 BLOCK reviews are preserved. E01/E02 definitions and contracts remain the semantic requirements; their bytes were not revised. No ontology semantic selectors are dependencies; the governance profile served routing context only.

All fifteen new transfer epochs were compared with the prior successor inputs: every expected input except the consumer-source manifest is identical; each new expected manifest digest is the reviewed v3 manifest. Every present transfer file except that manifest is byte-identical to its corresponding prior successor transfer. Thus reviewed native artifacts are reused evidence, not newly claimed provider executions. Intentional missing/corrupt fixtures remain present as such.

## Findings disposition

- **F1 resolved.** Native stage details now match the selected protocol shape, profile and expected positive/negative observations. Positive failure/timeout contradiction, negative-control survival, empty observations/replay false, extra negative repetition, and incorrect stdout digest all cause evidence-integrity BLOCK. Stage identity, predecessor hashes and native reference currency checks remain in place.
- **F2 resolved.** The closed native claim matches the exact positive graph source reference, empty observed violations, evidence kind, description, declared assumptions, dependency denominator and limits. Wrong source gives MIXED_RUN; contradictory observed details or evidence kind gives EVIDENCE_CORRUPT; removed assumptions gives CLAIM_OUT_OF_SCOPE.
- **F3 resolved.** `consumer.py:301-307` now requires the exact verification-receipt field set, authority_effect none and no failure reasons in addition to the existing verdict, stage denominator, currentness and replay checks. Rehashed authority inflation or COUNTEREXAMPLE reasons BLOCK. Unknown fields, omitted authority, null reason codes, replay false and incomplete verified-stage IDs also BLOCK.

No remaining actionable blocker was found within this selected consumer-source review. This statement is bounded by the inspected sources and probes, not a universal claim that every malformed native protocol value is proven safe.

## Four review questions

1. **Independent reconstruction and closure — PASS.** The consumer selects all Entity tuples, independently sorts the tuple map, retains every authored owns edge's provenance, checks mapping uniqueness/endpoints and the 1..64 bound, and calculates positive-length closure from actual edges. Removing all incoming target edges forms the negative control. A separately authored iterative traversal oracle again agrees for all 512 directed three-node graphs and nine endpoint pairs: 4,608 checks including zero-length self queries and nonempty cycles. Mapping/reachability implementation is unchanged from the fully inspected original.
2. **Exact identities, native evidence, negative controls and dependency joins — PASS for reviewed scope.** Caller expected epoch and input references constrain source/compiler graph/profile/query/definition/consumer/dependency identities. Raw native request/source/tools references, translation, command shape, rows and summaries are checked independently; selected raw paths and repetition count are joined to the formal bundle/profile. Repaired claim, stage and verifier predicates now reject all identified consistency defects. Source and native host references remain bound to the selected lock. Recorded lock/tree correspondence was checked in the original review; no fresh execution or full host-tree currency claim is made here.
3. **Consumer/IO independence — PASS.** Full original source inspection and successor diff inspection show no producer or EVF code imported as a consumer oracle. The pure module uses standard-library parsing/hash/base64/regex only. The unchanged IO shell reads immutable bounded bytes with component-wise O_NOFOLLOW and checks its own consumer.py/consume.py source manifest plus the caller-selected expected digest. The new predicates add no dependency. Compiler semantic validation and trusted runtime collection remain the explicitly documented E03 collector responsibilities, not independently re-proven compiler semantics.
4. **Missing/failure evidence and review behavior — PASS for reviewed scope.** Missing handle/raw remain not_evaluable, with independent negative evidence still evaluated where available. Stale epochs, substituted bytes, wrong mappings, surviving negative control, mixed runs and contradicted native execution/verifier records BLOCK. Without a caller-selected review digest, every positive technical baseline still reports consumer-independence not_evaluable. The probes never injected a fake PASS review. This newly authored review may be externally selected only for its exact source/lock pair; the parent must perform fresh review-bearing consumer evaluations to establish their own receipts.

## Independent validation receipts

`focused_probe.py` imports the actual v3 consumer and standard library only. It copies real transfer bytes in memory and independently rehashes mutations. It does not import producer, adapter, E03 test fixtures or EVF logic. It does not change frozen evidence or execute a provider.

- 21 consumer scenarios: three baseline/absence cases retain not_evaluable; all eighteen invalid or contradictory cases BLOCK.
- 15 supplied transfer replays: six positive/replay technical baselines remain not_evaluable solely for missing review; missing-evidence remains not_evaluable; eight invalid cases BLOCK.
- 4,608 graph/query cases agree with the independent traversal oracle.

Complete receipts are in probe-results.json. Run:

```text
python3 -B /home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/reviewer-final/focused_probe.py
```

Writes are limited to focused_probe.py, probe-results.json, review.json and this REPORT.md under reviewer-final. Earlier review reports retain the original findings and rejected candidates. Product approval, final E04 receipt construction, frozen-campaign closure and any operational residue remain separately owned by the parent/appropriate decision owner. No additional subagent, native provider run or external effect occurred.

## Selected references and SHA-256

Compared 600 present transfer files across the fifteen cases, excluding only the reviewed consumer manifest.

- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v3/candidate.json` — `faaee6fc55023ae91a5742e05efde24425ff850959f8f66ba70e56b37d7f9750`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v3/consumer.py` — `2c6f5a35e8960bfa8fc81f022fa4db2451d26b2f48534ff7d9c89d602a095f78`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v3/consume.py` — `5dc23a22dfdcaadb98a265cf2501d295995538947627fa3d6d8a352773fec828`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v3/consumer-source-manifest.json` — `38b0fed8bc9a0313dd70b4e907c9cc50e568a3a403eb2f8fc089000030e737de`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v3/producer.py` — `3c5ef685dfa36bc4ebd5bc260b185fd30f40eed7cea88d7aa719697f7b300b0a`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v3/adapter.py` — `57d550a6e89c93735ff76e84021575ac9d19e672ba7cee86cb631c3b4f05a87a`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v3/compile_bridge.mjs` — `69bbdc509f40721969e6c78df2aac293491eef2b37413efad2e121d9525e589d`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v3/producer-source-manifest.json` — `f250b061a891a5e92d6c7e5f684dbefd24b774d741597372fcf296bcad91f63d`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v3/README.md` — `8f39cdaef1e31958b15993784f71d147b40ab48a44553dfbef1596d45f07b996`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-reachability-v1/positive-chain/transfer/inputs/dependency_lock.json` — `d2d627f0d34156c12f9fd6ee48644a95d85cfec0f9967bada4231b216815f9ea`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e01-reachability-v1/DEFINITION-PACK.json` — `e2137df5b4c13c58f6e952c8204faa902f4db8463d42ffa0f68668064aa83e96`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e02-reachability-v1/contracts.json` — `db93284d0ace887d010e841bcfe42b3a5131f984e5680089bcec53b3f4145580`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/reviewer/review.json` — `e4a8a39708a48b23f40c1bffc5b9aee8639134892b1c40f252d3f6243097ce1e`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/reviewer/REPORT.md` — `e8af304bf7411ffc42e1fb2b2d332820aaafbdfc791390bfa084dfdc8806d6a1`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/reviewer-successor/review.json` — `86a934677260cd2b060e44c1494769a9fddc31239c2684a6d21ca7eb90b69ea2`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/reviewer-successor/REPORT.md` — `d8bb944bf72452385f5a9e7b8e821f77862866c4d5d6b9c415bd74f3b94d3aa5`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-unreviewed-checks.json` — `3646f3564ed2c2ae5b916aa5ad7dd70c00ca87841997ba81804f3c9097e47b7d`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/reviewer-final/focused_probe.py` — `0135da0d7d8dd1be33a747ef7a971a9d06ddef68818b853225411549381d75d7`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/reviewer-final/probe-results.json` — `0e79c6fa970554a5b4dfac0b2f28c7f4bc52b544f0da1edc4899dff86cbac87a`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/reviewer-final/review.json` — `a4e3acce877be92db85a2e24e35ac83be7dab62bb5bc63c9ff486890c5d43d51`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/positive-chain/trusted/expected.json` — `5452cb53cd2f958723db05deef9f89fbf51df55f0511cc12df78e962a11ec3e1`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/positive-chain/handle.json` — `8d3bddafb1e37ad87a8aef7f7e4fdb11d89c820be211cd96082002bc48ed8099`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/nonempty-cycle/trusted/expected.json` — `e2ef5b5d2e6bd323ccd8a549732572498afc742b83ce4acfecd6fb8a3b39f14c`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/nonempty-cycle/handle.json` — `264870d13af2bed8eebce95ca3ddd386842c31dcc601ef9f4a8e0d6cb668fcc5`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/valid-boundary/trusted/expected.json` — `b4fd1dfdcc9280690660823b8ff11b98bfb47ba19cfc9f65505f895da81667e6`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/valid-boundary/handle.json` — `f9c68a4d0eb3d305ffe1930e95a3c8e4546907117a0948f512758167d0f14397`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/replay/trusted/expected.json` — `9380f0f16def802f1dbe4353fc9789f341123ba74cbf55ca565f6471c28ad298`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/replay/handle.json` — `576e82ecc0e13b31eaa79be1b8e0766c4a2d27b644cdcdbb0895c67177b1c89d`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/replay-exact/trusted/expected.json` — `7a5ab0a38259aa5b9bf41e97174e67dbb3e32a0aec1e4f097ec2002e452ad3e5`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/replay-exact/handle.json` — `a65e8e685d1e9b967573ca90950f7a02e308c39ecf455c20a0eae3ae4cca701f`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/offline-replay/trusted/expected.json` — `5452cb53cd2f958723db05deef9f89fbf51df55f0511cc12df78e962a11ec3e1`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/offline-replay/handle.json` — `8d3bddafb1e37ad87a8aef7f7e4fdb11d89c820be211cd96082002bc48ed8099`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/stale-evidence/trusted/expected.json` — `e48e8cbc4fbc6954de1f9264154e7e1b8ded0fca483adedecd594aaa7f1b2d5b`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/stale-evidence/handle.json` — `7eb779a6c7dd0354fe1b1759fabbcd21a6d3d9ca6f994f0ab73547dc5f81138b`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/missing-evidence/trusted/expected.json` — `5452cb53cd2f958723db05deef9f89fbf51df55f0511cc12df78e962a11ec3e1`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/missing-evidence/handle.json` — `8d3bddafb1e37ad87a8aef7f7e4fdb11d89c820be211cd96082002bc48ed8099`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/corrupt-model/trusted/expected.json` — `5452cb53cd2f958723db05deef9f89fbf51df55f0511cc12df78e962a11ec3e1`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/corrupt-model/handle.json` — `ba9aa01b973114aea91bf0fa39af2bf90b1867de5451894fd8dd7d91131ab09a`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/surviving-control/trusted/expected.json` — `5452cb53cd2f958723db05deef9f89fbf51df55f0511cc12df78e962a11ec3e1`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/surviving-control/handle.json` — `b6eea4a8faf3d40dc45bc00594283370ad92e9aa73d71753ba7aff9f37455c84`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/provider-disagreement/trusted/expected.json` — `5452cb53cd2f958723db05deef9f89fbf51df55f0511cc12df78e962a11ec3e1`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/provider-disagreement/handle.json` — `285856a86651ab86797be050dacc08114be530b1793fa55dacb130d7d36e5e4c`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/empty-denominator/trusted/expected.json` — `f0f3ca78a8dc34db173df4306a85d85600330aced80449c9a40decfb2d00e6a9`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/empty-denominator/handle.json` — `4fafc74a2d8aaf8d0c11d24a737a219b3dc79ddc4518fff2fc02b53080b6d775`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/extra-claim/trusted/expected.json` — `5452cb53cd2f958723db05deef9f89fbf51df55f0511cc12df78e962a11ec3e1`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/extra-claim/handle.json` — `1d8a0d8c1bbcb81c4aad1bd84e6e78553ef9bac76ed46f778bc2ea7f9fe8bb11`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/substituted-bytes/trusted/expected.json` — `5452cb53cd2f958723db05deef9f89fbf51df55f0511cc12df78e962a11ec3e1`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/substituted-bytes/handle.json` — `8d3bddafb1e37ad87a8aef7f7e4fdb11d89c820be211cd96082002bc48ed8099`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/mixed-run/trusted/expected.json` — `5452cb53cd2f958723db05deef9f89fbf51df55f0511cc12df78e962a11ec3e1`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-v3-inputs/mixed-run/handle.json` — `5cb04c527daa50914076ec372607bb5ced9ea7dc05f7a4ba1f8789389ecf172a`
