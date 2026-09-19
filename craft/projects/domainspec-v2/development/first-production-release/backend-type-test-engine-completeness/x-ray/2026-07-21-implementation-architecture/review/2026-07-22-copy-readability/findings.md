# BTE X-Ray Copy and Readability Review — Verified Findings

- Dispatch: `2026-07-22-bte-xray-copy-readability-review`
- Inputs verified: `attacks.md` against the literal `index.html`, `instances.json`, `lanes.json`, and `X-RAY-RESULT.md`
- Zig-zag verification: V1 counter-example verifier and V2 scope verifier incorporated below
- Final approval: parent accepted two last scope objections after the single writer loop and narrowed F-07/F-08 accordingly
- Review boundary: change requests only; no target artifact was edited
- Severity result: no CRITICAL findings; three MAJOR findings survive

## `index.html`

| # | file | quoted evidence | severity | proposed fix |
| --- | --- | --- | --- | --- |
| F-02 | `index.html` ↔ `instances.json` ↔ `X-RAY-RESULT.md` | Green/runs-now copy says “A player may run `UnlockDoor` only when `HasKeyRule` holds”, “A successful operation produces `DoorUnlocked`”, and “the generated graph still says `HasKeyRule → enforces → UnlockDoor → produces → DoorUnlocked`”. The literal machine companion contains a source-backed `UnlockDoor` formation chain and a separate source-backed `HasKeyRule --enforces--> UnlockDoor` edge, but no inspectable `DoorUnlocked` or `produces` record and no source-backed causal behavior proof. | MAJOR | Make `UnlockDoor` formation the primary fully evidenced workday. Present `HasKeyRule --enforces--> UnlockDoor` separately as a structurally preserved relationship extension whose causal proof remains admission-blocked. Omit `DoorUnlocked`/`produces` from the primary path unless literal records are supplied; until then say only “not evidenced in this x-ray”, not `target-design`. Recast “player may run only when” as requested model intent, not observed behavior. [A1-F2; V1 counter-example objections 2–3; V2 scope objections 1–2] |
| F-03 | `index.html` | Mobile CSS sets `.risk-grid { grid-template-columns: 110px 1fr; }` and hides header cells 3+, while the remaining cells auto-place without retaining their original `Authority + formation`, `Graph + derivation`, or `Runtime + evidence` column label | MAJOR | Prefer a labelled horizontal-scroll region that preserves the literal four-column matrix and all row/column headers. If cards are used instead, repeat the existing row and column labels verbatim; do not invent a new observed/Design/owner classification without separately classifying every cell. [A2-F1, A3-F15; V2 scope objection 4] |
| F-04 | `index.html` | The four-column module table includes long homes such as `test-derivation-engine/src/minted-project/`; `.module-table` uses `overflow: hidden`, and no mobile rule adapts it | MINOR | Add a labelled `overflow-x: auto` wrapper or convert rows to labelled cards below 760px. Preserve `Consumes`, `Emits`, and pending-Design home labels with every row. [A2-F4] |
| F-05 | `index.html` | The target chain is eight numbered cards, but `.target-chain .record-card:nth-child(4n)::after { display: none; }`; below 1080px all `.record-card::after` connectors disappear | MINOR | Use a vertical ordered stepper at narrow widths and an explicit “continue ↓” connector between rows at wide widths. Numbering keeps the content available, so this is a visual-causality defect rather than functional content loss. [A1-F4, A2-F3] |
| F-06 | `index.html` | Controls declare `role="tab"`, but the script handles only `click` and does not implement Arrow, Home, End, or roving-focus behavior | MINOR | Implement the ARIA tabs keyboard model, including roving `tabindex`, ArrowLeft/Right, Home/End, and focus placement; or use ordinary disclosure buttons/native `<details>` instead of tabs. [A1-F5; narrower verified portion of A2-F2] |
| F-07 | `index.html` | Present-tense “The rest of the day keeps checking that the same meaning survives…” conflicts with the later boundary “It does not prove every business meaning in application code”, while the BTE path is not implemented | MAJOR | Use future/candidate tense and this bounded replacement: **“At each step, the intended BTE path would check that it is still referring to the same named source, rule, and operation and record each check’s evidence. For relations, it would do so only after the owner admits the relationship denominator and Design freezes the causal evaluator. It would not prove that all game behavior is correct.”** [A3-F3; V1 counter-example objection 5; V2 scope objection 5; V2 final scope objection 1] |
| F-08 | `index.html` | `O_spec = O_gen`, `TestCase`, `Binding`, `Evaluator`, `ExecutionResult`, and `MutationResult` appear in the workday before the glossary; the target panel is not initially active | MINOR | Give the newcomer a plain-language first pass: **match generated checks to the independently frozen checklist for the admitted structural scope**; **connect each check to code**; **run the valid and deliberately broken case**; **recompute and hand off evidence**. Put `O_spec`/`O_gen`, TestCase, Binding, Evaluator, ExecutionResult, and MutationResult second, in parentheses or the detailed record explorer. [A1-F3, A3-F10, A3-F16; V1 counter-example objection 4; V2 final scope objection 2] |
| F-09 | `index.html` ↔ `instances.json` ↔ `lanes.json` | The corpus alternates among “exact accepted core handle”, “exact green core handle”, “accepted green core handle”, and “green core receipt” although the consumer phase is proposed and admission remains owner-controlled | MINOR | Standardize the concept corpus-wide as **“green core receipt handle”** and place an adjacent `target-design`/“target after BTE” label wherever consumers receive it. Reserve `accepted`, `admitted`, and `released` for explicit owner decisions. [A3-F4; V2 scope objection 12] |
| F-10 | `index.html` | “Most important architecture correction”; “We should add a dedicated minted-project adapter and proof IR”; “What changes in the codebase”; “Build in seven dependency-safe slices” | MINOR | Say the legacy Markdown parser **must not be the canonical minted-project derivation input**, rather than implying it cannot feed anything. Use: **“This X-Ray proposes a dedicated minted-project adapter and proof IR. Invoke Design must freeze or reject that boundary before implementation adds it.”** Also use “Proposed codebase changes” and “Proposed dependency order: seven slices — not an authorized work plan.” [A3-F5, A3-F6, A3-F7; V2 scope objection 6] |
| F-11 | `index.html` | The H1 is followed by three H3 on-ramp cards; the first H2 appears only at the workday | MINOR | Add an H2 for the reader on-ramp or make its three cards H2-level peers, preserving a coherent heading outline. [A2-F5] |
| F-12 | `index.html` | State, tab, step, code, and lifecycle labels are set between `.61rem` and `.67rem`, although they carry implementation status and record identity | MINOR | Validate the page at its target narrow viewport and browser zoom levels, then raise and reflow load-bearing status, step, and record text until it remains legible without clipping or loss of hierarchy. Do not prescribe an untested rem threshold. [A2-F6; V2 scope objection 11] |
| F-13 | `index.html` | “The four planes must not collapse”; “Evidence code: existing · proposed · owner gate · external” | MINOR | Lead with ordinary-language responsibility separation: “Keep four responsibilities separate.” Rename “Evidence code” to “Status legend”, and put the colour/border explanation second. [A3-F8, A3-F9] |
| F-14 | `index.html` | “Follow actual Key and Door records, not placeholders” introduces one live formation chain, one target proof chain, and one live edge whose target proof is blocked | MINOR | Rename exactly: **“Trace one live compiler chain, one labelled target proof chain, and one live edge with admission-blocked target proof.”** Preserve the state on each tab and panel. [A3-F11; V2 scope objection 7] |
| F-15 | `index.html` | The 88-plus-word “After this x-ray…” paragraph repeats earlier architecture and boundary copy; no short pre-architecture retell checkpoint separates the example from the component map | MINOR | Add the three-bullet retell checkpoint specified in the revision map before architecture. Replace the late paragraph with four plain bullets: current compiler proof; proposed BTE proof path; fresh independent consumer receipts; owner-only admission/release authority. Move only page-specific X-Ray library/custom-pattern metadata into a collapsed provenance disclosure. [A3-F17, A3-F18; V1 counter-example objection 6; V2 scope objection 8] |

