# SWU Manifest — Unified Ontology View Architecture

Status: planned; no mutation authorized or executed.  
Execution rule: one dependency-satisfied SWU per Task Session.  
Selected first unit: `SWU-UOVA-001`.

The common admission and closeout contract in [WORK-PACK.md](WORK-PACK.md#common-task-session-closeout-contract) applies to every unit below. Every unit binds its task file, wave file, this manifest, the Work Pack, and every intended write target before mutation. Generated evidence lives under `session-evidence/<SWU-ID>/<attempt-id>/` and is never itself proof that the unit passed.

| ID | Parent | Primary behavior | Dependencies | Independent acceptance | Deterministic successor |
|---|---|---|---|---|---|
| SWU-UOVA-001 | TASK-01 | Normalize exact source graph identities and evidence | — | pure positive/negative fixtures prove no tuple deduplication, dangling reference, stale digest, or evidence loss | 002 |
| SWU-UOVA-002 | TASK-01 | Compile one digest-bound View Pack with exactly-one cluster membership | 001 | missing, duplicate, overlapping, and unassigned membership fail closed | 003 |
| SWU-UOVA-003 | TASK-01 | Derive bounded scenes with a total internal/cut relation partition | 002 | internal union cut equals the admitted relevant relation set exactly once | 004 |
| SWU-UOVA-004 | TASK-01 | Group every cut relation into a lossless destination portal | 003 | portal constituents reconstruct all cut relations and no cluster is inferred | 005 |
| SWU-UOVA-005 | TASK-01 | Return bounded exact-relation Path results for two admitted policies | 001 | contiguous hops, caps, timeout, parallel relations, and no-path cases pass | 006 |
| SWU-UOVA-006 | TASK-01 | Restore complete Navigation Frames atomically | 003–005 | success, cancellation, stale revision, missing target, and focus fallback pass | 007 |
| SWU-UOVA-007 | TASK-02 | Compile a DomainSpec development UI profile into one OEW UI API contract | 001–006 | profile digest, meta-type inventory, action bijection, guards/bindings, negative controls, and zero runtime dependency pass | 008 |
| SWU-UOVA-008 | TASK-02 | Resolve one exact-predicate encoding record per predicate | 001, 007 | exact text, unique color token, redundant pattern, direction phrase, and complete-registry search pass | 009 |
| SWU-UOVA-009 | TASK-02 | Resolve node-kind and role icons without replacing text | 001, 007 | every admitted node has labeled kind/role cues and unknown values fail closed | 010 |
| SWU-UOVA-010 | TASK-02 | Produce canonical pinned ELK geometry | 003, 007–009 | replay is byte-equal and every path/label/marker record is addressable | 011 |
| SWU-UOVA-011 | TASK-03 | Provide a complete Full Index and linear fallback before spatial activation | 003, 006–009 | 276 node + 301 relation rows remain complete; query/sort/filter counts stay separate | 012 |
| SWU-UOVA-012 | TASK-03 | Render one controlled spatial path per exact relation ID | 007, 010–011 | real paths, labels, markers, patterns, parallel edges, capability handshake, and proven fallback pass | 013 |
| SWU-UOVA-013 | TASK-04 | Render and operate Grouped Portal cards | 004, 007, 011–012 | group summary plus complete constituent expansion and destination intents pass | 014 |
| SWU-UOVA-014 | TASK-04 | Synchronize Path, graph highlight, and inspector on the same relation ID | 005–007, 011–013 | selecting any hop selects the exact path and evidence record | 015 |
| SWU-UOVA-015 | TASK-05 | Keep the desktop inspector from occluding selected geometry | 012, 014 | selected endpoints/path remain visible or the inspector reflows | 016 |
| SWU-UOVA-016 | TASK-05 | Provide narrow modal navigation and deterministic focus restoration | 006, 011, 013–014 | 390px sheet, trap, Escape, inert background, and return focus pass | 017 |
| SWU-UOVA-017 | TASK-05 | Preserve meaning in forced colors, reduced motion, keyboard, and 200% text | 011, 014–016 | redundant cues and linear access survive all named modes with no overflow | 018 |
| SWU-UOVA-018 | TASK-06 | Author a candidate-local Body War View Pack | 002 | all 276 nodes have exactly one source-referenced cluster; authority effect stays none | 019 |
| SWU-UOVA-019 | TASK-06 | Compile the exact Body War source into the unified Scene Model | 003–005, 008–009, 011, 018 | exact 276/301/39/577 denominators and home/focus/portal/Path/index/icon fixtures pass | 020 |
| SWU-UOVA-020 | TASK-06 | Cut over to a reproducible source-owned build with zero bundle surgery | 007–019 | empty-workroot tree digest, manifest, cutover, rollback, and zero-surgery scan pass | 021 |
| SWU-UOVA-021 | TASK-07 | Execute the full deterministic/browser/performance acceptance matrix | 020 | all positive, thirteen toy-game mutations, all UI-profile negatives, geometry, responsive, a11y-state, fallback, and numeric gates pass | 022 |
| SWU-UOVA-022 | TASK-08 | Generate static/print output from the same Scene and Geometry | 021 | identity/path/arrow/sentence parity passes without a second semantic renderer | 023 |
| SWU-UOVA-023 | TASK-08 | Prove a second-project adapter against the same contracts | 022 | read-only Augmentor or Anime fixture passes without project-source mutation | none |

## Split and result rules

- Each unit has one primary observable behavior; later consumers are separate units even when they touch the same component family.
- `SWU-UOVA-001` is the narrowest reversible start: pure normalization and fixtures, no visible UI or build cutover.
- `SWU-UOVA-007` is the UI-profile admission boundary. It consumes DomainSpec development evidence but emits an OEW-owned contract; no runtime import or authority transfer is allowed.
- A passing unit returns a Task Session receipt with baseline hashes, exact deltas, commands, raw observations, capability ceiling, residue, and next-unit selection.
- A blocked unit returns the same receipt shape plus one stable blocker ID and producer-owned diagnostics; it never silently weakens the contract.
- `SWU-UOVA-018` creates a candidate-local projection from existing source evidence. It does not promote cluster membership into canonical ontology authority.
- `SWU-UOVA-023` may read a second project and write only OEW fixture/test artifacts.
