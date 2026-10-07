# G01 trace/source compatibility and fixture fidelity — 2026-10-06

## Finding

The bare pre-fix Git checkout used by G01 is **not the canonical Defects4J buggy
fixture construction**. This limits interpretation of the historical campaigns
and makes fixture validation the next priority before more retrieval tuning.
Historical results already described adapted bare-Git experiments, not official
Defects4J or ARB leaderboard results; preserve their receipts and failed gates.
Do not rewrite them as canonical benchmark performance.

## Full exposed audit

Audited all62 r3/r4 cases without reading gold, patches or fixed source. Exact
buggy HEAD, clean status, query/packet bindings and caller-source identities were
checked.206 retained Java frames yielded190 matching tracked file/frame entries.
19 entries in18 cases have trace lines beyond the physical source file:7 r3
cases and11 r4.38 entries across37 cases lack the method token in that matched
source file:17 r3 cases and20 r4. Method-token absence is a lexical warning,
not proof of a missing declaration: inheritance, nested classes and compiler
bindings are not resolved. In-range lines likewise do not prove correspondence.

Two independently inspected examples:

- JxPath-6: recorded `VariableTest.testIterateVariable` line278, but the buggy
  tracked VariableTest file has275 logical lines and no such method token.
- JxPath-8: recorded `CoreOperationTest.testNan` line116, but its buggy tracked
  test file has113 logical lines and no such method token.

These counts follow the sealed audit's line parser, including an unterminated
final line; earlier prose used newline counts274/112. The audit receipt and
out-of-range finding are unchanged.

The existing observation policy rejects out-of-range frames. This demonstrably
discards those test contexts, leaving the generic assertion helper. It does not
prove that every retrieval/reader failure arose from this mismatch.

## Primary framework evidence

