# Control-center prototype implementation plan

Date: 2026-09-05. Owner: CyberAlchemy v2 product owner. Status: candidate.
This plan is authored before implementation. The user's request authorizes this
bounded local prototype. Product approval is a later decision.

## Objective and exact boundary

Demonstrate one continuous conversation coordinating an editable essay, an
ontology and an orchestration fixture, with predictable layout transitions.
All new files stay in `workspace/experiments/control-center/`. Existing
Workspace runtime, Tauri builds, benchmark budgets, source ontology records and
the Definition Pack remain untouched. No live agents receive messages.

## Sequence and dependencies

| Step | Lane | Work and exact outputs | Done criteria |
| --- | --- | --- | --- |
| 1 | Product construction | Add `business.json` with six interaction concepts, states, guarded transitions and invariants derived from the pack. | All six contracts linked to unchanged parent concepts and pinned pack bytes. |
| 2 | Product construction | Add `system.json`, `bridge.json`, `profile.json`, `ontology-schema.json`, `scenarios.json`. | Business-system endpoint closure; mappings explicitly planned; all 21 scenarios accounted for. |
| 3 | Product construction | Write this `PLAN.md` before model or UI code. | Scope, behavior, dependencies, failure cases and test mapping available for review. |
| 4 | Product construction | Implement `model.mjs`: immutable target capture, independent surface selection, versioned layout proposals, pin checks, layout-only history, session drafts and deduplicated attention. | Deterministic commands produce contract-compliant state transitions; unsupported targets fail closed. |
| 5 | Product construction | Implement `index.html`, `styles.css`, `app.mjs`: stable mounted surfaces, essay editing/preview, selectable ontology graph, orchestration stages, bottom-center chat, layout cards, pinning, resizing and session layout save/restore. | Core journey can be performed with keyboard and pointer; no focus theft or automatic retargeting. |
| 6 | Product construction / test | Add `model.test.mjs`, `validate.mjs`; execute all scenario checks, source and schema validation. | 21 named scenarios pass; no dangling links or source drift. |
| 7 | Operational support | Launch loopback-only server; use Playwright to exercise desktop and narrow layouts and inspect screenshots. Owner: current agent; affected stage: prototype review. | Reachable preview, no console errors, composer visible, preservation and pin behavior observed. |
| 8 | Product construction / test | Write `RESULTS.md` and append identity-bound local receipt under `receipts/`. | Test evidence and screenshots linked; remaining full-product checks explicitly not evaluated. |

## Interaction implementation decisions

- Start in Writing mode: essay primary, orchestration and ontology compact.
- Provide Writing, Ontology focus, and Orchestration focus proposals.
  Preview displays a miniature arrangement and explanation. Apply requires the
  proposal's base revision to match and all primary-role pins to be respected.
- Direct surface selection changes visual focus only. Chat target changes through
  its explicit selector or a surface's Target action. Submitted requests keep a
  copied target and context identity.
- Keep DOM editors mounted while layouts change. Capture selection and reading
  anchors in session state; restore them without replacing editor DOM.
- Keep one conversation dock in the bottom-center layout row. Expansion grows
  upward by allocating more of the viewport; the active canvas gives up space.
- Layout history stores layout only; it never restores old essay/chat content.
  Saved arrangements live only in the current browser session's memory.
- A pin protects the primary surface role. Viewport fit can compact supporting
  surfaces without erasing the preferred layout.
- Attention is keyed by condition identity. Acknowledge differs from Resolve;
  disconnect makes conditions stale. Fixture controls can trigger each condition.
- All text insertion uses DOM text APIs. User messages are local fixture inputs.
  A deterministic reply identifies the captured target; no real reasoning or
  delegation receipt is fabricated.

## Verification matrix

`scenarios.json` copies the 21 source scenarios with stable IDs; each maps to a
named Node test in `model.test.mjs`. Browser checks additionally cover visual
target stability, layout preview/apply/restore, preserved drafts, pin rejection,
attention focus, and a 390px viewport. Screenshot inspection checks actual
placement and readability, not only HTTP reachability.

Run `node --test model.test.mjs` and `node validate.mjs` from this directory.
The model tests establish state behavior; browser interaction establishes a
bounded UI witness. Neither establishes live orchestrator integration.

## Performance and candidate evidence

Existing budgets stay unchanged. This experiment uses no app build pipeline or
budget-file mutation. The production Rust/frontend suite, WDIO-specific Vite
build, unified Tauri smoke, repeated cold desktop performance campaign,
host-load qualification and identity-bound differential bundle remain
`not_evaluable` for this isolated browser prototype. Their causal prerequisite
is integration into one exact Tauri candidate. No one-sample p95 is reported.

Freeze hashes of the prototype source and ontology files in a local receipt
after checks. Product approval, reconciliation, commit, merge, publication and
release remain separate later decisions.

## Operational residue and causal blockers

No operational blocker prevents this fixture prototype. Live integration needs
a selected successor adapter and exact Lab addon vocabulary. Durable recovery
needs its persistence contract. Full product approval needs measured usability
thresholds and the existing performance campaign. Repository owners retain
later reconciliation and delivery work.

## Open Questions

The original [ontology residue](../../control-center-ontology/residue.json) and
[Definition Pack](../../interaction-definition-pack/README.md) remain open.
This prototype tests proposed explicit Apply and session-local preservation.
It does not silently close the automation, persistence, addon, adapter,
usability or Define-lifecycle questions.
