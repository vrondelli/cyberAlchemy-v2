# Open-source writing substrate research

Status: source-backed selection candidate; no dependency has been imported.

## Decision frame

Essays needs an editor adapter, not a pre-existing application that already owns the product's persistence, collaboration, publishing, identity, or desktop lifecycle. The DomainSpec v2 system ontology must remain authoritative for essay identity, lifecycle, review, validation, and export.

## Candidate comparison

| Candidate | License | Product coupling | Result |
| --- | --- | --- | --- |
| [Milkdown](https://github.com/Milkdown/milkdown) | MIT | ProseMirror and Remark editor framework with separable core, plugins, headless components, and Crepe composition | Recommended candidate. Markdown can remain the durable content projection while Essays owns state and lifecycle. |
| [Tiptap core](https://github.com/ueberdosis/tiptap) | MIT for open-source core | Headless ProseMirror framework; host owns UI and accessibility; Pro and Cloud features are separate commercial surfaces | Runner-up if stable typed JSON nodes and transaction interception prove more important than canonical Markdown. |
| [Novel](https://github.com/steven-tey/novel) | Apache-2.0 | React/Tiptap wrapper plus a Next.js demonstration coupled to hosted AI, storage, analytics, uploads, embeds, and broad formatting | Reject as base. Useful visual reference, but it adds a dated wrapper and removal work around Tiptap. |
| [HedgeDoc](https://github.com/hedgedoc/hedgedoc) | AGPL-3.0 | Collaboration-first Next.js/CodeMirror/Yjs frontend plus Nest/WebSocket/SQL backend | Reject. Collaboration, authentication, permissions, storage, and rendering are structural rather than removable edges. |
| [WriteFreely](https://github.com/writefreely/writefreely) | AGPL-3.0 | Go publishing and federation server with an embedded minimalist Markdown editor | Reject as code substrate; retain as calm-writing UX evidence. |
| [Zettlr](https://github.com/Zettlr/Zettlr) | GPL-3.0 | Electron/Vue/CodeMirror desktop publication workbench with filesystem, citations, search, exports, and updater services | Reject. Stripping the application would amount to a rewrite across the wrong runtime boundary. |

Primary evidence is the projects' official repositories, license files, package manifests, documentation, and release histories. This is technical license triage, not legal advice.

## Candidate architecture

```text
DomainSpec-owned essay state
  -> deterministic Markdown projection
  -> Milkdown editing session
  -> proposed Markdown revision
  -> DomainSpec operation and validation
  -> accepted new essay state
```

Milkdown's ProseMirror state, plugins, and UI events must never become the Essays system of record.

The allowlist candidate is limited to the core transformation pipeline; CommonMark or explicitly approved GFM syntax; history, clipboard, and listener support; and paragraph, heading, list, quote, code, and link capabilities. Collaboration, AI, uploads, media, tables, LaTeX, drag-and-drop, and slash-command surfaces remain excluded until admitted by the ontology.

## Required spike evidence before dependency adoption

1. Deterministic Markdown round-tripping for the admitted syntax.
2. Stable Whisper `block_id` and review selection anchors across edits.
3. Demonstrated keyboard and screen-reader behavior for the project-owned toolbar and review surface.
4. Exact direct and transitive license inventory for the pinned version.
5. Bounded bundle and dependency inventory with excluded capabilities absent.

Eliminate Milkdown if any of the first three conditions fails. Evaluate Tiptap core next, while preventing Markdown conversion from becoming a second source of truth and excluding every Pro, commercial UI, and Cloud package.

## Claim ceiling

This research establishes a source-backed candidate ranking only. It does not prove Markdown fidelity, anchor stability, accessibility, bundle size, performance, security, or DomainSpec v2 compatibility. It grants no publication, release, deployment, or production claim.
