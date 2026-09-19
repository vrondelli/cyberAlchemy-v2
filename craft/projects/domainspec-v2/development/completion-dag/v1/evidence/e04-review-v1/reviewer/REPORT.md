# Independent E04 consumer-source review

Result: **BLOCK**. Reviewer: `/root/e04_source_reviewer`, one user-authorized native helper. Selected route: `CA2-ROUTE-VALIDATE` after entry bootstrap. Authority effect: none. This is source-review evidence for a product-construction frontier, not product acceptance or operational authorization. No ontology semantic records were dependencies; the governance profile was routing context only and ontology enforcement is suspended.

The exact original consumer manifest and execution dependency lock match REVIEW-REQUEST.json. Both consumer source files match their manifest hashes and sizes. All eleven request-bound source/context/evidence references checked here match their recorded digests. The selected execution lock matches E02's dependency lock binding and the frozen runtime-tree digest; all sixteen host references match file entries in that tree. This verifies recorded dependency correspondence, not current host runtime currency or a new provider execution.

## Blocking findings

### F1 — Native execution-stage details are not reconciled with checked raw evidence (P1)

Source: `e03-reachability-v1/consumer.py:249-260`, particularly lines 253-256. The code validates stage identity, state, digest, and predecessor chain but does not evaluate S6/S7 execution observations, their repetition denominator, replay result, or negative-control kill result. Walking native references at lines 262-269 only establishes byte-reference consistency.

Reproductions in `focused_probe.py`, against actual frozen positive-chain transfer buffers:

- `positive_stage_contradicts_raw`: change `/stage_receipts/6/details/observations/owns-reachability/0` to `exit_code=19`, `timed_out=true`, `matched_expected=false`, `error_code=TIMEOUT`, with a counterexample output, while its stage still claims `passed` and raw positive records say success.
- `negative_stage_survived`: set `/stage_receipts/7/details/mutations/0/killed_for_declared_cause=false` while native stage/raw summaries still claim a killed negative control.
- `positive_stage_observations_empty`: set `/stage_receipts/6/details/observations={}` and `replay_equal=false` while two successful repetitions and replay equality remain claimed elsewhere.

The probe rehashes changed stage payloads, predecessor links, aggregate evidence, referring bundle references, and handle file references. Caller expected inputs remain byte-for-byte unchanged. **Observed:** all five technical conditions remain PASS, including evidence-integrity. Aggregate remains not_evaluable only because no review digest is supplied. **Required:** these contradictory/incomplete stage records cannot receive evidence-integrity PASS; contradictions must aggregate BLOCK (for example EVIDENCE_CORRUPT or DENOMINATOR_MISMATCH). Truly missing evidence may remain not_evaluable with its causal condition.

This violates E01 `/acceptance_conditions/4` (no contradictory or extra claims) and E02's native-evidence consistency and denominator boundary. It is not a request to authenticate a hostile host. The contradiction is present in the supplied bytes themselves.

Minimal successor repair: validate the selected native stage payload shape and reconcile S6/S7 check/mutant identities, exactly two observations per case, process status, expected output, replay equality, and kill result with the selected profile and raw positive/negative results. Preserve BLOCK precedence and missing-evidence causality. Rehashing alone must not erase contradictory semantic evidence.

### F2 — Formal claim source and observed result are not joined to the positive claim (P1)

Source: `e03-reachability-v1/consumer.py:220-226`, especially line 222. The code compares machine_property, limits, provider, claim identity and broad status, but not the native claim's `source_ref` or `observed_details`. Generic reference traversal accepts a valid reference to the wrong graph.

- `claim_reports_positive_violation`: set `/claims/0/observed_details/violations=["N0"]` in the formal bundle although the positive graph is reachable and both checked raw records contain no violation.
- `claim_source_ref_is_negative_graph`: replace `/claims/0/source_ref` with the exact valid reference to `negative.json`, retaining positive `machine_property` and supported claim status.

Only the untrusted bundle and handle digests change. **Observed:** all five technical conditions still PASS. **Required:** evidence-integrity must BLOCK for the contradiction or mixed source identity. Expected inputs and valid raw evidence cannot excuse a contradictory formal claim.

Minimal successor repair: join the claim's positive source reference and observed details to the exact selected positive graph/raw result; validate remaining claim-bearing fields under the pinned native protocol (including evidence kind and preserved scope/assumptions) so contradictory or additional native claims cannot ride along with a technical PASS.

## Four review questions

1. **Independent tuple mapping and positive-length closure: supported for inspected implementation and bounded probes.** `consumer.py:73-109` selects all Entity tuples, sorts tuples by UTF-8 bytes, preserves edge provenance, checks selector uniqueness and owns endpoints, excludes non-owns links, removes every incoming target edge for the control, and seeds closure with actual edges. A separately authored iterative traversal oracle agrees on all 512 directed three-node graphs and all nine endpoint pairs: 4,608 checks. This covers zero-length self queries and nonempty cycles. Source enforces 1..64 Entities; no general formal proof is claimed.
2. **Exact input/native/negative/dependency joins: BLOCK overall.** `consumer.py:131-165` checks caller epoch, file identities, source bytes, profile/definition/lock linkage. Lines 180-212 check raw request/source/tool paths, native digests, fixed translation, invocation shape, exact positive/negative rows and summaries. The real baseline's five technical checks pass; stale epoch and un-rehashed raw tamper correctly BLOCK. However F1 and F2 demonstrate incomplete native semantic joins despite digest consistency.
3. **Consumer/IO independence: supported by full source inspection.** Pure consumer imports only base64, hashlib, json, re; no producer/EVF/process/filesystem implementation is called. The IO shell imports the consumer and standard library only, reads component-by-component with O_NOFOLLOW, rejects nonregular/oversized files, checks source manifest bytes against its own consumer.py/consume.py, and requires externally selected expected digest. The probe imports only the consumer under review, not producer, adapter, test fixture helpers, or EVF. Compiler certificate semantic validation and host closure checking remain trusted collector responsibilities explicitly documented in E03; they are not incorrectly treated as independently re-proven by the consumer.
4. **Unknown/failure behavior: supported for directly tested absences, insufficient for contradicted native details.** Missing handle and missing raw return not_evaluable; missing raw keeps the independently evaluable negative control PASS. No review digest keeps consumer-independence not_evaluable. Stale epoch and corrupt bytes take BLOCK precedence. No synthetic PASS review was injected. F1 still prevents a positive conclusion for all native failure behavior. Source errors at the CLI may emit a compact diagnostic rather than a full six-condition receipt; no broad malformed-input robustness proof is made here.

