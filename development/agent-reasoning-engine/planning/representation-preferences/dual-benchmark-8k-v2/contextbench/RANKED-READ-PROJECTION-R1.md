# Ranked-read request projection

Candidate integration supplement to the approved ranked-read protocol R2.
No live admission. Raw execution and historical sources remain immutable.

A request view may retain only a leading prefix of a ranked tool result's
observations. Validate the entire recorded raw result against pinned hints,
manifest and source snapshots first. Never rerank, reread, reorder, shorten a
window, or rewrite tool arguments to make a view fit.

Full views equal the recorded result. Partial nonempty views preserve original
`ranked_read` execution metadata and source handles, replace only observations
with the leading prefix, and add deterministic `deferred` metadata with the raw
result digest, omitted count and existing archive recovery descriptors. Thus
`ranked_read.returned_windows` describes raw tool execution, not view delivery.
The receipt binder reconstructs this exact view from the recorded raw evidence;
it does not pass a partial view off as a new raw execution result. Delivered
ranked observations are counted from verified visible observations, not raw counts.

Zero retained observations use the existing failed/deferred envelope, with no
source credit. Recovery retains existing archive semantics and is counted as
recovery delivery, not a direct ranked search observation. Unknown or altered
projection metadata fails exact reconstruction. Tool call IDs and original
request/receipt hashes are never changed.

Native aggregate request measurement and deterministic halving remain unchanged.
Every accepted ranked view must also fit 8192 UTF-8 bytes including deferred
metadata. A prefix that exceeds this cap is reduced by the same admission loop;
if no prefix can fit, admission fails and prior spend remains recorded. No retry,
new query, additional source read or budget transfer is authorized by projection.

Product frontier: implement and test deterministic projection and binder, then
wire archive admission, evidence join, export and episode census. Research operator
owns WSL/process checks at qualification/live stages. Release remains deferred.

## Open Questions

Native tokenizer qualification must cover real mixed tool batches and zero views.
Full join/export/census wiring and model use remain unverified. This supplement
changes no quality, token, fixed-task or untouched-confirmation acceptance gate.
