---
dispatch_id: 2026-06-18-ontology-materialization-model
dispatch_type: research
status: collected-returns
created: 2026-06-18
---

# Research Returns - Ontology Materialization Model

Raw explorer returns for the `projects/ontology` materialization model dispatch.
These are evidence returns, not final synthesis.

## Abramsky, Samson - Ontologize Branch-As-View Corpus

Read-only. No files edited.

Owned branch/view constraints are split by authority:

- `projects/ontologize/ONTOLOGY-BRANCHES.md:19` owns the four branch definitions: B1 meaning, B2 system, B3 run-context, B4 bridge. It also owns the branch/product mapping and drift interaction language. It is explicitly "candidate design only" at line 10.
- `projects/ontologize/DAG-AND-METRICS.md:84` owns graph law: node types, edge catalog, drift vs contradiction, gates, event model, and metrics. Key constraint: raw `drifts_from` is not adjudicated `contradicts`; open contradictions block promotion at lines 119-129.
- `projects/ontologize/development/view-triad-method/BRANCH-MATERIALIZATION.md:5` owns only a method-local coverage profile. It says directly that it "does not redefine the branches" at lines 5-8. It requires branch materialization registers, B3 run-context records, B4 bridge ledgers, and validation gates.
- `projects/ontologize/development/view-triad-method/DESIGN.md:79` owns the planning workflow: source inventory, branch register, system/engineer/ontology-view passes, validation, and proposed output paths. It is "pass-for-planning" at lines 183-187.

The branch-as-view correction is not implemented. `projects/ontologize/development/refinement-runs/20260615T211104Z-branch-as-view-ontology/RESULT.md:3` says the strategy packet is prepared and runtime-backed refine stages have not run. `REFINE-SEED-PROPOSAL.md:86` says "Strategy packet only until confirmed."

Open design decisions include flat branch-view files vs branch directories at `REFINE-SEED-PROPOSAL.md:77`, and whether B2 should land as `engineer-view` or `system-view` at lines 23-26.

The artifact tree can be the ontology as the corrected target model, but not yet as promoted method reality. `REFINE-SEED-PROPOSAL.md:3` states the operator intent: "the ontology is the directory / artifact tree," each branch is a view artifact, and each view artifact is one ontology branch. `RESULT.md:21` repeats the current synthesis: ontology root with `meaning-view`, `engineer-view`, `run-view`, and `residue-view`.

Today's method pack still frames branch materialization as the triad covering B1-B4, not as the final branch-native ontology tree. `DESIGN.md:108` proposes `projects/ontologize/view-triad/` output and says the path is "proposed, not yet mutated" at line 121.

Must not be promoted yet:

- Product/public docs, canonical branch rewrites, and client-facing claims are blocked until later owner approval: `REFINE-SEED-PROPOSAL.md:95`.
- Product-facing doc patches and coined edges or branch vocabulary are blocked without governance: `BRANCH-MATERIALIZATION.md:104`.
- Nothing auto-promotes; promotion requires owner decision and projection evidence: `DAG-AND-METRICS.md:146`.
- Run-boundary, vertical event catalog, and proof metric choices remain residue/hypothesis: `ONTOLOGY-BRANCHES.md:101`.

## Grothendieck, Alexander - CyberAlchemy Promotion-Lifecycle Corpus

Read-only. No files edited.

- `PromotionRecord` is the governing boundary object, not an ontology entry or evidence container. It carries one primary claim plus provenance, source inputs, branch target, status, evidence/commitment confidence, owner, gate result, use scope, contradiction path, rollback/retirement, route impact, and bridge validation when needed. See `arcanum/development/cyberalchemy-ontology-lifecycle/ONTOLOGY-ARCHITECTURE.md:42`, schema at line 210, and boundary at line 232.
- Branch authority is stable only for Business, System, and Bridge. Operational Ontology is explicitly a candidate extension until user or ontology-harness review accepts it. Business owns intent/policy/value/rules; System owns implementation/runtime/test facts; Bridge owns traceability, drift, and cross-branch validation, but not source truth for either side. See `ONTOLOGY-ARCHITECTURE.md:71` and line 132.
- Confidence is split: `evidenceConfidence` says how strongly evidence supports/challenges the claim; `commitmentConfidence` says whether agents should rely on it now. Commitment cannot outrun evidence without explicit risk acceptance and review-owner signoff. See `ONTOLOGY-ARCHITECTURE.md:189` and `PROMOTION-LIFECYCLE.md:131`.
- Node rules distinguish evidence pointers, review inputs, governed change records, candidates, premises, policies, constitutions, axioms, capabilities, context solutions, and drift findings. Raw or adapter-derived material can feed governance, but only visible candidate/promoted states can guide agents. See `ONTOLOGY-ARCHITECTURE.md:141` and line 176.
- Edge rules make materialization traceable: claims `traced_to` evidence, records are `generated_by` provenance, inputs `feeds_record`, records `targets_branch`, decisions `promotes_to` outputs, bridge proof `validated_by`, contradictions `challenged_by`, governance `governs`, intent `realized_by` system concepts, and candidates can `expires_when`. See `ONTOLOGY-ARCHITECTURE.md:160`.
- Adapter boundaries are strict. Source adapters produce `InventoryEvidence`/`SourceSelector` but must not promote meaning; signal adapters produce `ReviewableSignal` then draft records but must not claim truth; lifecycle adapters preserve intent/route/stage/outcome but must not collapse implementation into business authority. See `ONTOLOGY-ARCHITECTURE.md:257` and `PROMOTION-LIFECYCLE.md:150`.
- Promotion lifecycle is governed transition, not state flip: discovery/evidence/signal/envelope/decision inputs become a draft record, pass evidence and confidence review, then may become candidate, premise, reviewed, promoted, policy, constitution, axiom, contradiction, retirement, reject, or defer. See `PROMOTION-LIFECYCLE.md:18`, line 84, and line 103.

