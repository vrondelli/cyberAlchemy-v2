# BTE X-Ray Conversational Language Audit — Raw Returns

- Dispatch: `2026-07-22-bte-xray-conversational-language-audit`
- Target: current `index.html`, `lanes.json`, `instances.json`,
  `X-RAY-RESULT.md`, and `WHISPER-RESULT.md`
- Boundary: read-only review; these returns do not modify or authorize changes

## Strategy Inventory Packet

- Lookup status: `machine-index-current-source-coverage-partial`
- Query terms: BTE, X-Ray, copy, readability, conversational language,
  terminology, Whisper, workday, newcomer
- Selected entry: `domainspec-v2-bte-xray-copy-readability-review-result`;
  used only as a stale regression checklist because its recorded target state
  predates the latest rewrite
- Selected entry:
  `whisper-concision-reading-flow-maintenance-review-strategy-result`; supplied
  the one-job-per-block and compress-before-sentence-editing checks
- Selected entry: `domainspec-v2-composability-proof-plain-language-guide`;
  supplied a non-authority first-use glossary and complete-example pattern
- Evidence cards / EvidenceSets: none selected
- Excluded: simple-ontology-presentation entries, because they govern a
  different transport and subject
- Excluded: EVF implementation-completion audits, because implementation
  sequencing does not answer this editorial audit
- Gap: no post-rewrite audit of conversational voice or term introduction
- Design consequence: every finding must quote the current target; terms are
  classified as retain-and-define, replace, move, or delete instead of treating
  all technical vocabulary as jargon
- Non-authority notice: Inventory is a discovery read model, not review proof

## Agent 1 — Simon, Herbert — Cold-reader task analysis

Cold-reader verdict: no CRITICAL findings. The technical claims remain bounded, but the page still speaks as a guide, authoring session, and workflow report too often. That conflicts with Whisper’s own “one audience block per job” claim and dilutes the BTE explanation.

Findings:

1. **MAJOR — replace** — `index.html:606`: “Start with one modeled change … this page separates …” opens by directing the reader and narrating the page.
   - Fix: state the BTE boundary directly: “BTE carries a modeled change from validated source to replayable structural evidence, while admission remains owner-controlled.”

2. **MINOR — move** — `index.html:610-612`: “Invoke Plan is next,” “Mixed architecture + process mode,” and “L0 static HTML/SVG” are delivery/runtime metadata in the primary header.
   - Fix: move Plan routing and renderer/mode metadata to the footer or result document.

3. **MINOR — replace** — `index.html:625-627`: “WHAT WE KEEP” and “Use the proven core” introduce author-team voice and an imperative.
   - Fix: rename to “EXISTING REUSABLE COMPONENTS” / “Reusable compiler foundations.”

4. **MAJOR — replace** — `index.html:659,676,694`: “The source is the thing you edit,” “You confirm both structural edges,” and “You change the implementation” turn the BTE model into second-person lifecycle coaching; the block also shifts actor from author to compiler to developer without making that responsibility change the subject.
   - Fix: compress the nine-step workday into three system stages—source/compile, proof execution, replay/handoff—and express human actions only as explicitly named boundary roles.

5. **MAJOR — delete** — `index.html:737-744`: “The process in three lines” is a retell checkpoint immediately after the full workday and adds no new BTE information.
   - Fix: remove the entire checkpoint; its three claims already exist in the preceding flow and claim boundary.

6. **MINOR — move** — `index.html:1011`: “Machine-readable companion … It carries the full records …” describes artifact packaging rather than the process instance.
   - Fix: move the companion link to the source ledger.

7. **MAJOR — replace** — `index.html:1016-1017,1057-1058,1079`: “Plan may choose,” “Plan must preserve,” and “Invoke Plan must assign …” make lifecycle authorship the recurring narrator of architecture sections.
   - Fix: state the invariant directly in the architecture sections and keep the one next-route sentence under Remaining Gates.

8. **MINOR — delete** — `index.html:1112`: “Open any term you need” is direct-address helper prose above controls whose affordance is already obvious.
   - Fix: delete the sentence or replace it with “Definitions include purpose and misuse boundaries.”

9. **MAJOR — replace** — `index.html:1132-1133`: “were read from live machine sources” and “The page layout … are explanatory choices … this page remains non-semantic” explain how the artifact was assembled.
   - Fix: retain only claim status—“Existing behavior is source-backed; candidate records and code homes are illustrative”—and move construction provenance to the collapsed footer.

10. **MAJOR — delete** — `index.html:1143-1154`: “After this x-ray, you should be able to say” is audience-performance narration and repeats the opening, workday checkpoint, architecture outcomes, and evidence boundary.
    - Fix: remove the section; if a close is required, replace it with one non-recap boundary sentence.

