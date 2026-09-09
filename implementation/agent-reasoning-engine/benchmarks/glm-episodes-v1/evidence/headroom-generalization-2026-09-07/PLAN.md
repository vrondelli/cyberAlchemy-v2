# Headroom and generalization construction

D65 owner-directed continuation: “plan and do, dont stop until we have a result”.

Product DAG: remove duplicate progress digests from prompt only → preserve exact ledger, source attachment and patch hashes → test → freeze → two paired8K tuning trials → require repair, continuity and minimum256 tokens headroom → fixed broader evaluation → separately report12K continuity workload. Failed trials remain counted. Any further tuning requires a separate frozen version; never tune during the fixed evaluation.

New opt-in deduplicated-state-v6 inherits v5. No parser, oracle, delivery or retention algorithm changes. Default policy and default two-episode selection remain unchanged. Additional episodes require explicit selection. Archive-slice-bounds extracts the repository's UTF-16 slicing behavior with a controlled mutation and independent eight-case oracle. Retention-long-window adds two dense long-ID pairing documents and requires six distinct reads; same retention repair oracle, separate workload identity.

After tuning succeeds, evaluate exact-json-scoring and archive-slice-bounds twice per policy at8K (eight arms), plus retention-long-window twice per policy at12K (four arms). No failure replacement; per arm12model24tokenizer580seconds, hard16384, output reserve2048, token margin256, safety margin1024. Every batch freezes its schedule and all source hashes. Continuity is reported separately from repair, and requires actual recycling and archive recovery. No claim about provider-internal compaction.

Operational owner: user/operator for credentials/provider availability. No operational prerequisite blocks local work. Publication, deployment and default activation remain deferred owner decisions. No additional ontology-runtime prerequisites.

## Open Questions

Does reduced duplicate state preserve behavior on new tasks? Does the longer workload exercise recycling at12K for both policies? Are observed rates stable beyond this bounded evaluation?


## Tuning iteration 2

Iteration1 repaired4/4 but only2/4 exercised continuity and minimum headroom was3. A smaller prompt let more history survive, so prompt reduction alone cannot guarantee reserve. Opt-in reserved-headroom-v7 inherits v6 and explicitly uses configured soft limit minus256 as its effective recycling threshold. Output reservation and tokenizer margin are unchanged. Reports verify the declared reserve and every dispatched bound. Freeze a second four-arm8K batch; same acceptance target.
