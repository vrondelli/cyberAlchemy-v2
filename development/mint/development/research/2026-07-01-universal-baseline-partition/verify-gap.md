---
node_type: research-finding
is_session: false
status: candidate
boundary: INTERNAL — cav2-native; gap-check only, no promotion enacted
created: 2026-07-01
authored_by: research subagent (SKEPTIC — GAP/non-vacuity gate, "Popper, Karl")
angle: REFUTE each candidate-localize by building the smallest minted-domain WITNESS that would REINVENT or silently OMIT the baseline; if the witness holds → PROMOTE (full or format-only), else keep-localize
subject: 15 candidate-localize cav2 definitions (3 AGREED + 12 CONTESTED) from the merged partition
corpus:
  - authority/definitions/DEFINITIONS.md (CAV2-D1..D50)
  - development/mint/SPEC.md (§Inheritance boundary, §Disclosed non-seeds, "seed the format not the rows")
  - development/mint/development/2026-07-01-universal-baseline-define.md (the three-way test + circularity guardrail)
  - development/mint/templates/authority-model.md (already-emitted format-seed for D41/D49)
  - development/research/2026-07-01-universal-baseline-partition/classify-universality.md, classify-coupling.md
verdict_vocab: keep-localize | PROMOTE-to-inherit | PROMOTE-to-inherit-as-FORMAT
guard: my gate guards UNDER-inheritance (the D21 error). I do NOT re-open keep-inherit calls; I only try to move localize→inherit. A PROMOTE fires only when a plausible NON-cav2, NON-UI-shipping domain would be worse off without the baseline. claim ≤ proof (CAV2-D38).
note: Paths repo-root-relative from domainspec-core/.
---

# Gap / non-vacuity check of the 15 candidate-localize definitions

## What the gate tests (Popper's refutation form)

For each candidate-localize I try to **falsify** the localize verdict by exhibiting
the *smallest concrete minted domain* — a research repo, a product repo, a process/ops
repo, a data/ML repo — that would **reinvent or silently omit** the thing and be worse
off. The refutation *succeeds* (→ PROMOTE) when the witness is a plausible non-cav2
domain that *needs the FORM as a baseline*. The refutation *fails* (localize stands)
when the only domains that would miss it are cav2 itself, cav2's self-model, or a
repo whose object content the domain must author anyway (seeding cav2's instance would
re-fuse the two System-5 levels — SPEC §Circularity guardrail).

**Two PROMOTE strengths** (per SPEC "seed the format, not the rows"):
- **PROMOTE-to-inherit** — the domain needs the *rule/method FORM itself* as a live baseline
  (a reference or baseline-constitution rule its own actions must satisfy).
- **PROMOTE-to-inherit-as-FORMAT** — the domain needs the *empty contract / table / slot /
  route* (the domain fills its own rows), but NOT cav2's populated instance. This is the
  SPLIT bucket the define-doc already names for D41/D42/D49.

The discriminator between FORMAT and full: if the definition's **normative FORM** is a
rule the domain's *actions* satisfy → full. If the definition is a **structure the domain
populates** (a tree, a model, a table) → format-only.

## Per-candidate table