11. **MINOR — delete** — `index.html:1190`: “Add it to the canonical X-Ray library only after repeated examples …” is internal lifecycle guidance, not BTE content.
    - Fix: retain this instruction only in `X-RAY-RESULT.md` or the X-Ray inventory.

What survived:

- `index.html:622`, the six-catalogue table at `851-867`, the canonical-input warning at `873-874`, and the concrete chains at `892-1008` explain BTE responsibilities, boundaries, and evidence directly.
- The term definitions at `1115-1125` are useful because each block performs one domain job despite the removable introductory prompt.
- “Jump to the live example,” architecture toggles/presets, and instance tabs at `613`, `755-764`, and `885-887` are navigational UI labels, not conversational prose.
- Catalogue questions at `858-863` and proof questions at `892`/`996` are bounded domain questions that expose what is being proven; they are not reader-directed prompts.
- Imperative-like layer labels such as “Freeze what must be proved” are compact process-node names and survive because they label system work rather than coach the reader.

Inventory consequence: `WHISPER-RESULT.md:111` says “one audience block per job: applied,” but the workday plus retell checkpoint plus reader-outcomes block disproves that on the current surface. `WHISPER-RESULT.md:121` records only the rewrite pass, and the target directory contains no later conversational-language audit. Register this review as the missing post-rewrite audit, with structural compression preceding sentence-level edits.

## Agent 2 — Gadamer, Hans-Georg — Contract-fidelity interpretation

Contract-fidelity audit found one critical contradiction and several major term drifts. The technical vocabulary itself is mostly justified; the problem is where casual wording changes eligibility, authority, or evidence semantics.

### Findings

1. **CRITICAL — “not yet designed” contradicts the validated Design state.**<br>
   `lanes.json:290`: “The versioned formation replacement, retirement-map schema, compatibility corpus, and failure precedence are not yet designed.” This conflicts with `X-RAY-RESULT.md:21-24` and `DESIGN.md:43-47`, which say Design is validated and Plan-ready while implementation/admission remain open.<br>
   **Treatment:** replace with “designed but not yet materialized as validated machine contracts and implementation.”<br>
   **Meaning that must survive:** architecture choices are frozen for Plan; schemas, validators, runtime, evidence, and admission are not yet complete.

2. **MAJOR — three catalogue IDs are casually shortened into different identities.**<br>
   `index.html:861-863` uses `node-instance@1`, `relationship-family@1`, and `edge-instance@1`; the contract names are `node-instance-conformance@1`, `relationship-family-causality@1`, and `edge-instance-conformance@1` in `DESIGN.md:362-364`.<br>
   **Treatment:** replace with the exact contract IDs everywhere; plain labels can sit beside them.<br>
   **Meaning that must survive:** catalogue identity is versioned and exact, not editorial shorthand.

3. **MAJOR — the “enter core proof” column drops required gates.**<br>
   `index.html:858-863` says, for example, formation criterion enters “After isolated formation-v2 is implemented and replayed,” structure after expectations freeze, and node causality after its evaluator proves a delta. The Design also requires successor formation/profile admission, profile/pattern admission, relationship admission, and terminal inclusion of all six catalogues (`DESIGN.md:357-375`).<br>
   **Treatment:** retain the table but synchronize each row to its complete admission + implementation + replay prerequisites.<br>
   **Meaning that must survive:** successful execution is insufficient; catalogue eligibility depends on exact owner admission and replay for the governed scope.

4. **MAJOR — receipt, replay result, and core aggregate handle are used as synonyms.**<br>
   `index.html:742`: “fresh consumer receipts may demonstrate preservation”; `index.html:829-831` says consumers return receipts and `verify:bte:consumers` validates receipt handles. `lanes.json:247,263` likewise says “fresh … receipts” and “green core receipt handle.” The Design requires a green **core aggregate handle**, consumer raw evidence/receipt, BTE-owned **ReplayResult**, then exact replay handles for the consumer aggregate (`DESIGN.md:535-549`).<br>
   **Treatment:** replace “core receipt handle” with “core aggregate handle”; say consumer receipts index raw evidence, while only successful consumer ReplayResults enter `verify:bte:consumers`.<br>
   **Meaning that must survive:** receipts are non-authoritative indexes; replay recomputes; aggregates consume replay results.

5. **MAJOR — the authority plane collapses distinct authority classes.**<br>
   `index.html:772` labels “Authority + authored input,” while `index.html:1115` defines the plane as machine files saying what is allowed. The Design explicitly says authority is not one boolean and separates semantic contract, admission decision, derived view, evidence, aggregate result, and lifecycle decision (`DESIGN.md:115-130`).<br>
   **Treatment:** rename to “Contracts, admissions, and authored inputs,” then distinguish semantic sources from owner admission in the first explanation.<br>
   **Meaning that must survive:** generated graphs/evidence cannot define semantics or perform admission, and semantic validity is not owner approval.

