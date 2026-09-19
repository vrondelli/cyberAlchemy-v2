# BTE X-Ray Copy and Readability Review — Attacks

- Dispatch: `2026-07-22-bte-xray-copy-readability-review`
- Target: parent X-ray `index.html`, `instances.json`, `lanes.json`, and `X-RAY-RESULT.md`
- Mode: read-only review attacks
- Status: collected attacker returns; not yet synthesized or verified

## A1 — Simon, Herbert — cold-reader operability

Read-only cold-reader attack complete. No CRITICAL defect found.

Verified reading path: the page opens with its promise and a “Start with one workday” link (`index.html:581-591`), then the Key/Door request at `#workday`, `index.html:612-630`. It can be retold as input → compilation → graph/provenance → proposed obligation/test/evidence → owner boundary, but there are material operability gaps below.

### A1-F1 — MAJOR — The first viewport still makes the newcomer decode architecture before they encounter the concrete change

- Location: `index.html:581-610`, especially `.lede` and `.truth`.
- Evidence: the opening asks the reader to parse “separately versioned YAML formation contract,” “normalized graph,” “exact set of obligations,” and “targeted invalid case” before the concrete request begins at line 622. The direct route to the requested behavior is only the small badge, “Start with one workday ↓” at line 590.
- Why it matters: the declared baseline is `newcomer` (`lanes.json:21-28`); a cold reader has to choose to bypass the material that is supposed to be the on-ramp. This weakens the stated reader contract to start with “one concrete day of work” (`lanes.json:29-41`).
- Proposed fix: make the Key/Door request and its three-loop summary the first content block after the title; move the one-sentence architecture and “keep/add” cards immediately after it. Keep a compact “architecture at a glance” jump link, rather than making the workday a badge-level detour.

### A1-F2 — MAJOR — The claimed Key-and-Door end state is not carried by inspectable concrete records

- Location: `index.html:622,640,652`; `instances.json:14-106,277-308,311-425`.
- Evidence: the workday promises “A successful operation produces DoorUnlocked” and says the graph is “HasKeyRule → enforces → UnlockDoor → produces → DoorUnlocked.” But the source-backed live instance records only `UnlockDoor`, its `writes_state` criterion, graph row, manifest join, receipt, and mutation. The sole source-backed edge record is `HasKeyRule --enforces--> UnlockDoor` (`instances.json:281-295`). Across the reviewed corpus, `DoorUnlocked` and `produces` occur only in narrative strings, not a source, graph, manifest, or receipt record.
- Why it matters: a reader can state the intended behavior but cannot independently point to the concrete output node or `produces` edge that allegedly survives transformation and provenance. This breaks the requested retell at the “concrete Key and Door” level rather than merely withholding a target-BTE detail.
- Proposed fix: add a source-backed `DoorUnlocked` record and source-backed `produces` edge/manifest join to Instance 1, or explicitly narrow the workday claim to the verified `enforces → UnlockDoor` path. Show their graph IDs and source digests beside the existing `UnlockDoor` chain.

### A1-F3 — MINOR — New terms are disclosed after they are needed, and most are collapsed

- Location: technical vocabulary at `index.html:583,645-689`; glossary at `index.html:1032-1048`, with only “Authority plane” open.
- Evidence: the workday asks the reader to understand `O_spec = O_gen`, `TestCase`, `Binding`, `Evaluator`, `ExecutionResult`, `MutationResult`, and replay before the reader-term disclosures. The target tab helps, but it is not the active panel (`index.html:830-876`).
- Proposed fix: introduce a one-line first-use gloss in each blue workday card, for example “Obligation = a named required check,” and link it to the detailed term. Keep the late glossary as reference rather than first disclosure.

### A1-F4 — MINOR — The main proof-chain explorer loses linear navigation at the dense eight-step target sequence

- Location: `.instance-chain.target-chain` and `.record-card::after` at `index.html:403-424`; target chain at `index.html:872-920`.
- Evidence: the target chain is an eight-item grid constrained to four columns. Arrows are suppressed after every fourth card with `.target-chain .record-card:nth-child(4n)::after { display: none; }`. Thus there is no visual continuation from Binding (4) to Evaluator (5), despite the page’s claim that the chain should be read causally.
- Proposed fix: render the target proof as a numbered vertical `<ol>` for newcomer mode, or add an explicit “continue ↓” connector between rows; retain the compact grid only as an optional architecture view.

### A1-F5 — MINOR — The tabbed process explorer lacks complete tab navigation behavior

