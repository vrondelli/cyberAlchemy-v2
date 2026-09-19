# Three-arm ledger reconciliation core

Status: pure validation component; four offline adversarial tests pass. Independent review and filesystem/campaign integration pending.

[comparison-ledger.mjs](comparison-ledger.mjs) compares returned model/request-tokenizer receipts with the supplied durable ledger, verifies its content digest and idle phase, requires an externally supplied transport identity, and checks the exact task/cell scope. Current ARE uses the original scope hash; candidates additionally bind the driver profile and independent-native policy. Candidate driver-binding metadata must match exactly.

Every model receipt requires a hash-matching captured request. Candidate request-capture events and current-ARE admission capture arrays are supported. Model counts and tokenizer counts must match; all supplied attempt families must report single-attempt success and complete usage. Returned index measurements must equal final per-request journal snapshots with no duplicate receipt hashes. Model input/output totals preserve multiplicity and must fit the arm cap. Failure rejects reconciliation without modifying raw evidence or resetting costs.

Four tests cover all three arms/both binding formats; changed/pending/failed/cross-run ledger evidence; missing captures/index events and hidden failed attempts; and repeated identical requests whose costs must count twice. Tests use synthetic evidence shaped to the inspected transport. They do not execute HTTP, prove provider authenticity or read real campaign files.

## Limits and next integration

The function accepts parsed evidence; the caller must load exact externally bound files with path/symlink/size checks, verify no writer remains, bind result/journal/ledger to the outcome seal, and obtain expected transport identity from the exact configured client rather than trusting the ledger itself. Result task/source hashes and complete twelve-slot denominators are owned by the campaign adapter. Failed/unstarted outcomes stay in raw accounting; this success reconciliation does not erase or replace them.

Request capture hashing is not proof of exact 8K admission. Actual measured request/window evidence must be reconciled separately. Index journal comparison uses final snapshots and is not a complete lifecycle-state-machine validator. Filesystem/process settlement and request-window qualification remain explicitly pending in returned records; benchmark_cleared is always false.

## Open questions

Can the filesystem adapter reconstruct every model/tokenizer/index event from a sealed campaign without trusting unbound paths? How will original current-ARE and candidate admission records independently establish exact window limits? Which request-tokenizer-to-model mapping and lifecycle checks must be added before live acceptance? Coordinator owns integration and independent review. D:/WSL admission, native scoring, prospective experiment amendment and exact freeze remain pending; release/deployment remain separate.