| D# | term | witness-domain that would REINVENT/OMIT it (or "none — cav2-specific") | verdict |
|---|---|---|---|
| **D1** | Stable Repository | **none — cav2-specific.** The Normative Def's subject is *this repo's own extraction from `domainspec-core` into a standalone repo*. A minted domain (e.g. `resonantos-economy-research`) IS already born standalone by the mint act — it has no "move-out-of-umbrella" event to model. The *maintainability* properties it lists (understandable-without-hidden-context, exportable base) are already carried by D36 traceability + the promotion-policy template, which ARE inherited. No domain reinvents *cav2's extraction target*. | keep-localize |
| **D6** | Stable Repository Stewardship | **none — cav2-specific.** This is a **populated discipline card** whose subject is keeping *cav2* ledgered. Its universal genus is D50 discipline; the mint's disclosed non-seed #19 already withholds discipline *cards* (seed only the Growth-Rule + card schema, later). A minted domain authors its OWN stewardship card if it needs one — it does not inherit cav2's. Seeding = a cav2 discipline instance. | keep-localize |
| **D9** | CyberAlchemy v2 | **none — cav2-specific.** The literal self-name ("the project-local stable repository candidate at `cyberAlchemy-v2/`"). 100% self-reference; seeding it into a domain is the textbook two-System-5 refusion. No domain reinvents cav2's *name*. | keep-localize |
| **D12** | Craft Execution Surface | **WITNESS HOLDS → a multi-session research repo** (e.g. a drug-discovery-lit review repo or `resonantos-economy-research`) that runs recursive work across weeks. Without a declared work-state substrate (ledger-of-truth + derived views) it reinvents an ad-hoc NOTES.md and loses blockers/residue/next-moves between sessions — the exact "pile of true but unowned docs" cav2 exists to prevent. BUT the definition is welded to cav2's OWN `CTX-CAV2-*` contexts + `.craft/ledger.yml` rows. The *surface concept* the domain needs is the **empty Craft ledger contract**, not cav2's contexts. (Method form = D20, kept inherit already.) | **PROMOTE-to-inherit-as-FORMAT** |
| **D15** | Project Space | **WITNESS HOLDS → any minted repo.** Every governed repo partitions itself into folders with declared authority-bearing roles (which dir may hold authority vs. evidence vs. candidate synthesis). A process/ops repo that does NOT declare this lets `research/` silently become canon by proximity — the precise failure D15 guards. BUT the definition's *substance* is cav2's OWN folder enumeration (`authority/ research/ architecture/ specs/ …`). The domain needs the **space-typing rule (empty format: "declare each folder's authority role")**, never cav2's specific rooms. The scaffolder (`domainspec-new-repo`) already emits a tree; the missing piece is the *role-declaration format*. | **PROMOTE-to-inherit-as-FORMAT** |
| **D19** | Ontology | **WITNESS partially holds but resolves to keep-localize.** A data/ML domain repo genuinely needs a *governed meaning layer*. BUT (a) the ontology METHOD is already the `ontology-vault`/`ontology` Arcanum capability the framework-attach half carries — the domain gets the tool, not a seeded instance; (b) this card is welded to cav2's OWN ontology package (normalizes "Operational Ontology" vs cav2's D23, cites cav2's `.arcanum/ontology-vault/` map + a cav2 review); (c) SPEC disclosed non-seed #14 explicitly withholds the ontology package as cav2's self-model ("at most seed the empty record-shape as an optional tool"). The domain authors its own ontology *using the attached capability*; no baseline row is omitted. The gap is already closed by the attached tool, not by a seed. | keep-localize |
| **D27** | Residue Entropy | **none — cav2-specific.** The witness fails: a minted domain has no carrier for this. D27 is a *specialized measurement primitive* over cav2's OWN embedded Lean formalization (`domainspec-lean-formalization/*.lean` cited as local source evidence). A research/product/process/ML domain that never formalizes residue in Lean would not reinvent H(R)=Σ negMulLog — it simply has no residue-entropy object. The universal parent (D18 residue) IS inherited; D27 is an optional cav2-local observable *over* D18, not a baseline any domain's actions need. A domain that later wants a residue measure authors its own under D18. | keep-localize |
| **D41** | Authority Model | **WITNESS HOLDS (format) → any minted repo — AND ALREADY EMITTED.** Every governed repo needs the routing structure A(x)=(kind,posture,owner_route,…): "what may count for which purpose." A domain WITHOUT it lets evidence/generated-projections silently become authority. BUT the mint ALREADY emits `templates/authority-model.md` = the empty 4-column FORMAT with domain placeholders + the D49 owner-gate. The DEFINITION as written is cav2's OWN model (`AUTHORITY-MODEL.md`, cav2's Kinds table). So the FORMAT is covered; the *definition* is cav2's instance. **Recording as inherited-as-FORMAT (already carried), NOT a fresh seed of the definition.** | **PROMOTE-to-inherit-as-FORMAT (already emitted by authority-model.md template)** |
| **D42** | Governed Artifact Tree | **WITNESS HOLDS → a product repo with a design-system/pattern library, or a data repo with a feature-store tree.** When ANY folder becomes load-bearing, it needs the governance-interface (owner/source/views/promotion/validation/challenge/drift) before downstream work relies on it. A domain that skips this lets a pattern library become de-facto authority with no owner or drift route. The INTERFACE OBLIGATION is a universal FORM. BUT the card is welded to cav2's OWN trees (`architecture-pattern-inventory`, cav2's `ARCHITECTURE-KNOWLEDGE-GOVERNANCE.md`). Seed the **empty interface-obligation checklist (the GAT(T) field set)**; the domain declares its own trees. Not cav2's architecture instance. | **PROMOTE-to-inherit-as-FORMAT** |
| **D43** | Pattern Promotion Lifecycle | **none new — D48 already inherited covers the FORM.** The witness (a domain growing reusable patterns from ops) DOES need a pattern-promotion path — but D43 is an explicit **instance of D48** ("`CAV2-D43` … are instances of" APL, DEFINITIONS.md:3198). D48 (the genus lifecycle) + the promotion-policy ladder are ALREADY inherited machinery. The domain instantiates D48 for its OWN kinds via the promotion-policy template; seeding D43 hands it cav2's *architecture-pattern* lifecycle specifically. The baseline is not omitted — it is inherited one level up (D48). | keep-localize |
| **D44** | View-Bearing Concept | **WITNESS is weak → keep-localize.** The threshold rule ("when does a concept need its own governed view?") is generic, but its FORM overlaps D42 (which I am already promoting as format) — a view is one kind of governed tree. The card is wired to cav2's OWN ontology views (`ontology/views/*`, `BRANCH-AS-VIEW`). A minted domain that needs a view gets the obligation via D42's format; D44 adds no *independent* baseline a domain's actions must satisfy beyond D42. Promoting both double-seeds one obligation (violates D22 orthogonal-classification — no redundant axis). Keep-localize; the non-vacuity is absorbed by D42-as-format. | keep-localize |
| **D45** | UX/UI Knowledge Governance | **none for a non-UI domain — cav2/UI-repo-specific (the gate's explicit carve-out).** The witness must be a *UI-shipping* repo; the gate instruction excludes those ("would only cav2 / a UI-shipping repo need it → keep-localize"). A research/process/data/ML domain with no interface ships zero UX evidence and needs none of the lesson/pattern/browser-evidence lanes. The cluster is wired to cav2's OWN `ux-lessons`/`ux-evidence-validator`/`ui-prototyping-studio` capabilities. A UI-shipping minted domain authors its own via those attached capabilities. Localize. | keep-localize |
| **D46** | Experience Evidence Lifecycle | **none for a non-UI domain.** Instance of D48 for UX (DEFINITIONS.md:3197 lineage), wired to cav2's ux capabilities. Same carve-out as D45; the lifecycle FORM is inherited via D48. A UI domain instantiates D48 for its own interface evidence. Localize. | keep-localize |
| **D47** | Interface Evidence Boundary | **none for a non-UI domain.** A D38 (claim≤proof) specialization for UX claim-classes (hard-gate/soft-flag/human-study/not-automatable), wired to cav2's `ux-evidence-validator`. The universal parent D38 IS inherited; D47 is its UI-specific specialization a non-UI domain never exercises. A UI domain gets it via the attached `ux-evidence-validator` capability. Localize. | keep-localize |
| **D50** | Discipline | **none new — genus already covered; card is cav2's instances.** The witness (a domain with a recurring cross-capability practice) needs the *notion* of a stewarded discipline — but that genus overlaps D32 (method) / D48 (lifecycle), which ARE inherited, and SPEC disclosed non-seed #19 already commits to seeding the Growth-Rule + card schema *later* (not the cards). This D50 card is wired to cav2's OWN discipline cards (`stable-repository-stewardship`, `provisional-model-stewardship`) + `concept.discipline`. No discipline exists at mint-time to seed (SPEC.md:75). The baseline (genus + future card schema) is not omitted; cav2's *instances* correctly localize. | keep-localize |

## The four PROMOTEs — why the localize verdict was hiding a gap

1. **D12 Craft Execution Surface → FORMAT.** A multi-session research/ops domain WILL reinvent
   an ad-hoc notes file and lose cross-session residue/blockers. The classifiers localized it
   because it *names cav2's own `CTX-CAV2-*` contexts* — correct that cav2's rows localize, but the
   **empty Craft-ledger contract** (ledger-of-truth + derived-views + typed-residue-carried) is a
   baseline the domain's work-state needs. Seed the empty ledger contract, never cav2's contexts.
   (D20 Craft *method* is already inherit; D12 is its surface — seed the surface FORMAT to match.)
2. **D15 Project Space → FORMAT.** Every minted repo partitions itself; without a declared
   authority-role per folder, `research/` becomes canon by proximity. Coupling-classifier localized
   it because the def *lists cav2's actual folders*. Seed the **role-declaration format** ("each
   space declares its authority posture"), never cav2's room list. Pairs with D3/D14 (already
   inherit) to complete the space-typing baseline.
