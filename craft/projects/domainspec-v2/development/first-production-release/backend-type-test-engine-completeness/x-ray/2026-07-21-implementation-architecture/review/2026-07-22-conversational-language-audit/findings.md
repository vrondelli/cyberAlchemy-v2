# BTE X-Ray Conversational Language Audit — Findings

- Dispatch: `2026-07-22-bte-xray-conversational-language-audit`
- Review status: `accepted; resolved`
- Boundary: change requests only; this review does not authorize or perform target mutation
- Target corpus: current `index.html`, `lanes.json`, `instances.json`, `X-RAY-RESULT.md`, and `WHISPER-RESULT.md`
- Contract references: current package `DESIGN.md` and `GLOSSARY-CONSISTENCY.md`

## Preflight and verification

Inventory was used only as a discovery read model. The selected copy/readability entry predates the rewrite; the Whisper maintenance entry contributed the one-job-per-block and compress-before-sentence-editing checks; the plain-language guide contributed first-use bridges. No Evidence Card or EvidenceSet was selected, and simple-ontology/EVF entries were excluded as out of scope. Inventory therefore supplied a regression checklist, not proof. The live files and package contracts were the verification boundary.

The complete attack ledger and all seven current files were read literally. Every quoted defect below is present. `DESIGN.md` is Plan-ready and separates architecture completion from implementation and admission; `GLOSSARY-CONSISTENCY.md` preserves the exact TestCase/result, coverage-key, mutation, receipt/replay, and aggregate meanings. All C1–C8 and E1–E4 survive. There is no unresolved attacker/verifier disagreement after applying the narrowed remedies and the final C6 correction. The parent final approver accepted the reconciled findings after checking the quoted defects against the current target corpus. This acceptance authorizes the subsequent Whisper revision; the audit itself remains read-only with respect to the target.

