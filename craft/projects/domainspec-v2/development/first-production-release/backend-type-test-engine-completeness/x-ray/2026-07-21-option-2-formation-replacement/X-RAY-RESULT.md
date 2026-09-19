# Option 2 Formation Replacement X-Ray Result

## Run Contract

- Mode: `mixed`
- Target boundary: the Backend Type Test Engine Define package and accepted `DEC-BTE-FORMATION-AUTHORITY-001`, ending at the Invoke Design handoff
- Intent: explain what Option 2 changed, what remains frozen, and what proof gates still block implementation and completeness claims
- Reader contract: `working-reader`
- Output: [`index.html`](index.html)
- Machine lanes: [`lanes.json`](lanes.json)
- Renderer: `L0 static HTML/SVG`
- Library status: canonical x-ray seed library reused; no new canonical component was added

## Lane Handles

- Surface: `surface.summary`
- Properties: `properties.catalog`
- Components: `components.map`
- Internal dependencies: `dependencies.internal`
- External dependencies: `dependencies.external`
- Flow: `flow.graph`
- Lifecycle: `lifecycle.timeline`
- Risk questions: `risk.questions`
- Visual composition: `visual.model`

## Layer Interactions

- `stacked`: all four orthogonal layers share the two-version map
- `isolate`: any layer can be shown by itself with the checkboxes
- `compare`: current v1 and replacement rails remain visible as separate histories
- `trace`: the flow layer shows the ordered path from accepted decision through Design, proof, and admission

## Evidence and Inference

Source-backed claims come from `DEFINE.md`, `REQUIREMENTS.md`, the accepted decision record, and `work-pack/shared/GAPS.md`. The two-rail layout, grouping order, dependency spine, and visual risk placement are explanatory inference only.

## Reader On-Ramp

The page starts with three plain statements:

1. Option 2 selected a separate versioned YAML-owned replacement.
2. Current v1 and its four JSON formation schemas remain frozen.
3. Design must define the machine replacement and proof protocol before implementation, admission, or retirement can count.

## Reader Outcomes

After reading the x-ray, the working reader should be able to explain:

- why accepted direction is not machine authority;
- why `GAP-029` remains open for proof even though its decision is resolved;
- why `GAP-030` depends on the replacement design;
- why exact migration and exact-set evidence are stronger than passing totals;
- why IOLM and Body War are later independent consumers rather than core proof substitutes.

## Canonical Library Selection

Components:

- `shape.node`
- `shape.boundary`
- `shape.layer-panel`
- `shape.risk-marker`
- `connector.arrow`
- `connector.branch`
- `connector.feedback-loop`
- `chart.timeline-strip`
- `chart.risk-matrix`

Patterns:

- `pattern.process-branch`
- `pattern.dependency-boundary`
- `pattern.lifecycle-stack`
- `pattern.evidence-inference-split`

The Design route may need a future domain-specific migration-parity matrix for old-JSON-constraint to new-YAML-rule mapping. That shape is not currently part of the starter library, so the x-ray only records the extension need; it does not add an ungoverned canonical component.

## Validation

- X-ray example validator: `PASS`
- Lane schema: canonical `arcanum/arcana/x-ray/schemas/xray-lane-model.schema.yml`
- Required four layer toggles: present
- Evidence/inference and reader-contract markers: present
- Remote script, image, stylesheet, and hyperlink references: absent
- Linked source artifacts: present
- Render-level browser inspection: unavailable because no Chromium executable is installed in this environment

## Workflow Gap

The generated `.agents/skills/x-ray/` runtime contains the validator but not its default `schemas/xray-lane-model.schema.yml` path. This run validated successfully by passing the canonical schema explicitly. The missing generated schema copy is an x-ray packaging gap, not a blocker for this artifact.

## Signal Observer Result

- Observed sigil: `x-ray`
- Result: `recorded`
- Ledger: `.arcanum/observability/signals/sigil-invocations.jsonl`, line 268
- Signals: quality pass plus one low-severity template workflow gap
- Quality Bar: `pass`
- Anti-Pattern hits: none
- Reflection trigger: `output-threshold`
- Recommendation: `reflect-now`
- Validation: the invocation envelope parsed as JSON and the central ledger row was read back successfully
