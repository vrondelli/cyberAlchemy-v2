# DSH preparation correlation and Companion verification

Status: source and extracted Windows prepared-prompt display qualified; full plan incomplete.

## Scope

The [whole UI plan](WHOLE-UI-IMPLEMENTATION-PLAN.md) remains the parent scope.
This slice does not complete session ownership, objective continuity, Evolution,
or installed lifecycle work.

New model-entry records in the
[gateway journal](../../../packages/codex-app-server-wrapper/src/gateway-session-store.mjs)
retain each prompt's exact preparation references. The
[DSH Host owner](../../../packages/dsh-gateway-backend-adapter/src/web-host-owner.mjs)
binds an edited prompt to its queue-edit preparation, not its earlier prompt.
Validation rejects missing, stale, foreign, or mismatched preparation references;
legacy records remain readable but explicitly uncorrelated.

The [observer](../../../packages/dsh-gateway-backend-adapter/src/web-adapter-observation.mjs)
and [dashboard](../ui/app.js) distinguish four relationships: included in the
latest retained model entry, different preparation, no retained model entry,
and legacy unbound entry. Native turn state is a separate observation. None
of these relationships proves model liveness, hidden reasoning, or control of
this desktop chat.

## Verification

- Journal plus Host-owner focused tests: 72 passed, zero failures/cancellations.
- Dashboard plus DSH observer tests: 76 passed, zero failures/cancellations.
- Observer and dashboard JavaScript syntax checks passed.
- Graph source pins were updated for this slice's source changes and the
  changed Host-owner test. No unrelated package drift was accepted.
- Graph-manifest suite: 7 passed, zero failures/cancellations; includes all
  182 source pins and the complete installed package tree.
- Approved extracted Windows smoke with a disposable DSH observer: Host CLI
  suite 2 passed, zero failures/cancellations. Both optional Windows branches
  were enabled. Native Windows read the authenticated loopback observation;
  the WebView2 probe opened the dashboard from the orb and asserted DSH
  Adapters activity and Threads state with explicit claim limits. The test
  closes the Companion and Host. No installer was run or settings changed.
- Tested executable: `C:\Users\vlad_\AppData\Local\Temp\are-win-dsh-payload-Vhf2uJ\are-companion.exe`,
  extracted from the prep-observer build. It predates this slice's correlation
  changes. The fixture has one resumed idle Agent, not a newly admitted prompt.
- Preparation-correlation snapshot native Rust compilation and unsigned NSIS
  packaging passed. Later objective lifecycle changes are outside this build.
- Actual qualified DSH Web prompt-to-provider-to-observer tests: 2 passed,
  zero failures/cancellations, including lost prompt ACK and released-session
  restart. The local provider received the ARE context with no advertised
  tools; the observer retained the prepared UNDERSTAND route linked to the
  exact model entry, separately from the closed native turn and its terminal.
  Before the prompt, preparation was absent. Observer output contained neither
  prompt nor reply text. The test fixture's private Unix socket now uses the
  existing stale-socket recovery helper after its forced process death.
- Rebuilt extracted Windows package: all 13 bundled feature checks passed,
  including health, routing/context, reasoning-state loading, and Evolution
  write/reopen/replay. Its packaged observation client is byte-identical to
  the current correlation source (SHA-256
  `c8f71a2e734b7fbf22c12b57d90203bf1b92a12eda76f0994a042ff397698bee`).
- Approved rebuilt prepared-prompt GUI test: one actual qualified DSH Web
  prompt test passed, zero failures/cancellations (`with ACK`, 83.4 seconds).
  The optional native Windows GUI branch was enabled. The orb opened the
  dashboard; Adapters showed the disposable Host, and Threads asserted the
  UNDERSTAND preparation was included in the latest retained model entry,
  separately from the closed native turn and retained terminal event.
  Prompt/reply text was absent from that DSH observation display. The local
  provider received ARE-selected context and no advertised tools. This tests
  the actual preparation-to-model-entry-to-dashboard join, not a synthetic
  Agent display. It does not verify all four correlation states in native UI.
  The test closed the Companion and disposable Host; a post-test exact-path
  Windows process query found no surviving tested Companion process.
  No installer was executed and no Windows settings were changed.
- Extracted executable SHA-256:
  `066212537c60e13eff88843d727b6fafeceaefbc53ad7fac45019ad60096d42a`.

## Running verification handoff

The initial Windows build correctly refused a mixed source snapshot after the
UI test script changed during staging. A native Windows comparison found
705 files in both closures, zero mode-only differences, and that script as
the only changed file. The failed stage is retained at `C:\acw\acw-Hyndjq`.
The source-closure guard was not changed.

A fresh build passed that guard and completed successfully in `C:\acw\acw-8V1aLc`.
Tool session `16405` terminated with exit 0. Unsigned output:
`C:\Users\vlad_\AppData\Local\Temp\ARE_Companion_0.1.0_x64-setup-prep-correlation-20261006.exe`.
SHA-256: `99175f6dfad7240a1b4f5c28d854d61d2f7657cde063fe0262409da58fb71a85`.
The builder reported 854 closure files, development closure
`4414ff6700b70d39fafb4219f3f3c933a6ef8f14e838fdfd08364146c391713b`
and Core closure `65ba95076f5079ddce28dbceefe1d314f814689f3d17c0cdae73c89c3b9f25fa`.
Archive integrity passed for 864 entries. This is the frozen preparation-
correlation snapshot; later neutral objective lifecycle extraction is not
included. Successful packaging is not installation or GUI qualification.

The full serial DSH `npm test` suite is also running, tool session `46419`,
with durable output at
`/tmp/are-dsh-full-suite-prep-correlation-20261006.HLUjQt.log`.
It has no aggregate verdict yet. These handles and PIDs are transient and
must be revalidated, not treated as durable proof of a running process.

The new native UI assertion is optional via
`ARE_TEST_WINDOWS_DSH_PREPARED_UI_EXE` on
[the real-turn test](../../../packages/dsh-gateway-backend-adapter/test/web-host-owned-native-turn.test.mjs).
It requires an extracted package with the matching current UI/native bridge,
and launch authorization. The user approved the additional DSH GUI smoke.
Extraction completed successfully at
`C:\Users\vlad_\AppData\Local\Temp\are-win-prep-correlation-payload-yiuyag`;
the prepared-prompt GUI result passed as recorded above.

## Open questions

- Does the rebuilt extracted Windows package render all four relationships?
- Can the other three correlation states be qualified in native Windows UI?
- DSH objective/requirement continuity and Evolution are still separate work;
  see the parent plan for the complete remaining scope.