6. **MAJOR — load-bearing comparison terms arrive before a usable bridge.**<br>
   `index.html:688-689` introduces `ProofContext`, `O_spec`, `O_gen`, “coverage keys,” and “blocking diff” in one paragraph; `index.html:713-734` adds “typed residue,” “core aggregate,” and “exact denominator.” The actual coverage-key definition waits until `index.html:867`, and several others never receive first-use plain definitions.<br>
   **Treatment:** retain the formal terms, but bridge first use: “coverage key—the catalogue ID plus obligation ID used to match unlike records”; “typed residue—a machine-readable blocking reason”; “denominator—the exact membership set being claimed”; “core aggregate—the exact replay-backed structural result.”<br>
   **Meaning that must survive:** exact equality is by `catalogue_id + obligation_id` plus compatible versions/digests; residue blocks; aggregate is bounded and non-admitting.

7. **MAJOR — “mutation” is narrowed to an invalid variation.**<br>
   `lanes.json:119` and `index.html:1123` define mutation as “deliberately invalid.” The formal contract permits one declared semantic edit whose expected effect is either a specific failure or removal of a causal output (`DESIGN.md:494-500`).<br>
   **Treatment:** replace with “one declared semantic edit in a fresh child build, expected to trigger a named failure or remove a named causal effect.”<br>
   **Meaning that must survive:** fresh lineage and reason-specific causal discrimination; stale digest rejection alone is never a kill.

8. **MINOR — internal governance routing leaks into the newcomer’s main task.**<br>
   `index.html:1097-1104` exposes “Plan regeneration,” “stale execution package,” and “FPR-02 Decision 9.” These are repository workflow details, not necessary to understand BTE architecture.<br>
   **Treatment:** move exact route/package/decision identifiers to the source ledger or a maintainer note; retain “implementation planning and requirement trace must be refreshed before work begins.”<br>
   **Meaning that must survive:** Design is complete, implementation authorization/tasks are not.

### What survived

- The `UnlockDoor` opening gives technical terms a concrete reason to exist and sharply separates structural graph evidence from application correctness (`index.html:646-654,928`).
- `ProofContext` remains an envelope over the canonical graph, never a second graph (`index.html:937-940,1120`).
- `O_spec` independence from `O_gen` and expectation provenance survive (`index.html:941-958`).
- `TestCase` as pre-run instruction and `ExecutionResult` as post-run observation remain correctly distinct (`index.html:953-973`; `GLOSSARY-CONSISTENCY.md:23-24`).
- Exact-set equality preserves different artifact IDs and a shared coverage projection (`index.html:991`; `GLOSSARY-CONSISTENCY.md:58-72`).
- Receipt/replay separation is correctly stated in the detailed proof chain and glossary even though other passages drift (`index.html:981-989,1124`).
- Current, Design-defined, implementation-open, and owner-controlled states are visually and verbally separated well.

## Agent 3 — Shannon, Claude — Cross-surface information analysis

Cross-surface verdict: **FIX**. No CRITICAL findings; three MAJOR and three MINOR findings survive.

