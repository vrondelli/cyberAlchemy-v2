# Page performance baseline — 2026-09-18

Result: **FAIL against the fixed performance budgets**. Benchmark implementation is
complete; this does not mean the page is performance-ready. No visual optimization was
included in this measurement change.

Source: `evidence/performance/page-current.json`, `are.page-performance/v1`.
Twelve production page loads: three cold/warm pairs per profile. No unexpected HTTP or
browser errors. Seven calculation/download-budget tests pass, as does the production build.
The fixture reports chat unavailable explicitly; this is not a live-model latency test.

## Loading results

Nearest-rank p75 of three repetitions (the slowest observed repetition for each metric):

| Metric | Desktop | Mobile approximation | Target |
| --- | --- | --- | --- |
| Cold transfer | 9.38 MiB | 9.38 MiB | ≤2 MiB |
| Cold images | 9.23 MiB | 9.23 MiB | ≤1.5 MiB |
| Cold hero ready | 8.49 s | 21.11 s | ≤3 s |
| Cold LCP snapshot | 8.51 s | 21.02 s | ≤2.5 s |
| Warm hero ready | 0.97 s | 2.45 s | ≤3 s |
| Warm LCP snapshot | 0.64 s | 1.38 s | ≤2.5 s |
| Warm transfer | 1,016 bytes | 1,016 bytes | ≤256 KiB |
| Cold CLS | 0.00136 or less | 0.00136 or less | ≤0.1 |

The five requested `assets/cyber-engine/*.png` files account for about **9.12 MiB**.
The entire new Light Sculptures family is **241.3 KiB**; it is not the main download cost.
Loaded images represent approximately **31.24 MiB** of decoded RGBA pixels. Re-encoding
alone does not reduce that pixel footprint; appropriately sized images matter too.
Unused files in the 14 MiB public directory must not be counted as initial downloads.

## Motion results

Range of per-sample frame-interval p95 across three repetitions. These are headless WSL
rAF scheduling observations, not physical GPU frame-presentation measurements.

| Scene | Desktop | Mobile approximation | Target |
| --- | --- | --- | --- |
| Engine assembly | 33–133 ms | 50–200 ms | ≤25 ms |
| Transition after chapter 1 | 50–167 ms | 67–217 ms | ≤25 ms |
| Transition after chapter 2 | 50–83 ms | 83–100 ms | ≤25 ms |
| Transition after chapter 3 | 67–133 ms | 83–350 ms | ≤25 ms |
| Final component loop | 17–33 ms | 33–67 ms | ≤25 ms |
| Explanation cycles | 17 ms | 17–33 ms | ≤25 ms |

The early hero scenes repeatedly fail; the final loop also fails some samples. The
explanation is substantially lighter but is not uniformly within every mobile target.
Long-task and stall ratios are preserved per scene in the raw report.

Pointerdown-to-two-rAF response proxy: 17–97 ms desktop; 84–336 ms mobile. One mobile
sample exceeds the 200 ms target. This proxy is not INP.
Final-loop phase timing and zero clock advancement while paused pass all six motion runs.

## Next experiment order

1. Convert and resize the five heavy hero PNGs, preserving transparency and composition.
   Compare image quality at actual display sizes. Rerun the unchanged loading budgets.
2. Profile the expensive assembly and chapter transitions. Investigate animation updates,
   filters and compositing with a trace; the benchmark locates slow scenes but does not
   establish which rendering operation causes them. Rerun the unchanged motion budgets.
3. Check Windows Chrome on the actual laptop and then deployed cache/compression behavior.
   A local headless pass would not establish field Core Web Vitals or WSL connectivity.

## Open Questions

The method, profiles, reproduction command, thresholds and device/hosting limitations are
owned by [PAGE-PERFORMANCE.md](PAGE-PERFORMANCE.md#open-questions). This baseline records
failures; it neither authorizes deployment nor silently raises the budgets.
