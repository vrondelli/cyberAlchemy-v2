# G02 r11 issue-symbol navigation — exposed source-only screen

Status, 2026-10-04: **reject this exact static symbol-name proposal rule**.
No GLM call, ARE read, language server, native score, or fresh-cohort claim was
made. The nine Python tasks were already exposed development cases.

The [source-only sealer](../research/g02-product-r4/seal-g02-r11-issue-symbol-navigation-exposed-r1.py)
verified each exact clean base commit and scanned tracked regular Python
files of at most 256 KiB. It extracted identifier calls and backticked
identifiers from the task issue, required a matching call or definition in
ARE-delivered source, then proposed at most three non-delivered files with
at most five definitions for that symbol across the repository. Each proposal
retains its issue symbol, delivered source anchor, and target definition
location. Gold and prior evaluator labels were not read during selection.
The private `SOURCE-PROPOSALS.json` SHA-256 is
`6933b58b6058c8dbb273cd4284bcadba870b05452405a25b57d19e0806da444f`.

The separate [evaluator-only audit](../research/g02-product-r4/audit-g02-r11-issue-symbol-navigation-exposed-r1.py)
pinned the source result, prior relation union, task packets, and reference
parquet by SHA-256 and checked instance/base identities. Its counts-only
`EVALUATOR-AUDIT.json` SHA-256 is
`6d709fa0e2cd3ae29f76809f04470cd25d70856721f0823ec49bb78b8513bcb8`.

| Exposed Python tasks | Missed gold | Proposed reads | Gold proposals | New beyond prior union | New gold beyond union |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 9 | 14 | 9 | **0** | 2 | **0** |

The rule abstained on six Python tasks and proposed three files each on three
tasks. All nine proposals were non-gold. This is an exposed proposed-read
screen, not measured File-/Span-F1 or a live read-policy test. There was no
prospective numeric advancement gate for this exploratory screen; rejection
is a post-audit engineering decision based on zero useful proposals, not a
claim of statistical inferiority. Do not transfer this rule to a fresh cohort.
Task 5 alone has eight of the 14 missed Python gold files and received no
proposal; any successor needs to address that multi-file pattern rather than
only refine the ranking of this rule's nine proposals.

The failure narrows the next hypothesis: exact issue-name occurrence in an
already delivered file is not a sufficient anchor. A semantic navigation arm
would need a stronger **relation-specific** cue and should first prove
coverage and precision on exposed cases before language-server installation,
GLM selection, or fresh DSH comparison. The [external-method screen](EXTERNAL-LOCALIZATION-TECHNIQUES-2026-10-04.md)
remains a source of hypotheses, not an ARE result.

## Open Questions

- Which issue-to-source anchor can reach the 14 missed Python gold files
  without scanning thousands of irrelevant paths?
- Can a symbol's resolved import, call, or type relation distinguish a true
  target from the same-name non-gold definitions found here?
- What bounded alternative should be screened next before consuming fresh
  matched G02 tasks?
