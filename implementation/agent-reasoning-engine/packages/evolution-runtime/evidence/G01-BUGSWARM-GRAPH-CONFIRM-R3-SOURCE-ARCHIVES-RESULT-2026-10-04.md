# G01 reserved confirmation r3 — failed-source archive result

Status, 2026-10-04: **terminal failed whole-cohort archive gate, 19/24 admissible** under the [prospective r3 rule](G01-BUGSWARM-GRAPH-CONFIRM-R3-SOURCE-ARCHIVES-PROTOCOL-2026-10-04.md). No model call, label, passing-commit source, rank, or score was opened. Do not score a 19-case subset or reinterpret r3 as passed.

The 24 exact failed-commit HTTPS codeload requests completed with HTTP 200. Two archives, slots 1 (`Tuxemon/Tuxemon`) and 16 (`UniversalMediaServer/UniversalMediaServer`), exceeded the frozen 100 MiB compressed cap; each retained 105,906,176 partial bytes and was not admitted. Three complete archives, slots 6, 9, and 23, failed the frozen root-name check. Their actual roots were `cookiecutter-cookiecutter-django-4daf3b2`, `fastapi-sqlmodel-ba43203`, and `besu-eth-besu-e14279f`; their metadata repository names were the earlier `pydanny/cookiecutter-django`, `tiangolo/sqlmodel`, and `hyperledger/besu`. Separate read-only HTTPS commit-page diagnostics returned 301 redirects to those current repository names with the same full failed-commit SHA and final HTTP 200. This identifies a credible rename-alias mechanism, but **does not repair r3**.

The r3 protocol SHA-256 is `b93c9352c74d4889683a26886e66829a490e550cc0974b8f67724dba5684d735`, acquisition script SHA-256 `586f7898b3cd806fb93b414851ed2cd6c6de0ee3c44a584f76c0d19bf018fbed`, and terminal result SHA-256 `fa6220e629a4e88a6e7cdeb6d3d8ec812ebf6d832d886f95fcb2e4377483f608`. All 24 receipts and complete or partial source blobs remain private under `/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-confirm-r3/source-archives/`; no VPS source checkout was made.

Next: a separately frozen r4 source-only rule may verify the exact HTTPS alias redirects and revalidate the three complete archives against their resolved canonical roots; it may fetch the two large exact archives under a larger, explicitly bounded WSL-only cap. Preserve r3 as failed and stop r4 if any slot remains invalid. Treatment, comparator, labels, and claims remain closed.

## Open Questions

- Do the two large archives finish within a larger bounded WSL-only cap and still satisfy code-projection safety?
- Can all three rename aliases be independently tied to the exact failed commit without weakening the archive path check?