3. **D42 Governed Artifact Tree → FORMAT.** Any load-bearing tree (a product design-system, a data
   feature-store) needs the owner/source/promotion/challenge/drift interface *before* downstream
   reliance. Seed the empty GAT(T) field-checklist; the domain declares its own trees.
4. **D41 Authority Model → FORMAT (already emitted).** Universal routing structure; the mint template
   `authority-model.md` ALREADY carries the empty 4-column format. I record it as inherited-as-format
   so the partition does not falsely list it as pure-localize — the *format* is a baseline every
   domain gets; only cav2's populated model localizes.

## Guardrail check (did I over-promote / re-fuse the levels?)

Every PROMOTE is **format-only** (empty contract / table / slot / role-declaration), never cav2's
populated rows — so none re-introduces the two-System-5 refusion the circularity guardrail forbids
(SPEC §Circularity guardrail, "seed the format, not the rows"). I promoted **zero** definitions
whose normative substance is cav2's own object content:
- D1/D6/D9/D27 fail the witness test (no non-cav2 domain reinvents cav2's extraction target, its
  stewardship card, its name, or its Lean-backed entropy observable).
- D19/D43/D44/D46/D47/D50 fail because the baseline is **already inherited one level up** (attached
  ontology capability; D48 genus lifecycle; D42 format; D48 again; D38; D32/D48 genus) — promoting
  them would double-seed and violate D22 orthogonal-classification.
- D45 fails the gate's explicit UI-shipping-repo carve-out.

## claim ≤ proof (CAV2-D38)

This is a candidate gap-check, cited per definition by D# + DEFINITIONS.md line ranges and SPEC
sections. It enacts NO promotion; it recommends moving 4 verdicts from localize→inherit-as-FORMAT and
confirms 11 keep-localize. The FORMAT strength is load-bearing: a full-instance seed of any of the 4
WOULD re-fuse the levels — the gate's recommendation is the empty contract only. D41's format is
already emitted (not a fresh build); D12/D15/D42 formats are net-new empty contracts for the baseline
template. The partition owner (sigil-development) confirms whether the 3 net-new formats are worth the
template surface, or whether D12/D42 collapse into the D15/existing-tree formats.
