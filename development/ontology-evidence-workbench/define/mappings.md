# Mappings

## Presentation Mapping

| Candidate source | UA-compatible presentation | Loss treatment |
| --- | --- | --- |
| Finding | `claim` node | exact kind retained in sidecar |
| Research artifact | `source` node | exact kind retained in sidecar |
| Definition | `claim` node | definition status and source retained in sidecar |
| Observation | `source` node | exact kind retained in sidecar |
| `contradicts` | `contradicts` edge | exact match |
| `derives-from` | `builds_on` edge | explicitly labeled generalized; exact verb retained in sidecar |
| `specializes` candidate | `related` edge | explicitly lossy; exact verb, indeterminate status, diagnostic retained in sidecar |

No generalized mapping can be used for policy evaluation or grounding closure.

## Visual Semantics

| State | Shape/style | Text requirement |
| --- | --- | --- |
| composing lineage | solid directional edge | exact relation badge |
| contradiction | red dashed edge | “contradicts” label |
| policy-indeterminate | amber dotted edge | diagnostic code |
| excluded residue | muted but visible | exclusion rationale |
| code context | indigo secondary lane | “external code context” badge |

Color is never the only signal.

## Poker O13 Mapping

- `F1` → claim/finding
- `R1` → source/research artifact
- `D1`, `D2` → claim/definition
- composing focus: `F1`, `R1`, `D1`
- visible non-composing conflict: `D2 contradicts D1`
- visible unbound candidate: `specializes(D2,D1)` with
  `POLICY_OWNER_UNBOUND`

## Open Questions

See [SPEC.md](SPEC.md#open-questions).
