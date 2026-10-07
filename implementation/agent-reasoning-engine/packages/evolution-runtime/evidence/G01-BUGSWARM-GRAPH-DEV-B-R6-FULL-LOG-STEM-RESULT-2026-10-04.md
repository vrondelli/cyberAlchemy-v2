# G01 BugSwarm cohort B — full-log stem screen result

Status, 2026-10-04: **the separately fixed r6 development-advancement gate
failed.** No GLM call was made, and the reserved confirmation partition was
not opened. This is private exposed development, not ContextBench, live ARE,
or a product superiority result.

The earlier [r5 pairwise protocol](G01-BUGSWARM-GRAPH-DEV-B-R5-PAIRWISE-PROTOCOL-2026-10-04.md)
fixed at least 20/24 candidate reach before any GLM call. Its sealed r2/r3
union packet contains at most 49 candidates and 11,968 prompt bytes, but an
evaluator-only screen found only **19/24** gold-reachable cases. R5 therefore
did not dispatch model calls; it cannot pass its own advancement gate.

The separately fixed [r6 acquisition rule](G01-BUGSWARM-GRAPH-DEV-B-R6-FULL-LOG-STEM-PROTOCOL-2026-10-04.md)
scanned exact unique non-test source-file stems across complete original
failure logs, adding at most 20 paths per case without removing any union
path. Its [source-only script](../research/arb-trace2code-r1/acquire-bugswarm-graph-dev-b-r6-stems.py)
sealed 24/24 complete candidate lists. Private candidate SHA-256 is
`ee28398434ed026aedc8275fe96983d71510a337f42087ce1799b038a9b57bf4`;
seal SHA-256 is
`a45c86edaa249bc98acfde3970a24e8b7c00da61df8a490358c024f811a6aa82`.
The [evaluator-only reach audit](../research/arb-trace2code-r1/evaluate-bugswarm-graph-dev-b-r6-stems.py)
produced receipt SHA-256
`74c8e1cbe986de12d5975f4dcd1246b313843d1892a437c094d6ded811b4d73e`:
reach **19/24→19/24**, zero gains, zero losses, maximum 69 candidates.
The predeclared 20/24 reach condition failed, so no r6 GLM campaign follows.

Evaluator-only diagnosis identifies five remaining misses. Two Python gold
stems occur as exact log tokens but are outranked by frequent incidental
stems. Two Java gold stems appear in longer test-class identifiers such as
`OperationControllerIT` or `OpcUaXmlEncoderTest`, which the exact-stem rule
does not map. The fifth (`FieldAnswer`) is absent from the failure log.
These observations suggest a *new*, separately versioned hypothesis:
failure-context weighting, test-to-source name mapping, and a fallback for
log-silent files. They do not authorize changing r5/r6 after scoring or
claiming transfer from the same exposed cases.

Original BugSwarm logs/diffs remain unauthenticated HTTP payloads. The next
development test must preserve source/evaluator separation and report full
cost; any superiority claim still requires an untouched, provenance-admitted
confirmation population and end-to-end parity.

## Open Questions

- Can failure-context and test-name mapping increase reach under the same
  bounded packet budget on a distinct development population?
- What non-log evidence can identify correct but log-silent source files?
- Can the original log and diff provenance be authenticated or reproduced?
