# ARE product completeness audit

Date: 2026-09-16

This audit checks the private ARE product from source closure through agent,
provider, language, conversation, and benchmark surfaces. It distinguishes a
working implementation from a declared product component and from research
qualification.

## Current evidence

| Layer | Evidence | Result | Remaining boundary |
| --- | --- | --- | --- |
| Exact release closure | `src/product.mjs`, `src/product-test-plan.mjs`, `src/product-isolation.mjs` | PASS: Candidate 013 binds 3,410 files, 53,860,253 bytes, and digest `a17912f2…` | The closure includes a content-addressed DomainSpec compiler distribution from the sibling checkout; publishing it requires that exact distribution or a separately committed/package-bound equivalent |
| Isolated product tests | `evidence/product-test-receipt.013.json` | PASS: 156 test files, 1,244 cases, and 26 owned suites | Product approval remains separate |
| Release verification | `scripts/verify-release.mjs` | PASS for Candidate 013 with no reason codes | Commit, tag, publication, activation, and deployment remain separate |
| Persistent gateway | `packages/codex-app-server-wrapper/src/gateway.mjs` | PASS: retained sessions, acknowledgements, replay, bounded storage, and recovery | Product-facing names remain Codex-oriented |
| Backend adapter contract | `packages/codex-app-server-wrapper/src/backend-adapter.mjs` | PASS: Codex default and model-neutral JSON-lines process adapter | Promotion changes the declared product surface |
| Agent client adapters | gateway client, stdio proxy, and RPC client in `packages/codex-app-server-wrapper/src/` | PASS | No browser or hosted-service adapter is declared |
| Model providers | `packages/coding-agent-runtime/native-provider-transports.mjs` and `openai-compatible-transport.mjs` | PASS_BOUNDED: OpenAI-compatible, native OpenAI, Anthropic, and Google all reach the governed proposal boundary; zero live calls and zero repository effects | Live credentials and provider availability are deployment concerns |
| Secret providers | `packages/coding-agent-runtime/secret-provider.mjs` and `sops-age-secret-provider.mjs` | PASS in the product suite | External secret-store plugins remain optional |
| Interaction learning | `packages/codex-app-server-wrapper/src/interaction-learning-lifecycle.mjs` | PASS in the 186-case wrapper suite; durable correction, reuse, contradiction, revocation, and restart paths are covered | Serving profile remains disabled by design |
| Objective-language benchmark | `packages/codex-app-server-wrapper/scripts/objective-language-benchmark.mjs` | 12/20 matched, 8/20 safe deferrals, 0 unsafe resolutions, 0 provider calls | Broader paraphrase resolution changes intent behavior and needs a product decision; corpus is authored, not held out |
| Conversation runtime | `packages/conversation-runtime/` | PASS: 13/13 and declared as the eighteenth required component | No remaining release-closure gap |
| GLM 5.3 Flash 8K research | `../../agent-reasoning-engine/research/contextbench-v1/releases/glm-5.3-flash-8k-v1/` | Wrapped research chapter with bounded claims | Does not qualify 10K or 12K |
| GLM 5.3 Flash 10K | `../../agent-reasoning-engine/research/contextbench-v1/larger-window-v1/round59-reviewed-decision.json` | NOT QUALIFIED: the conditional canary was causally valid but lost 0.21 pp aggregate Span-F1 while saving 2,219 tokens; the three active pairs lost 0.56 pp while saving 2,225 tokens | Analyze prefix-observable displacement or evidence-structure signals under LW-H3b before another run |
| GLM 5.3 Flash 12K | `../../agent-reasoning-engine/research/contextbench-v1/larger-window-v1/round59-reviewed-decision.json` | BLOCKED: neither unconditional nor handle-count-conditional 10K transfer passed | Reconsider only after a 10K successor passes development and independent confirmation |

## Declared component coverage

Every required component has a directly owned current-source suite. These are
implementation checks; they do not by themselves qualify research claims or
authorize deployment.

| Component | Files | Cases | Result |
| --- | ---: | ---: | --- |
| `aci-binding-contract` | 1 | 4 | PASS |
| `codex-app-server-wrapper` | 17 | 186 | PASS |
| `coding-agent-runtime` | 48 | 411 | PASS |
| `conversation-runtime` | 4 | 13 | PASS |
| `context-basis-runtime` | 3 | 43 | PASS |
| `evolution-runtime` | 7 | 54 | PASS |
| `intent-route-resolver` | 7 | 34 | PASS |
| `module-port` | 3 | 18 | PASS |
| `module-port-distribution-envelope` | 1 | 9 | PASS |
| `module-port-governance-cutover` | 1 | 9 | PASS |
| `real-reasoning-benchmark` | 19 | 76 | PASS |
| `reasoning-policy-runtime` | 1 | 7 | PASS |
| `reasoning-state-runtime` | 1 | 32 | PASS |
| `request-decision-router` | 7 | 52 | PASS |
| `request-intent-runtime` | 7 | 65 | PASS |
| `runtime-journal` | 1 | 8 | PASS |
| `semantic-input-runtime` | 1 | 19 | PASS |
| `semantic-judgment-evaluator` | 3 | 22 | PASS |

