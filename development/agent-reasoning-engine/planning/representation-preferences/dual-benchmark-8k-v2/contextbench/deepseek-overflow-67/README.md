# Actual DeepSeek overflow recovery qualification

Pinned DSH0.1.5-rc.2 received a synthetic HTTP400 context_length_exceeded at
request2. It continued through native compaction and terminal selection, exiting0.
The fixture recorded12 HTTP requests,9 tool responses and2 summary requests;
one request was the injected denial. Real provider calls:0.

Evidence: RESULT.json, wire/injected-overflow.json, wire/summary.json, exact
wire requests/responses, and tool-evidence. Mock implementation:
../deepseek-overflow-mock.mjs. Transport HTTP behavior is separately covered by
the real loopback regression. This does not establish live GLM recovery or quality.

## Open questions

Owned by ../DEEPSEEK-CONTROL-FIT-DAG.md.
