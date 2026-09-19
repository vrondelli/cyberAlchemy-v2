# Ranked-source worker review R1

Rejected for external-cancellation cleanup. All seven supplied tests independently pass.

## Blocking finding

An actual isolated supervisor running run_index was sent SIGTERM after its fake worker started. The supervisor exited -15 and the separate worker process group remained alive. Default Python SIGTERM bypasses finally. The review harness then killed and reaped only its exact fixture worker (3062664), verifying group absence. Additive repair needs explicit cancellation/ownership handling and a real external-signal regression before integration.

## Retained capacity evidence

All four retained artifacts, inventory hashes, manifest byte/posting counts and index digests verify. Their processes exited cleanly and groups are absent. Maximum recorded build time was 32.03058 seconds and RSS 161,184 KiB. These are observed measurements; the enforced worker memory limit is 512MiB virtual address space.

Exclusions reproduce: tasks 1–3 have 14/11/7 encoding exclusions; task 4 has 110 encoding and two native-file-size exclusions. All manifests honestly report partial eligibility. This does not imply cap exhaustion or missing unreported entries. No corpus rebuild or model/evaluator call was made.

The existing tests cover bounded pipes/deadlines/output and actual allocation denial after setting RLIMIT_AS. Sequential Git pipe reads can block until the outer deadline; the outer process-group bound is therefore essential. Exact reviewed hashes are in the paired JSON.

## Open Questions

External supervisor cancellation is the concrete blocker. Caller-owned durable failure persistence, full native admission/no-credit reconstruction and launch capacity still require integration evidence. No live admission, useful-acquisition, perfect-quality or savings claim is supplied.
