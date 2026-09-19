---
module: language-type-enforcement-parser-experiment
feature_code: LTE
status: draft
updatedAt: 2026-07-17
docType: glossary-consistency
authority: non-authority design check
---

# Glossary Consistency: Language Type-Enforcement Parser Experiment

## Result

`PASS` for design vocabulary. No canonical definition is added, amended, or
promoted.

## Source Vocabulary

| Term | Source meaning used here | Consistency result |
| --- | --- | --- |
| parser | Turns authored material into a declared representation and accounts for every in-scope input. | preserved |
| `ParsedCompletely` | Every in-scope declaration is consumed or produces a named diagnostic. | preserved; whole-spec judgment not claimed by L0 |
| `ShapeValid` | The selected schema accepts the representation. | explicitly later than L0 |
| `ProfileAdmitted` | The selected profile admits the node/relation lifecycle and maturity. | explicitly owned by FPR-02, not L0 |
| endpoint-admissibility checker | Decides source/target membership relative to authority and profile. | excluded from parser experiment |
| witness | Concrete acceptance, rejection, or mutation result. | preserved |
| receipt | Record that one execution ran with named inputs and outputs. | preserved; Task Session output, not proof |
| proof under assumptions | Quantified claim discharged under explicit authority, encoding, build, and trust premises. | not claimed by L0 |
| Concept Registry | Local method-vocabulary table mapping concept to meta-type. | preserved from `domainspec-v2-D14`; no promotion |

## Experiment-Local Terms

| Term | Local meaning | Authority boundary |
| --- | --- | --- |
| Registry Parse Kernel | Pure implementation component that parses and accounts for one Concept Registry. | implementation design only |
| Registry Parse Result | Discriminated parsed/rejected return value with declarations, diagnostics, and counts. | implementation contract only |
| `RegistryParsedCompletely(spec)` | Experiment-local subjudgment: the one in-scope registry is fully accounted or exactly rejected. | necessary input to whole-spec `ParsedCompletely`; not a canonical definition or whole-spec proof |
| diagnostic code | Stable exact-cause identifier shared by consumer adapters. | test/API compatibility surface; not DomainSpec vocabulary |
| consumer adapter | Small mapping from the shared parse result into the content-validator or normalized-parser output. | implementation boundary only |
| parity matrix | Positive/negative table demonstrating that both consumer surfaces classify the same structural mutation the same way. | experiment evidence only |

## Collision And Drift Check

- `type` in `RegistryDeclaration.metaType` means an authored DS-D1/local label;
  it does not mean the kernel has admitted it to a profile.
- `manifest` here means an in-memory parse/accounting result unless a later
  owner explicitly chooses a durable receipt format.
- `proof` is not used for a green test run. The L0 result is a witnessed
  discriminator with a Task Session receipt.
- `Fixture` remains the sample-local technical label already recorded by
  FPR-01; the parser must preserve it as text and must not promote or reject it
  on profile grounds.

## Gaps

None blocks design. The emitted `[LTE-*]` values are frozen compatibility
identifiers for this experiment; only internal exported or type names may vary.
Changing a code later requires an explicit compatibility/design revision.