- Location: tab markup `index.html:829-939`; interaction script `index.html:1125-1135`.
- Evidence: controls use `role="tab"` and `aria-selected`, but the script listens only for `click`; it provides no Arrow, Home, or End roving focus behavior and does not move focus into the newly revealed panel.
- Proposed fix: either implement the standard ARIA tabs keyboard model and focus the selected panel heading, or remove tab roles and present them as ordinary disclosure buttons with visibly labelled “next instance” links.

### A1 — What survived

- The artifact is unusually honest about temporal and status boundaries. The workday labels each stage “runs now,” “target after BTE,” or “owner decision” (`index.html:615,630,638-701`); target-record schemas are explicitly not frozen (`instances.json:109-114`).
- The verified live `UnlockDoor` subchain is retellable and evidence-bearing: input `state_change: "yes"`, governing `writes_state`, generated graph and manifest digest, compiler receipt, and the `yes → no` failure control align in the page and machine instance (`index.html:842-869`; `instances.json:24-106`).
- The boundary remains clear: the workday explicitly limits its claim and denies receipt-based release authority (`index.html:706-710`); the relation proof is separately marked admission-blocked rather than silently promoted (`instances.json:296-308`).

## A2 — Shannon, Claude — visual mechanics and correctness

Read-only mechanics/correctness review of the complete target corpus. No CRITICAL finding; four MAJOR failures affect content availability or meaning on common reading paths.

### A2-F1 — MAJOR — The mobile risk matrix changes the meaning of its cells

- Evidence: `index.html:512-527` defines a four-column matrix: `160px repeat(3, ...)`, with three semantic headers. At mobile, `index.html:568-569` changes it to two columns and removes headers three and four: `.risk-grid { grid-template-columns: 110px 1fr; }` and `.risk-cell.header:nth-child(n+3) { display: none; }`.
- The following DOM cells remain in normal auto-placement order (`index.html:1025-1028`). Thus “Proof IR boundary” and “Exact runtime contracts,” which originally belong under “Graph + derivation” and “Runtime + evidence,” land in the two-column mobile grid with no retained column identity. The risk content is not merely compacted; its ownership/category is silently lost.
- Proposed fix: on widths at or below 760px, render each row as a labelled card or list whose cells retain an explicit `data-column` or visible heading, or preserve all four columns in a horizontally scrollable wrapper. Do not delete matrix headers without carrying their labels into each cell.

### A2-F2 — MAJOR — Two of the three concrete process instances are unavailable without JavaScript

- Evidence: the page calls itself `L0 static HTML/SVG` in `X-RAY-RESULT.md:16` and says the target must expose concrete process instances, but the target-proof and edge panels are initially hidden: `<article class="instance-panel" ... id="instance-proof" ... hidden>` at `index.html:872` and `<article class="instance-panel" ... id="instance-edge" ... hidden>` at `index.html:923`.
- CSS also sets `.instance-panel { display: none; }` at `index.html:384`. Only the click handler removes `hidden` at `index.html:1127-1134`. Without script execution, the reader can inspect only the live compiler sequence; the intended proof chain and relationship case are absent. This conceals the key current-versus-target boundary rather than offering a degraded but complete static read.
- Proposed fix: make all panels readable in the no-script baseline as stacked sections or native `<details>`, then progressively enhance them into tabs. If retaining ARIA tabs, add ArrowLeft, ArrowRight, Home, and End keyboard navigation and roving `tabindex`; current code listens only for `click`.

### A2-F3 — MAJOR — The proof-chain diagram drops causal direction at every responsive wrap

- Evidence: the eight target records are represented as a four-column grid with `.instance-chain.target-chain { grid-template-columns: repeat(4, minmax(0, 1fr)); }` at `index.html:403-408`.
- Arrows are deliberately removed after cards 4 and 8 with `.target-chain .record-card:nth-child(4n)::after { display: none; }` at `index.html:417-418`. There is no visible continuation from “4 · Binding” to “5 · Evaluator,” although the content claims a causal sequence through eight stages at `index.html:878-918`.
- Below 1080px, every connector is removed with `.record-card::after { display: none; }` at `index.html:554-555`. Numbering preserves order, but causal propagation is concealed precisely where the cards wrap.
- Proposed fix: use an explicit ordered-flow component: retain a horizontally scrollable single row, add a visible down or return connector between rows, or use a vertical stepper at narrow widths. Preserve directional links rather than deleting them at breakpoints.

### A2-F4 — MAJOR — The proposed-module table has no viable narrow-screen treatment

