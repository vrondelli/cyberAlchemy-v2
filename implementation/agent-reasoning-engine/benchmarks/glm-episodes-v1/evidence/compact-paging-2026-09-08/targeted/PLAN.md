# Compact paging v10 construction and targeted evaluation

Product frontier: prevent newest full observation from exceeding a fresh 8K/10K context while preserving verified delivery. Candidate compact-paging-v10 keeps bounded-reads-v1, 512 input margin, 2048 output reservation, 256 soft headroom and 12 model/24 tokenizer caps. Large read-file bodies become at most 5500 UTF-16 units per response. Explicit offset requests retrieve subsequent pages from the unchanged allowlisted source. Hash-verified gap-free delivered coverage satisfies full-file completion. One final response reserved; archive recovery remains separately required after recycling. Existing policies and defaults unchanged.

Runnable product work / DAG: prior diagnosis -> paged native result + coverage projector + independent report checker -> negative and resume tests -> full suite -> source freeze -> six fixed live trials -> checked outcome report. No oracle/fixture/request edits. Reading a page is not proof of model understanding.

Targeted schedule: long workload at 8K,10K,12K, clear then recent-observations-v2; one trial each, six total. This is tuning evidence, not independent generalization. Success target: all six repair + completion gate + recycling continuity, no reservation overrun; all reports valid and sources unchanged. Keep every failure; no retries/replacement or mid-batch changes. Per arm 12 model/24 tokenizer/580 seconds; aggregate 72/144, 3960-second batch start deadline.

Operational tasks and owners: agent runs owner-authorized bounded provider calls using existing secret references; product owner retains activation/deployment decisions. Affected stages: local GLM candidate and benchmark evidence. Causal blockers: test failures, source drift, provider availability. Deferred residue: general token-adaptive page sizing (current cap is a bounded candidate checked by the existing tokenizer admission guard), source attachments assembled from paged mutation files, independent unseen tasks, reordered-results repair investigation, pilot/default activation. No new ontology record dependencies. Native owner-directed CAV2-D65 construction; evidence grants no authority.

## Open Questions

Does a 5500-unit page fit these contexts while leaving enough turns? Will the model follow next offsets and still complete archive recovery? Other scripts/languages may need smaller pages; current admission remains fail-closed. Does reserving one synthesis turn affect repair quality? Four tasks are tuned fixtures, not unseen validation.

## V9 evidence and v10 refinement

V9 failed all six targeted trials: two 8K fresh-context blocks, one invalid final, three unmet completion gates. Its 5000-unit cap requires three pages for contract and cases, creating a 14-response lower bound including recovery/final. V10 uses 5500-unit pages, a compact control prompt and explicit next-required-read hint. That lowers this unchanged workload to ten reads plus archive recovery plus final = twelve responses. Existing v9 behavior retained for comparison. Both versions remain opt-in. No turn cap or token reservation increased. This is an adaptive refinement, separately frozen six-arm batch, not replacement of the v9 failures.