Implications for `projects/ontology` materialization:

- `projects/ontology` is currently empty, so its first materialized shape should probably be fixtures/templates, not canonical mutation.
- First concrete unit should be a normalized `PromotionRecord` schema plus examples, before ontology nodes/edges are treated as active knowledge.
- Node materialization should preserve status visibly: raw/cataloged/reviewable/draft/candidate/promoted/etc.
- Edge materialization must require evidence pointers and provenance; no node should appear as promoted just because it was observed.
- Cross-branch nodes need `BridgeValidation` with two-sided evidence or an explicit contradiction/insufficient state.
- Operational guidance should remain candidate unless status, use scope, owner, confidence split, rollback/retirement, and bridge validation are present. See `PROMOTION-LIFECYCLE.md:210`.
- Next planned implementation concerns are schema normalization, review-owner assignments, signal threshold defaults, bridge-validation templates, and the user decision path for Operational Ontology acceptance. See `PROMOTION-LIFECYCLE.md:319`.

## Fong, Brendan - Arcanum Runtime Substrate Corpus

Read-only. No files edited.

Recommendation: yes, `inventory + ontology-vault`, composed by `ontology-harness`, is the right path for `projects/ontology`. `projects/ontology` is currently empty, so the first slice should materialize the ontology substrate rather than migrate existing material.

Use this split:

- `projects/ontology/`: human-authored ontology source material, preferably Markdown. Keep branch/view artifacts here if this is the project-owned ontology tree.
- `.arcanum/inventory/`: generated compiled read model. It "does not replace canonical sources"; raw sources stay where they live, generated inventory pages cite them and record uncertainty: `.arcanum/inventory/README.md:7`.
- `.arcanum/ontology-vault/`: governed ontology maps, branch maps, premise reviews, promotion/demotion reports, drift reports, and traceability matrices.

Storage shape:

- Keep durable ontology narrative, maps, indexes, logs, schema, and reports as Markdown. The inventory package is Markdown/wiki-shaped: `README.md`, `schema.md`, `index.md`, `log.md`, `tags.md`, plus `wiki/`, `entries/`, `queries/`, and `lint/`: `arcanum/arcana/inventory/README.md:62`.
- Local generated pages should use YAML frontmatter and cite concrete sources: `.arcanum/inventory/schema.md:13`.
- CSV should stay source-level only: useful for raw tabular evidence if the ontology project later has tables, but not for authority, promotion state, or branch governance. The requested runtime docs do not define CSV as a governance/storage surface.

Evidence and promotion:

- Create evidence cards early. The local inventory already says there are no selector-level evidence cards or EvidenceSets yet: `.arcanum/inventory/index.md:33`.
- Evidence cards belong under `.arcanum/inventory/entries/evidence-cards/` when selector-level reuse is needed, and must include source refs, authority level, promotion owner, trace, and residue: `.arcanum/inventory/schema.md:81`.
- Do not treat evidence cards as authority. Canonical inventory says downstream owners decide promotion, not Inventory: `arcanum/arcana/inventory/README.md:13`.
- EvidenceSets can follow only after repeated grouped reuse; they reference card IDs rather than copying card content: `arcanum/arcana/inventory/README.md:29`.
- In the runtime substrate surfaces, the concrete required artifact is promotion metadata/reporting: `promotion_owner` in inventory cards, plus ontology-vault confidence promotion/demotion reports and decision gates when human trade-offs are involved: `arcanum/arcana/ontology-vault/README.md:71`, `arcanum/spells/ontology-harness/README.md:76`.

Minimal first slice:

1. Inventory source manifest for `projects/ontology/`.
2. A tiny ontology map in `.arcanum/ontology-vault/`, status `draft` or `candidate`.
3. 3-5 evidence cards for the first branch/view claims.
4. Updated inventory index/log only after materialization.
5. Context-builder dry run to prove retrieval works.

Suggested command-shaped sequence:

```text
inventory validate --path /home/vrondelli/projects/domainspec-core
inventory ingest --path /home/vrondelli/projects/domainspec-core --source projects/ontology --dry-run
ontology-vault map --path /home/vrondelli/projects/domainspec-core --source projects/ontology --output .arcanum/ontology-vault/map-<date>-projects-ontology.md --dry-run
context-builder --path /home/vrondelli/projects/domainspec-core --source .arcanum/inventory --dry-run
```

