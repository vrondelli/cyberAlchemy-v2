# Label simplification

Owner requested a whole-page review of excessive labels. Scope: landing page, illustrated reader and expanded scene; commerce terms remain intact.

Removed46 decorative elements: repeated header/hero descriptors, figure metadata, duplicate brand stamps, product serial marker, secondary section slogans, illustration overlines, chapter thumbnail numbers, repeated archive plate captions and chapter kickers. Five section markers now use plain names without numbering. Source inventory: `label-removals.json`.

Kept section names, main headings, descriptive action labels, chapter names and current-position counters, video duration, alpha/license facts, form labels and accessible names. Full story prose remains identical across slideshow and reader. The existing ARE-page links are preserved.

Adjusted layout after removing metadata: notes use title + arrow columns, the mark is centered, and the artwork's assembly control remains visible. `build.py` regenerated all six editions.

Validation: existing film/reader test passed; ten-viewport geometry checks and keyboard/swipe/menu/media-lifecycle regression checks passed. Screenshots of desktop and mobile sections are under `previews/labels-*`. Prior UI-review numerical results describe the earlier revision; latest section geometry is `layout-results.json`.

## Open Questions

Owner visual preference is the final judgment of the label density. No deployment or commercial-policy change was performed.