- Evidence: `index.html:989-1000` contains a four-column table with lengthy code/home values, including `<code>test-derivation-engine/src/minted-project/</code>` at line 994.
- CSS provides only `width: 100%` and `overflow: hidden` on the table at `index.html:476-489`; `code` has no global wrapping rule at `index.html:43`. The mobile media block adapts many grids but never `.module-table` at `index.html:557-575`. At phone widths, either intrinsic widths force a wide layout or material is clipped; neither creates a usable comparison.
- Proposed fix: wrap the table in a labelled horizontal scroll region using `overflow-x:auto`, not hidden, or transform rows into four labelled definition-list cards below 760px. Preserve “consumes,” “emits,” and “home” labels with each record.

### A2-F5 — MINOR — Heading semantics skip the first visible section level

- Evidence: after the sole `h1` at `index.html:582`, the Reader on-ramp contains three `h3`s: “One causal pipeline, four separated planes” at line 597, “Use the proven core” at line 602, and “Build the missing proof spine” at line 607. The first `h2` is only the subsequent workday section at line 614.
- Proposed fix: add a visible or visually hidden `h2` for the on-ramp and keep its cards as `h3`, or make the cards `h2` if they are peers of the workday.

### A2-F6 — MINOR — Dense metadata text is mechanically undersized, though contrast is adequate

- Evidence: important labels use `.61rem` to `.67rem`: status (`index.html:286-294`), tab state (`index.html:382`), record steps (`index.html:420`), code samples (`index.html:424`), and lifecycle labels/text (`index.html:506-508`). At the default 16px root, that is about 9.8–10.7px, often uppercase with added tracking. These labels carry implementation state, not decoration.
- Proposed fix: raise state and step labels to at least `.75rem` and body/code text to `.8rem` where the content distinguishes implementation status; retain compact text only for redundant decoration.

### A2 — What survived

- Text contrast is strong. Token foregrounds on `--panel` calculate at approximately: muted 7.79:1, runtime 9.75:1, exists 9.73:1, proposed 7.27:1, authority/gate 9.45:1, external 8.02:1, and risk 6.99:1. No declared text token fails contrast.
- Status semantics are not color-only. Existing, proposed, gated, and external modules pair color with status words and solid, dashed, or double borders (`index.html:281-299`); the workday repeats state in text (`index.html:637-700`).
- The concrete process is well chosen and truthfully bounded in the source. The Key/Door walkthrough uses a real current compiler path and explicitly says it stops before BTE proof (`index.html:836-869`); `instances.json` labels the proof chain `target-design` and warns that IDs are not frozen.
- The large-screen architecture preserves separation through actual layer membership and controls (`index.html:716-800,1106-1123`), rather than presenting proposed proof stages as current compiler behavior.
- Responsive source order remains logical. The failure is the loss of connectors and category labels, not semantic reordering of the underlying text.

## A3 — Gadamer, Hans-Georg — full copy fidelity

Read-only review of all four requested files. The corpus is disciplined about source-backed versus target-design versus owner-gated material. No finding is CRITICAL. The main weakness is late or uneven boundary signalling: the page often explains proposed architecture in the confident voice of a settled navigation page, then repairs that accuracy later.

### A3 — Verified findings