| # | Current evidence | Severity | Concrete change |
|---|---|---|---|
| F-01 | `lanes.json:290-295` says “formation replacement… and failure precedence are not yet designed” and lists other design defects, while `index.html:1094-1097` says “Architecture questions are closed,” and `X-RAY-RESULT.md:21-24,30-35` says validated Design is ready for Plan and has frozen failure order/interfaces. | **MAJOR** | Reconcile from the authoritative Design state. If Design is validated, delete the stale “not yet designed” lane evidence and replace it with implementation/admission gates. If those questions truly remain open, downgrade the HTML/result status from pass. Do not leave opposite lifecycle claims in machine and human surfaces. |
| F-02 | The declared four-state model in `X-RAY-RESULT.md:26-37` separates “Runs now,” “Design contract,” “Build next,” and “Owner gate.” The HTML collapses and mutates it: “Design validated · implementation open” (`index.html:608-610`), “Design contract · build next” (`index.html:649-654`), and “existing · Design/build-next · owner gate · external” (`index.html:768-769`). `instances.json:146,154` instead uses `validated-design-unimplemented` and `target-design`. | **MAJOR** | Establish one lifecycle vocabulary and map every machine value to it. Keep `external` as a system boundary, not a lifecycle state; keep source provenance separate from implementation state. Do not merge Design-defined and build-next if the result contract treats them as distinct. |
| F-03 | The page repeatedly restates its thesis/status rather than progressing: opening summary cards (`index.html:617-633`), current/target day outcomes immediately followed by a three-line retell (`index.html:730-744`), four architecture outcomes (`index.html:840-845`), another four-item reader outcome block (`index.html:1143-1153`), then a footer status disclaimer (`index.html:1185-1191`). This conflicts with Whisper’s “one audience block per job: applied” assertion (`WHISPER-RESULT.md:109-123`). | **MAJOR** | Consolidate at block level before editing sentences: keep the opening contract and local state labels; delete `day-outcome` because the adjacent retell checkpoint performs the summary job; delete the late reader-outcomes block because the plane outcomes already do it; move footer status/provenance to operational metadata. Revalidate Whisper after consolidation. |
| F-04 | The process explorer paraphrases itself three times: heading “Trace one live compiler chain…” (`index.html:878-880`), paragraph “The first tab… The second… The third…” (`index.html:881`), then explicit tab labels (`index.html:884-887`). | **MINOR** | Delete the paragraph at line 881. The heading supplies the audience promise and the tabs supply exact state/local navigation. |
| F-05 | Authoring/renderer metadata is exposed as hero copy: “Mixed architecture + process mode” and “L0 static HTML/SVG” (`index.html:607-613`). The visible source ledger also promotes “Whisper narrative and delivery-flow result” (`index.html:1179-1182`), while the footer exposes “x-ray 0.2.0-seed” (`index.html:1185-1186`). | **MINOR** | Remove mode/renderer badges from the hero. Move the Whisper link and seed/runtime status into the existing collapsed provenance disclosure or the operational result files. Keep “Invoke Plan is next”: that is audience-relevant lifecycle guidance, not authoring metadata. |
| F-06 | The consumer handoff object still drifts: “verified core aggregate handle” (`index.html:717-719`), “exact core handle” (`index.html:829`), “target green core receipt handle” (`lanes.json:261-263`), and “Verified green core aggregate handle” (`instances.json:493-497`). | **MINOR** | Standardize on **verified green core aggregate handle**, matching the concrete machine instance, and use it everywhere with adjacent target-design status. Reserve “receipt” for actual receipt records rather than the aggregate handoff. |

What survived:

- The earlier evidence overclaim is repaired: `instances.json:113-141` now supplies literal `DoorUnlocked`/`produces` records, while `index.html:646-647,928` limits them to structural preservation rather than runtime behavior.
- The workday’s current/target/owner separation remains locally legible, especially `index.html:658-734`.
- The live, target, and admission-blocked process panels are clearly distinguished at `index.html:890-997`.
- The risk matrix preserves its literal column structure through horizontal scrolling (`index.html:1099-1105`; CSS at `index.html:479-484`).
- X-Ray and Whisper process language is legitimate inside `X-RAY-RESULT.md` and `WHISPER-RESULT.md`; the defect is its promotion into the newcomer-facing HTML, not its existence in operational records.
- The glossary and evidence-boundary blocks each retain a distinct audience job and should remain.

## Synthesizer — Meadows, Donella H. — Candidate finding set

The semantic findings below are not matters of tone; the editorial findings
are labeled separately.

### Contract and identity defects

