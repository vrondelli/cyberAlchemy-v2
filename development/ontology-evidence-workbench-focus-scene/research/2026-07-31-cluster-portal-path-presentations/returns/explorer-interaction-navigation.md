# Explorer return — interaction and navigation

## Bottom line

The strongest interaction narrative is a **labeled cluster-portal drill-down with a separate Path branch comparator and reversible scene history**.

A cluster icon alone should not be selected. It provides too little information scent to reveal destination, membership rule, crossing relation, or scope change. If retained, the icon should be decorative or redundant beside a visible target name, concept count, crossing count, and accessible action label.

This is a design recommendation, not evidence of improved comprehension.

## Current evidence and interaction gaps

Current A/B evidence establishes complete graph 237/231, first tour 4/0/6, literal Identity-and-Consent portal with source predicate `owns`, portal target 7/7/12, and accepted Back state 2/1/5. Current Back therefore restores the source node’s one-hop focus, not the exact preceding 4/0/6 scene.

The captures also show:

- baseline visually dense;
- six-portal panel obscures lower canvas at 1440×1000;
- area title/purpose split between header and tour sidebar;
- portal buttons have semantic scent but appear as a long ledger;
- `UNFOCUS` is the only explicit complete-graph escape.

Current Path:

- reads full stored graph, not active focus projection;
- builds bidirectional adjacency despite directed edges;
- returns one insertion-order BFS node sequence, not alternatives;
- carries no edge IDs, predicates, direction, provenance, or authority;
- counts nodes, not relations;
- selects a node and closes without recoverable branch state;
- lacks executed dialog/focus-restoration evidence.

## Evidence-based interaction principles

