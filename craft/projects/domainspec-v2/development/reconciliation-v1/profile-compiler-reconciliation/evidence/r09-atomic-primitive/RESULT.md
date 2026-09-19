# R09 atomic no-replace primitive — isolated candidate

2026-09-13. Product construction; authority effect none. This is run-local prototype evidence, not a shipped native dependency or completion of R09.

## Result

### Current — normal CLI integration and optional restricted-mode handling

The user resolved the decision: "yes maintain current behavior of the cli and optional handling for the edge case". All three atomic writers are integrated. Normal CLI uses the bundled no-replace helper without extra flags or compiler installation. Node permission-mode processes can plan and inspect artifact currentness but receive a structured unavailable error before this output path creates files. No permission grant, unsafe fallback, new public export or release occurred.

**Final focused run97258 exits0:49/49 tests pass, zero skipped/cancelled/TODO,63.454 seconds.** [Machine evidence](normal-cli-result.json) records the exact TAP digest, selected source hashes and verification scope. Native emitted API tests run normal publication in a container with only the relocated fixture mounted; no checkout/development dependency mount is supplied. Separate permission-mode processes with read-only filesystem grants prove planning/currentness, source-checkout denial, unavailable output errors and absent targets. Actual emitted CLI `build`, `instantiate`, and `instantiate-project` commands return the expected structured error/exit22 under that mode. Original exact receipt, import, output-layout, native compound behavior and legacy-language assertions remain covered.

The shared helper passes final-claim conflict/interruption checks through all three public writers, plus a real two-process public publication race. One complete winner is retained, the other attempt rejects, and unrelated files survive. A directory-open failure after successful mkdir is now cleaned with identity checks and empty-directory removal, never recursive deletion of a replacement.

Full strict CLI typecheck57919 exits0; all six source materializers73903 exit0, including the native payload check. Build/typecheck and normal test scripts now register these checks. The native payload remains14,408 bytes. `git diff --check` passes for the scoped tracked changes.

Earlier runs remain evidence, not rewritten:89900 passed44/45; the added legacy branch first lacked shipped Lean fixture assets, and98831 exposed use of a successor Calculation-v2 fixture through the deliberately unsupported legacy formalizer. The fixture now includes the shipped Lean assets and a separate canonical legacy source.14939 then passed;81475 additionally passed actual CLI permission-error assertions;16816 passed3 public-writer race/interruption tests.97258 is the clean final49-pass run, not a composite pass claim.

Task-session result: PASS for this selected integration/edge-case change, with decision/evidence synchronized. Context-builder selected the R09 visibility contract, three writers, native adapter/helper, emitted public tests and permission-mode decision. Local execution; no subagent or runtime handoff. ARE182 uses the exact user response and existing owner-directed scope. **R09 overall is still in progress**: complete its remaining architecture/naming/source-order/module-root and full safety matrix before R10–R18. No remaining owner decision is identified for the permission boundary.

### Historical frontier before the owner response

### Current frontier — permission-model compatibility decision

The native candidate and shared helper are implemented and tested, but **not adopted by public writers**. An integration attempt passed19/21 checks and failed the two existing relocated public API checks that publish under `--permission` with only scoped filesystem grants. The three writers were restored byte-for-byte to their pre-attempt hashes; no tests or permission grants were weakened. See [the decision record](../../R09-PUBLICATION-DECISION.md). R09 and the CLI goal remain incomplete.

Current candidate files: `impl/cli/native/rename-noreplace.c`, `impl/cli/tools/materialize-atomic-publication-native.mjs`, `impl/cli/src/generation/atomic-publication-native{,.generated}.ts`, `impl/cli/src/generation/atomic-publication.ts` and their two focused test files. No package.json, public export or build/test script was changed to adopt them.

