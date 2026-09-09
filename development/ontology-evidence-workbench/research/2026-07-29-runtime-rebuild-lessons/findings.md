# OEW Runtime Rebuild Lessons

Dispatch: `2026-07-29-oew-runtime-rebuild-lessons`

## Plain-language finding

This is not a package-manifest or package-SHA runtime failure. The package and
SHA records are reproducibility guards: they identify the exact inputs and
prevent silent expansion, but `pnpm`, `tsc`, and Vitest did not consult those
repository guards during the clean replay. The direct blocker is 48 ordinary
strict-TypeScript errors in three OEW overlay modules:
`loadOewBundle.ts` (7), `store.ts` (5), and `types.ts` (36).

Governance is part of the diagnosis, but not because its invariants were
fictional. Missing lock ownership and an incomplete build order were real
reproducibility defects. Exact-byte ownership granularity amplified those
ordinary repairs into repeated stop-refresh-reselect churn without advancing a
browser witness.

No candidate is currently a browser-testable OEW prototype. The thin adapter is
recommended only as the smallest build-from-owned next target. Its present
status is **KILLED-PENDING-WITNESS** until an end-to-end browser run executes.

## Package topology

The pinned Understand-Anything archive had eight package manifests before and
after the clean replay: the top root, homepage, plugin root, core, dashboard,
viewer, and two tree-sitter WASM packages. The dashboard already consumes core
through `workspace:*`; upstream already owns pnpm, TypeScript, Vitest, Vite,
and the core/dashboard build scripts.

The OEW overlay contributes zero package manifests. OEW has one existing
repository-side `package.json`, which is a dependency-free command registry,
not another dependency graph. Recent work added zero new manifests. That
registry does declare materialize, immutable-build verification, browser
acceptance, and browser-verification commands, but their named build/browser
script targets are absent. A declaration is not deployed behavior.

Topology summary: **8 upstream manifests, 0 overlay manifests, 1 existing OEW
command registry, 0 new manifests**.

## Blocker chronology and measured churn

| Stop or transition | Immediate cause | Underlying classification | User-visible advance |
|---|---|---|---|
| Historical `008` | Trust-rail runner sat outside the exact inventory | Registry/write-set ownership mismatch | No |
| First-working refresh and selection | Required refresh and human selection | Governance admission, not runtime | No |
| `008F` attempt 001 | Passed and admitted 28 implementation paths | UI source advance, without final build/browser proof | Yes, source only |
| `013B` attempt 001 | Required `L1-BUILD.lock.json` was absent and unowned | Real reproducibility invariant exposed by incomplete ownership | No |
| `013B` attempt 002 | Core was not explicitly built after install with `--ignore-scripts` | Real workspace build-order need encoded incompletely | No |
| `013B` attempt 003 | Dashboard `tsc -b` reported 48 errors in three overlay files | First direct ordinary product/source defect | No |
| Typed-overlay refresh | Added repair ownership and changed governance projections | Ownership repair; no implementation mutation | No |
| `007T` attempt 001 | Interrupted preflight; no mutation admission or technical blocker recorded | Incomplete governed state | No |

Four Task Sessions were consumed from the first-working selection: `008F` and
three `013B` attempts. Three of four were blocked reproducibility/build
sessions; none reached a browser. The main lane applied at least 56 governance
path-write events—24 first-working refresh, 6 selection, 9 lock ownership, 8
effective build order, and 9 typed-overlay repair—before counting task receipt
and closeout evidence. Runtime implementation writes were 28, all in `008F`;
the three `013B` attempts and current `007T` preflight added zero. Thus the
observed governance churn is **at least 56 versus 28 runtime writes**, a
conservative lower bound of at least 2:1.

## Candidate verdicts

| Candidate | Owner and precedent | Witnessed as OEW browser prototype? | Sound direction? | Verdict |
|---|---|---:|---:|---|
| Current `007T -> 013B -> 014 -> 014V` | Existing governed L1 work pack | No: repair is unadmitted, build blocked, browser stages planned | Yes for eventual independent L1 verification | KEEP as eventual lane; KILLED as current minimum prototype |
| Thin adapter in pinned upstream workspace | Upstream owns workspace/build/UI mechanics; OEW owns fixture, adapter outputs, UI contract, and gateway safety precedent | No: `/oew-data/*`, browser runner, Vite artifact, and end-to-end receipt are absent | Yes | RECOMMEND as smallest next target; **KILLED-PENDING-WITNESS** |
| Static/Node-native viewer | Existing OEW L0 viewer and Poker test | No: serves `knowledge-graph.json`, not the graph/sidecar/receipt trust-and-inspector journey | Yes as a diagnostic | KEEP as L0 diagnostic; KILLED as OEW first working prototype |
| Generalized runtime | No missing-behavior owner or precedent need | No | No; duplicates owned mechanics | REMOVE FROM CRITICAL PATH and DEFER |

## Exact prototype-path disposition

These are scope dispositions, not file-deletion or implementation authority.

