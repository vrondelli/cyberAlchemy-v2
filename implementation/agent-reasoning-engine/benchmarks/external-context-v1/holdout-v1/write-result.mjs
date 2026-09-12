// Render the audited measurements; no effect on experiment inputs. Open questions: RESULT.md.
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('./',import.meta.url),read=p=>JSON.parse(readFileSync(new URL(p,root))),c=read('closeout.json'),analysis=read('analysis.json'),diagnosis=read('diagnosis.json'),syntax=read('syntax-diagnostic/report.json');
const noSubmission=c.rows.filter(r=>r.status==='unable_to_repair').length,infra=c.rows.filter(r=>r.status==='run_error').length,unverified=c.rows.filter(r=>r.patch_produced&&!r.verified_success).length,unique=new Set(c.rows.filter(r=>r.verified_success).map(r=>r.task_id)).size;
const outcome=r=>r.verified_success?'Full pass, reproduced':r.status==='run_error'?'Transport interrupted':r.patch_produced?'Not repeat-verified':'No submitted repair';
const table=c.rows.map(r=>`| [${r.cell_id}](evidence/${r.cell_id}/result.json) | ${outcome(r)} | ${r.repair??'—'} | ${r.regression??'—'} | ${r.model_calls} | ${r.recycles} | $${r.list_price_estimate_usd.toFixed(4)} |`).join('\n');
const bounds=c.rows.map(r=>`| ${r.cell_id} | ${r.peak_admitted_bound} | ${r.recycle_at} | ${r.schema_rejections} |`).join('\n');
const text=`# Fixed GLM holdout result

The six-attempt study is complete: **${c.successful_cells} repeat-verified repairs across ${unique} distinct tasks, ${noSubmission} completed episodes without a submitted repair, and ${infra} infrastructure-interrupted attempt**.${unverified ? ' Another '+unverified+' submitted patch was not repeat-verified.' : ''} This is a descriptive engine experiment on three previously unused Svelte tasks, not broad GLM qualification or an official leaderboard submission.

The objective was to test whether the frozen repair workflow transfers beyond the original successful example and determine what needs tuning. [Selection](selection.json), [matrix](matrix.json), [source freeze](freeze.json), [completion audit](closeout.json), and [research DAG with conclusions](research-result.json) retain that chain.

## All six attempts

Repair and regression columns are strict expected-label counts. A dash means no patch was submitted for private scoring; it is not a missing successful evaluation. Every repeat-verified result passed a separate fresh evaluator twice.

| Cell | Outcome | Repair labels | Regression labels | Model calls | Recycles | Recorded list-price estimate |
| --- | --- | --- | --- | --- | --- | --- | --- |
${table}

Recorded model usage totals **$${c.list_price_estimate_usd.toFixed(6)}**, against a $1.20 reserve. This is a receipt-based list-price estimate, not a billing statement. Pricing and limits are recorded in [PLAN.md](PLAN.md#frozen-behavior-and-limits).

The \`16542-32k\` attempt stopped on a tokenizer request that received no HTTP response, after 15 completed model calls and a failed public candidate. It was not retried or replaced. After an endpoint reachability check and source-integrity check, only the three previously unstarted cells continued. [Incident](incident-16542-32k.json) and [continuation receipt](continuation-receipt.json) preserve the interruption. Exclude this pair from window correctness and efficiency comparisons.

## What the evidence says

The observed window effect is mixed. Task 16309 finished in 20 calls at 12K and 11 at 32K. Task 16417 submitted its repair in 15 calls at 12K, while its 32K attempt used 24 calls without submission. One sample per cell cannot separate context effects from stochastic trajectory or run-order effects. The two complete pairs both ran 12K first after the interrupted pair is excluded.

The failure traces identify separate mechanisms worth testing:

- **Investigation and evidence reuse:** \`16542-12k\` had zero schema errors, 26 source reads across seven files, and eight exact rereads spanning six model calls. All eight rereads followed recycling. Hypotheses were recorded on call 23, after staging closed at call 22; no candidate was constructed. Recycling and rereading are associated here, but that does not prove memory loss caused the failure.
- **Candidate validity and revision time:** \`16417-32k\` had no recycling or rereads. It staged invalid JavaScript on call 21; the public probe caught a syntax error on call 22, leaving no staging opportunity for revision. A post-run parse-only diagnostic confirmed that the original file parses and the exact saved candidate does not. This establishes earlier error detection, not that an earlier rejection would necessarily have produced a correct repair.
- **Transport observability:** one tokenizer request failed without an HTTP response. Later calls succeeded, but the original socket error category was not preserved, so its exact cause remains unknown.

These are trace-based, exploratory diagnoses. [diagnose.mjs](diagnose.mjs) produces [diagnosis.json](diagnosis.json); [syntax-diagnostic.mjs](syntax-diagnostic.mjs) produces the [parse-only control result](syntax-diagnostic/report.json). They did not change any frozen model input, runtime source, or outcome.

## Accounting and protocol

All paired initial prompts matched. The frozen source checks, exact candidate attribution, projection replay, retained-reasoning accounting, per-episode budgets, and container-cleanup checks passed. There were zero automatic retries. Ten offline checks and all six private baseline/reference preflights passed before model execution. Candidate private scores were collected only after all six model attempts were terminal.

| Cell | Maximum admitted bound | Recycle threshold | Schema rejections |
| --- | --- | --- | --- |
${bounds}

The admitted bound includes output reservation and accounting margins. Natural history exercised recycling in every 12K run. No 32K run recycled, so this study does **not** establish live recovery at the 32K threshold. These are configured experimental thresholds, not claims about the provider's native maximum context.

## Proposed next implementation DAG

\`\`\`mermaid
flowchart LR
  A[Audited failure traces] --> B[Project-native syntax validation during staging]
  A --> C[Reserve turns from the workflow DAG]
  A --> I[Selected evidence retention hypothesis]
  A --> D[Preserve bounded transport error categories]
  B --> E[Offline controls on retained valid and invalid candidates]
  C --> F[Controlled development ablation]
  I --> F
  D --> G[Transport failure controls]
  E --> H[New frozen validation]
  F --> H
  G --> H
\`\`\`

Start with candidate syntax validation because the exact retained failure is reproducible offline. Use the [phase contract](../success-v1/revision-phases.mjs) to reserve calls for the remaining successful path before spending more calls on search. Without recorded hypotheses, that path needs at least four model turns: record hypotheses, stage, probe, and submit. Recording hypotheses on call 23 cannot finish within 24 calls. Test this budget policy and selected evidence retention separately, retaining full repair correctness as the success criterion. Use the now-observed failed tasks as development cases; use fresh tasks or explicitly declared replications for subsequent qualification. These are proposed engine changes, not changes made during this comparison.

Construction posture remains a local candidate: no production admission or broader model qualification follows from this pilot. The [read-only status command](status.py) and [execution instructions](README.md) expose the completed stages and preserved evidence.

## Open Questions

Which evidence should survive recycling to reduce useful-source rereads within 12K? Can earlier investigation checkpoints preserve enough time for a valid repair without forcing premature edits? Does parse-only validation improve repair success or only detection latency? What caused the tokenizer connection failure? Do these findings persist with repeated samples, randomized order, and other repositories? The two preregistered explanatory hypotheses remain inconclusive pending controlled follow-up.
`;
if(!syntax.base_parses||!syntax.candidate_rejected||!syntax.cleanup_verified)throw Error('syntax diagnostic not established');writeFileSync(new URL('RESULT.md',root),text,{flag:'wx'});console.log(JSON.stringify({verified:c.successful_cells,unique_tasks:unique,no_submission:noSubmission,infrastructure:infra}));