| Evidence | Terminal result | Boundary |
| --- | --- | --- |
| `portable.tap` | 0/13; compile-hook failure, no assertions executed | Preserved initial missing S_IFMT/S_IFDIR failure. |
| `portable-recovery.tap`, session64000 | exit0,13/13,1.402s | Explicit Linux UAPI mode bits; same primitive and packaging assertions.14,408-byte artifact; no DT_NEEDED/GLIBC versions, only Node-API imports. |
| `adapter.tap`, session84718 | exit0,6/6 | Initial emitted loader qualification. |
| `adapter-expanded.tap`, session50061 | exit0,13/13,2.130s | Emitted relocated loader, denied permissions, tamper, held unlinked inode, replacement preservation, failed-load retry, five target conflicts, argument validation. |
| `atomic-helper.tap`, session79579 | exit0,6/6,0.529s | Nested output/receipt, partial-write cleanup, competing empty target, stage replacement, foreign inventory, parent replacement. |
| `writer-integration.tap`, session28434 | exit1,19/21,49.931s | Two permission-model regressions prevent adoption; successful source/native output checks do not erase those failures. |
| `atomic-helper-final-claim.tap`, session83691 | exit0,6/6,0.590s | Corrected injection to the seventh (final) stage identity check; the earlier six-pass run injected at the fifth check, before the final claim boundary. |
| `writer-restored-exact.tap`, session37825 | exit0,2/2,27.064s | Both exact previously failing permission-restricted public API checks pass after disconnecting integration. |

Restoration TAP SHA256 `38bdf5cd566eb23073b69f73f51d15b8593b226d97db878263e9795b388956c2`; final-claim helper TAP SHA256 `9e2d491a5b4c7fe1eb9959b77a788a2484c11e305df163dde44742efdeba315a`. Earlier `writer-restored.tap` selected only the build assertion and an empty instantiation file wrapper due to an incomplete name pattern; it is not evidence for restoring both assertions. The exact two-test run above supersedes that coverage claim. Original logs remain unchanged.

Initial libc-linked packaging `packaging.tap` passed4/4 but produced16,320 bytes with GLIBC2.33 dependency; that variant was not adopted. The portable prototype corrected this without adding an end-user compiler requirement. The CLI candidate's source comment/error text differs, so its14,408-byte payload hash is `2661e7007e16b52b5760a3a4dd549785c2d20b1e2cd2108fc771e525494f0a37`, not the prototype's hash. Materializer `--check` and an independent `--rebuild-check` both pass (session43474). The latter builds in two distinct temporary source directories, verifies exact bytes, no linked runtime libraries, Node-API-only imports, RELRO and non-executable stack. Build toolchain remains GCC15.2.0/Node26.8.1; runtime uses no compiler.

Strict full-CLI typecheck passed after adding the candidate (78301), during writer integration (51710), and after restoration (76495). No full verifier suite was rerun.

Evidence SHA256: `portable.tap` `08a2c6b83e11559a5f787c1c594378c6a26914070dfe8174765a56c88cf38932`; `portable-recovery.tap` `fa748ba5eed6627d84c99703c6afab503416c4e9f199aacf13a9e783dcb0b530`; `adapter-expanded.tap` `3c4039558ae1d41c106ee37d60b7baffe3b31e48b4c9119551f5e98821115292`; `atomic-helper.tap` `e4777d488e614752b8675e1faad5885c685e69c804e29a6f74bca06f1a6193e5`; `writer-integration.tap` `f20c3a26df9cbec1b49d7ce4acad566341b95a1af4768d5e8ea122f21d155d75`.

The helper is still a candidate: the final syscall makes the destination claim atomic, but checks do not prove immunity to arbitrary simultaneous same-UID source mutation, mount changes or power loss. A renamed private extraction directory may leave an empty owned directory at its moved location; foreign replacements are preserved. No universal hostile-filesystem/durability claim is made.

### Historical initial primitive result

Session8996 exits0:9/9 tests pass, zero skipped/cancelled/TODO,822.92313 ms including compilation and process tests. TAP `primitive.tap` SHA256 `46fee35ac34fa5da1c42e336bff6d38d175d1de79d3722cce8747bc1eacee4d8`.

