# H23 JS model-view adapter

The isolated JS projection matches the Python reference byte-for-byte for all135 saved H22 prompts and all6 pairs in the completed tokenizer experiment. Five test groups pass: reference parity, exact measured-body parity, whole-schema diagnostics/unsupported inputs, payload preservation, and adapter composition. See parity-report.json. No provider calls or generated-code execution occurred.

The adapter composes after the frozen H22 metadata/padding adapter, then records the projected body used for measurement and dispatch. It preserves response normalization and records projection receipts outside the model prompt. Core agent sources and default profiles are unchanged. Live integration and completion quality remain untested.

Schema validation reuses the complete envelope.schema.json from ../payload-view-v1. Ajv8.20.0 is pinned by package-lock.json; installation disabled lifecycle scripts. `allErrors` collects errors across fields; coercion, defaults and removal of unknown fields remain disabled. See [Ajv options](https://ajv.js.org/options.html#allerrors). The existing bounded JSON parser in ../../../../../packages/coding-agent-runtime/patch-schema.mjs rejects duplicate keys and bounds input/depth. The restricted patch shape validator is not copied or extended.

Only validated successful read-file envelopes with a verified output digest/byte count project. Complete output/arguments/source metadata and outer correlation remain. Unknown or paged schemas pass through unchanged. Unsafe numeric values, non-integer numbers and ill-formed Unicode pass through unchanged; this JS candidate therefore has a deliberately narrower supported JSON profile than the offline prototype. Parity is proven for the declared corpus, not all possible JSON inputs. Native output digest reconstruction follows the exact producer field order; unsupported serialization remains unchanged.

Run `npm ci --ignore-scripts --no-audit --no-fund`, then `node --test projection.test.mjs` in this folder. Python plus installed jsonschema is required only for the independent reference test; live JS projection does not spawn Python.

## Construction and operational lanes

D65 candidate scope under glm-payload-js-86: this folder and research records. Owner: ARE implementer/evaluator. Runnable frontier: freeze a matched live comparison using this adapter and unchanged H21 candidate, source fixtures, padding, token reserves and call caps. Include unpressured controls and genuine-pressure cases; preserve missing proposals separately from incorrect code. No live cohort is bound by local parity tests. Serving, adoption and publication remain deferred user-owned decisions.

Research dependencies: H23 hypothesis and completed token experiment; canonical evolution-runtime constructors/record verification and existing DAG layering. No mandatory ontology-runtime enforcement.

## Open Questions

Does GLM complete the near-boundary tasks correctly with the smaller envelope? How does it behave under genuine payload pressure? What should support paged/unknown tool envelopes? Does the candidate transfer beyond one task family? Full product qualification remains in the GLM finish plan.
