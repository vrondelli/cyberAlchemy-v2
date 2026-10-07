# G01 source type-link navigation development r1

## Fixed source-only hypothesis

All62 exposed r3/r4 cases, no new labels/providers. Build a lexical Java type-
reference graph from each tracked file's first20000Unicode characters. Mask
comments/quoted literals, resolve basename type identities through package,
explicit/wildcard imports, static import owners and qualified names. No global
simple-name fallback. Retain duplicate identities as candidate links, not unique
compiler bindings. This is not an AST, method-call graph, overload/type inference,
dynamic dispatch or semantic root-cause engine; nested/package-private types,
modern text blocks, truncated definitions and ambiguous imports remain limitations.

Source seeds: ordered caller observation paths plus expanded-query production
top5, deduplicated, at most8. Degree-normalized propagation for two hops, outgoing
weight.75/incoming.25, seed mass1/(ordinal+1), depth2 contribution halved. Sort
graph scores, ties by original expanded-query rank then lexical path. Add<=4
missing production paths from graph top20 to unchanged caller-reader union.
Match control width per case using expanded-query missing paths. All source
digests/counts must match original pinned ARE corpus receipts; keep source-link
witnesses for added candidates. Seal before repeated gold scoring.

Same source-pilot threshold: net>=2 mapped-file reachable cases beyond equal-width
control, positive improvement in both cohorts and no base reach losses. Keep
known incomplete JxPath-7 mapping explicit. A pass can motivate source-informed
comparator/reader development, never accuracy, fresh confirmation or superiority.
No threshold change or provider spend for a failed pilot.

## Implementation and tests

[Lexical linker/navigation](../research/arb-trace2code-r1/java-type-links-dev-r1.mjs),
[four tests](../research/arb-trace2code-r1/java-type-links-dev-r1.test.mjs),
[source-only generator](../research/arb-trace2code-r1/screen-defects4j-symbol-nav-dev-r1.mjs).
Tests cover comment/string exclusion, package/import scope, wildcard/static owner
links and source-backed two-hop witnesses. Shared post-seal mapped-file reach
scorer preserves the62-case denominator and unchanged source-pilot criteria.

## Completed result — 2026-10-06

The fixed source-pilot gate **failed**. r3 mapped-file reach remains30/32, equal
to base and width control; r4 reaches29/30 versus28/30 control. Only JacksonCore-7
improves. Net gain1 fails>=2, and r3 has no positive gain. Maximum28 candidates,
no base reach losses, all62 source counts/raw corpus digests verified against
pinned comparator receipts. Four linker/navigation tests and Node syntax checks
passed. No providers/fresh cases followed. Do not promote this exact graph rule.

[Source seal](/home/vlad_/are-benchmark-archive/defects4j-caller-r4/SYMBOL-NAV-SCREEN-DEV-R1.json):
`aa20392955205976305e48f50794afab76bdcba1c1e615c2c6def3ac98ef876a`.
[Shared-schema reach score](/home/vlad_/are-benchmark-archive/defects4j-caller-r4/SYMBOL-NAV-REACH-DEV-R1.json):
`e2cd89befdd797d66c488e45cafa8369e6da55e44a8cb4123f1304462f64ba0c`.
Shared scorer schema retains its multi-view name; the input seal and archive
filenames identify this graph experiment. The known incomplete r4 mapping stays
explicit and these are mapped-file reach numbers, not accuracy or confirmation.

The subsequent [trace/source fidelity audit](G01-DEFECTS4J-TRACE-SOURCE-AUDIT-R1.md)
identified a more fundamental bare-Git versus framework-fixture distinction.
Resolve that boundary before investing in compiler-backed navigation.

## Open Questions

This exact type-link rule did not advance beyond the fixed pilot threshold.
After fixture fidelity is established, are package/import heuristics precise
enough, especially with large reverse-reference neighborhoods? Is compiler-backed
symbol navigation worth its runtime cost? Complete-label representation,
reader evidence, live ARE, G02 quality/cost and broader G03 transfer remain open.
