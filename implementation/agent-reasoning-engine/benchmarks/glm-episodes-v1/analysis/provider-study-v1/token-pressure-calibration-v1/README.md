# H22 actual-token pressure calibration

This tokenizer-only diagnostic extends the verified multiple-fact recorder. Exact full-history and fallback templates are captured from the unchanged H21 engine after six reads, using a synthetic trigger only to obtain the fallback rendering. Each full template contains both exact original fact bodies; the fallback contains neither. The preceding six requests are retained. Actual pressure claims depend on the subsequent provider measurements, not that synthetic trigger.

The same deterministic neutral user message is appended to every template. It contains SHA-256 strings derived from a fixed seed, no answers or task instructions. A later live experiment must apply this identical pressure adapter before admission and verify real requests again. Padding calibration is a controlled capacity diagnostic, not a natural repository workload or a guarantee of future provider token counts.

For each of 8K/10K/12K, bounded bisection over 0–512 padding blocks finds two neighboring measured sizes spanning the full-history admission boundary. The chosen padding must leave all six preceding read requests and the engine-rendered fallback admitted. Reserve 2048 output tokens plus the existing 512 input margin and 256 soft headroom. Failure to bracket, an earlier overflowing read, a too-large body or unknown measurement is explicit inconclusive feasibility. No cutoff, candidate or correctness criterion is changed to make a bracket pass.

## Execution and evidence

At most 32 measurements per window and 96 total; one worker; zero model attempts, retries or redirects. The endpoint is fixed to the existing provider tokenizer. Requests, reservations, dispatch records and receipts are saved before/after each attempt. A transport failure stops the run and preserves the failed reservation; rerunning the initial command against an existing directory is rejected. Token request bodies have a conservative 126976-byte ceiling, leaving space below the existing 131072-byte model envelope; this is not a larger-payload qualification.

Three local tests cover a successful content-based bracket, an overflowing prefix that must fail, and a transport failure with one retained attempt and no retry. Source/data hashes and exact execution limits are bound before provider calls. Credentials are resolved through the existing secret registry and never written to evidence. The construction fixtures and H21 live results remain frozen.

## Construction and operational lanes

Current frontier: complete local checks, bind this exact token-only run, measure and independently audit its feasibility, then record a canonical H22 observation. Owner: ARE implementer/evaluator. No live model study is authorized by this package. Future model execution needs a fresh frozen schedule, actual remeasurement and an exact execution binding; product adoption and serving activation remain user-owned separate work.

## Open Questions

Can all windows be bracketed with decisive evidence delivered before pressure? Does actual fallback lose joint semantic correctness when GLM chooses subsequent actions? How will evidence survive pressure without increasing recovery loops? Token calibration alone cannot answer model-quality or product-qualification questions.
