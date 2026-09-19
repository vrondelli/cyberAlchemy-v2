# DomainSpec v2 Meta-Type Target Architecture Audit

## Outcome

The current target layer is not consistently generic. Of 36 declared target files, 31 carry Financial Settlement vocabulary or stronger cross-layer evidence. Five are corpus-generic, but they implement evaluator behavior inline, so semantic ownership remains unresolved rather than proven clean. Enum contributes three language slots but declares no target source paths, so its bytes are not classifiable from the current candidate manifest.

This is an observed architecture audit, not a repair decision. The exact machine denominator is in [TARGET-INVENTORY.json](./TARGET-INVENTORY.json), and path-level evidence is in [LEAKAGE-FINDINGS.json](./LEAKAGE-FINDINGS.json).

## Intended layers

The selected Design separates authored meaning from native observation. Its relevant constraints are:

- DomainSpec does not generate business meaning (Design line 13).
- the proof denominator is authored outside candidates/providers (line 108);
- a target observation contains native facts and no expected outcomes (lines 110-112);
- a realization composition adapter imports exactly one family and one language target (lines 132-162);
- expected outcomes and mutants do not flow into targets (lines 148-159);
- the Work Pack's per-type target unit includes the native observation, composition adapter, and provider as distinct responsibilities (Work Pack lines 59-64).

Recommended dependency direction:

```text
system-owned corpus (descriptor, observation, hostiles, expected outcomes)
    -> realization composition adapter
        -> generic family evaluator + language-native target
            -> provider execution and candidate-local evidence
```

The system corpus supplies inputs. It does not become reusable DomainSpec target implementation.

## Observed layers

```text
candidate manifest
    -> target
        -> inline Financial Settlement vocabulary/builders (31 paths / 11 builders)
        -> family fixtures/evaluators in TypeScript and Rule fixtures across languages
        -> provider/factory execution
```

The strongest leakage is not merely naming. Eight target paths directly depend on corpus/realization fixtures, five TypeScript targets also import family evaluator/decoder runtime behavior, and one Event target imports hostile test evidence. Policy demonstrates the opposite failure mode: all three Policy targets hard-code settlement routing while importing nothing forbidden.

## System corpus ownership

- **Financial Settlement** is example/proof-corpus data. W3/W4 call it a Financial Settlement fixture, and their contracts cap claims at `candidate-local-exact-fixture`.
- **Shipment Priority** is the Enum candidate's logistics corpus, but Enum's three target source paths are missing from its manifest.
- **Bolina** is absent from all 36 declared target files. This audit does not infer anything about Bolina outside that exact denominator.

## Observed-versus-intended gap

| Concern | Intended | Observed |
|---|---|---|
| Generic target | Native language facts/projection only | 31 paths contain system-domain vocabulary or stronger leakage evidence; five corpus-generic targets still contain inline evaluator logic needing semantic review |
| Composition | Adapter joins family + target + supplied corpus | Five TS targets import family evaluator runtime and settlement fixtures directly |
| Realization boundary | Target is an adapter input | Rule TS imports a realization fixture; Rule Python/Rust import target fixture modules |
| Test evidence | Corpus/hostiles remain outside target runtime | Event TS imports a hostile mutation helper |
| Multi-language firewall | Same ownership rule in TS/Python/Rust | Current scanner observes TS runtime imports only |
| Inventory closure | Each language slot binds an exact source | Enum has three slots and zero source declarations |

## Claim ceiling

This package proves the current candidate-declared target denominator, direct imports, contextual literals, and layer mismatches. It does not choose ownership, assert every path must be rewritten, freeze the transitive repair denominator, admit a candidate, or authorize product mutation.