| ID | Severity | Location and evidence | Problem | Concrete fix |
| --- | --- | --- | --- | --- |
| A3-F1 | MAJOR | `index.html:581-583` — “How we are going to implement it” followed by “Compile governed JSON…” | The title is an author-team conversation, not reader navigation; the lede describes a target pipeline in indicative voice. Badges recover proposal status too late. | Rename H1 to “Backend Test Engine: proposed implementation architecture.” Start lede: “The proposed BTE path would compile…” |
| A3-F2 | MAJOR | `index.html:614-615` — “One change enters once—and leaves with evidence”; “This is the intended workday when the BTE proof spine is complete.” | The heading promises an outcome before the current/target boundary. The slogan is more promotional than navigational. | Rename H2 “Trace one change from source to evidence”; retain the status sentence. |
| A3-F3 | MAJOR | `index.html:622-623` — “The rest of the day keeps checking that the same meaning survives…” | “Same meaning survives” risks claiming application-semantic preservation, while the actual claim is bounded structural evidence at `index.html:710` and `instances.json:424`. | Say: “The intended BTE path checks that the specified structural identities and relations survive its compiler, test, and evidence stages; it does not prove all application meaning.” |
| A3-F4 | MAJOR | `index.html:693-700` — “exact accepted core handle” and “it cannot admit a profile…” | “Accepted core” can read as admission, conflicting with the explicit non-admission boundary and `instances.json:404,424`. | Replace “accepted core handle” with “verified green core handle” everywhere. Preserve “owner decision” as the only admission language. |
| A3-F5 | MAJOR | `index.html:818-820` — kicker “Most important architecture correction”; “We should add a dedicated…” | “Most important” is authorial emphasis; “we should” is design-authoring conversation. The proposed adapter and IR are inference, labelled only later at `index.html:1055`. | Kicker: “Derivation input boundary.” H2: “Why the legacy Markdown parser cannot feed the BTE path.” Body: “The proposed Design should add…; acceptance remains with Invoke Design.” |
| A3-F6 | MAJOR | `index.html:945-946` — “What changes in the codebase”; “The target is not a rewrite. It is a new…” | The heading and body state a design recommendation as settled fact. | Use “Proposed codebase changes” and “The recommended target is a new, explicit proof path…” Add a “requirements-backed proposal” tag. |
| A3-F7 | MAJOR | `index.html:1005-1006` — “Build in seven dependency-safe slices”; “Each slice should…” | Seven slices are architecture inference, not a frozen plan. “Build in” reads like authorization although Design is missing. | Rename “Proposed dependency order: seven slices” and label the timeline “design candidate — not an authorized work plan.” |
| A3-F8 | MINOR | `index.html:716-717` — “The four planes must not collapse”; color legend | “Plane,” “collapse,” and the color legend arrive before ordinary-language separation. | H2: “Keep four responsibilities separate.” First sentence: “The page separates rule-setting, compilation, proof, and downstream use.” Put the legend second. |
| A3-F9 | MINOR | `index.html:735-736` — “Read left → right inside each plane…”; “Evidence code…” | “Evidence code” does not tell a newcomer that it is a status legend. | Rename to “Reading guide” and “Status legend: existing / proposed / owner gate / external.” |
| A3-F10 | MINOR | `index.html:777-787` — `O_spec`, `O_gen`, “Exact-set gate,” equality formula | Abbreviations appear before their plain terms. | At first occurrence use “expected obligations (`O_spec`)” and “derived obligations (`O_gen`)”; caption the equation “same required IDs across five stages.” |
| A3-F11 | MINOR | `index.html:826-827` — “Follow actual Key and Door records, not placeholders” | “Not placeholders” argues with an imagined prior artifact and is not fully accurate for target-design Instance 2. | Rename “Trace one real compiler record and two labelled target examples.” State which tab is live, target-design, and admission-blocked. |
| A3-F12 | MINOR | `index.html:873-875`; `instances.json:110-113` | “How the same node becomes a complete proof chain” reads as a future fact before the body qualifies it. | Rename “Proposed proof-chain records for the same node.” Keep the target-design tag and stable-ID warning. |
| A3-F13 | MINOR | `index.html:934-937`; `instances.json:296-302` | “What composability proof must add” can read as accepted scope while the relationship denominator remains owner-controlled. | Rename “What a future, admitted composability proof would require.” Keep the “Why blocked” body. |
| A3-F14 | MINOR | `index.html:986-998` | The section labels proposals correctly, but table header “Likely home” can look decided when scanned. | Rename the column “Suggested home (pending Design).” |
| A3-F15 | MINOR | `index.html:1021-1028` | “Must” spans source-backed omissions and Design decisions; the matrix does not consistently identify observed versus proposed versus owner-gated items. | Add a legend: “Observed gap” / “Design decision required” / “Owner admission required.” Do not merge the categories. |
| A3-F16 | MINOR | `index.html:1034-1047`; `lanes.json:44-124` | The glossary is excellent but arrives after terms are used. | Keep it; duplicate only four- or five-word bridges at first use. Do not move all definitions to the top. |
| A3-F17 | MINOR | `index.html:1067-1069` | The 88-plus-word reader-outcome quote repeats the lede, workday, four planes, proof path, gates, and Design gap. | Reduce to three bullets: current boundary; proposed proof path; next authorized action. Preserve “Design must freeze…” exactly. |
| A3-F18 | MINOR | `index.html:1074-1100` | Visual-library enumeration and custom-pattern nudge are X-Ray production metadata, not newcomer explanation. | Keep source links and final status boundary. Collapse visual-library and custom-pattern details into a `<details>` “X-Ray provenance” block or `X-RAY-RESULT.md`. |
| A3-F19 | MINOR | `X-RAY-RESULT.md:61-75,128-154` | “Whisper Content Review,” “SCU cores,” “Spell,” and observer mechanics are operational provenance, not intelligible newcomer content. | Rename the public-facing portion “Narrative rationale” and move Whisper/observer telemetry into an implementation appendix. |
| A3-F20 | MINOR | `lanes.json:46-123` | `source-backed` and `explanatory` authority labels do not state current behavior versus target design. `instances.json:6-10` has the sharper boundary. | Add a `state` field to each term: `existing`, `target-design`, `mixed`, or `governance-limit`. Keep `authority` separate. |