| ID | Severity / treatment | Current evidence | Proposed fix | Sources |
|---|---|---|---|---|
| C1 | **CRITICAL — replace** | `lanes.json:290`: “formation replacement, retirement-map schema, compatibility corpus, and failure precedence are not yet designed.” This directly contradicts `X-RAY-RESULT.md:21-24,30-35` and `DESIGN.md:43-47`, where Design is validated and those boundaries are frozen for Plan. | Replace with: “Designed and frozen for Plan, but not yet materialized as validated machine contracts, implementation, evidence, or owner admission.” Preserve the distinction between Design completion and implementation/admission completion. | A2-1, A3-F01 |
| C2 | **MAJOR — replace** | The canonical states are `X-RAY-RESULT.md:26-37`: **Runs now / Design contract / Build next / Owner gate**. HTML merges two at `index.html:654` (“Design contract · build next”) and `769` (“Design/build-next”), while `instances.json:146,154` invents `validated-design-unimplemented` and `target-design`; `external` at `index.html:769` is topology, not lifecycle. | Use exactly the four state labels everywhere. Map machine values to those four or add separate `design_status` and `implementation_status` fields. Keep `external` as a boundary/ownership axis. | A3-F02 |
| C3 | **MAJOR — replace** | `index.html:861-863`: `node-instance@1`, `relationship-family@1`, `edge-instance@1`. Design IDs are `node-instance-conformance@1`, `relationship-family-causality@1`, and `edge-instance-conformance@1` (`DESIGN.md:362-364`). | Replace all shortened IDs with exact versioned identities; retain plain labels beside them if helpful. | A2-2 |
| C4 | **MAJOR — replace while retaining table** | `index.html:858-863` reduces core eligibility to implementation/replay or a frozen graph. Design requires catalogue-specific admission plus implementation and replay, and terminal core requires all six (`DESIGN.md:357-375`). | Synchronize each eligibility cell with its exact prerequisites: successor formation admission; profile/pattern admission; relationship admission where applicable; implementation; replay; and terminal six-catalogue inclusion. | A2-3 |
| C5 | **MAJOR — replace** | `index.html:719` says “verified core aggregate handle,” `829-831` says consumers return receipts and the aggregate validates receipt handles; `lanes.json:247,263` says “green core receipt handle.” The correct concrete value already appears at `instances.json:495`: “Verified green core aggregate handle.” | Standardize on **verified green core aggregate handle**. Consumer receipts index raw evidence; BTE-owned consumer replay emits `ReplayResult`; `verify:bte:consumers` consumes exact fresh replay handles (`DESIGN.md:535-544`). Never use receipt, replay result, and aggregate handle synonymously. | A2-4, A3-F06 |
| C6 | **MAJOR — replace** | `index.html:772`: “Authority + authored input”; `1115`: authority is “machine files saying … what is allowed.” Design explicitly separates six authority classes and says status and ownership are independent (`DESIGN.md:115-130`). | Rename the plane **Contracts, admissions, and authored inputs**. At first explanation distinguish semantic contracts, admission decisions, derived read models, proof evidence, aggregate results, and lifecycle decisions. Generated validity must not imply authority or admission. | A2-5 |
| C7 | **MAJOR — replace** | `lanes.json:118-124` and `index.html:1123` define mutation as deliberately invalid. Design permits one declared semantic edit expected either to produce a named failure or remove a named causal effect (`DESIGN.md:494-500`). | Define mutation as “one declared semantic edit in a fresh child build, expected to trigger a named failure or remove a named causal effect.” Preserve recomputed lineage and the rule that digest mismatch alone is not a kill. | A2-7 |
| C8 | **MAJOR — retain-and-define** | `index.html:688-689,713-734` introduces `ProofContext`, `O_spec`, `O_gen`, coverage key, blocking diff, typed residue, core aggregate, and denominator before usable bridges. The coverage key is only explained at `867`. | Keep the formal terms, but bridge first use: coverage key = catalogue ID plus obligation ID; typed residue = machine-readable blocking reason; denominator = exact claimed membership; core aggregate = exact replay-backed, non-admitting structural result. Preserve exact-set equality and compatible version/digest requirements. | A2-6 |

### Audience-facing copy defects

| ID | Severity / treatment | Current evidence | Proposed fix | Sources |
|---|---|---|---|---|
| E1 | **MAJOR — delete/retain with one summary job** | `index.html:730-734` gives current outcome, target outcome, and claim boundary; `737-744` immediately retells Today/Designed/Authority; `1143-1153` recaps the page again. | Assign **workday closure** solely to `day-outcome` plus `day-limit` (`730-734`). Delete the retell checkpoint (`737-744`) and late reader-outcomes block (`1143-1153`). Retain architecture outcomes (`840-845`) because they map the four planes rather than retell the whole page. | A1-5, A1-10, A3-F03 |
| E2 | **MINOR — replace/delete** | Reader/author narration appears at `index.html:606` (“Start with…”), `625-627` (“WHAT WE KEEP / Use…”), `659`, `676`, `694` (“you”), and `1017,1057-1058,1079` (“Plan may choose/must preserve/must assign”). `1112` adds “Open any term you need.” | Replace coaching with direct system statements or named actors. Keep exactly one lifecycle route under Remaining Gates/Next Route; elsewhere state the invariant directly. Delete the redundant glossary instruction. | A1-1, A1-3, A1-4, A1-7, A1-8 |
| E3 | **MINOR — delete** | `index.html:878-887` gives a heading, a prose description of all three tabs, then self-describing tab labels. | Delete only `index.html:881`; heading and tabs already perform the orientation job. | A3-F04 |
| E4 | **MINOR — move, with selective replacement** | Audience HTML exposes mode/renderer badges (`610-612`), companion packaging (`1011`), repository workflow identifiers (`1097-1104`), Whisper authoring linkage (`1181`), seed/runtime status and promotion guidance (`1186-1190`). `1132-1133` narrates artifact construction rather than only claim status. | Move mode, renderer, companion packaging, exact internal route IDs, Whisper provenance, seed version, and pattern-promotion guidance into collapsed provenance or the operational result files. Keep “Invoke Plan is next” and a plain requirement-refresh statement. Replace `1132-1133` with concise claim status: existing behavior is source-backed; candidate records/code homes are illustrative. | A1-2, A1-6, A1-9, A1-11, A2-8, A3-F05 |

### Dropped candidates

- Delete `day-outcome` and keep the retell: dropped because `day-outcome`
  preserves the more precise current-versus-intended contrast and sits beside
  the claim boundary.
- Remove “Invoke Plan is next”: dropped because it is relevant lifecycle
  routing; only repeated Plan narration should go.