## Reproduction and limits

Run from any directory:

```text
python3 -B /home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/completion-dag/v1/evidence/e04-review-v1/reviewer/focused_probe.py
```

The probe reads frozen positive-chain inputs and mutates copies in memory. Its stdout is recorded in `probe-results.json`. It runs no provider or compiler. There are ten consumer scenarios: baseline, five semantic contradiction probes, missing raw, stale epoch, un-rehashed raw tamper, and missing handle; the independent graph oracle adds 4,608 cases. Five contradiction probes should have blocked and did not. No fake source-review authorization was used to force aggregate PASS. The initial probe launch exposed only an incorrect repository-parent calculation in the new probe; this was corrected before the successful recorded run.

The original E03 test source and E04 CHECKS were context, not the oracle for this review. No exhaustive host-tree reread, native execution rerun, full compiler validation, EVF product review, E05 acceptance, publication, or operational effects occurred. The parent separately owns frozen-campaign verification. No frozen E01/E02/E03/E04 byte was edited. Writes are limited to these four new reviewer files. A repair needs a fresh successor candidate, current test evidence, and a bounded follow-up review; this BLOCK record must remain historical evidence.

## Selected source references and SHA-256

Paths below are relative to the repository root. Transfer inputs used by the probe are bound by the listed handle and expected records.

- `projects/domainspec-v2/development/completion-dag/v1/evidence/e01-reachability-v1/DEFINITION-PACK.json` — `e2137df5b4c13c58f6e952c8204faa902f4db8463d42ffa0f68668064aa83e96`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e02-reachability-v1/contracts.json` — `db93284d0ace887d010e841bcfe42b3a5131f984e5680089bcec53b3f4145580`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v1/consumer-source-manifest.json` — `d0112ac9b2c904dcb07b2c8efd9fba3f9bb578986d3e9f1c07ddb85eff04634c`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v1/consumer.py` — `3acdd1a107f0bb4c718249f88dc7ad60258bd36f092b5f8a386ae8284b94af26`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v1/consume.py` — `5dc23a22dfdcaadb98a265cf2501d295995538947627fa3d6d8a352773fec828`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-reachability-v1/positive-chain/transfer/inputs/dependency_lock.json` — `d2d627f0d34156c12f9fd6ee48644a95d85cfec0f9967bada4231b216815f9ea`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v1/producer.py` — `3c5ef685dfa36bc4ebd5bc260b185fd30f40eed7cea88d7aa719697f7b300b0a`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v1/adapter.py` — `57d550a6e89c93735ff76e84021575ac9d19e672ba7cee86cb631c3b4f05a87a`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v1/compile_bridge.mjs` — `69bbdc509f40721969e6c78df2aac293491eef2b37413efad2e121d9525e589d`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-reachability-v1/runtime-tree-lock.json` — `f577a346f6bce8eedd0bcb6c1171401c9708fbec5b22e51bab1196aace31a8b9`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-reachability-v1/CHECKS.json` — `589d2d16965bf2e32fb38f5a3e285334e40ac6bfa37b59502c7c6c4149118f6e`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v1/README.md` — `babcf7be067aafb8357ecffcfa0698587f57e766578927ac622ce47ed2195127`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e03-reachability-v1/test_adapter.py` — `c435ff5b147851ffd72ab92c24c7a70c531e41aa4a123cc2e9609dc39454348a`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e02-reachability-v1/profile.json` — `a058d616ffc2ba551bf4fcaccfd78db27ad2c759332f5f1b50695edf7bd056db`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e02-reachability-v1/dependency-lock.json` — `0240b632a2c6e1fbddcd262e846aa335c6aa77f33142d8ff3873ac5f8383b7df`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-reachability-v1/REVIEW-REQUEST.json` — `f18b79976c00131290acac966e41a1f53776834deacd004028d4ea754f50c2cb`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-reachability-v1/positive-chain/trusted/expected.json` — `fe8ae79f6f09fedb060bd3bdbc94b36ae49d72e9fdf3859d77da2b9659cad4d6`
- `projects/domainspec-v2/development/completion-dag/v1/evidence/e04-reachability-v1/positive-chain/handle.json` — `30df82d1e1e050071b16fb544decc394536c4e378e314281a5f1c82161d3eb36`
- Reviewer output `focused_probe.py` — `72ab611d77be56fb20363d602e1151a297cf010559fb223ec6eeb7934a32eab1`
- Reviewer output `probe-results.json` — `f62d917ba0500c43f824fad13306920dccb0147e56f6a02d7d4a38b4b4d1eba0`
- Reviewer output `review.json` — `e4a8a39708a48b23f40c1bffc5b9aee8639134892b1c40f252d3f6243097ce1e`