**Verdict: FIX.** F-02, F-03, and F-07 are MAJOR: the page overstates its source-backed example, erases matrix meaning on mobile, and uses present-tense semantic-preservation language for an unimplemented structural proof path.

## `instances.json`

| # | file | quoted evidence | severity | proposed fix |
| --- | --- | --- | --- | --- |
| F-02 | `instances.json` ↔ `index.html` ↔ `X-RAY-RESULT.md` | The workday marks “Edit HasKeyRule, UnlockDoor, DoorUnlocked, and their directed relations” and `--produces--> DoorUnlocked` as `source-backed-runs-now`; its literal source-backed instances evidence `UnlockDoor` formation and the separate `HasKeyRule --enforces--> UnlockDoor` edge | MAJOR | Base the primary workday on the complete source-backed `UnlockDoor` node → `writes_state` criterion → graph node → manifest → receipt chain. Move the `enforces` edge to a separate relationship extension and retain `target-design-admission-blocked` for its causal proof. Remove `DoorUnlocked`/`produces` from current claims until literal records exist; describe them only as “not evidenced in this x-ray”. [A1-F2; V1 counter-example objections 2–3; V2 scope objection 1] |
| F-09 | `instances.json` ↔ `index.html` ↔ `lanes.json` | Consumer step input is “Exact green core handle” while neighboring surfaces use “accepted” and “receipt” variants | MINOR | Rename the input “green core receipt handle” and keep its `requirements-backed-target-design` status adjacent. [A3-F4; V2 scope objection 12] |

