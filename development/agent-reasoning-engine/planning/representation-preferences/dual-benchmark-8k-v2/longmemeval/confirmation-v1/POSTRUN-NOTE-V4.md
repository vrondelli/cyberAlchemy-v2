# Note-v4 postrun consumer

`postrun-note-v4.mjs` is an additive descendant of the reviewed bounded-v3 consumer. It imports the note-v4 adapter/live verifier and uses only the `live-note-v4-rN`, `score-note-v4-rN`, `postrun-note-v4-rN` namespaces. The live freeze supplies the selected hypothesis, experiment, fresh qualification plan and source/reference hashes. Earlier files and results remain unchanged.

The qualified plan supplies the complete generation-call ceiling and generation-token ceiling. They must equal the sum of chunk counts plus eight answers, and `7744 * all_chunks + 64000`, respectively. Started ingestion must reserve 768 output tokens and7744 total; final answers remain1024/8000. Unknown ingestion holds7744. All fixed four-pair/eight-answer checks, native observation/learning-decision validation, raw generation receipt and public judge event census, answer identity, held cost checks and full-benchmark claim ceiling are inherited.

Twelve synthetic tests pass, including a changed21-call plan rather than a hardcoded153-call requirement, forged qualification rejection,7744 unknown reservation retention, missing/extra dispatch detection and known truncation remaining inconclusive. Tests use synthetic source/receipt values and existing prospective record schemas, without reading actual run artifacts or references.

Invocation after terminal generation and evaluation:

`node postrun-note-v4.mjs live-note-v4-rN score-note-v4-rN postrun-note-v4-rN`

## Open Questions

Independent exact-source review is pending. Actual note-v4 qualification, reviewed freeze and terminal model/evaluation artifacts are prerequisites to using the CLI. No provider/tokenizer/network calls or reference-value reads occurred. A successful fixed-cohort diagnostic does not establish full-benchmark or campaign completion.