Pinned Defects4J metadata commit `6d54320e0db5a357f9ab38a8e4d2e5aead7e1c09`.
[Project.pm](/home/vlad_/are-benchmark-archive/defects4j-metadata-v3.0.1/framework/core/Project.pm:373)
implements `checkout_vid`: it obtains the post-fix revision, applies checkout
hooks/test/dependency setup, tags the fixed fixture, then applies the source
patch to construct/tag the buggy fixture. Later it constructs a separate pre-fix
tag from the original revision diff. Therefore the original pre-fix revision and
the framework's buggy fixture are distinct constructions. See the
[same pinned upstream source](https://github.com/rjust/defects4j/blob/6d54320e0db5a357f9ab38a8e4d2e5aead7e1c09/framework/core/Project.pm).
Local Project.pm SHA-256:
`b62cef271539edf2cc079853146a2b869d92ae4df626a6537b5c1543cadfd901`.

The current adapter fetches the original `buggy_revision` and materializes a
clean worktree at that commit; it does not call the framework's fixture builder.
This construction distinction plausibly explains mismatched regression-test
content and may explain some label representability problems; the latter needs
fixture evidence, not assumption. No fixed revision or patch contents were opened
by this audit. Filename inventory only established that patch artifacts exist.

## Evidence and validation

[Audit receipt](/home/vlad_/are-benchmark-archive/defects4j-caller-r4/TRACE-SOURCE-AUDIT-R1.json):
`084e4a2b6bf10ee6ac1e32eff127ace1ed188dbb0998723eba002f2243d59825`.
[Audit implementation](../research/arb-trace2code-r1/audit-defects4j-trace-source-r1.mjs),
[three tests](../research/arb-trace2code-r1/audit-defects4j-trace-source-r1.test.mjs).
Tests cover nested frame parsing, no line clamping, comment/string exclusion and
constructor-unknown handling. All passed. No providers or fresh labels were used.

## Next exact construction frontier

1. Produce one **exposed JxPath-8** canonical buggy fixture through the pinned
   framework, in isolated WSL archive storage. Trusted fixture preparation may
   internally require post-fix source and the inverse source patch; those are
   preparation-only inputs, never agent/model retrieval context. This is a new
   declared fixture boundary, not permission to contaminate historical runs.
2. Expose only the generated buggy fixture plus preparation identity receipts:
   metadata pin, framework version/tag, source tree digest, source/test inventories
   and failures. Keep raw fixed source, patches, gold and intermediate Git history
   outside candidate acquisition. Fail closed if the isolated output boundary
   cannot be demonstrated. No provider calls for this preflight.
3. Verify recorded test/method/line correspondence and compare production/test
   source identities to the old bare-Git view. Do not assume an in-range line
   suffices or silently copy regression tests into old sealed worktrees.
4. If fidelity is established, prepare a distinct **exposed development** campaign
   with all comparators on the same generated buggy corpus; freeze its evidence
   and exposure contract before any reader requests. No historical score repair.
5. Fresh confirmation waits for that development evidence and a separately
   prospective complete-label representability contract. Do not scale down the
   quality gate or repeatedly open unchanged fresh cohorts.

Product work: bounded fixture-adapter prototype and integrity tests. Operational
support: installed permanent WSL Java/Ant/Perl dependencies if the pinned checkout
requires them; Java was initially absent (installation progress below). Tooling availability is an
exact fixture-stage dependency, not evidence of benchmark superiority. Publication,
deployment, candidate admission and product-wide claims remain separate.

### Construction implementation — 2026-10-06

The permanent WSL [bootstrap](../../../../../tools/toolchain/bootstrap-defects4j)
and [launcher](../../../../../tools/toolchain/run-defects4j) keep the pinned
framework runtime separate from the metadata checkout. Temurin11.0.32.1+1 and
cpanminus1.7048 payloads are SHA-256 verified. Java, all8 declared Perl modules and
official framework resources are now installed; the pinned framework smoke check
passes. [Installation receipt](/home/vlad_/.local/share/are-toolchains/defects4j-v3/INSTALLATION.json)
SHA-256:`8874ec2d46109f537392ba5f019b77844eef4f0f20a91c2aed3d8bea1f6ac491`.
Perl's baked-in compiler name required explicit
ExtUtils/Module::Build overrides to use the existing shared GCC launcher, supplied
through local-lib environment configuration because cpanminus's local-lib option
resets those overrides. Pinned user-local `unzip` and libcrypt headers/runtime
resolve missing host prerequisites. An inherited `NO_COLOR` suppressed ANSI output
expected by YAML::PP's tests; all8 affected tests pass with that flag removed only
in the installer child. No `--notest` or `--force` bypass is used; upstream optional
test skips remain as reported by upstream suites. Failed attempts are retained
under the private runtime's `logs/` directory.

The [one-case preflight](../research/arb-trace2code-r1/preflight-canonical-jxpath8-r1)
captures trusted checkout logs privately, then invokes the
[buggy-only projector](../research/arb-trace2code-r1/project-canonical-buggy-fixture-r1.mjs).
Projection requires exact generated buggy-tag HEAD, a clean preparation tree,
regular tracked Java blobs, non-overlapping boundaries and an exclusive output.
Only Java source is exported; build properties, Git history and raw framework logs
remain excluded. The receipt explicitly acknowledges preparation's internal
fixed/patch/gold access instead of claiming the full framework is gold-blind.
Three projector tests pass; with the existing audit/navigation tests,10/10 pass.
Those tests validate the boundary, not ranking quality. The real JxPath-8
construction and execution preflight has now passed as described below.

### Real exposed JxPath-8 result

The official pinned framework generated the requested BUGGY_VERSION fixture.
Its isolated projection contains209 Java files, the same paths as the old bare
view, with2 modified identities: `CoreOperationRelationalExpression.java` and
`CoreOperationTest.java`. The canonical test file has126 logical lines and
`testNan`; recorded line116 is in range. The bare file has113 logical lines and
no such method token. The unchanged `JXPathTestCase.assertXPathValue` frame is
also present.

The framework compiled the tests successfully and ran the exact exposed selector
`org.apache.commons.jxpath.ri.compiler.CoreOperationTest::testNan`, reporting
1 failing test. Both retained query frames reproduced at their exact lines:
`assertXPathValue:63` and `testNan:116`. All209 source identities remained unchanged
through execution and still match the sealed Java-only projection. This confirms
one concrete source/trace mismatch and verifies the canonical construction for
this case; it does not prove every case or an ARE retrieval improvement.

- [Projection receipt](/home/vlad_/are-benchmark-archive/defects4j-canonical-jxpath8-r1/buggy-java-only/RECEIPT.json):
  `6ae5e5de96dd6e1e347d6f4d8b5eacf0e8f75e3980896f5d0736835b24e4d61e`.
  Source-tree seal:`2acf7197c663a2cfbad1242c580e8f211b3da44662f307a39bcbb5fb11a8232c`.
- [Fidelity inspection](/home/vlad_/are-benchmark-archive/defects4j-canonical-jxpath8-r1/FIDELITY-INSPECTION.json):
  `c2f9a108da5f010d74dab59daf80a81ff5b14933901d287f2a6fb2f77858cb10`.
- [Execution receipt](/home/vlad_/are-benchmark-archive/defects4j-canonical-jxpath8-r1/REPRODUCTION-RECEIPT.json):
  `4f18032d2d09bc909d285ae12fb16f508b132f7b8a6f4a611a06a75adb83aae3`.

Raw checkout, fixed/history tags, generated build properties and preparation logs
remain in the separate trusted stage; none were sent to a provider. Source-only
inspection initially used the shorthand case ID, then corrected it to the
manifest's exact `Defects4J-JxPath-8` identifier before producing its receipt.
No sealed historical campaign was edited. Next: a separately routed exposed
canonical-source development comparison, beginning with label representability
and matched comparator inputs, before any fresh confirmation or superiority claim.

That next [full exposed source stage](G01-CANONICAL-SOURCE-DEV-R1.md) now completes
all62 canonical projections and matched ARE/RepoMap comparisons. All73 labels map,
all observed range/method warnings disappear, and the unchanged r4 candidate
policy remains mathematically short of its six-hit gate. The linked note owns
the next source-navigation hypothesis, exact receipts and open questions. Do not
interpret corpus repair as admission of a historical failed campaign.

## Open Questions

The one-case buggy-only isolation and exact retained-frame reproduction are
verified. Can that boundary and reproduction scale across the exposed cohorts?
Does canonical source resolve JxPath-7's unmappable label? How much of existing
quality changes is fixture fidelity rather than retrieval method? Full source/
trace execution reproducibility, total cost, live ARE delivery, G02 quality/cost
and broader G03 transfer remain unresolved.