The first promotion gate should remain closed. A local candidate map says full ontology promotion is premature and recommends inventory-first work because branch ownership is not claim-level yet: `.arcanum/ontology-vault/map-2026-06-18-dispersed-knowledge.md:71`.

## Baez, John - Agent Ontology And Research Synthesis Corpus

Read-only. No files edited.

The core pattern is clear: CyberAlchemy's ontology model is already anti-pointer by design. Inventory is the evidence substrate, while ontology owns "thick" agent-usable knowledge: meaning, context, applicability, agent payloads, edges, confidence, promotion state, and retrieval guidance. See `cyberAlchemy/agentic-system-inventory-ontology-pipeline.md:33` and `cyberAlchemy/agentic-system-ontology-entry-model.md:15`.

Open owner decisions are in `research/cyber-alchemy-space/findings.md:73`:

- `OD-1`: branch-as-view vs built triad. Triad is built; branch-as-view is unrun and needs ratification.
- `OD-2`: B3 `run-view` producer. No producer exists; legal run-trace source must be defined.
- `OD-3`: residue-view embedded vs extracted.
- `OD-4`: artifact catalog primary-class rule vs multi-tag reality.
- `OD-5`: authority tie-break algorithm is proposed, not owned.
- `OD-6`: answered: `spec != system-view`; views precede and feed spec.

Thick-entry rules:

- Every ontology entry must carry usable content, context, applicability, retrieval payload, edges, evidence, confidence, promotion state, and maintenance rules: `cyberAlchemy/agentic-system-ontology-entry-model.md:57`.
- Inventory can summarize, index, tag, and preserve provenance, but it does not own final meaning or route authority: `agentic-system-ontology-entry-model.md:31`.
- Generated inventory pages must not become source authority: `agentic-system-ontology-entry-model.md:55`.
- The promotion ladder is raw source or memory observation -> inventory evidence -> thick ontology candidate -> review -> promoted entry: `agentic-system-ontology-entry-model.md:276`.
- The pipeline repeats the same gate: pointer-only entries fail; entries must distinguish facts, candidates, reviewed premises, decisions, contradictions, and open questions: `agentic-system-inventory-ontology-pipeline.md:229`.

Owned:

- Engine/law/private-parent composition is owned: `research/cyber-alchemy-space/findings.md:25`.
- Four branches B1 meaning, B2 system, B3 run-context, B4 bridge are owned: `findings.md:26`.
- Substrate chain `inventory -> ontology-vault -> context-builder` is owned: `findings.md:32`.

Retracted or downgraded:

- The first synthesis over-claimed and was corrected under the honesty contract: `findings.md:17`.
- Five-view branch-as-view was retracted; target is four views: `findings.md:42`.
- Authority tie-break algorithm is proposed, not owned: `findings.md:67`.
- "Orthogonal lifecycles" is dropped; reuse recursive self-application and tier-A/tier-B: `findings.md:70`.

Branch-as-view constraints:

- Branch-as-view is not current canonical built reality. Current built reality is the triad; branch-as-view is the target/open owner decision: `findings.md:39`.
- The ontology is the tree only if OD-1 lands.
- B1 becomes `meaning-view`; the skill may still remain named `ontology-view`: `findings.md:51`.
- B3 `run-view` cannot be filled from research fanout/doc-production receipts; that would be an illegal cross-branch edge: `findings.md:58`.
- B4 residue extraction risks single-owner conflict unless explicitly chosen: `findings.md:61`.

B3 vs CyberAlchemy Operational Ontology:

- Ontologize B3 `run-view` is per-subject run context: runtime/pilot/execution state of the thing being ontologized. It is empty for code-less contexts unless there is real subject runtime evidence: `findings.md:58`.
- CyberAlchemy Operational Ontology is cross-run agent-operation knowledge: lessons, route patterns, failure modes, capability updates, prompt contracts: `agentic-system-inventory-ontology-pipeline.md:143` and `agentic-system-ontology-entry-model.md:175`.
- B3 should not import CyberAlchemy Operational Ontology wholesale. It can cite it as method/route guidance, but B3 content must come from the subject's legal run traces.

Implications for `projects/ontology`:

- It should not start as pointer pages.
- It should start with a branch registry aligned to B1/B2/B3/B4.
- It should include thick branch/view artifacts with content, context, evidence, confidence, and promotion gates.
- It needs explicit source-ledger and inventory references.
- It needs a legal B3 producer rule before any `run-view` content is accepted.
- It needs a clear boundary between CyberAlchemy Operational Ontology as cross-run method knowledge and Ontologize B3 as subject-run evidence.
- It needs decision-gate records for OD-1 and OD-2 before treating branch-as-view as canonical.

Guardrail: every node must be able to answer "what does this mean, when does it apply, what evidence supports it, what can invalidate it, and what should an agent do with it?" If it only answers "go read this other file," it belongs in inventory or a source ledger, not ontology.