The Node-API8 prototype exposes one operation: rename between two validated leaf names relative to one open directory descriptor, always using Linux `renameat2(..., RENAME_NOREPLACE)`. There is no overwrite flag, shell invocation or fallback to ordinary rename. Missing kernel/filesystem support rejects. This primitive does not itself validate a registered project, hold stage ownership, perform safe cleanup or prove durable publication.

Verified cases:

1. Successful rename preserves directory identity and publishes both complete artifact and receipt.
2. Existing empty directory, nonempty directory, file, dangling link and directory link each reject with EEXIST while preserving their inode/type, staged tree and unrelated sentinel.
3. Renaming the original parent and replacing its path with a symlink cannot redirect the operation through that link: the held descriptor selects the original directory. This is anchoring evidence, not a claim that the public API may return a stale original path as success.
4. Invalid names (including traversal, embedded NUL and excessive length), descriptors and arity reject without touching the stage.
5. Two ready-synchronized OS processes compete for one target. Exactly one wins, the loser retains its stage, and the target contains one complete winner rather than merged/replaced contents.

Source SHA256: `rename-noreplace.c` = `375cacfbd9caf720c7a030cdd7a22c2398e9237361c85f13eca8df6a6badd767`; `primitive.test.mjs` = `46a431606a81d7e9a021f7a308e4b7dbeca49ce83d0ed6a3705850a43c1d1f8a`. Compilation used the existing launcher and GCC15.2.0, Node26.8.1 headers, `-std=c11 -O2 -shared -fPIC -fvisibility=hidden -Wall -Wextra -Werror -DNAPI_VERSION=8`. Every generated binary and fixture was inside the test-owned temporary directory and cleaned after execution. No production source or existing prep log changed.

## Controlling evidence and reuse boundary

- Installed Node26.8.1 `fs.renameSync` calls its native binding with only old/new paths; no RENAME constants are exposed. The inspected source and current [Node filesystem API](https://nodejs.org/api/fs.html#fsrenamesyncoldpath-newpath) agree on that signature.
- [Linux rename documentation](https://man7.org/linux/man-pages/man2/rename.2.html) specifies ordinary rename replacement, the no-replace flag, relative directory descriptors and explicit errors for unsupported filesystem flags. This is not durability or arbitrary-filesystem support evidence.
- `impl/cli/README.md` promises single-directory atomic visibility and no existing-target update. `contracts/foundation-contract.candidate-3.json#/supported_surface/writes` rejects partial publication. Reusing the existing per-file legacy-project writer would change that behavior.
- The R09 prep307-input comparison found only six changes: the R08-updated remaining plan, formalizer and four Operation/capsule implementation files. All four publication implementations are unchanged. The old snapshot does not capture every new verification dependency and is not treated as full current qualification.

## Reproduction

From the DomainSpec project root, run the existing toolchain launcher with `node --test --test-timeout=60000 --test-concurrency=1` against `primitive.test.mjs`. Use a new TAP destination rather than overwrite `primitive.tap`. The test performs its own exact temporary compiler invocation; it does not install a compiler or modify package.json.

## Task Session Result and Open Questions

PASS for the primitive candidate; R09 in progress. Context-builder standard scope selected the R09 requirement, preparation matrix/probes, four publisher touchpoints, public visibility contracts, installed Node API and Linux syscall contract. No delegation or runtime handoff. ARE requests175/176 retain user-directed implementation scope without granting admission or publication authority.

Next: verify a distributable adapter that preserves the existing Linux/x64 platform and does not require users to install a compiler; then integrate held-parent/stage ownership and cleanup checks into the applicable writers. Do not ship or advertise the prototype yet. Permission-model behavior, native loading, deterministic build/relocation, stage replacement and complete public safety qualification remain unproven. If preserving the existing installation/platform contract proves impossible, raise that product decision before integration; no such change has been selected here.
