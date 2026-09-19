# Repair-capable comparison runner

Status: additive integration tested offline; independent review pending. No provider calls or live admission.

## Binding

[comparison-repair-arm.mjs](comparison-repair-arm.mjs) retains the original three arm identities, source task/cell derivation, shared cancellation and provider-health checks. Current ARE still invokes the unchanged recovery-v2 runner. Both candidates now invoke [the repair prepared runner](discovery-v1/orchestrate-comparison-repair-v1.mjs), whose [native wrapper](comparison-repair-native-driver.mjs) selects the minimal repair or independent repair episode.

The prepared runner supplies the complete native repository tool list and an isolated base/work source pair. It records snapshots, journals captures/results with guarded persistence, retains the actual patch, and checks the base checkout remains clean. Independent investigators restrict themselves to source tools; synthesis alone edits. The minimal candidate receives editing tools throughout its work phase.

Final native export is independently reconstructed from retained snapshots, branch captures and receipts. Minimal has one evidence conversation and uses the original exporter. Independent repair has four, including synthesis, and uses the additive repair exporter. Request/response captures for final reporting are selected after the terminal-packet event, because synthesis and final reporting share the join phase name. Including all join captures would incorrectly count synthesis as unregistered terminal source delivery.

Existing frozen wrappers, dispatcher, episode modules and review records remain unchanged. The twelve-slot schedule still describes the same cells and caps, but its prior source review does not approve this changed implementation. Campaign wiring and a fresh exact source freeze must select the repair dispatcher explicitly.

## Evidence and limits

Eight prepared-runner tests pass with actual temporary Git source copies, native repository tools, native measured driver/recycler and scripted transport. Both candidates produce a real patch and a reconstructed saved native export. Other cases verify source/task admission, provider failure, dispatch denial, reasoning replay, cancellation-signal forwarding and unknown-arm rejection. Guarded persistence is real; transport ledger binding is a fixture stub, so these tests do not prove durable provider reconciliation.

Six dispatcher tests pass, preserving three-arm routing, bound task/source overrides, exact common caps, cancellation, index failure propagation, and known/unknown exception evidence. Executor injection tests routing; the prepared-runner tests separately execute candidate source preparation. Current ARE's full native episode is not re-executed by these tests.

Combined with four minimal and five independent episode tests, this successor has 23 scoped passing tests. These are offline instrumentation results, not GLM benchmark quality or token savings.

## Remaining work and open questions

Coordinator owns campaign integration, durable receipt/index/capture reconciliation and scoring. Independent review must finish before a prospective native experiment amendment and exact execution freeze. Review must distinguish end-to-end architecture comparison from an isolated retention claim: prompts, history policies, per-phase tool availability and final reservations differ explicitly. Common task duties are restored, but methodological equality is not implied by tool availability.

Real request qualification, process settlement, all twelve outcomes, full cumulative costs and D:/WSL admission remain prerequisites for the fixed live comparison. C: is excluded. Untouched confirmation and broader benchmark scope remain open; release/deployment remain separate.

Can synthesis deliver both repair work and sufficient final evidence within its internal reservation? Are all selected execution dependencies bound in the next campaign freeze? Does the durable reconciler correctly support the current-ARE and candidate ledger-binding formats?