**Verdict: FIX.** F-02 assigns source-backed/current status to a combined narrative that the machine companion does not make inspectable as one chain.

## `lanes.json`

| # | file | quoted evidence | severity | proposed fix |
| --- | --- | --- | --- | --- |
| F-09 | `lanes.json` ↔ `index.html` ↔ `instances.json` | One flow inference says consumers use “the accepted green core handle”, while another lane says consumers start only after “a green core receipt” | MINOR | Standardize on “green core receipt handle” and state in the same sentence that this consumer handoff is target design; keep admission as a separate owner-controlled action. [A3-F4; V2 scope objection 12] |

**Verdict: KEEP.** The terminology should be aligned, but no CRITICAL or MAJOR defect survives for this artifact.

### Candidate schema question — not a change request

`reader_terms` uses `authority` for source-backed/explanatory provenance while implementation state remains prose. A separate state projection might improve machine use, but the literal lane schema was not verified to allow it. Validate the schema and an actual consumer need before adding `existing`, `target-design`, `mixed`, or `governance-limit`; this question does not affect verdict or the ordered changes. [A3-F20; V2 scope objection 9]

## `X-RAY-RESULT.md`

| # | file | quoted evidence | severity | proposed fix |
| --- | --- | --- | --- | --- |
| F-02 | `X-RAY-RESULT.md` ↔ `index.html` ↔ `instances.json` | Evidence Boundary includes “the green morning steps of the workday”; Reader On-Ramp says it is grounded in “one real node and one real edge”; Validation claims a retell chain and says “Live source/criterion/graph/manifest/receipt values” were checked, without limiting the claim away from the unsupported `DoorUnlocked`/`produces` and behavioral narrative | MAJOR | Revise the Evidence Boundary, Reader On-Ramp, and Validation to name the two separately evidenced objects: the complete live `UnlockDoor` formation chain and the live `HasKeyRule --enforces--> UnlockDoor` structural edge. State that causal effect remains admission-blocked and `DoorUnlocked`/`produces` are not evidenced in this x-ray. Do not claim the whole green workday was source-backed. [A1-F2; V2 scope objection 2] |

**Verdict: FIX.** The operational result repeats the same over-broad evidence claim as the page and machine workday.

