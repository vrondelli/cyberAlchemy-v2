# G01 fresh r14 — score-blind source/log repair result

Status, 2026-10-04: **24/24 exact failed-source HEAD and complete original-log availability slots filled; source archives and evaluator labels are not yet admitted.** The [prospective r14 protocol](G01-BUGSWARM-FRESH-R14-SCORE-BLIND-REPAIR-PROTOCOL-2026-10-04.md) preserved eleven r13-admitted cases, then traversed the sealed same-language source-order queue to replace thirteen failed slots. Queue SHA-256: `1b89ccc6cbc1b82874909c684888af61e35b42e03802269e4343875612cb43bd` (56 Python and 32 Java candidates). All replacements were selected without patch paths, passing-commit source, rankings, scores, or model outputs.

Five Python replacements consumed the first five Python queue candidates; eight Java replacements consumed 17 Java candidates. Thus **22** network attempts filled **13** slots. Every failed attempt and each successful log/page/header body remains in private WSL archive under `fresh-r11/repair-r14/run/`. The final `RESULT.json` is SHA-256 `2f266bba198a1a72f2fdf55418c0ad284cb02a06f8e262f0dcd6d5a21e4ebcc1`. An independent replay checked all 24 final repository identities, source-order use, first-success stopping, TLS-returned page-header markers, raw-log byte hashes, full `Content-Length` equality, and every admission decision. Its `AUDIT.json` is SHA-256 `7ffa068558092b0be67c997f86266806a34199ea0710c5bae562609e32008696`. The 24 final repositories are distinct.

This is an availability-selected, repository-disjoint **source/log cohort**, not a benchmark score. Next gates: acquire and validate each exact failed-commit source archive in WSL; materialize bounded code-only roots; independently derive and authenticate passing-versus-failing Git-tree patch-path labels in evaluator-only storage and verify projection survival; freeze ARE, graph/test-edge, failed-test-query acquisition, 8K packets and GLM predictions before reading labels. Any subsequent result must disclose the 22 replacement attempts and full source/log admission rule.

## Open Questions

- Can all 24 exact failed-source archives pass safe-path and code-projection caps, especially larger repositories?
- Will evaluator-only direct-tree labels exist and survive projection for all 24 without label-based replacement?
- Does the frozen r10 treatment transfer with 24 valid 8K calls and the full matched claim gate?
