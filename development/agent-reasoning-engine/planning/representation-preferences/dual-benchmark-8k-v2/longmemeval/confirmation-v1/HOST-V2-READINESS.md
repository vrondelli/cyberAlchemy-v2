# Full-S host-volume successor

The additive `live-host-v2.mjs`, `score-host-v2.mjs` and `prepare-freeze-host-v2.mjs` descend narrowly from the reviewed original live, score-live and prepare-freeze modules. The original 85-binding freeze and its sources are unchanged. This successor has not been frozen or executed.

The storage guard now verifies the explicitly bound D: registry metadata and Linux mount identity using `../../storage-host.mjs`. Generation and evaluation require 32 MiB growth headroom before launch, in addition to 12 GiB host and 8 GiB guest reserves; per-event and per-dispatch checks retain those reserve floors. No C: fallback is permitted. A failed launch guard precedes provider construction and output creation.

The generation freeze schema is `are.full-s-live-freeze/v2`, written separately as `live-host-v2-freeze.json`. It explicitly binds guard code, registry binding JSON and the correction provenance. Generation review uses `LIVE-HOST-V2-REVIEW.json`, scope `full-s-generation-host-v2`; evaluator review uses `EVALUATOR-HOST-V2-REVIEW.json`, scope `full-s-evaluator-host-v2`, and is itself freeze-bound. Runtime directories are single-use `live-host-v2-rN` and `evaluator/score-host-v2-rN`. Generation seal/evaluation result schemas remain compatible with the unchanged core; exact freeze hashes distinguish successor executions.

The same four source tasks, eight answer slots, 153 generation calls, two workers, 8K admission, 1,131,200 generation-token reservation and 64,000 judge-token reservation remain unchanged. Existing native source, reference identity, rubric, usage accounting, settlement and durable-event rules are inherited. No reference values were read for this amendment.

Sixteen focused successor tests pass, including original core/provider simulations, known and unknown partial costs, signal cleanup, health-stop behavior, privacy and scoring gates, plus launch headroom, old namespace rejection and explicit host binding tests. Eleven guard tests separately cover mount/metadata ambiguity, root-device identity, wrong volume, missing mount and capacity reserves. All exchanges are injected synthetic functions; no network/tokenizer/provider calls occurred. Freeze-builder syntax was checked without running it.

## Open Questions

Independent review of these exact successor files and the shared guard remains required. No live approval or freeze is implied. The actual D: volume currently lacks the unchanged host reserve; storage reclamation and fresh measurement are prerequisites to launch. The existing research continuity/source/reference bindings remain inputs to the new reviewed freeze, not permission to reuse the original launch freeze.
