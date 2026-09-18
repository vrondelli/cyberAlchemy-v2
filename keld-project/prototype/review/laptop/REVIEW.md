# Independent laptop UI review

Date: 2026-09-18. Reviewer: laptop_ui_review. Read-only implementation audit; browser evidence only.
Target: ../../index.html and ../../legend.html, served at localhost:4399.
Geometry is measured CSS pixels, not physical monitor inches. Windows display scaling and browser chrome can reduce a nominal 1920×1080 panel to approximately 1536×730 usable CSS pixels. The latter is a test scenario, not a measured owner device.

## Findings

1. **P1 — Main sections are larger than ordinary laptop viewports.** At 1366×768, sticky header is 88px, leaving 680px. Hero is 886px, workbench 919px, studio 826px. Hero assembly control sits y815–863 outside the initial screen. At 1366×650, the primary hero CTA ends at708 and is also below the fold. Workbench CTA is clipped on first section view. Width breakpoints do not solve height. Source: ../../assets/styles.css rules .hero-grid, .artifact-stage, .artifact-visual, .workbench, .section-intro, .engine-copy, .studio. Evidence: hero-1366x768.png, gear-1366x768.png, geometry.json.
   - Fix by budgeted desktop compositions relative to available viewport height; reduce empty spacing and artwork size before touching readable text. Preserve complete CTAs and assembly controls. Studio can use a tighter three-column or horizontal principle arrangement.
   - Acceptance: at1366×650,1366×768,1536×730,1536×864,1920×1080, top of each desktop section aligns below header and complete meaningful content/controls ends before viewport bottom. Do not simply apply fixed height/overflow hidden.

2. **P1 — Film cannot fit in one screen even before considering legend introduction.** At1366×768 film block is834px; video alone702px exceeds the680px available under header. Play is near image bottom and supporting links require scrolling. Film is886px tall at1920×1080, but the legend opening heading adds330px ahead of it. Source: ../../assets/legend.css .legend-film-screen aspect-ratio16/9 at full shell width and independent heading/margins. Evidence: film-1366x768.png.
   - Give film its own clear viewport-sized section; fit 16:9 screen to BOTH maximum width and remaining height. Reduce duplicated introduction or move film heading alongside introduction.

3. **P1 — Slideshow cannot show complete scene and navigation together.** At1366×768 scene1 is925px; scene5 is1115px; thumbnails add151px. Image alone701px consumes more than the usable680px. At1920×1080 scene5 is1167px: larger monitors do not fix it because images scale with width. Source: ../../assets/legend.css .legend-frame, .legend-scene-copy, .legend-full-prose, .legend-chapter-track. Evidence: scene-1366x768.png, geometry.json.
   - Use image/prose beside each other on landscape desktops, with compact chapter navigation sharing the height budget. Long prose should remain intact; if needed paginate within a chapter, with explicit page count rather than tiny text or inaccessible overflow.

4. **P1 — Clicking a chapter leaves its image/title behind the reader.** Click scene5 thumbnail normally at1366×768: new scene top=-590px, title y33–80 hidden underneath sticky header y0–88; previous arrow is y31–74, also obscured. Only bottom prose and thumbnails are in view. Source: ../../assets/legend.js select/keepTabInView deliberately preserves vertical position while chapters differ in height. Evidence: interactions.json and chapter-click-result.png.
   - Keep all scene components visible in a bounded desktop layout. When stacked, intentional chapter selection should position the new scene start below the header (without hijacking unrelated scroll), preserving keyboard focus. Acceptance: ordinary pointer/keyboard chapter activation displays title, image and navigation in the current scene, not stale bottom position.

5. **P1 — Fullscreen cinema has hidden navigation and disappearing Close.** Scene5 dialog scrollHeight1011px at768px viewport. Next controls begin y770, below screen. After scrolling down243px, Close is y-229 to-187 and disappears. Source: ../../assets/legend.css .cinema-figure>img sets height calc(100dvh -260px) while full prose is appended; .cinema-top is not sticky. Evidence: cinema-1366x768.png, cinema-bottom.png, interactions.json.
   - Fit image and prose with a landscape split; keep close/prev/next always reachable. If overflow is necessary on zoom/mobile, sticky controls with visible focus remain essential.

6. **P2 — Prior responsive QA does not assert the user's actual usability criterion.** ../../qa_film.mjs varies width at a fixed1000px height and checks document horizontal overflow, correct prose, clicks and iframe construction. It never asserts section, scene, CTA or navigation bounds. Tests pass despite these defects.
   - Add height matrix plus geometry assertions. Verify all six chapters, last controls, expanded view, 125%/150%-equivalent viewports. Capture states after actual navigation, not only scrollIntoViewIfNeeded, which can hide layout failures.

7. **P2 — Very small functional and secondary type undermines laptop reading.** Hero assembly is9px; legend chapter names10px, view scene9px, chapter metadata7–9px, header descriptor8px. Film fallback/read links have19px hit heights. Decorative technical annotations may remain small; navigation/instructions should not use diagram annotation sizes.
   - Separate decorative labels from useful controls. Functional secondary text should remain readily readable; enlarge link hit boxes and navigation text without shrinking prose to fit.

## Coverage and positive observations

All seven viewport sizes had zero document horizontal overflow. Notes section was524px high and fits1366×768 below header. Contact632px also fits that viewport, but exceeds562px available at1366×650. Content dialogs are intentionally long reading surfaces; unlike scenes, fitting the entire full-story reader into a single viewport would destroy readability. Native Escape closing and dialog focus restoration worked during these checks. User-triggered film loading and continuous complete reader should be preserved.

## Suggested DAG integration

A: Establish viewport/content budgets → B: hero/workbench/studio/contact spacing and artwork fit.
A → C: separate film and slideshow viewport compositions.
C → D: chapter navigation scroll/focus semantics and fullscreen persistent controls.
B + C + D → E: laptop height/geometry and interaction regression gate.
E → F: independent visual review at compact laptop and large desktop, plus mobile/zoom overflow fallbacks.

## Open Questions

Exact owner laptop CSS viewport and browser zoom are unknown. Do not equate17-inch diagonal with a CSS resolution. Preserve natural document scrolling for mobile/200% zoom and long article readers rather than hiding text to satisfy an impossible universal no-scroll constraint.
