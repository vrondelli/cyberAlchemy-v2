# Independent successor consumer-source review

**Result: BLOCK**, with original F1/F2 resolved and one adjacent remaining finding F3. Native reviewer: `/root/e04_source_reviewer`. Route: `CA2-ROUTE-VALIDATE`. Authority effect: none. This follow-up uses the same one authorized reviewer and exact selected execution dependency lock. No ontology semantic dependency or operational authority is claimed.

## Source currency and original findings

The eight files listed by `e03-reachability-v2/candidate.json` match their hashes. Only consumer.py implementation bytes changed; consume.py, producer.py, adapter.py and compile_bridge.mjs are byte-identical to the original. The consumer manifest lists the actual source hashes and sizes. The original consumer still hashes to `3acdd1a107f0bb4c718249f88dc7ad60258bd36f092b5f8a386ae8284b94af26`. Original review bytes were not changed. The dependency lock remains `d2d627f0d34156c12f9fd6ee48644a95d85cfec0f9967bada4231b216815f9ea`.

The independent probe reran all five original F1/F2 examples against actual successor positive-chain transfer buffers. All now aggregate BLOCK: wrong claim source gives MIXED_RUN, contradictory claim details and stage observations/kill/replay information give EVIDENCE_CORRUPT. Four adjacent cases also BLOCK: wrong claim evidence kind, removed claim assumptions, extra negative observation and mismatched positive stdout hash. The source repair joins the claim source/result and validates all thirteen stage detail shapes, with closed stage fields and S6/S7 input-reference joins.

## F3 — Verification receipt can carry contradictory reasons or authority (P1)

Source: `e03-reachability-v2/consumer.py:301-302`, the verification receipt digest and selected field checks immediately after stage validation. The current predicate checks schema, passed verdict, stage IDs, recomputed passed aggregate, reference currency and replay equality. It does not require the native receipt's `authority_effect` to be `none`, does not require an empty `reason_codes`, and does not close its record fields.

Two isolated in-memory reproductions preserve caller expected inputs and all compiler, graph, raw and runtime identity bytes:

- `verifier_authority_contradiction`: change evidence `/verification_receipt/authority_effect` from `none` to `deployment-granted`.
- `verifier_reason_contradiction`: change evidence `/verification_receipt/reason_codes` from `[]` to `["COUNTEREXAMPLE"]` while retaining `verdict=passed` and `recomputed_aggregate_state=passed`.

The probe recomputes the native verification receipt digest, enclosing evidence digest, referring bundle references/digest and handle file references/digest. No externally selected review digest is provided or fabricated. **Observed:** all five technical conditions still PASS in both cases; aggregate remains not_evaluable solely because consumer-independence is unreviewed. **Expected:** evidence-integrity and aggregate BLOCK because the supplied native record is internally contradictory or asserts authority outside the selected scope. A valid hash does not resolve this contradiction.

This is an E01 evidence-integrity/no-extra-claims defect and a pinned-native-protocol/authority-ceiling violation, not an attempt to establish untrusted-host authenticity. The verifier record is explicitly part of the consumer's integrity check and should not be treated as opaque prose when its other fields are validated.

Minimal repair: validate the exact pinned verification-receipt key set, require `authority_effect == "none"` and `reason_codes == []` for its claimed passed state, retain existing verdict/stage/replay checks, and add regression probes for unknown fields and those two contradictions. Use a new candidate or explicit permitted unfrozen successor scope; do not change this review or prior frozen candidate bytes.

## Review questions and validation

1. Independent tuple mapping and positive-length closure remain supported for the inspected bounded implementation: their implementation bytes are unchanged, and the independent iterative traversal oracle again passes all 4,608 three-node graph/query cases.
2. Exact input, raw, negative and dependency joins retain earlier positive evidence; F1/F2 are repaired, but F3 prevents a passing native-integrity review.
3. Consumer and IO remain independent of producer/EVF code. The new checks import no additional code; consume.py is unchanged. Compiler semantics and runtime-tree execution verification remain the documented trusted collector boundary.
4. Missing handle/raw/review still remain not_evaluable. Stale epoch and corrupt bytes remain BLOCK. All fifteen supplied successor transfers were independently evaluated: six positive/replay technical baselines remain not_evaluable only for missing review, the missing-evidence case stays not_evaluable, and eight invalid-evidence cases BLOCK. F3 still permits a contradicted verifier record to retain technical PASS.

