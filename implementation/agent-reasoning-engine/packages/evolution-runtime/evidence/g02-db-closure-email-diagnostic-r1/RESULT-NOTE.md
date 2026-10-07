# G02 exposed email database-closure diagnostic

After the matched [email/ACP quality failure](../g02-cross-layer-emails-pair-r1/RESULT-NOTE.md), an additive source-only database API-implementation closure was tested in an **ARE-only run on the already exposed task** `4eb0e647`. This is a mechanism diagnostic, not a new matched or prospective G02 win. Its ranker snapshot SHA-256 is `8d48c6d4438bef369e403b2b99d27a16a3735a59c6e2c82bb14d8d4b5933d978`; the VPS receipt root is `/opt/are-benchmark-runs/g02-cross-layer-email-dbdiag-r1`, with `FREEZE.json` SHA-256 `6fc487e6bd62cc7534132b024c3f696537fef6e5d0003c82063ed4be6eb71e87`.

The initial packet delivered bounded `pexpire`/`pttl` source regions from Mongo, Postgres, and Redis `main.js` files, plus an email settings view. The episode completed with 11 model calls, 93,033 known model tokens, and 153.82 arm seconds. Native scoring of its raw final prediction gave **0.34722 Span-F1** and **0.31579 File-F1**. The previous ARE run on this task scored **0.27302 / 0.30000** with 153,712 tokens and 185.36 seconds; the frozen DSH result was **0.29480 / 0.30000**. Cross-run differences are diagnostic because the task is exposed, the model can vary, and no contemporaneous DSH arm ran here.

The model's final selection included admin users controller, email source, and admin manage-users view, but **none of the newly delivered database files**. Therefore the observed quality gain cannot be attributed to retaining backend files in the final context. The live source-delivery mechanism is verified by `evidence/run/events.jsonl` (SHA-256 `5f5f9ea6258812a226d8ff3875918e1cb256e770ea0f50b003ed551968bfe2f3`); the native score is `evidence/run/native-score.json` (`d055af311e9437922bc41744267260ca26f927c0fa15558f4b2435b009f47fe9`).

## Open Questions

- Does this fixed database-closure mechanism improve a new source-only matched task, rather than only the exposed email diagnostic?
- When backend implementations are delivered, what evidence is needed to retain only genuinely task-relevant spans without flooding the final selection?
