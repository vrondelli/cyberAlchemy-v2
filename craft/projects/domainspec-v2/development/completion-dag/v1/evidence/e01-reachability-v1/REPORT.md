# E01 — Finite owns-reachability audit

E01 definition work: **PASS**. Candidate meaning only; no implementation or product approval.

The proposed product answers: **Can Entity C be reached from Entity A by following one or more explicitly authored owns edges in this exact compiled project?**

Profile: `dsv2.owns-reachability.v1-candidate`; approved Stable 1.0 compiler input, pinned portable EVF 0.4.0 archive, Souffle provider, proposed `dsv2-owns-reachability-consumer-v1`. All project Entities are included, at most 64; exactly one query obligation. The agent selected this revisable candidate scope within E01; user product approval is not claimed.

## Proposed definitions

### Selected owns graph

**Disposition:** propose. **Decision owner:** DomainSpec compiler/profile meaning owner.

Select every Entity and every explicit owns edge between Entities in one validated compiled project; preserve exact project and source identities.

**Formal:** V = all Entity selectors in G.nodes; E = {(u,v) | an explicit G.relationships edge has relationship = owns, source u and target v}. Require 1 <= |V| <= 64.

**Plain meaning:** Use the whole project Entity graph, keeping only authored owns links.

**Example:** inventory:A owns inventory:B; inventory:B owns inventory:C.

**Boundary:** No generated owned-by edges, belongs-to substitution, inferred ownership, silent truncation, or scope filtering. Parallel owns records may map to one ordered pair only if every original edge ID is retained in provenance.

### Reachability obligation

**Disposition:** propose. **Decision owner:** DomainSpec EVF integration product owner.

One explicitly selected source Entity must reach one explicitly selected target Entity by a path containing at least one selected owns edge.

**Formal:** D = {reachability(source,target)}; |D| = 1; claim true iff (source,target) is in E+ (positive transitive closure). Both endpoints must belong to V.

**Plain meaning:** Follow one or more owns arrows from the named source to the named target.

**Example:** A -> B -> C satisfies A reaches C; removing B -> C makes the same claim false.

**Boundary:** A equals C is insufficient by itself; a real nonempty cycle may satisfy self-reachability. This is an additional audit claim, not one of the compiler built-in obligation IDs and not a new normative transitivity rule for owns.

### Bound evidence bundle

**Disposition:** propose. **Decision owner:** EVF integration evidence-contract owner.

Bind the exact source snapshot, compiled graph, profile, query, projection, identifier map, runtime and tool identities, raw positive evidence and broken-edge control to one candidate epoch.

**Formal:** Bundle identity = SHA256(canonical manifest of named inputs, outputs, dependencies and their SHA256 digests); all required references must equal consumer-supplied expected identities.

**Plain meaning:** The evidence must describe exactly the graph and question the caller asked about.

**Example:** Evidence for A -> B -> C cannot be reused after removing B -> C from the caller-pinned source snapshot.

**Boundary:** Canonical byte encoding and manifest fields are E02 design work. Hash consistency is not origin authentication. Trusted compiler, host and read-only caller snapshot remain assumptions; all provider-writable workspace bytes are untrusted inputs.

### Independent consumer verdict

**Disposition:** propose. **Decision owner:** Independent compiler-evidence consumer owner.

The candidate consumer dsv2-owns-reachability-consumer-v1 independently reconstructs the selected graph, compares the provider model, checks positive and negative evidence, and reports every required condition before aggregating.

**Formal:** PASS iff every required condition is evaluated and satisfied. BLOCK iff any evaluable condition fails. Otherwise not_evaluable. BLOCK takes aggregate precedence; unknown dependent conditions stay not_evaluable.

**Plain meaning:** A separate reader checks the graph and evidence itself, and says why it passes, fails, or cannot yet be checked.

**Example:** Missing evidence is not_evaluable; stale digest or a reported success contradicted by the graph is BLOCK; all checks satisfied is bounded PASS.

**Boundary:** Consumer is a proposed component, not an existing deployed service. It must not import producer projection/verdict logic or EVF adapter reachability functions. Its receipt grants no approval or operational effect.

## Product and business scaffold

The intended user is a compiler evidence reviewer. Proposed value: detect a missing authored ownership path before relying on a graph. This is a hypothesis, not measured value. The seven-node business scaffold links capability, user, value, claim, scope, evidence and independent consumer. It is not a registered ontology.

Six conditions must hold: input identity, graph correspondence, native positive evidence, killed negative control, evidence integrity and reviewed consumer independence. These conditions do not enlarge the one-obligation denominator.

The negative control removes all incoming edges to the target in the normalized graph, making positive-length target reachability false, including cyclic self-reachability. This is a provider control, not a newly compiled source project. The separate broken-source fixture must compile and be evaluated independently.

## Evidence and limits

Ten source files and three archive members are pinned. E00 output hashes were verified; selected sources were checked again after authoring. Nine structural/source checks passed. The 18 fixture intentions have not been implemented or run. Full Define runtime validation, saved session and context-evaluator evidence are explicitly absent; this local candidate is not an admitted Define lifecycle state.

No legal ownership, authorization, runtime behavior, whole-compiler correctness, Auth conformance, UI adoption, multi-provider agreement, TLC stability or hostile-host authenticity is established. Hashes do not authenticate a provider-writable workspace.

## Construction frontier and open questions

E02 is next: resolve byte encoding, source-to-model mapping, evidence transport, tool identities and independent consumer design, then construct the DomainSpec/compiled-system prototypes required by the DAG. E03 implementation, E04 product tests and E05 independent review/approval remain open. R00, U00 and L00 remain independently ready. No causal blocker prevents E02 candidate design.

Encoding/transport belongs to E02; runtime closure belongs to E02/E03 before E04; named reviewer and product decision actors belong to the product owner before E05. These are visible open questions, not missing E01 concepts. Allowed use: review/challenge and E02 design input. Blocked actions: canonical promotion, admitted construction handoff, ontology admission and operational effects. Refresh through CA2-ROUTE-DEFINE into a successor candidate when selected meaning or sources change.

## Operational support residue

O01 hosted compiler evidence stays with the Repository/release owner for release preparation. O06 distribution/publication stays with the portable EVF package owner. E03/E04 execution owners must verify exact contained runtime dependencies before execution. The EVF/TLC owner retains the unexplained TLC failure; TLC is outside this profile. Named actors remain unassigned here. These items do not block definition/design.

Original DAG, E00 and frozen compiler/EVF files are preserved. Only this new evidence directory is authored.
