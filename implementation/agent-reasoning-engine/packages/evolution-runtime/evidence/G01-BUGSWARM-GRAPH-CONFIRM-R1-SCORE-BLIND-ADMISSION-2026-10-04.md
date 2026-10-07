# G01 BugSwarm graph confirmation r1 — score-blind source/log admission

Status: fixed before accessing the reserved confirmation cases beyond their sealed metadata IDs. The reserved 12 Python + 12 Java repositories come from the immutable graph-development r1 split (SHA-256 `6630be1c012aa027f3b525ffa3b1382e7f5ab751b84c8547eb9c679a16d68a85`). This r1 preflight does **not** fetch patch diffs or passing-commit source, rank files, call GLM, or score any case. Preflight is not confirmation itself.

## Exact r1 preflight

Use those 24 metadata candidates in original reserved order; verify all are repository-disjoint from the earlier exposed, graph development, and B-development cohorts. For each case, use only its exact failed commit and failed job ID:

1. Check the exact failed commit through GitHub's HTTPS codeload archive `HEAD` endpoint. HTTP 200 means *availability only*; a later acquisition must verify archive identity and safe paths.
2. Fetch `https://www.bugswarm.org/artifact-logs/{job_id}/raw/` with TLS certificate verification and no automatic retry. Require a successful complete transfer, nonempty UTF-8 content, and at most 8 MiB. Read the HTTPS job page separately and require that it identifies the same numeric job ID and repository link. Preserve the raw log privately with SHA-256 and byte length; do not print its body or export it to an evaluator label path.
3. Record every attempt, status, byte length, hash, failure reason, and script/input pins. Copy the exact VPS receipts and complete logs into private WSL cold storage with a matching full-file hash inventory.

This r1 preflight attempts exactly 24 candidates. If any source or log condition fails, stop **admission** with the full 24-case denominator visible. Do not score a reduced subset, replace a case in place, or reinterpret a partial HTTPS body as a mismatch. A separately fixed r2 rule may later replace only failed slots using the existing source order, the same language and reserved hash partition, and repository exclusions, without opening labels or scores. That rule must be sealed before replacement requests. Passing-commit label admission and source-side prediction sealing are separate later stages.

If all 24 r1 cases pass, the subsequent prospective treatment protocol must choose the raw-listwise r8 selector or another exact frozen variant before any evaluator label is opened. The r8 B-cohort score is development evidence only. Confirmation must match the ARE and graph-r2 comparators on the same 24 cases, account for full quality and provider cost, and retain an untouched outcome denominator. Any claim is bounded to the exact task, population, metric, and cost tradeoff; no general product superiority follows automatically.

## Open Questions

- Will complete BugSwarm HTTPS logs and exact GitHub failed commits be available for all 24 reserved cases?
- If a score-blind r2 replacement is needed, how many same-partition, repository-disjoint metadata candidates remain before a predeclared cap?
- Can subsequent HTTPS Git-tree label admission verify all old-source gold paths without exposing them to source-side ranking?