- Delete technical vocabulary wholesale: dropped because the terms are
  load-bearing and need first-use bridges.
- Remove process language from X-Ray/Whisper operational results: dropped
  because those files own that metadata.
- Rewrite compact system-node labels: dropped because they label system work,
  not reader behavior.
- Delete the evidence boundary: dropped because it has a distinct epistemic
  job; only construction-provenance wording should move.

## Verifier 1 — Gigerenzer, Gerd — Counter-example attack

Verifier verdict: the candidate set is directionally sound, but several
remedies over-compress the newcomer surface. No files changed.

| ID | Disposition | Literal evidence and concrete revision |
|---|---|---|
| C1 | Confirm | `lanes.json:290` says the replacement, retirement map, corpus, and precedence “are not yet designed,” while `X-RAY-RESULT.md:30-35` says architecture, failure order, and interfaces are “frozen for Plan.” Replace with: “Designed and frozen for Plan; versioned machine schemas, validators, implementation, evidence, and owner admission remain open.” |
| C2 | Narrow | Drift is real: `index.html:654` says “Design contract · build next,” `769` says “Design/build-next,” while `instances.json:146` says “validated-design-unimplemented.” But “use exactly four labels everywhere” destroys useful evidence/admission detail. Define four lifecycle states, then give machine records separate `lifecycle_state`, `evidence_status`, and `admission_status`; keep `external` as topology. |
| C3 | Confirm | `index.html:861-863` literally shortens three IDs to `node-instance@1`, `relationship-family@1`, and `edge-instance@1`. Replace them with the exact versioned IDs; preserve plain question labels beside them. |
| C4 | Confirm, narrow remedy | The cells at `858-863` mention isolated implementation, frozen expectations, graph handles, or relationship selection unevenly. Do not stuff every common prerequisite into every row. Add one table-level rule: “Every catalogue requires applicable owner admission, implementation, successful replay, and terminal six-catalogue inclusion”; keep only the row-specific gate in each cell. |
| C5 | Confirm | `index.html:829-831` says consumers “return a fresh receipt” and the aggregate validates “receipt handles”; `lanes.json:247,263` says “green core receipt handle.” Yet `instances.json:493-497` correctly uses “Verified green core aggregate handle” and “Fresh consumer ReplayResults.” Standardize on that chain: aggregate handle → raw consumer evidence/receipt → BTE-owned ReplayResult → consumer aggregate. |
| C6 | Narrow | `index.html:772` says “Authority + authored input,” while `1115` reduces authority to files saying what is allowed. The grouping is useful, but it must not imply one authority class. Rename it “Authority inputs: contracts, admissions, and authored sources,” followed by one sentence that derived views, evidence, aggregates, and lifecycle decisions have distinct roles. Avoid front-loading all six classes into the newcomer’s first explanation. |
| C7 | Confirm | `lanes.json:119` and `index.html:1123` define mutation only as “deliberately invalid,” but `index.html:1006` already uses edge removal to require a causal change. Replace with the candidate definition covering a named failure or removal of a named causal effect in fresh child lineage. |
| C8 | Confirm | `index.html:688-689` introduces `ProofContext`, coverage keys, `O_spec`, `O_gen`, and blocking diff; `713-734` adds typed residue, core aggregate, and denominator before the coverage-key bridge at `867`. Add short first-use bridges for coverage key, typed residue, denominator, and core aggregate. Keep the detailed formal chain intact. |
| E1 | Reject full deletion; narrow | Deleting both `737-744` and `1143-1153` removes every deliberate global recall aid. `730-734` is a local workday closure, not quite an exit test. Delete the immediate three-line checkpoint, but retain a compressed final reader-outcomes block covering current compiler proof, Design proof/replay, consumer handoff, and owner authority. |
| E2 | Narrow | The actor drift is real: “You confirm” (`676`) and “You change” (`694`) obscure responsibility. Replace those with “The DomainSpec author inspects…” and “The implementation developer changes…”. Do not mechanically purge all direct address: “Open any term you need” (`1112`) is useful disclosure affordance, and “Start with” (`606`) is navigational rather than semantic drift. |
| E3 | Confirm | `index.html:878-887` repeats the three-instance orientation in heading, paragraph, and tab labels. Delete only `881`; no proof semantics disappear. |
| E4 | Confirm, narrow | Mode/renderer badges (`610-612`), companion packaging (`1011`), internal route identifiers (`1097-1104`), Whisper link (`1181`), and seed/promotion metadata (`1186-1190`) can move. But preserve concise epistemic status at `1132-1133`: “Existing behavior is source-backed; Design boundaries are validated contracts; candidate record values and code homes are illustrative.” Keep “Invoke Plan is next” and the plain refresh requirement. |

Retell stress test:

