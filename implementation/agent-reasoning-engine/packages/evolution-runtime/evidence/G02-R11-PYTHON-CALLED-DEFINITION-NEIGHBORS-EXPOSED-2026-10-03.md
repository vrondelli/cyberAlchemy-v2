# G02 r11 Python called-definition import-neighbor gate

Status, 2026-10-03: **rejected on exposed development; no model or ARE read dispatched**.

The source-only candidate generator used the previously sealed Python direct-import graph and ranking for the nine scored r11 Python tasks. It extracted exact call/backtick identifiers from each issue, removed Python builtins and names shorter than four characters, and proposed only read-cap-eligible import-neighbor files whose pinned-base Python AST defines an identically named function or class. It ranked matches by exact-symbol count, then the prior source-only rank, with a maximum of three paths per task and abstention otherwise. The generator read no native labels, scores, comparator output, or prior audit receipt. Its source seal was fixed first at SHA-256 `ceaea1351298880fddd75c697aabaf7f0c38d77c4e8add8582619039cf2875e5` under `/home/vlad_/are-benchmark-archive/g02-r11-python-called-def-neighbors-exposed-r1-20261003/`.

The later evaluator-only audit verified the sealed task/base identities, graph membership, absence of already-delivered paths, and parity of archived native file-score counts. The gate abstained on **6/9** tasks and proposed **9** files on the other three. It found **1** new gold file and **8** false positives. An additive file-set replay, which assumes all proposed paths are selected without rerunning ARE, moved nine-task mean File-F1 **0.642411→0.594880**: one task improved, two regressed, six were unchanged. The evaluator receipt SHA-256 is `e177bc68f5c92fc879759b5a314010933c09f4ab4ee563425eeabb41a9ceb50a`.

This rule is not eligible for fresh G02 dispatch. Exact issue-named definitions among direct import neighbors did not supply the necessary precision, and a post-hoc adjustment to the three proposing tasks would overfit this exposed slice. No actual reads, Span-F1, full-episode cost, independent cohort result, or superiority claim follows.

## Open Questions

- What source relation raises *candidate coverage and precision* together, beyond direct imports, direct includes, exact quoted literals, and code BM25, without using opened labels to choose paths?
- Can that mechanism pass a separately sealed, multi-repository exposed development test before an untouched paired G02 cohort is frozen?
