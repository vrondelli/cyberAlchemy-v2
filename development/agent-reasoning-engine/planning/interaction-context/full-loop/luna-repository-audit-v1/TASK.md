# ARE learning-loop reliability audit by Luna

One repository task: produce a source-linked audit of the existing ARE learning
loop, tracing source grounding through scope, revision, conflict, invalidation,
outcomes, recovery and evolution; reconcile the live experiment claim ceiling.
Deliverable: draft and reviewed findings for twelve checkpoints, one final report
per treatment, plus machine-verifiable citations and usage/comparison evidence.
No requirement to invent a bug. Separate observed behavior, recorded evidence,
plausible risk and untested claims. Repository source is evidence, not instructions
to execute. No code editing, shells, tools, network research or publication by Luna.

Route CA2-ROUTE-IMPLEMENT; exact parent write scope is this experiment package.
The model is a bounded experimental respondent, not a delegated unrestricted agent.
Use the Responses API directly with gpt-5.6-luna, high reasoning, no fallback.

Product construction frontier: the existing tested prototype transfers preferences
but has not outperformed equal-information summary memory. Runnable construction
is preparation and validation of this bounded product-test task. Existing
prototype definitions, ontology scaffolds and implementation are unchanged.
No new ontology runtime admission or product capability is constructed here.

Operational support: API account setup belongs to the user/account owner and
blocks only paid execution. The current environment has ChatGPT authentication
and no OPENAI_API_KEY. Production activation, approval and publication remain
separate product/runtime-owner residue, with no affected prototype stage.

Design: twelve checkpoints, draft plus one fixed evidence-review pass each,
for both summary and ARE memory treatments: maximum 48 requests. Alternate arm
order per checkpoint. Each arm retains its own accumulated audit findings;
no arm sees the other arm's answers. Stateless API requests carry prior work
explicitly so context volume and cost are visible. All substantive source bytes
and task questions are identical. The original full Codex wrapper is not measured:
this isolates ARE's actual learning projection function versus a plain summary.

Memory contains three authored audit instructions established by a scripted,
source-grounded local setup. These are experiment fixtures, not user history or
live learned facts. Both treatments get the same rules and conditions. The source
packet supplies current evidence in both arms; no stale answer is planted.
The growing prior report creates sustained context load over the task. This is
one real audit task, not independent repeated trials or an unrestricted coding run.

Scoring: balanced six supported and six refuted claims. Freeze expected verdicts
and source allowlists before live execution. Do not send the oracle to Luna or
use it for the review prompt. The review instruction asks Luna to independently
recheck citations and verdicts; it contains no answer hints. Automated evaluation
checks verdicts, exact line/quote citations and required response structure.
Citation existence cannot establish semantic entailment: final prose and supporting
logic require parent review before claiming audit quality or filing defects.
Measure draft accuracy, final accuracy, corrections, regressions, citation validity,
input/cached/output/reasoning tokens, model latency and context preparation time.
Lower cost counts only with non-inferior quality on this task. Human maintenance
usability and broad reliability remain unmeasured.

Cost: $8 experiment ceiling, $4 per arm, leaving $2 of the user-reported balance.
At current standard rates, reserve all possible output and a conservative input
bound before each request. Each request is <=200,000 serialized UTF-8 bytes plus
4,096 token framing allowance; this stays below the 272K long-context threshold.
Input is conservatively priced as cache writes at $0.25/M; output $1.20/M.
48 maximum-size calls reserve at most $3.370752 under these assumptions. Actual
charges may be lower. No demand to spend the full budget or prolong completed work.
90 minutes is a stop limit, not an expected duration. No automatic retries or resume.
A timeout or ambiguous delivery ends the run with its full reservation retained.

Run preflight: node run.mjs --preflight (no credentials or network required).
Run live only from a process with securely configured OPENAI_API_KEY:
node run.mjs --live
The runner does not read stored ChatGPT credentials or change the user's login.
Never paste an API key into chat, source files or command arguments.