- UnlockDoor source → compile → proof → replay remains recoverable from `638`, `663-701`, and `711-719`, with the exact record chain at `937-989`.
- The six catalogue questions remain intact at `851-867`; C3/C4 correct identities and eligibility without deleting the questions.
- TestCase versus ExecutionResult remains explicit: `index.html:953` says “Before running,” while `970` says “After running.” `instances.json:215` and `271` repeat the same distinction.
- The only material recall risk is E1’s proposed deletion of both summary surfaces; retain one global exit retell.

Confirmed IDs: C1, C3, C5, C7, C8, E3; C2, C4, C6, E1, E2,
and E4 survive only with the narrowed revisions above.

Dropped/refuted: no entire semantic ID should be dropped. Refuted remedy
portions are C2’s exact-label-everywhere rule, C4’s repetition of all
prerequisites per row, E1’s deletion of both recall aids, E2’s wholesale
removal of direct-address affordances, and E4’s over-terse claim-status
replacement.

## Verifier 2 — Wittgenstein, Ludwig — Scope attack

Read-only verification complete. The Design, glossary, and all five current
X-Ray surfaces support a mixed verdict.

Confirmed: C1, C3, C4, C6, C7, E1.<br>
Confirmed with narrower treatment: C2, C5, C8, E2, E4.<br>
Refuted as written: E3.

- **C1 — confirm CRITICAL.** `lanes.json:290` says the replacement, retirement map, corpus, and failure precedence “are not yet designed,” while `DESIGN.md:43-47` says Design is Plan-ready and implementation/admission remain open. Revision: “These boundaries are designed and frozen for Plan; their machine contracts, validators, implementation, replay evidence, and owner admissions remain outstanding.”

- **C2 — confirm defect, reject literal four-value-only prescription.** HTML merges “Design contract · build next” (`654`) and “Design/build-next” (`769`), but machine values such as “validated-design-unimplemented” (`instances.json:146`) accurately express two axes. Revision: display separate `Design contract` and `Build next` badges; machine records should expose separate state axes or an explicit mapping. Keep `external` as topology and provenance as evidence state—not lifecycle.

- **C3 — confirm MAJOR.** `index.html:861-863` shortens exact identities that Design fixes at `DESIGN.md:362-364`. Replace with `node-instance-conformance@1`, `relationship-family-causality@1`, and `edge-instance-conformance@1`.

- **C4 — confirm MAJOR.** “After isolated formation-v2 is implemented and replayed” (`858`) omits admission; other rows similarly omit catalogue-specific admission, proof, replay, or terminal inclusion. Synchronize each row to `DESIGN.md:357-375`; do not use one generic prerequisite formula.

- **C5 — confirm semantic drift, narrow targets.** “Validates exact fresh receipt handles” (`index.html:831`) conflicts with Design’s exact fresh replay handles (`DESIGN.md:540-544`); `lanes.json:247,263` incorrectly says “core receipt handle.” Also correct aggregate-runner input at `index.html:1070`. Preserve `index.html:829-830` saying consumers return receipts—that is accurate. Revision: core input = verified green core aggregate handle; consumer runner emits raw evidence plus non-authoritative receipt; BTE replay emits `ReplayResult`; aggregate consumes exact fresh replay handles.

- **C6 — confirm MAJOR.** “Authority + authored input” (`772`) and “machine files saying … what is allowed” (`1115`) flatten the six roles at `DESIGN.md:117-130`. Rename to “Contracts, admissions, and authored inputs,” with a short distinction among semantic contract, owner admission, derived graph, proof evidence, aggregate result, and lifecycle decision.

- **C7 — confirm MAJOR.** “A deliberately invalid variation” (`lanes.json:119`; `index.html:1123`) excludes causal-output removal. Use the proposed semantic-edit/fresh-child-lineage definition from `DESIGN.md:494-500`.

- **C8 — confirm only for unbridged terms.** Objection: `ProofContext` already has an inline bridge at `index.html:688`, `O_spec/O_gen` are immediately labeled expected/derived at `689`, and TestCase/Binding/Evaluator are bridged at `694`. Revision should target only `coverage key`, `blocking diff`, `typed residue`, `core aggregate`, and `denominator`, retaining exact formal names and version/digest semantics.

- **E1 — confirm MAJOR, after C2.** Keep `day-outcome` plus claim boundary (`730-734`); delete the immediate retell (`737-744`) and late recap (`1143-1153`). First unmerge Design contract from Build next so compression does not erase the four states.

- **E2 — narrow.** Revise actual coaching: “Start with” (`606`), “WHAT WE KEEP / Use” (`625-626`), “you edit/confirm/change” (`659,676,694`), and optionally delete `1112`. Name the DomainSpec author or implementation developer. Refute removal of “Plan may choose,” “must preserve,” and “must assign” (`1017,1057-1058,1079`): these are precise Design/Plan boundaries, not conversational leakage.

