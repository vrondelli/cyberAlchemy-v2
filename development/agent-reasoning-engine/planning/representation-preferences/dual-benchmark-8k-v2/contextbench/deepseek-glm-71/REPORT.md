# GLM compatibility qualification71

Completed:19paid GLM calls,86,096known tokens,zero unknown usage. All19requests
were admitted inside the measured8000-token window. The harness produced a
source patch, then failed on a summary truncated at the1800-token output cap.
Both harness and proxy are terminal. There is no valid final source selection.

Six summary calls used34,459tokens; task-work calls used51,637tokens. The patch
adds lowLimit/dictLimit adjustments in ZSTD_invalidateMatchState. This is an
observed edit, not verified task correctness. The patch and all costs are retained.
No native score or relative efficiency claim is available.

The official @deepseek-ai/dsh-llm-pi-ai0.1.5-rc.2 plugin provides GLM connectivity.
Our benchmark proxy and source exporter are separate instrumentation. The47local
regressions pass; five cases match the actual pinned native pruner. Native
payload delivery and source projection passed offline before this trial.

The combined profile kept the original task, GLMlow,8K window,512margin and96K
cumulative cap. It used native350-word checkpoint guidance, source dictionaries
and1800maximum output. Nineteen admitted requests show progress in request fit;
one exposed failure cannot establish general capability or benchmark success.

## Open questions

How many checkpoint tokens are source identifiers versus essential state? Can
bounded checkpoint content retain useful evidence without growing every cycle?
The next candidate must remain a declared native configuration adaptation and
preserve matching conditions for a fresh four-task paired comparison. See
../DEEPSEEK-CONTROL-FIT-DAG.md. Do not rerun this sealed paid stage.
