# G01 fresh r16 — exact failed-source archives admitted

Status, 2026-10-04: **24/24 byte-pinned exact failed-commit source archives pass the source-only safety and code-projection preview.** R15 remains terminal at 21/24 under its historical literal-owner root rule; the separately fixed [r16 rule](G01-BUGSWARM-FRESH-R16-RENAMED-ROOT-PROTOCOL-2026-10-04.md) re-inspected only slots 1, 6, and 20. Each had a single safe top-level root with the same repository basename and failed-SHA prefix, while the owner prefix reflected a repository rename. All other safe-path, member-count, regular-byte, per-file and 64 MiB projected-code caps remained unchanged. No archive was redownloaded or transferred to the VPS.

The private r16 `fresh-r11/source-archives-r16/RESULT.json` is SHA-256 `aca7cb5b46e166612c851dc536a962fa648a2a1ad2f3f59419cf2650a09db654`. Every r16 row rechecked its r15 archive byte count and SHA-256 against the WSL file. This is source acquisition, not source-code ranking, evaluator label admission, GLM quality, or a superiority claim.

Next: project the exact `.py` or `.java` source files into 24 isolated WSL code-only roots, then independently audit evaluator gold-path survival before freezing matched rankings and GLM packets.

## Open Questions

- Do the code-only materialized roots reproduce the previewed file/byte counts and stable tree digests?
- Do authenticated direct-Git-tree evaluator labels exist and survive for all 24?