Jul and Furnas support local views with labels and landmarks to guide next moves; this favors named portal cards over unexplained icons. [Navigation in Electronic Worlds](https://citeseerx.ist.psu.edu/document?doi=31d98921ea7797ae03f6c7c47a8dd897fbf13ff5&repid=rep1&type=pdf)

Information-foraging theory treats cues as predictors of value beyond a choice. Applying it here is inference: destination, purpose, counts, and crossings are stronger cues than artwork alone. [Pirolli and Card](https://citeseerx.ist.psu.edu/document?doi=59f1e446fab201399d84ae48156ea7bd05c4439b&repid=rep1&type=pdf)

Overview+detail, zooming, and focus+context are distinct mechanisms. [Cockburn, Karlson, and Bederson](https://www.csse.canterbury.ac.nz/andrew.cockburn/papers/fc.pdf) Van Ham and van Wijk provide local-cluster/global-overview precedent, not Body War proof. [Small World Graphs](https://cgl.ethz.ch/teaching/scivis_common/Literature/vanHam-smallworld.pdf)

React Flow supports group nodes and cross-group connections, but D3-force does not own subflow layout. [Sub Flows](https://reactflow.dev/learn/layouting/sub-flows), [layout comparison](https://reactflow.dev/learn/layouting/layouting)

React Flow documents keyboard-focusable nodes/edges and Enter/Space operation, but this is not executed OEW evidence. [Accessibility](https://reactflow.dev/learn/advanced-use/accessibility)

Portal traversal is not proven hierarchical, so the stack should be labeled **Navigation history**, not an ARIA breadcrumb. [W3C Breadcrumb Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/) Path dialog focus must enter the dialog and return to the invoking control. [W3C H102](https://www.w3.org/WAI/WCAG22/Techniques/html/H102)

## Exact Body War journey

1. **Bounded home**
   - Heading: `Business capability map`
   - Scope: `Bounded home · 4 contexts`
   - Purpose: `Start with the business contexts and capabilities that organize Body War responsibilities.`
   - Escape: `Complete graph — 237 nodes`
   - Initial focus moves to area heading.
2. **Area meaning**
   - Four cards: Candidate Geometry Evidence, Identity and Consent, Suggested Track Route Expansion, Score Preview.
   - State that this is a presentation projection and changes no ontology authority.
3. **Portal recognition**
   - `Identity and Consent — related → Authentication and Consent`
   - Secondary: `source predicate: owns · projected direction: forward · authority effect: none`
4. **Local focus**
   - Target `Authentication and Consent`
   - Announce `Focus scene loaded: 7 concepts, 7 relations, 12 boundary crossings.`
   - Store the preceding exact scene frame.
5. **Neighbor area**
   - `Activity Evidence`
   - `3 concepts · 2 crossings from this scene`
   - Purpose text
   - Button name: `Open Activity Evidence area; 3 concepts; 2 crossing relations`
   - Constituent crossings remain individually recoverable.
6. **Activity Evidence**
   - Nodes: Activity Evidence, Activity Import, Evidence Submission.
   - Three internal relations, six crossings.
7. **Path**
   - Control `Path — compare routes`
   - Dialog `Compare relation paths`
   - Default `Follow stored direction`
   - Optional `Connections either way`
8. **Alternatives**
   - Directed fixture `Activity Evidence → Authentication and Consent`
   - Two shortest alternatives of two relations:
     - via Activity Import
     - via Evidence Submission
   - Result: `2 shortest directed paths · 2 relations each`
9. **Choose and recover**
   - `Show Route 1 on graph`, `aria-pressed="true"`, persistent `selectedBranchId`
   - Branch projection 3 nodes/2 relations
   - Back restores exact 3/3/6 Activity Evidence frame
   - `Navigation history` exposes earlier scene frames
   - `Complete graph — 237 nodes` exits intentionally.

## Narrative comparison

### A. Labeled portal cards + Path branch lanes

Strongest candidate. It preserves accepted portal navigation, adds meaningful area cards with recoverable crossings, compares routes in a focused dialog, projects the selected branch, and uses complete scene-frame history. It avoids new compound layout. Risk: grouped cards need a collapsible desktop rail and focus-managed narrow-screen sheet to avoid occlusion.

### B. Spatial regions + semantic zoom

Strongest global/local visual relationship but highest semantic and implementation risk. Spatial grouping may look like ontology containment; current D3-force does not own subflow layout; compound focus order and crossing validation add work.

### C. Area-card hub + small-multiple routes

Strongest direct comparison and lowest canvas-keyboard dependence. But it hides cross-area topology and risks a second presentation/state form. Select only if novice evidence shows canvas alternatives fail.

### Rejected: icon-only portals

A lone icon cannot communicate target, grouping rule, membership/count, crossing justification, scope change, or authority. An icon may be redundant decoration beside a label; never the sole control or semantic carrier.

## Required state separation

```text
navigationFrame:
  scope + exact visible node/edge IDs + context/focus ID + selected node

navigationHistory:
  ordered navigationFrame snapshots

pathResult:
  from + to + scope + traversal policy + status
  + relation-bearing branches + selectedBranchId
```

- Portal entry pushes a complete frame.
- Back restores byte-equivalently.
- Path does not alter navigation history.
- Branch choice changes only Path projection.
- Closing Path restores focus to `Path — compare routes`.
- Complete graph escape does not claim ontology completeness.
- Filter/scope changes visibly invalidate or recompute Path.

## Empty and error cases

- Same endpoints: `Choose two different concepts`; Find disabled.
- One branch: `1 shortest directed path · no alternatives`.
- Multiple branches: exact count and length.
- Directed no path: `No directed path in the current graph scope.`
- Reverse traversal: `traverses opposite stored direction`.
- Endpoint outside filter: state that explicitly; no silent full-graph fallback.
- Missing graph: `Path unavailable — graph data did not load. Retry.`
- Zero portals: `No relations leave this area.`
- Zero members: `0 concepts match the current filter`.
- Lost relation binding: block branch with `Route details unavailable`; do not synthesize unlabeled edge.

## Observable novice tasks and hooks

Tasks cover area/purpose/count, portal prediction, pointer/keyboard entry, area rationale, exact predicate/direction recovery, two Path alternatives, branch inspection, exact history restoration, complete graph escape, no-path/error distinction, forced colors, and narrow viewport.

Required hooks:

- `[data-testid="area-heading"][tabindex="-1"]`
- `[data-testid="navigation-history"]`
- `button[data-testid="knowledge-cluster-portal"][data-target-cluster]`
- `button[data-testid="open-path"]`
- `[data-testid="path-result"][data-status][data-branch-count]`
- `button[data-testid="path-branch"][aria-pressed]`
- `button[data-testid="focus-back"]`
- `button[data-testid="open-complete-graph"]`

Record success, time, wrong controls, backtracks, direction errors, prompts, focus restoration, and occlusion. Automated witnesses establish mechanics only; comprehension and accessibility conformance remain pending.

## Repository evidence loci

- `planning/WORK-PACK.md:14-24,63-79,114-130,138-211`
- `NOVICE-TEST.md:1-70`
- `generated/runs/BODY-WAR-ONTOLOGY-FOCUS-AB-001/20260730T210652Z/result.json`
- `knowledgeFocusScene.ts:103-205`
- `KnowledgeFocusPortals.tsx:24-101`
- archive `PathFinderModal.tsx:9-310`
- archive `CustomNode.tsx:74-202`
- archive `KnowledgeGraphView.tsx:37-48,306-409`
- prior candidate `findings.md:163-225`
- prior blocked audit `audit.md:8-34`

No evidence establishes superior usability, comprehension, ontology correctness, accessibility conformance, implementation readiness, promotion, release, deployment, or production readiness.
