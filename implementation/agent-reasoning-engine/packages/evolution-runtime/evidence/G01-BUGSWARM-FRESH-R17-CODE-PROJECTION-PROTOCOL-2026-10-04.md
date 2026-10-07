# G01 fresh r17 — exact failed-code-only projection

Status: fixed before r17 materialization. Inputs are r14 source/log result SHA-256 `2f266bba198a1a72f2fdf55418c0ad284cb02a06f8e262f0dcd6d5a21e4ebcc1` and r16 exact failed-source archive result SHA-256 `aca7cb5b46e166612c851dc536a962fa648a2a1ad2f3f59419cf2650a09db654`. Neither passing source nor evaluator labels may enter this step.

For each of the 24 identity-matched slots, recheck archive path, size and SHA-256, then materialize only regular `.py` files for Python or `.java` files for Java from the inspected single root. Skip files larger than 1 MiB; cap total projected bytes at 64 MiB per case. Require safe relative paths, no duplicate destination, and exactly the code-file count and bytes admitted by r16 inspection. Create one isolated private WSL root per slot, initialize a local Git index and add only projected code files. Require the tracked path set to equal the projection set. Seal a deterministic sorted path-and-content SHA-256 tree digest for each root, with all file/byte counts and no labels or model calls. Do not send archives or roots to the VPS.

If any slot fails, stop r17 and do not score a partial denominator. Code-only roots still need evaluator-only direct-tree gold-path survival and source-only query/ranking freezes before model calls.

## Open Questions

- Can all 24 byte-pinned archives reproduce their inspected code-file and byte counts in isolated roots?
- Will every evaluator gold path survive the source-only projection?