Source-return key: [A1 — cold reader](attacks.md#agent-1--simon-herbert--cold-reader-task-analysis), [A2 — contract fidelity](attacks.md#agent-2--gadamer-hans-georg--contract-fidelity-interpretation), [A3 — cross-surface](attacks.md#agent-3--shannon-claude--cross-surface-information-analysis), [S — synthesis](attacks.md#synthesizer--meadows-donella-h--candidate-finding-set), [V1 — counter-example verifier](attacks.md#verifier-1--gigerenzer-gerd--counter-example-attack), [V2 — scope verifier](attacks.md#verifier-2--wittgenstein-ludwig--scope-attack), [Z — reconciliation](attacks.md#zig-zag-reconciliation--meadows-donella-h), and [FV — final re-verification](attacks.md#final-re-verification).

## `index.html` — verdict: FIX

| ID | Current quoted evidence | Severity | Treatment | Concrete proposed fix | Source return |
| --- | --- | --- | --- | --- | --- |
| C2 | “Design contract · build next”; “Design/build-next”; `external` appears in the same status list | MAJOR | replace and map | Show separate **Runs now / Design contract / Build next / Owner gate** states. Keep `external` as topology. Machine companions may use separate lifecycle/evidence/admission axes or an explicit composite mapping; do not force all machine values into four strings. | A3-F02; V1-C2; V2-C2; Z-C2 |
| C3 | `node-instance@1`, `relationship-family@1`, `edge-instance@1` | MAJOR | replace | Use `node-instance-conformance@1`, `relationship-family-causality@1`, and `edge-instance-conformance@1`; keep the plain questions. | A2-2; V1-C3; V2-C3; Z-C3 |
| C4 | “After isolated formation-v2 is implemented and replayed”; other eligibility cells unevenly omit admission, replay, or terminal inclusion | MAJOR | retain table; replace eligibility contract | Add one table-level rule requiring applicable owner admission, implementation, successful replay, and terminal six-catalogue inclusion. Keep each row’s additional catalogue-specific gate rather than repeating the whole common rule in every cell. | A2-3; V1-C4; V2-C4; Z-C4 |
| C5 | “verified core aggregate handle”; “returns a fresh receipt”; `verify:bte:consumers` “validates exact fresh receipt handles”; aggregate runner consumes “exact receipt handles” | MAJOR | replace selectively | Standardize the chain: **verified green core aggregate handle → consumer-owned raw evidence plus non-authoritative receipt → BTE-owned ReplayResult → consumer aggregate consuming exact fresh replay handles**. Preserve accurate statements that consumers return receipts; never treat those receipts as replay or aggregate inputs by themselves. | A2-4; A3-F06; V1-C5; V2-C5; Z-C5 |
| C6 | “Authority + authored input”; “machine files saying … what is allowed” | MAJOR | replace with concise bridge | Rename the heading **Contracts, admissions, and authored inputs**. State exactly: “Semantic contracts define allowed shape and meaning; owner decisions admit exact contracts or sets; authored inputs provide governed content. Derived graphs, evidence, aggregates, and lifecycle decisions remain separate roles.” | A2-5; V1-C6; V2-C6; Z-C6; FV-C6 |
| C7 | Mutation is “A deliberately invalid child lineage” | MAJOR | replace | Define mutation as: “One declared semantic edit in a fresh child build, expected to trigger a named failure or remove a named causal effect.” Preserve recomputed lineage and that digest mismatch alone is not a kill. | A2-7; V1-C7; V2-C7; Z-C7 |
| C8 | First use clusters “coverage keys,” “blocking diff,” “typed residue,” “core aggregate,” and “denominator” before usable bridges | MAJOR | retain and define | Bridge only the unbridged terms at first use: coverage key = catalogue ID plus obligation ID; blocking diff = exact missing/extra/duplicate/stale/mismatched members; typed residue = machine-readable blocking reason; denominator = exact claimed membership; core aggregate = exact replay-backed, non-admitting structural result. Do not re-explain `ProofContext`, `O_spec`, `O_gen`, TestCase, Binding, or Evaluator where already bridged. | A2-6; V1-C8; V2-C8; Z-C8 |
| E1 | Local outcome/claim boundary is followed by “The process in three lines,” then “After this x-ray, you should be able to say” | MAJOR | delete one retell; compress one recall aid | Apply C2 first. Keep `day-outcome` and `day-limit`; delete the immediate three-line retell. Retain exactly one compressed final four-state recall aid: **Runs now** — compiler/graph/provenance; **Design contract** — exact proof/replay boundaries; **Build next** — schemas/runtime/evidence/consumer handshakes; **Owner gate** — admission and release. Do not replay the nine-step workday. | A1-5/A1-10; A3-F03; V1-E1; V2-E1; Z-E1 |
| E2 | “Start with”; “WHAT WE KEEP / Use the proven core”; “The source is the thing you edit”; “You confirm”; “You change” | MINOR | replace coaching that obscures actors | Use direct system statements and name the `DomainSpec author` or `implementation developer`. Keep useful navigation/disclosure direct address and precise “Plan may/must” ownership language. | A1-1/A1-3/A1-4/A1-7/A1-8; V1-E2; V2-E2; Z-E2 |
| E3 | Heading names three instances; the next paragraph narrates all three; tabs name them again | MINOR | compress | Do not delete the paragraph. Replace it with: “Tabs distinguish checked-in compiler evidence, illustrative Design records still to implement, and an existing edge whose causal proof awaits implementation and admission.” | A3-F04; V1-E3; V2-E3; Z-E3 |
| E4 | Hero badges expose “Mixed architecture + process mode” and “L0 static HTML/SVG”; risk text exposes “FPR-02 Decision 9” | MINOR | move only misplaced metadata | Move only the mode/renderer badges to provenance and the exact decision ID to a maintainer/source note; retain the plain requirement-refresh statement. Keep “Invoke Plan is next,” `instances.json`, the Whisper link, footer provenance/promotion guidance, and a tightened source/inference split. | A1-2/A1-6/A1-9/A1-11; A2-8; A3-F05; V1-E4; V2-E4; Z-E4 |

## `lanes.json` — verdict: FIX

| ID | Current quoted evidence | Severity | Treatment | Concrete proposed fix | Source return |
| --- | --- | --- | --- | --- | --- |
| C1 | “The versioned formation replacement, retirement-map schema, compatibility corpus, and failure precedence are not yet designed.” | CRITICAL | replace | Replace with: “These boundaries are designed and frozen for Plan; versioned machine schemas, validators, implementation, replay evidence, and owner admissions remain outstanding.” | A2-1; A3-F01; V1-C1; V2-C1; Z-C1 |
| C2 | Reader terms and lane evidence use `mixed`, `target-design`, `existing`, and `green core receipt handle` without an explicit four-state mapping | MAJOR | map axes | Add an explicit mapping to the four reader-facing lifecycle states while preserving separate evidence/admission state and topology fields. | A3-F02; V1-C2; V2-C2; Z-C2 |
| C5 | “green core receipt handle”; consumers “return fresh receipts” for the aggregate path | MAJOR | replace selectively | Use **verified green core aggregate handle** for consumer input; preserve receipt as a non-authoritative evidence index, then name BTE-owned ReplayResults as aggregate inputs. | A2-4; A3-F06; V1-C5; V2-C5; Z-C5 |
| C7 | Mutation means “A deliberately invalid variation” | MAJOR | replace | Use the fresh-child semantic-edit definition from C7 and allow either a named failure or removal of a named causal effect. | A2-7; V1-C7; V2-C7; Z-C7 |

## `instances.json` — verdict: FIX

| ID | Current quoted evidence | Severity | Treatment | Concrete proposed fix | Source return |
| --- | --- | --- | --- | --- | --- |
| C2 | `validated-design-unimplemented`, `target-design`, and `mixed-current-target-and-owner-gate` encode composite states without mapping them to the reader contract | MAJOR | explicitly map | Keep useful composite detail, but expose or document separate `lifecycle_state`, `evidence_status`, and `admission_status`, with an explicit mapping to the four reader-facing states. | A3-F02; V1-C2; V2-C2; Z-C2 |

## `X-RAY-RESULT.md` — verdict: FIX

| ID | Current quoted evidence | Severity | Treatment | Concrete proposed fix | Source return |
| --- | --- | --- | --- | --- | --- |
| C2/E1 | “The page keeps four states separate”; validation says “current/Design/build/owner state labels: present” | MAJOR | refresh after target correction | Re-run the X-Ray validation after C2/E1. Record the explicit state mapping and the single retained four-state recall aid; do not claim separation from label presence alone. | A3-F02/F03; V1-C2/E1; V2-C2/E1; Z-C2/E1 |

## `WHISPER-RESULT.md` — verdict: FIX

| ID | Current quoted evidence | Severity | Treatment | Concrete proposed fix | Source return |
| --- | --- | --- | --- | --- | --- |
| E1 | “one audience block per job: applied”; “Draft status: `pass`” | MAJOR | revalidate | Re-run Whisper after block-level compression. The current workday, immediate retell, architecture outcomes, and late recap disprove the recorded one-job-per-block result. Keep one final four-state recall aid and update status only from the refreshed surface. | A1 inventory consequence; A3-F03; V1-E1; V2-E1; Z-E1 |

## `DESIGN.md` — verdict: KEEP

| ID | Current quoted evidence | Severity | Treatment | Concrete proposed fix | Source return |
| --- | --- | --- | --- | --- | --- |
| REF-DESIGN | “The design is complete enough to enter Invoke Plan”; authority is split across six roles; exact catalogue, mutation, replay, and consumer contracts are explicit | — | keep as contract source | No change requested by this audit. Use it to correct the explanatory surfaces without inflating implementation or admission state. | A2; V1; V2; FV |

## `GLOSSARY-CONSISTENCY.md` — verdict: KEEP

| ID | Current quoted evidence | Severity | Treatment | Concrete proposed fix | Source return |
| --- | --- | --- | --- | --- | --- |
| REF-GLOSSARY | `coverage_key` is `catalogue_id + obligation_id`; mutation kill includes failure or causal-output removal; receipts are not replay; aggregates remain non-admitting | — | keep as term source | No change requested by this audit. Preserve these distinctions in C5, C7, and C8. | A2 “What survived”; V1; V2 |

## Ordered change requests

1. **CRITICAL — C1:** remove the stale “not yet designed” claim in `lanes.json`.
2. **MAJOR — C2:** establish the four-state reader vocabulary and explicit machine mapping before compression.
3. **MAJOR — C3/C4:** correct catalogue identities and eligibility without bloating every row.
4. **MAJOR — C5:** correct the aggregate-handle → receipt/raw evidence → ReplayResult → aggregate chain across HTML and lanes.
5. **MAJOR — C6:** apply the final verified heading and role wording exactly.
6. **MAJOR — C7/C8:** correct mutation semantics and bridge only currently unbridged load-bearing terms.
7. **MAJOR — E1:** remove the immediate retell and retain one final four-state recall aid.
8. **MAJOR — result refresh:** re-run X-Ray and Whisper validation; update their pass assertions from the corrected surface.
9. **MINOR — E2:** replace actor-obscuring coaching while preserving useful navigation and Plan ownership language.
10. **MINOR — E3:** compress, do not delete, the process-instance orientation.
11. **MINOR — E4:** move only the hero implementation metadata and exact internal decision ID; retain the verified evidence affordances.

## Dispatch closeout

- Final approver: `parent`
- Final approval disposition: `approve`
- Final approval evidence: all C1–C8 and E1–E4 were checked against the current corpus; both verifier lanes converged after the single permitted reconciliation loop, including the final C6 wording correction
- Dispatch registry close row: `2026-07-22-bte-xray-conversational-language-audit`
- Closed at: `2026-07-22T11:06:38-03:00`
- Exit reason: `resolved`
- Agents spawned: `7` (`3 explorer, 1 synthesizer, 2 skeptic, 1 writer; 0 helpers`)
- Loops used: `1`
- Target mutation authorization: `none in this review`
- Writer closeout: `findings complete; no target files changed`