- **E3 — refute deletion.** `index.html:881` says the second tab uses “illustrative record values” and the third is blocked on “implementation and owner admission”; the tab labels do not carry those evidence boundaries. Compress instead: “Tabs separate checked-in compiler evidence, illustrative Design records still to implement, and an existing edge whose causal proof awaits implementation and admission.”

- **E4 — narrow substantially.** Move hero mode/renderer badges (`611-612`) to provenance and consider moving exact internal route IDs (`1104`) to a maintainer/source note. Keep “Invoke Plan is next.” Refute moving the machine companion (`1011`) or Whisper link from the source ledger (`1181`): both are correctly placed evidence affordances. Seed status is already in the footer (`1186`), promotion guidance already collapsed (`1187-1190`), and the source/inference wording (`1132-1133`) performs a required epistemic-boundary job; tighten it, do not reduce it to claim status alone.

No files were changed.

## Zig-zag reconciliation — Meadows, Donella H.

All twelve IDs survive for re-verification, with narrowed remedies.

### Final contract and identity candidates

- **C1 — CRITICAL — replace.** Replace `lanes.json:290` with: “These
  boundaries are designed and frozen for Plan; versioned machine schemas,
  validators, implementation, replay evidence, and owner admissions remain
  outstanding.”
- **C2 — MAJOR — replace and explicitly map.** Preserve reader-facing
  **Runs now / Design contract / Build next / Owner gate**. Machine records may
  use separate `lifecycle_state`, `evidence_status`, and `admission_status`, or
  an explicit composite mapping. `external` remains topology/provenance.
- **C3 — MAJOR — replace.** Use the exact IDs
  `node-instance-conformance@1`, `relationship-family-causality@1`, and
  `edge-instance-conformance@1`, with plain questions beside them.
- **C4 — MAJOR — retain table and replace eligibility contract.** Add one
  table-level rule requiring applicable owner admission, implementation,
  successful replay, and terminal six-catalogue inclusion. Each row retains
  only its additional catalogue-specific gate.
- **C5 — MAJOR — replace selectively.** Standardize the chain as **verified
  green core aggregate handle → consumer-owned raw evidence plus
  non-authoritative receipt → BTE-owned ReplayResult → consumer aggregate
  consuming exact fresh replay handles**. Consumers may still return receipts;
  those receipts are not replay or aggregate inputs by themselves.
- **C6 — MAJOR — replace with concise bridge.** Rename the plane **Authority
  inputs: contracts, admissions, and authored sources**. Add one short sentence
  distinguishing semantic contracts and owner admissions from derived graphs,
  proof evidence, aggregates, and lifecycle decisions.
- **C7 — MAJOR — replace.** Define mutation as: “One declared semantic edit in
  a fresh child build, expected to trigger a named failure or remove a named
  causal effect.” Digest mismatch alone is not a kill.
- **C8 — MAJOR — retain and define only unbridged terms.** Bridge coverage key,
  blocking diff, typed residue, denominator, and core aggregate at first use.
  Do not re-explain terms already bridged at `index.html:688-694`.

### Final audience-facing candidates

- **E1 — MAJOR — delete one retell and compress one global recall aid.** Keep
  `day-outcome` plus `day-limit`; delete the immediate retell checkpoint; retain
  one compressed final four-state exit check without replaying the nine-step
  workday. Apply C2 first.
- **E2 — MINOR — replace coaching that obscures actors.** Name DomainSpec
  author and implementation developer instead of “you”; neutralize
  “WHAT WE KEEP / Use the proven core.” Keep navigational/disclosure direct
  address and precise Plan ownership language. A neutral opening may replace
  “Start with,” but wayfinding itself is not a semantic defect.
- **E3 — MINOR — compress.** Replace the process-explorer paragraph with:
  “Tabs distinguish checked-in compiler evidence, illustrative Design records
  still to implement, and an existing edge whose causal proof awaits
  implementation and admission.”
- **E4 — MINOR — move only misplaced metadata.** Move hero mode/renderer badges
  to provenance and move the exact FPR-02 decision ID to a maintainer/source
  note while retaining the plain refresh requirement. Keep the machine
  companion, Whisper result link, footer provenance, next route, and a tightened
  evidence/inference split.

Stable disagreement: none after reconciliation. No target files were changed.

## Final re-verification

### Gigerenzer, Gerd

PASS

### Wittgenstein, Ludwig

C6 — “Authority inputs: contracts, admissions, and authored sources” still
places authored sources beneath an authority umbrella. `DESIGN.md:117-130`
says authority is not one boolean and separates roles. Revise to “Contracts,
admissions, and authored inputs,” then state: semantic contracts define allowed
shape and meaning; owner decisions admit exact contracts or sets; authored
sources provide governed content. Derived graphs, evidence, aggregates, and
lifecycle decisions retain separate roles.
