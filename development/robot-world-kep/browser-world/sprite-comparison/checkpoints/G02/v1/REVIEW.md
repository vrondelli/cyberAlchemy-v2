# G02 — 2D Robot World comparison review

## Candidate

This checkpoint freezes the browser Phaser candidate after the user-selected G01 decision `accept-64px`. The robot nominal height is 64 px. The candidate is a local recorded-fixture comparison and remains a prototype; no live agent, KEP, ARE, AlchLang, marketplace, hosting, publication, or deployment behavior is included.

## What is shown

- `?view=bench` keeps the scale decision visible with light/dark idle/walk samples at 48, 64, and 80 px and the authored workshop reference.
- `?view=colony` renders the two source actors, Explorer/Alice and Builder/Bob, against authored ground, path, workshop, parts-store, research-shelter, charging-pad, cargo, and plant visuals. The recorded counters remain visible through tick 80 and revision 241.
- `?view=load&count=50|200|500` draws deterministic synthetic actors while reporting zero real agents and leaving the recorded session and crew state untouched.

## Evidence

The evidence directory contains current 1440x900 bench and colony captures, 1280x800 and 1024x768 colony captures, a scene close-up, load evidence, and a 42.2-second WebM replay/selection capture. The browser checks report clean console output, one active Phaser game, and explicit synthetic counts.

Short headed-browser samples measured approximately 16.7 ms median and below 20 ms p95 for the recorded colony and 50/200/500 synthetic views. These samples contain fewer than the required 1,800 intervals, so the formal performance target is `not_evaluable`. Transfer byte totals, GPU allocation, the 1920x1080 bridge resize, negative asset injection, reduced-motion toggling, and a stable drag delta remain `not_evaluable`.

## Limits and next decision

The supplied character design is shared by both crew members; color markers distinguish them in the inspector. The scenery and props are newly authored style references with no collision, navigation, inference, economy, or construction authority. Historical B1 timing is retained as context and is not a comparable benchmark.

Please choose one exact next direction for the next checkpoint:

1. **Revise this comparison** — identify the visual or interaction changes to make.
2. **Prefer the 2D direction for the next UI checkpoint** — continue this browser renderer as the UI substrate.
3. **Retain the 3D direction** — keep this 2D package as a comparison reference while returning to the B1/3D path.

This question is a visual/product-direction decision only. It does not authorize renderer cutover, B2 work, deletion, deployment, live agents, or network integration.
