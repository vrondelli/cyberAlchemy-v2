# G01 fresh r15 — exact source archive result

Status, 2026-10-04: **r15 archive gate failed at 21/24; no labels, ranks, or GLM calls.** All 24 final r14 slots were attempted once from the exact failed GitHub commit over HTTPS into private WSL storage. The private `fresh-r11/source-archives-r15/RESULT.json` is SHA-256 `f89074fa0239d68423ab0d2f2824ba9e21f534222aa8f90409b8bc02f58e0eae`.

All 24 downloads returned HTTP 200 with complete gzip bodies under the 256 MiB compressed cap. Twenty-one passed the frozen single-root, safe-path, source-projection preview. Three failed **only** the literal owner-derived tar-root check: slot 1 requested `volcengine/verl` but the archive root was `verl-project-verl-5dfe76b`; slot 6 requested `projectmesa/mesa` but root was `mesa-mesa-8381be0`; slot 20 requested `panic08/funpay4j` but root was `therepanic-funpay4j-985db35`. Each root retains the requested repository basename and exact failed-commit prefix, but r15's fixed rule required the historical owner string, so these three are not admitted under r15.

A separately frozen source-only r16 may inspect the **same byte-pinned three archives** and allow a renamed owner prefix only if there is one safe root ending in `-<requested-repo-name>-<failed-SHA-prefix>`, with all other member and code-projection caps unchanged. It must not fetch passing source, labels, or scores, and r15 remains failed. Even 24/24 source archives would not yet prove evaluator label availability or benchmark superiority.

## Open Questions

- Do the three renamed-owner archives pass every unchanged safe-path and code-projection limit?
- Do evaluator-only exact Git-tree labels exist and survive the projection for all 24 cases?
