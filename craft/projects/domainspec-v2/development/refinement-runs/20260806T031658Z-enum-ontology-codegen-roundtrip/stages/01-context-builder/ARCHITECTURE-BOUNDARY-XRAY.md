# Architecture Boundary X-Ray

## Plain-language map

The ontology says what an Enum means. The realization compiler decides how to
express that meaning in a target language. The TypeScript compiler checks that
the emitted source is valid TypeScript. The adapter reports what the source
actually contains. The independent evaluator decides whether the reported
implementation satisfies the frozen architecture obligations. Receipts record
the evidence; none of these downstream objects may rewrite the ontology.

## Layer handles

| Handle | Layer | Owner | Consumes | Emits | Must not do |
| --- | --- | --- | --- | --- | --- |
| `definition.canonical` | semantic source | DomainSpec Enum definition owner | author-approved member identity and relationships | immutable definition handle | infer identity from code |
| `obligations.expected` | proof expectation | independent architecture catalogue owner | definition plus portable/profile contracts | frozen `A_spec` | import generator output |
| `realization.ir` | portable compiler boundary | architecture realization compiler owner | canonical definition handle | deterministic target-neutral IR | contain TypeScript syntax |
| `source.typescript` | target realization | TypeScript emitter owner | IR plus admitted profile/provider binding | source, source map, manifest, build receipt | declare semantic authority |
| `build.typescript` | target validation | pinned TypeScript compiler owner | emitted source and exact config | diagnostics and build handle | judge ontology meaning |
| `observation.typescript` | evidence projection | existing adapter owner | emitted/compiled source and exact provider binding | observation facts/diagnostics | invent expected values |
| `evaluation.architecture` | independent proof | independent evaluator owner | frozen obligations plus raw build/observation handles | exact join and reason codes | import emitter/generator |
| `mutation.architecture` | causality proof | mutation owner | one declared obligation and fresh lineage | killed/survived result | reuse self-authored pass literal |
| `proof.receipt` | evidence envelope | proof receipt owner | allowlisted raw handles | bounded proof receipt | admit or promote |
| `proof.replay` | independent verification | replay owner | raw sources, contracts, receipts | replay result | trust receipt pass fields |

## Current versus missing

Existing TypeScript provider, adapter, fixtures, runner, mutation evidence, and
frozen observation occupy the target realization, observation, and partial
proof/replay lanes. Missing are the canonical generative input contract,
portable generation boundary, target emitter, generated-source manifest, and
an independently frozen architecture obligation catalogue for generation.

## Primary false-green path

If one component reads the ontology, emits TypeScript, derives the expected
facts from those emitted bytes, evaluates those facts, and writes a passing
receipt, the round trip only proves that the component agrees with itself. The
Design must break this cycle with separately owned expected obligations, raw
handles, a generator-independent evaluator, reason-specific mutations, and
independent replay.

