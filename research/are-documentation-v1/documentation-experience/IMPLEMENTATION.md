# Canvas documentation implementation

Date: 2026-09-18. Status: local implementation and validation; no publication or release approval.

## User-visible result

Selecting a component opens a movable documentation card in the same React Flow scene as the engine nodes. Several documents can remain open. Their headers support pointer, touch, and keyboard movement. Cards expand and collapse without losing their reading position. Opening a previously opened document focuses its existing card.

Links to other available documents inside a card open another canvas card. Read full documentation opens the actual Markdown guide in the same tab. Return to canvas restores the cards, positions, expansion states, selection, and viewport. Browser Back/Forward and same-tab reload are covered by the browser proof. The old screen-positioned CanvasExpansion has been removed.

The documentation home supports full-text search, including a user-oriented alias for “forget a preference”. Older capability pages link both to the canvas and to actual guides. Legacy component full-page URLs resolve to their mapped guide. Invalid document URLs and unavailable source references have explicit explanations.

## Implemented scope and content boundary

The site retains its existing React/Vite/React Flow stack and adds no dependencies. Reviewed Markdown is projected into a generated content index with source hashes and a bound candidate version. The renderer uses React text/elements rather than injected HTML. Unpublished references are labeled, not emitted as broken source links.

Five complete manual pages are available in the local preview:

- Core concepts: Understand the engine.
- State, learning, and conversation: Keep useful progress.
- Privacy and retention: Control what stays.
- Configuration: Configure your integration.
- Compatibility and lifecycle: Check supported integrations.

The [generated inventory](../../../workspace/experiments/are-documentation/src/generated/documentation.json) records dispositions for all 41 manifest entries. The other 36 entries are withheld from this preview, not deleted. Their complete publication review remains open. In particular, current setup/deployment instructions need standalone-package prerequisites and a validated delivery path. The UI states that setup, deployment, and the complete API field reference are still being prepared. This implementation does not claim full public-manual coverage.

The content version is `0.10.0-self-contained-candidate.7`, with visible development-candidate labels. Source hashes identify the projected documentation bytes; they do not recertify the engine's frozen release closure.

## Source map

- [Canvas and navigation integration](../../../workspace/experiments/are-documentation/src/main.tsx).
- [Workspace state and restore validation](../../../workspace/experiments/are-documentation/src/canvasWorkspace.ts).
- [Documentation graph node](../../../workspace/experiments/are-documentation/src/DocumentationNode.tsx).
- [Documentation home and article reader](../../../workspace/experiments/are-documentation/src/DocumentationPage.tsx).
- [Content routing](../../../workspace/experiments/are-documentation/src/documentationContent.ts).
- [Safe Markdown renderer](../../../workspace/experiments/are-documentation/src/Markdown.tsx).
- [Source projection and link checks](../../../workspace/experiments/are-documentation/scripts/build-documentation.mjs).

## Verification

Run from `workspace/experiments/are-documentation`:

```sh
npm run build
npm run test:canvas
```

The browser proof requires the local site at `http://127.0.0.1:4193/`. Set `ARE_CANVAS_URL`, `ARE_PLAYWRIGHT_ROOT`, and `ARE_CHROMIUM` to use another local environment. The development server can be started with `npm run dev`.

- TypeScript and production build passed.
- Documentation projection freshness, source-link existence, and published anchor checks passed.
- Five workspace tests cover reopening, multiple cards, complete snapshots, invalid/corrupt/obsolete state, and an empty start.
- [Browser results](../../../workspace/experiments/are-documentation/evidence/canvas-docs/results.json) record the latest exact checks. These cover real graph nodes, dragging, keyboard movement, scroll isolation, collapse/expand, two-card restoration, zoom behavior, reload/history, search, mobile overflow/readability, touch movement, peer-document links, legacy links, and storage failure.
- [Desktop screenshot](../../../workspace/experiments/are-documentation/evidence/canvas-docs/canvas.png).
- [Mobile screenshot](../../../workspace/experiments/are-documentation/evidence/canvas-docs/mobile.png).

The first mobile check exposed initialization fit overwriting the readable card zoom. The initialization rule was corrected before the final proof. Touch tests use a sequence of movement events rather than a single synthetic move. Tests exercise navigation only and do not dispatch model work.

Vite reports a main JavaScript bundle above its 500 kB advisory threshold. Code splitting remains a performance improvement; it is not hidden by changing the warning limit.

## Construction and operational lanes

Plan A0–E is implemented locally. A has a complete manifest disposition inventory; F has the five reviewed pages, and broader publication review remains open. G has deterministic and browser evidence. H has a local visual/source review; new-reader usability measurement has not been performed.

Runnable next product work: review the remaining manual pages, make standalone setup instructions usable, and extend the public content index without changing canvas behavior. This does not require a new canvas implementation.

Operational owner decisions: product owner selects the accepted publication version and public/customer content policy; deployment owner supplies production URLs and deployment configuration. Those decisions affect publication, not the implemented local preview. No commit, release, deployment, model call, engine behavior change, or saved-lesson mutation is part of this work. This is owner-directed local construction evidence, not admitted Goals execution state or product approval.

## Performance follow-up

The scrolling implementation was subsequently reviewed and repaired. See [the architecture review and before/after benchmark](PERFORMANCE-REVIEW.md) for the current performance evidence and remaining work.

## Guide discovery follow-up

The preview now contains nine reviewed guides with goal-based reading paths and a canvas guide picker. See [the expansion report](GUIDE-EXPANSION.md) for current coverage, tests, and remaining publication questions. The five-guide figures above describe the original implementation.

## Reader structure follow-up

ARE now uses the grouped navigation and three-column reader structure from the existing AlchLang docs app. See [the adaptation and validation report](ALCH-READER-STRUCTURE.md). Canvas cards and full-page return remain available.

## Open Questions

- Which of the remaining 32 manual entries should be public, customer-only, or internal?
- Which accepted package and delivery instructions should replace the existing checkout-specific setup guidance?
- When should the large client bundle be split, and what load-time budget should the site meet?
- Do first-time readers complete the proposed journeys faster than on the earlier site? Automated browser checks establish mechanics, not that usability outcome.