## Provisional usability experiment — not a verified finding

The hero is jargon-heavy and may delay the example, but browser inspection was unavailable and `lanes.json` requires the opening to include both “the implementation in one sentence” and “one concrete day of work” without mandating their exact order. Therefore the former F-01 MAJOR finding is withdrawn.

Test this proposal-labelled, scenario-first hero with a newcomer before moving cards:

> **Backend Test Engine: current proof and proposed path**
>
> Start with one modeled change: a key rule controls an unlock operation. This page separates what the compiler proves today from the proof path still being designed.

Keep JSON/YAML/normalized-graph detail out of the hero and place that technical sentence after the workday. Treat moving the three architecture cards after the workday as the experiment variable, not an accepted change request. [A1-F1, A3-F1, A3-F2; V1 counter-example objections 1 and 7; V2 scope objection 3]

## Page-level revision map

| order | page area | keep / move / revise | concrete replacement or layout action | boundary preserved |
| --- | --- | --- | --- | --- |
| 1 | Hero | REVISE COPY; TEST ORDER | H1: **“Backend Test Engine: current proof and proposed path.”** Lede: **“Start with one modeled change: a key rule controls an unlock operation. This page separates what the compiler proves today from the proof path still being designed.”** Move the JSON/YAML/normalized-graph sentence after the workday. Test, rather than assume, whether the three cards should move. | Proposal-labelled, scenario-first copy distinguishes today from proposed proof without claiming the order is already validated. |
| 2 | Primary workday | REPLACE EXAMPLE SPINE | Use the fully evidenced `UnlockDoor` formation chain: authored operation → `writes_state` rule → compiler check → graph node/source manifest → build receipt; then valid `yes` versus deliberately broken `no`. | Every green step is source-backed in the literal companion. |
| 3 | Relationship extension | SEPARATE | **“Requested model intent: `HasKeyRule` should control `UnlockDoor`. Today this x-ray evidences the directed `enforces` edge and its source join. Whether that edge changes behavior remains an admission-blocked proof to design.”** Omit `DoorUnlocked`/`produces` unless records are added. | Requested intent, current structural preservation, and future causal proof are not stitched into one claim. |
| 4 | Plain-language workday labels | REVISE | Use **“match generated checks to the independently frozen checklist for the admitted structural scope”**, **“connect each check to code”**, **“run the valid and deliberately broken case”**, and **“recompute and hand off evidence”** first; show record type names second. | “Complete” remains relative to a frozen checklist and admitted denominator; target record types remain secondary. |
| 5 | Workday scope sentence | REPLACE | **“At each step, the intended BTE path would check that it is still referring to the same named source, rule, and operation and record each check’s evidence. For relations, it would do so only after the owner admits the relationship denominator and Design freezes the causal evaluator. It would not prove that all game behavior is correct.”** | Future tense, bounded structural scope, and an explicit relationship-admission condition. |
| 6 | Pre-architecture retell checkpoint | ADD | Three bullets: **“Today: compile `UnlockDoor`, trace its source, and reject the broken value.”** **“Proposed: make the checklist complete, connect each check to code, run valid and broken cases, and recompute the evidence.”** **“Authority: fresh consumer receipts provide downstream evidence; only the owner authorizes admission or release.”** | The third bullet keeps consumer evidence separate from owner authority. |
| 7 | Architecture boundary callout | REVISE | **“The legacy Markdown parser must not be the canonical minted-project derivation input. This X-Ray proposes a dedicated minted-project adapter and proof IR. Invoke Design must freeze or reject that boundary before implementation adds it.”** | X-Ray proposes; Design decides; implementation follows. |
| 8 | Process explorer | REVISE MECHANICS + COPY | **“Trace one live compiler chain, one labelled target proof chain, and one live edge with admission-blocked target proof.”** Add plain first-use glosses and complete tab keyboard behavior. | Live, target, and blocked states stay explicit. |
| 9 | Risk matrix | REBUILD MOBILE FORM | Prefer horizontal scroll preserving the literal row/column matrix; if converted to cards, repeat the existing row and column labels exactly. | No new classification is invented. |
| 10 | Consumer handoff | STANDARDIZE | Use **“green core receipt handle”** with adjacent `target after BTE` status in the page and machine companions; say consumers return **fresh independent consumer receipts**. | Green proof, consumer evidence, admission, and release remain separate states. |
| 11 | Reader outcome | COMPRESS | Four bullets: **Current compiler proof**; **proposed BTE proof path**; **fresh independent consumer receipts after a green core receipt handle**; **owner-only admission/release authority**. | Consumer receipts and owner authorization are both explicit. |

