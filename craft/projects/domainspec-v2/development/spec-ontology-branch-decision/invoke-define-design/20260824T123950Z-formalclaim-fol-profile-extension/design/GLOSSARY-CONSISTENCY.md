# Glossary Consistency Report

Verdict: pass for this candidate Design

| Define term | Design use | Result |
| --- | --- | --- |
| FormalClaim | source payload remains the semantic content of the existing node | consistent |
| many-sorted FOL with equality | source signature and AST semantics | consistent |
| source semantics profile | explicitly separated from executable/solver profiles | consistent |
| capability assessment | validation-owned immutable contract | consistent |
| executable projection | exact source-bound downstream representation | consistent |
| solver admission | profile and runtime references remain separately owned | consistent |
| `needs_formal` | boolean plus typed reasons at the TDE boundary | consistent |
| domain closure | explicit authored assumption, never defaulted silently | consistent |
| unique-name assumption | explicit authored assumption, never defaulted silently | consistent |
| unknown / timeout | provider outcomes that never pass | consistent |
| proof-provider-required | routing classification, not proof evidence | consistent |
| unsupported | total class for a valid claim with no exact admitted capability match | consistent |
| indeterminate | classification-evidence defect or inconclusive result, not unsupported | consistent |

No Define term is silently redefined or promoted. The candidate Design adds the
contract names `FormalClaimSourcePayload/v1`,
`FormalClaimCapabilityAssessment/v1`, and `ExecutableProjectionBinding/v1` as
local design identifiers only.