`focused_probe.py` runs 16 consumer scenarios plus 15 supplied replays and 4,608 independent graph checks; `probe-results.json` records complete receipts. No producer, adapter, E03 unit-fixture helpers or EVF modules are used as the probe oracle. Run:

```text
python3 -B /home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/reviewer-successor/focused_probe.py
```

This was retained-evidence consumption, not a fresh provider run, product approval, external effect, or runtime-currentness certification. Writes were only these four new reviewer-successor files. The original BLOCK review remains historical. Parent owns successor campaign closure and any additional repair scope.

## Selected references and SHA-256

- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v2/candidate.json` — `e7e3e0d695bce1b6a125ac8cf63aedd4033d6806c255e4b37f5d07ebcb1a53d1`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v2/consumer.py` — `af57ed9d232d98812abdf27bfb66d95e793d6406e90fcb195cdbb40587dde122`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v2/consume.py` — `5dc23a22dfdcaadb98a265cf2501d295995538947627fa3d6d8a352773fec828`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v2/consumer-source-manifest.json` — `f384adddd3aff1133087838eab60dbe9bd307392c1068f1501fecf6ed01580bc`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v2/README.md` — `6e0bf076a75476369ab26cb82d3fa6c97917779cc653a0382fc278ab872351b7`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v2/producer.py` — `3c5ef685dfa36bc4ebd5bc260b185fd30f40eed7cea88d7aa719697f7b300b0a`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v2/adapter.py` — `57d550a6e89c93735ff76e84021575ac9d19e672ba7cee86cb631c3b4f05a87a`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v2/compile_bridge.mjs` — `69bbdc509f40721969e6c78df2aac293491eef2b37413efad2e121d9525e589d`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v2/producer-source-manifest.json` — `f250b061a891a5e92d6c7e5f684dbefd24b774d741597372fcf296bcad91f63d`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-reachability-v1/positive-chain/transfer/inputs/dependency_lock.json` — `d2d627f0d34156c12f9fd6ee48644a95d85cfec0f9967bada4231b216815f9ea`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e01-reachability-v1/DEFINITION-PACK.json` — `e2137df5b4c13c58f6e952c8204faa902f4db8463d42ffa0f68668064aa83e96`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e02-reachability-v1/contracts.json` — `db93284d0ace887d010e841bcfe42b3a5131f984e5680089bcec53b3f4145580`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/reviewer/review.json` — `e4a8a39708a48b23f40c1bffc5b9aee8639134892b1c40f252d3f6243097ce1e`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/reviewer/REPORT.md` — `e8af304bf7411ffc42e1fb2b2d332820aaafbdfc791390bfa084dfdc8806d6a1`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-inputs/positive-chain/trusted/expected.json` — `f068e9fb179e19f9cdaa45d8983f0b9a2dbaf909d5040f0b41c85cef914a11c7`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-inputs/positive-chain/handle.json` — `a7ad3faf07457863adf387491d23001a7463eb326ef9464d03a27cf5af2e4e15`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/successor-unreviewed-checks.json` — `6b389f9323b82dfe597d113338efc59d3c703d50a67c754bd0b32d11efe3ad79`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/reviewer-successor/focused_probe.py` — `6aefe48555c3d0d94cf56a5ccbbce1ef42f41378c632718a009b70dbddb21c78`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/reviewer-successor/probe-results.json` — `ffdb30433f786d6957c79970bab2b498df815ec63adff4b36718393e35ef7b12`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/reviewer-successor/review.json` — `86a934677260cd2b060e44c1494769a9fddc31239c2684a6d21ca7eb90b69ea2`
