# Interface Concept — Evidence Constellation

The interface should feel like a calm scientific instrument: dark ink canvas,
high-contrast evidence cards, subtle depth, and motion only when it teaches
relationship or state.

## First Working Version Target

The first version opens directly into the verified Poker Team candidate run and
supports one complete review journey:

1. confirm `SOURCE ✓`, `ADAPTER ✓`, `CANDIDATE ONLY`, and `AUTHORITY: NONE`;
2. select `F1` and trace exact grounding through `R1` to `D1`;
3. retain `D2 contradicts D1` as visible residue;
4. inspect exact relations, policy disposition, diagnostics, source path, and
   digest in the inspector;
5. switch among Graph, Outline, and Table without changing selection;
6. search/filter and complete the Poker walkthrough;
7. open the receipt drawer and verify why each trust label is present.

Done means that journey works in the final pinned dashboard build and passes
the automated desktop, tablet, mobile, keyboard, reduced-motion, and
accessibility checks. It does not include code context, editing, promotion,
public hosting, collaboration, or a manual usability/accessibility pass.

## Desktop Layout

```text
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ ◇ Ontology Evidence Workbench    SOURCE ✓  ADAPTER ✓  CANDIDATE ONLY  AUTHORITY: NONE   │
├───────────────┬───────────────────────────────────────────────┬──────────────────────────┤
│ NAVIGATOR     │  Evidence   Outline   Table   Code Context    │ EVIDENCE INSPECTOR       │
│               │                                               │                          │
│ Search  ⌘K    │                 [ F1 ]                         │ F1 · Finding             │
│               │                    ╲ derives-from              │ policy-pass              │
│ Saved views   │                   [ R1 ]                       │ authority_effect: none   │
│ • Poker O13   │                      ╲ derives-from            │                          │
│ • Conflicts   │                     [ D1 ]← ┄ contradicts [D2]│ Exact source             │
│ • Indeterminate│                                              │ result.v1.json           │
│               │          specializes? · owner unbound         │ digest …a4d9             │
│ Filters       │                                               │                          │
│ Kind          │  ┌─────────────────────────────────────────┐  │ Why it is here           │
│ Relation      │  │ Tour 1/4  Finding → Research → Definition│  │ Grounding member         │
│ Disposition   │  └─────────────────────────────────────────┘  │ [Open raw] [Copy handle] │
│ Diagnostic    │                                               │                          │
├───────────────┴───────────────────────────────────────────────┴──────────────────────────┤
│ RECEIPT DRAWER  run SWU-OCGP-008 · terminal receipt ✓ · upstream pin 2cda14e · local only│
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

## Visual Language

- **Finding:** circular node with cyan keyline.
- **Research artifact/Observation:** rounded square with violet keyline.
- **Definition:** hexagonal node with neutral blue keyline.
- **Composing relation:** solid directional line plus exact text badge.
- **Contradiction:** dashed red line, conflict icon, and text.
- **Policy indeterminate:** dotted amber line with diagnostic pill.
- **Code context:** indigo-labeled secondary swimlane; never mixed into
  grounding closure.
- **Selection:** luminous focus ring and path halo, not a color-only fill.
- **Verification:** textual trust rail with receipt-backed icons.

## Primary Interactions

1. `/` or `⌘K` opens command/search.
2. Selecting `F1` opens exact evidence and offers **Trace grounding**.
3. Trace mode dims unrelated objects but leaves conflict residue visible.
4. Hover previews generalized relationship; click opens exact source relation.
5. `Shift+I` toggles the evidence inspector.
6. `R` opens the receipt drawer.
7. `G`, `O`, `T`, and `C` switch Graph, Outline, Table, and Code Context modes.
8. Deep links encode run ID, selected source ID, surface, and filters—not raw
   private content.

## “Cool” Without Losing Trust

- Animated path tracing is allowed only for an exact ordered lineage.
- Layout transitions preserve selection and avoid rearranging while a person is
  reading.
- Background constellations/community hulls are presentation groups and are
  labeled as such.
- No particle effects, confidence scores, or AI “truth” badges.
- The strongest visual element is the evidence state, not graph density.

## Responsive Behavior

- **Wide desktop:** three panes plus receipt drawer.
- **Tablet:** navigator and inspector become mutually exclusive drawers.
- **Mobile:** outline/table is the default; graph is optional pan/zoom mode.
- Critical trust and exact relation status never disappear at smaller sizes.

## Empty and Failure States

- No selected run: explain how to choose a verified local run.
- Receipt fail: full-page block with diagnostic; no graph behind it.
- Unsupported mapping: list exact source IDs/relations that could not be
  projected.
- Stale optional code graph: show it disabled; evidence graph remains usable.
- Missing manual accessibility evidence: label overall accessibility
  `NOT_RUN`, not pass.

## Open Questions

See [../define/SPEC.md](../define/SPEC.md#open-questions).
