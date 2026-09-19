# Design Risks And Gaps

| ID | Risk or gap | Failure mode | Control / owner route | Plan effect |
| --- | --- | --- | --- | --- |
| DES-R01 | Architecture-Pattern Enforcement collision | normalized finding becomes a second architecture truth | provider reference plus owner/digest preservation | must close before implementation |
| DES-R02 | Second binding registry | package writes identity that disagrees with code tags | reconciliation-only API; no canonical writer | must close with code-tag reformulation |
| DES-R03 | Direct-leaf/public-index conflict | one profile makes both edges mandatory | explicit `edge_policy`; external architecture owner decision | blocks normal implementation Plan |
| DES-R04 | Runtime-plane collapse | fixture evaluator becomes scheduler/runtime/effect dispatcher | application-owned evidence provider; package consumes result only | enforce in interface review |
| DES-R05 | Parser duplication | shared evaluator starts parsing three languages | language-owned adapters; explicit unsupported sets | enforce in component boundary |
| DES-R06 | Gate duplication | evaluation receipt treated as admission/promotion/release | no authority-changing operation; owner route on receipt | enforce in receipt schema and tests |
| DES-R07 | Exception laundering | native suppression deletes an underlying finding | no accepted-with-exception result; retain finding; no owner means fail | blocks exception feature |
| DES-R08 | State Machine admission omission | design refers to a kind absent from the selected profile | supported-profile owner decision and digest update | blocks runtime-contract implementation |
| DES-R09 | Diagnostic privacy leak | receipt exposes private paths, fragments, or tool output | raw reference indirection, redaction metadata, caller-owned retention/access | blocks receipt persistence/publication |
| DES-R10 | Generated-code staleness | generated module appears conformant after source/config change | bind source, generator, config, output, and tool-version digests | planned negative witness |
| DES-R11 | Cross-language false parity | same normalized code hides different source guarantees | compare meanings and claim limits; retain native diagnostics and unsupported cases | no parity claim before fixtures |
| DES-R12 | Evaluation lifecycle ambiguity | Define state view sends binding/evidence failures directly to `Rejected` while the receipt contract expects failure evidence | upstream patch request: separate invalid envelope from valid failing evaluation | Design remains usable; normal Plan flagged |
| DES-R13 | Inferred CAV2 pattern ontology | candidate source map/private evidence is mistaken for canonical pattern authority | record that no standalone canonical ontology was selected; owner-reviewed pattern cards only | no ontology import or promotion |
| DES-R14 | Performance unknown | checker damages editor or CI loop | define measurement dimensions; select thresholds only after versions/corpus | recommended, not a Design claim |
| DES-R15 | Multiple implementation selection | feature flags/environment violate exactly-one binding | initial profile rejects or excludes; future owner-approved selector model required | deferred |
| DES-R16 | FFI/RPC/plugin boundary | direct-call topology cannot establish implementation binding | outside minimum profile; typed unsupported/deferred | deferred |
| DES-R17 | Shared-core host ambiguity | “one package” becomes a hidden TypeScript/Python/Rust runner or three unproven evaluator implementations | one governed contract family; future owner selects a core host or parity strategy against golden fixtures | blocks implementation package selection |

## Upstream Patch Requests

1. Clarify `STATES.md` so valid conformance failures can produce a failing
   evidence receipt while malformed/stale envelopes remain rejected.
2. After owner decision, bind the chosen Rule edge policy in the supported
   implementation profile without overriding the v1 public-index precedent by
   implication.
3. Complete code-tag reformulation before any implementation writes or relies
   on canonical binding projections.

These are design follow-ups, not mutations performed by this invocation.
