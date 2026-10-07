# G01 reasoning-free historical view diagnostic

On exposed Svelte task `575f5d76`, the earlier identifier-aware candidate failed after nine model calls with `intent-anchor-episode.bounded-view-not-admitted`. The opt-in successor preserves each complete raw exchange and its receipts but omits `reasoning_content` from the model-facing historical assistant view. Focused local tests passed, and a new immutable VPS source snapshot was used.

The successor crossed the prior failure point and completed **13 model calls** with a native-scoreable final context. It used **38,546 known model tokens** in **221.316 seconds**. Eleven raw reasoning exchanges remained durably recorded; none of the stable model-facing views retained reasoning text. This validates the admission mechanism on this exposed task.

The native score was **Span-F1 0, File-F1 0**. The final context selected `src/runtime/internal/scheduler.ts`, while the gold spans were in compiler/rendering and runtime utility files. Thus this is a **validity repair, not an accuracy win**, and it neither repairs the [failed eight-task campaign](../g01-identifier-itt-replication-r1/RESULT-NOTE.md) nor establishes a successor benchmark gain.

Full VPS receipts: `/opt/are/evolution-runtime/g01-reasoning-view-svelte-diagnostic-r1`. Source snapshot: `/opt/are/evolution-runtime/g01-reasoning-view-source-r1`.

## Open Questions

- Does the reasoning-free view prevent admission failures on untouched tasks without reducing quality?
- What gold-blind source-acquisition signal would distinguish compiler/rendering code from generic runtime scheduling for this class of issue?