The derived Rust governance binding also passes 6 cases. The product-owned
entrypoint and release tests pass 54 cases.

## Declared integration coverage

| Integration | Coverage | Result | Remaining boundary |
| --- | --- | --- | --- |
| `define-cli` | 6 owned Node test files, 69 cases | PASS | None for local release closure |
| `codex-desktop-bridge` | 7 owned Node test files, 44 cases | PASS | Installation in a live host is operational work |
| `are-product-package` | 1 owned Python mutation file, 6 cases | PASS | Positive package validation remains part of its validator and frozen package receipts |
| `module-port-cutover-alch` | 1 owned integrity test over source, fixture, and every closure-retained generated file | PASS | Generated build evidence remains excluded; runtime behavior is exercised by `module-port-governance-cutover` |
| `module-port-packaged-verifier-alch` | 1 owned integrity test over source, fixture, and every closure-retained generated file | PASS | Generated build evidence remains excluded; runtime behavior is exercised by `module-port-governance-cutover` |
| `module-port-signed-envelope-alch` | 1 owned integrity test over source, fixture, and every closure-retained generated file | PASS | Generated build evidence remains excluded; envelope behavior is exercised by distribution-envelope tests |

## Findings

The release machinery now derives its tests from the exact source closure and
proves that the copied closure runs without undeclared checkout dependencies.
Candidate 013 is the selected Option B successor: it declares the conversation
runtime and model-neutral gateway adapter surface, and its release verifier
passes after the complete DomainSpec compiler distribution and Define evidence
are included.

The isolated closure is self-contained, but an ARE Git checkout alone is not.
Candidate 013 hashes 1,554 files under `domainspec-core`, including the compiler
distribution used by its tests. It also contains 215 Git-ignored build-support
files under the Alch compiler (`dist` plus the pinned TypeScript runtime). The
ARE release commit therefore records their exact hashes and evidence without
absorbing the sibling repository's unrelated dirty work or committing installed
dependencies. A published artifact must materialize those 1,769 frozen files,
or bind committed/package-locked equivalents and freeze a successor candidate.
Passing locally does not turn workspace-only inputs into ARE source history.

The current workspace suite also exposed an order-dependent router test. Earlier
integration suites can update generated examples in the live sibling DomainSpec
compiler, so comparing a frozen route bundle to that moving workspace produced
a false reproducibility failure. The repaired test verifies every frozen bundle
digest and compares two fresh compiler builds independently. The router passes
52/52 tests, and the complete workspace product passes 1,222/1,222 cases.

The gateway no longer has to spawn Codex directly. A validated backend adapter
owns process creation; Codex is the backward-compatible default, and any agent
that speaks the expected JSON-lines protocol can supply a process adapter. The
gateway still relies on a wrapper for message interpretation, so protocol
translation remains an adapter responsibility.

The audit also found that the required `are-product-package` integration's
Python mutation tests were present in the release closure but absent from the
test plan. The planner and runner now own a `python-unittest` suite for that
integration. Three Alch integrations also received directly owned integrity
tests, and release verification now blocks any required integration without a
suite. The selected Option B closure passes 1,244/1,244 cases.

Provider coverage was already broader than the product inventory suggested.
The four transport families share the same governed proposal path and stop at
approval. No additional provider implementation is required for release.

The language and conversation layers have different gaps. Interaction learning
is implemented and tested. Objective interpretation is deliberately
conservative: it defers eight paraphrases instead of guessing. The conversation
runtime was failing because it did not pass the semantic module port to the
current router; that integration is repaired, but the package is not a declared
product component.

Temporary isolated checkouts retained by failed diagnostics were removed after
the successful run: 16 directories and about 627 MiB of file content. The
isolation runner removes successful checkouts automatically and retains only
failures for diagnosis.

Round 59's additive scoring recovery changed no live evidence and made no model
calls. Its conditional instrument checks all pass. Its 205 MiB reconstructible
score cache was removed after the closeout was hash-bound. The filesystem
currently has about 865 GiB free.

## Resolved product decision

Option B was selected. `conversation-runtime` is a required eighteenth
component, and `are.gateway-backend-adapter/v1` is a supported product surface.
The objective-language result remains an explicit bounded limitation: 12/20
authored paraphrases resolve and 8/20 defer safely, with no unsafe resolutions.

## Open Questions

- Should the eight safely deferred paraphrases remain a known limitation for
  this release, or should objective-language behavior be broadened before the
  next freeze?
- Should publication materialize Candidate 013's 1,769 content-addressed
  workspace inputs, or should a successor candidate bind committed/package-
  locked compiler inputs?
- Which prefix-observable displacement or evidence-structure signal should be
  preregistered for the next 10K development experiment under LW-H3b?