## Dropped or refuted candidates

| candidate | disposition | literal verification result |
| --- | --- | --- |
| Former F-01 / A1-F1 + A3-F1 + A3-F2 as MAJOR | DOWNGRADED TO EXPERIMENT | The hero is jargon-heavy, but neither browser evidence nor the lane contract proves that moving the cards is required. Proposal-labelled copy survives as a change; ordering is a usability experiment. [V1 counter-example objections 1, 7; V2 scope objection 3] |
| A2-F2 (MAJOR no-JavaScript failure) | REFUTED at claimed severity | `L0 static HTML/SVG` does not state a no-script contract, and the page intentionally includes inline interaction script. The narrower ARIA-tab keyboard defect survives as F-06. |
| A3-F12 | DROPPED | “How the same node becomes a complete proof chain” is immediately qualified by proposed fields/IDs, a `Requirements-backed · to build` badge, and the `target design` tab label. |
| A3-F13 | DROPPED | The edge panel begins with “proof blocked”, calls the causal test a target contract, and ends with a `Why blocked` paragraph. |
| A3-F14 | DROPPED | “Likely home” sits inside “Proposed module boundaries”, beside text saying homes are inference and not accepted until Design names them. |
| L-01 / A3-F20 as a finding | DOWNGRADED TO SCHEMA QUESTION | The distinction may help, but schema support and consumer need were not verified. It is recorded above without a change request. [V2 scope objection 9] |
| R-01 / A3-F19 | REFUTED | `X-RAY-RESULT.md` is the operational result, not the newcomer page. Whisper and observer provenance are appropriate there and do not interrupt the HTML reader route. [V2 scope objection 10] |

Merged candidates are not dropped: A1-F4/A2-F3 became F-05; A1-F3/A3-F10/A3-F16 became F-08; A3-F5/A3-F6/A3-F7 became F-10; A3-F8/A3-F9 became F-13; and A3-F17/A3-F18 became F-15. A2-F2 survives only in the narrower keyboard-behavior portion cited by F-06.

## Verifier objection resolution