### A3 — Keep, cut, merge, rename matrix

| Surface | Decision | Rationale |
| --- | --- | --- |
| Hero badges at `index.html:584-590` | KEEP | Compact, visible governance boundary. Move its force into the H1 and subtitle; do not remove the badges. |
| Three truth cards at `index.html:594-609` | KEEP, light rename | Strong scan anchor. They correctly separate proven core from missing proof work. |
| Workday legend and current, target, owner labels at `index.html:615,630,638-702` | KEEP | Best audience-facing governance device in the corpus. |
| Workday opening and mental model at `index.html:621-629` | MERGE | The blocks repeat orientation. Make one two-sentence on-ramp and retain the legend. |
| Current, target, and claim-boundary end cards at `index.html:707-710` | KEEP | Crucial correction to optimistic workday copy; keep adjacent to workday. |
| Four-plane module map at `index.html:716-813` | KEEP, rename labels | Useful architecture view with module-level states. Reduce “plane” jargon with first-use glosses. |
| “Most important architecture correction” at `index.html:816-821` | RENAME | Keep the legacy-parser boundary; remove authorial ranking and conversational recommendation voice. |
| Instance explorer at `index.html:824-940` | KEEP | The live, target, and admission-blocked division is concrete and evidence-conscious. |
| Reuse, build, and do-not-carry-forward cards at `index.html:943-981` | KEEP, add target tag | Strong decision-facing structure; add explicit proposal status. |
| Proposed module table at `index.html:984-1000` | KEEP | Already has the right inference disclaimer. Tighten “Likely home.” |
| Seven-slice lifecycle at `index.html:1003-1016` | KEEP, rename | Useful dependency map, but not an authorized plan before Design. |
| Design-gap matrix at `index.html:1019-1030` | KEEP | Clear and falsifiable. Add status-category legend rather than compressing. |
| Reader glossary at `index.html:1032-1048` | KEEP, redistribute bridges | Definitions are strong; first-use bridges solve premature jargon. |
| Evidence split and status legend at `index.html:1051-1062` | KEEP | Governing accuracy anchor. Do not merge into generic prose. |
| Reader-outcome quote at `index.html:1065-1071` | CUT or COMPRESS | Repeats earlier sections; retain a shorter reader test. |
| Source ledger at `index.html:1073-1095` | KEEP | Direct links substantiate the evidence claim. |
| Visual-library and custom-pattern footer at `index.html:1097-1100` | CUT from reader route; retain as provenance | Useful to maintainers, not newcomers. Preserve the final seed and non-authority sentence. |
| `instances.json` evidence boundary and stable-ID warning | KEEP | Exact, compact, and prevents target-design inflation. |
| `instances.json` relationship blocked explanation | KEEP | A real edge does not establish admitted completeness. |
| `lanes.json` reader contract | KEEP | Its “must not start with…” constraints support preserving the workday first. |
| `X-RAY-RESULT.md` status meaning and evidence boundary | KEEP | Strongest textual account of non-authority and stale-plan boundaries. |
| `X-RAY-RESULT.md` Whisper and observer material | MOVE | Valid operational record, wrong layer for an audience-facing result. |

### A3 — What survived

The page’s central governance claims survive. It repeatedly and concretely separates:

- live compiler and provenance evidence from BTE target design (`index.html:707-710`; `instances.json:106,316,421-425`);
- source-backed, requirements-backed, owner-gated, and open-gap material (`index.html:1054-1061`; `X-RAY-RESULT.md:20-25`);
- proof evidence from admission and release authority (`index.html:700,800,1100`);
- a real compiled edge from a future relationship-completeness claim (`index.html:925-937`; `instances.json:296-302`).

The “one real node / same candidate proof chain / real edge with blocked causal proof” sequence is sound. It does not collapse candidate IDs into frozen schema (`instances.json:110-113`) and keeps target steps visibly labelled. The recommendation is revision, not rejection: make proposal state and structural-claim limits visible at the first heading or body sentence of each architectural block, then delete meta-copy that repeats what the labels already establish.