| Disposition | Exact artifacts or behavior | Reason |
|---|---|---|
| KEEP | Pinned archive/commit and locks; upstream workspace/manifests; core/dashboard scripts; React/Vite graph substrate; existing `?oew=1` entry patch; deterministic Poker fixture and adapter graph/sidecar/receipt; 008F UI, styles, tests, and tour other than repairs below; focused Node runners; loopback/token/containment/teardown patterns; existing L0 native viewer | Already owned, observed, or useful precedent |
| REPAIR | `types.ts`, `loadOewBundle.ts`, and `store.ts` under strict TypeScript without weakening strictness; do not inflate this into a fully typed UI claim because `OewApp.tsx` uses `// @ts-nocheck` | Current 48-error source blocker |
| BUILD-FROM-OWNED | Fail-closed loopback `/oew-data/{presentation-graph,evidence-sidecar,adapter-receipt}` routing derived from the existing gateway safety pattern; one exact browser acceptance runner and receipt; the declared-but-absent materialize/build/browser script targets needed by the chosen executable sequence | Missing OEW behavior with an existing owner or precedent, not grounds for a new runtime |
| REMOVE-FROM-CRITICAL-PATH | Treating the OEW command registry as a dependency graph; copied manifests or `node_modules`; generalized runtime abstractions; separate static UI reimplementation | Duplicates upstream ownership or existing UI behavior; no repository deletion is authorized |
| DEFER | Independent immutable build/browser verifier ceremony during fast prototype iteration, while retaining it for eventual L1; Firefox, axe, full responsive/manual matrices; L2 editing, promotion, multi-user, public, release, production, and runtime-generalization claims | Outside the smallest local witness |

## Smallest acceptance sequence

This sequence is proposed and has not run:

1. Verify the pinned archive, overlay, patch, Poker fixture, adapter outputs, and
   their digests; demonstrate unchanged manifest bytes and counts.
2. In a fresh temporary workroot, extract the archive, copy the overlay, and
   apply the existing entry patch exactly once.
3. Run frozen install with the isolated store, explicitly build core, force
   discovery of focused typed OEW tests, and build the dashboard through Vite.
   Any strict-TypeScript or focused-test failure stops before serving.
4. Launch one owned loopback gateway serving dashboard `dist` and
   token-protected immutable `/oew-data/*` documents. Fail closed on adapter
   identity, digest, receipt, token, path, or network violations.
5. Bind the exact Playwright version, Chromium executable and hash, runtime
   token, and port. Open `/?oew=1&token=<token>` and assert the trust rail, F1
   grounding trace, Outline/Table view parity, inspector source identity and
   `authority_effect: none`, receipt commit, no console errors, and no outbound
   requests.
6. In `finally`, terminate owned children and prove browser/gateway closure,
   port release, and temporary-root removal.

Passing would prove only one local automated Poker-Team journey. It would not
prove ontology correctness, promotion, product acceptance, release, or
production readiness.

## Measurement obligation

The proposed reductions from **2 to 1 runtime roots**, **4 to 2 planning
gates**, and **6 to 4 or 5 commands** are challenged projections, not measured
simplification. They use a boundary that excludes operations needed by the
proposed witness. Before claiming improvement, execute both lanes against one
identical boundary and count every hash verification, materialization,
overlay/patch action, adapter verification, install/build/test command,
gateway launch, browser assertion, teardown, port proof, and temporary-root
proof. Also confirm OEW-owned manifests remain 1, with 0 new.

## Stop doing

- Stop diagnosing the current failure as a package-manifest or SHA-runtime
  problem.
- Stop treating a green upstream Vitest run as proof that focused typed OEW
  tests were discovered.
- Stop treating command declarations as deployed build or browser behavior.
- Stop converting the OEW command registry into a second dependency topology.
- Stop copying manifests, dependency graphs, or `node_modules`.
- Stop designing a generalized runtime without an evidenced missing behavior.
- Stop counting simplification across unlike execution boundaries.
- Stop calling source admission, a proposed witness, or the L0 native viewer a
  browser-testable OEW prototype.
- Stop allowing exact ownership omissions to surface only after a Task Session
  has been consumed; bind executable owners and order before admission.

## Remaining gaps

- The 48 strict-TypeScript errors remain unrepaired.
- Dashboard build has not reached Vite, and no dashboard artifact exists.
- Focused typed OEW test discovery is unverified; the separate focused Node
  runners passed 18/18 but do not close that gap.
- `/oew-data/*` routing and its fail-closed integration do not exist.
- The materialize/build/browser targets declared by the command registry are
  absent.
- No Playwright OEW journey or browser receipt exists.
- Token, port, browser identity/hash, outbound-network behavior, child
  termination, port release, and temporary-root cleanup are unbound.
- No like-for-like simplification measurement has executed.
- `007T` remains interrupted preflight with `selected_swu=null` and
  `mutation_authorized=false`.

## Next target and claim ceiling

The smallest justified next target is: strict typing repair of the three
modules, build-from-owned `/oew-data/*` routing, and one exact fail-closed
browser runner/receipt, all inside the existing ownership topology and with
zero new manifests.

This finding does not authorize implementation, select an SWU, delete files,
or alter the governed chain. Its ceiling is a read-only diagnosis and proposed
repair route. It makes no working-browser, ontology-correctness, promotion,
release, or production claim.