| verifier objection | resolution | resulting record |
| --- | --- | --- |
| V1 counter-example 1 — hero remains jargon-heavy | ACCEPTED | Scenario-first hero in the provisional experiment and revision map; technical sentence moves after workday. |
| V1 counter-example 2 — behavioral/causal claim unsupported | ACCEPTED | F-02 separates requested intent, current edge preservation, and admission-blocked causal proof. |
| V1 counter-example 3 — stitched source-backed chain | ACCEPTED | F-02 and map use `UnlockDoor` formation as primary, separate the edge, and omit the unevidenced output. |
| V1 counter-example 4 — plain-language first pass | ACCEPTED | F-08 and map put four ordinary-language actions before record type names. |
| V1 counter-example 5 — F-07 replacement still jargon-heavy | ACCEPTED | F-07 uses the verifier’s future-tense replacement verbatim. |
| V1 counter-example 6 — pre-architecture retell checkpoint | ACCEPTED | F-15/map add three plain bullets including consumer evidence and owner authorization. |
| V1 counter-example 7 — F-01 severity unsupported | ACCEPTED | F-01 withdrawn as a verified finding; ordering is a provisional experiment. |
| V2 scope 1 — `target-design` unsupported for missing records | ACCEPTED | F-02 says “not evidenced in this x-ray” and requires literal records before any promotion. |
| V2 scope 2 — extend F-02 to result lines 101–105/120 | ACCEPTED | `X-RAY-RESULT.md` now has an F-02 MAJOR row and FIX verdict. |
| V2 scope 3 — F-01 downgrade/card move optional | ACCEPTED | Hero copy remains proposed; card order is experiment-only. |
| V2 scope 4 — preserve literal risk labels | ACCEPTED | F-03 prefers horizontal scroll and prohibits an invented taxonomy. |
| V2 scope 5 — F-07 future tense | ACCEPTED | F-07 says “intended BTE path would”. |
| V2 scope 6 — correct Design boundary | ACCEPTED | F-10/map state X-Ray proposes, Invoke Design freezes or rejects, and legacy parser must not be canonical input. |
| V2 scope 7 — exact F-14 framing | ACCEPTED | F-14/map use the requested live/target/live-edge-with-blocked-proof sentence. |
| V2 scope 8 — four-part reader summary | ACCEPTED | F-15/map include current proof, proposed path, fresh consumer receipts, and owner authority. |
| V2 scope 9 — remove L-01 ordered change | ACCEPTED | L-01 is a non-actionable schema question and is absent from ordered changes. |
| V2 scope 10 — refute R-01 | ACCEPTED | R-01 is explicitly refuted; operational provenance remains in the operational result. |
| V2 scope 11 — remove untested rem thresholds | ACCEPTED | F-12 requires viewport/zoom validation without a numeric threshold. |
| V2 scope 12 — corpus-wide core handle term | ACCEPTED | F-09 standardizes “green core receipt handle” with adjacent target-design state across page and companions. |
| V2 final scope 1 — relationship check omitted admission condition | ACCEPTED BY FINAL APPROVER | F-07 and the revision map now condition relationship checks on owner admission of the denominator and Design freezing the causal evaluator. |
| V2 final scope 2 — “complete checklist” implied universal completeness | ACCEPTED BY FINAL APPROVER | F-08 and the revision map now make completeness relative to the independently frozen checklist and admitted structural scope. |

## Ordered change requests

1. **[MAJOR · F-02] Correct the Key-and-Door evidence story across all three affected artifacts.** Make `UnlockDoor` formation the complete primary live chain; separate the live `enforces` edge and its admission-blocked causal proof; remove `DoorUnlocked`/`produces` and behavioral causality from current claims until literally evidenced.
2. **[MAJOR · F-07] Bound the workday in future tense.** Use the named-source/rule/operation replacement, condition relationship checks on owner admission and a frozen causal evaluator, and explicitly deny proof of all game behavior.
3. **[MAJOR · F-03] Preserve the literal risk matrix on mobile.** Prefer labelled horizontal scrolling; any card transform must repeat existing row and column labels.
4. **[MINOR · F-08/F-15] Add a plain-language retell layer.** Use the four ordinary-language work actions, the three-bullet pre-architecture checkpoint, and a four-part reader summary including fresh consumer receipts and owner authority.
5. **[MINOR · F-09/F-10/F-14] Correct boundary terminology.** Standardize “green core receipt handle” with target-design state; state the X-Ray/Invoke Design boundary exactly; use the verified three-instance explorer title.
6. **[MINOR · F-04/F-05/F-06/F-11/F-12] Validate and repair responsive/semantic mechanics.** Treat module-table overflow, proof-flow cues, tabs, heading hierarchy, and load-bearing small text at actual viewports and zoom levels.
7. **[MINOR · F-13] Replace architecture shorthand with an ordinary-language responsibility heading and explicit status legend.**

## Dispatch closeout

- Final approver: `parent`
- Approval: accepted after the final-approver corrections recorded above
- Exit reason: `resolved`
- Agents spawned: 6 (`explorer`: 3, `writer`: 1, `skeptic`: 2, helpers: 0)
- Whole-dispatch loops used: 1
- Target mutation: none; this review produced change requests only
