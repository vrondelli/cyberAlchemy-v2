# Decision: SWU006 DOM compatibility repair

- Decision ID: `D-OEWFR-01-DOM-COMPATIBILITY-REPAIR`
- Status: PASS — owner selected `B-CONFIG-SIDE`
- Source: direct user Invoke Refresh request dated 2026-08-04
- Admissibility receipt:
  [DOM-COMPATIBILITY-REPAIR-receipt.json](admissibility/DOM-COMPATIBILITY-REPAIR-receipt.json)
- Feasibility evidence:
  [COMPATIBILITY-FEASIBILITY.md](../refresh-runs/20260804T014000Z-whole-package-alignment/COMPATIBILITY-FEASIBILITY.md)

## Question

Which repair boundary should the exact SWU006 successor use?

## Admissible options

| ID | Kind | Summary | Downstream effect |
| --- | --- | --- | --- |
| `A-TEST-SIDE` | action | keep Node and replace the two direct-DOM tests with non-vacuous bounded focus-root fixtures | smallest patch-only successor; Chromium remains the real DOM proof |
| `B-CONFIG-SIDE` | action | give only the selected tests a pinned DOM-capable environment | adds package/lockfile/runtime gates and possible exact dependency fetch |
| `C-DEFER` | defer | leave the repair unselected | SWU006 remains terminal BLOCK and SWU007 remains stopped |
| `D-STOP` | stop | stop this semantic-navigation branch | preserve current evidence; author no successor |

## Current result

- Selected option: `B-CONFIG-SIDE`
- Rationale: on 2026-08-04 the user explicitly selected option 2 and authorized
  the bounded candidate-local config-side repair through implementation and
  testing without further preference gates.
- Source of decision: direct user response in the active session.
- Timestamp: `2026-08-04T03:55:43Z`
- Decisions resolved: 1
- Blockers remaining: 0 inside this Decision Gate
- Consequential mutation: admitted only through the exact successor work pack
  and its live validation boundary.
- Exact granted scope: isolated DOM test environment, compatible pinned runtime
  dependency, dashboard package-manifest and frozen-lockfile deltas, necessary
  private builder/binding generalization, one generalized build attempt, and
  local Chromium acceptance.
- Preserved exclusions: credentials, credential persistence, destructive
  cleanup outside isolated workroots, public Arcanum mutation, publication,
  deployment, release, commit, and push.
- Machine selection:
  [DOM-COMPATIBILITY-REPAIR-selection.json](admissibility/DOM-COMPATIBILITY-REPAIR-selection.json)
