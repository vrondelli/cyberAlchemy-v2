# Explorer research transcript

The parent mechanically serialized each explorer return as JSON without semantic editing.

## Agent 1 — van Lamsweerde, Axel

```json
{
  "task_status": "completed",
  "domain_gate_status": "blocked",
  "agent": "van Lamsweerde, Axel",
  "angle": "constraint-evidence",
  "artifacts": [
    {
      "facet": "numeric_bounds",
      "classification": "genuine-owner-gate",
      "current_status": "unresolved",
      "selectors": [
        "relationships.yml#/signatures/14",
        "DEFINITIONS.md#ds-d8",
        "BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md#bmc-rel-d01--numeric-evidence-policy",
        "BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json#/rows/14/numeric_bounds_evidence",
        "BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json#/rows/14/proposed_decision/numeric_bounds"
      ],
      "finding": "No source selects the four concept-degree bounds; one_to_many and the single example prove no minimum, maximum, or totality.",
      "option_shapes": [
        "explicit source/target min/max tuple with relation-specific evidence",
        "defer",
        "stop"
      ],
      "recommendation": null,
      "dependencies": [
        "D01 orthogonal profile",
        "positive source minimum activates D02 outgoing closure",
        "positive target minimum activates D02 incoming closure"
      ],
      "examples": {
        "low": "One PaymentTransaction emits PaymentCompleted proves endpoint admissibility only.",
        "medium": "One Entity adjacent to two Events distinguishes max one from max at least two or unbounded.",
        "complex": "A closed concept population with zero- and high-degree endpoints distinguishes all four tuple coordinates without counting runtime occurrences."
      }
    },
    {
      "facet": "closure",
      "classification": "source-determined-for-positive-minimum-proof",
      "current_status": "packet-unresolved",
      "selectors": [
        "BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md#bmc-rel-d02--closure-and-positive-minimum-enforcement",
        "BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json#/rows/14/proposed_decision/closure",
        "N12-OWNS-CYCLE-CLOSURE-PROOF-SHAPE/decisions/BMC-REL-NONNUMERIC-12-OWNER-SELECTION-RECEIPT.json#/selection_effect",
        "N26-BELONGS-TO-SAME-KIND-CYCLE-CLOSURE-PROOF-SHAPE/decisions/BMC-REL-NONNUMERIC-26-OWNER-SELECTION-RECEIPT.json#/selection_effect"
      ],
      "finding": "D02 already requires exact boundary identity/kind/placement, eligible Entity/Event population completeness, and directional emits adjacency completeness. Source minima use outgoing closure; target minima use incoming closure.",
      "recommendation": "build-from-D02; no redundant semantic gate",
      "missing_evidence": [
        "emits validation-envelope fixture",
        "closure serialization and loader contract",
        "proof beyond the exact evaluated predicate"
      ]
    },
    {
      "facet": "partial_view",
      "classification": "genuine-owner-gate-with-D02-constraints",
      "current_status": "unresolved",
      "selectors": [
        "BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md#bmc-rel-d02--closure-and-positive-minimum-enforcement",
        "BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json#/rows/14/proposed_decision/partial_view",
        "N11-OWNS-CYCLE-PARTIAL-VIEW-VERDICT/decisions/BMC-REL-NONNUMERIC-11-OWNER-SELECTION-RECEIPT.json#/selection_effect",
        "N25-BELONGS-TO-SAME-KIND-CYCLE-PARTIAL-VIEW-VERDICT/decisions/BMC-REL-NONNUMERIC-25-OWNER-SELECTION-RECEIPT.json#/selection_effect"
      ],
      "finding": "D02 fixes positive-minimum absence behavior and immediate observed violations, but does not select an aggregate emits conformance PASS on open views.",
      "option_shapes": [
        "predicate-scoped invalid/evaluate/not-evaluated",
        "closed-boundary conformance only",
        "defer",
        "stop"
      ],
      "recommendation": null,
      "examples": {
        "low": "One valid edge in an open view passes local typing but not whole-boundary minimum conformance.",
        "medium": "An observed over-maximum is invalid immediately; an apparent under-minimum remains unevaluated without directional closure.",
        "complex": "Complete outgoing and incomplete incoming evidence produce different per-predicate verdicts."
      }
    }
  ],
  "validation": {
    "result": "pass",
    "checks": [
      "declared inputs readable",
      "JSON inputs parsed",
      "emits packet row verified",
      "no files edited"
    ]
  },
  "blockers": [
    "numeric bounds lack owner selection",
    "broader partial-view behavior lacks owner selection"
  ],
  "residue": [
    "Do not infer numbers from one_to_many.",
    "Do not equate concept degree with runtime Event count.",
    "Closure is directional and predicate-scoped."
  ]
}
```

## Agent 2 — Beer, Stafford

```json
{
  "task_status": "completed",
  "domain_gate_status": "open",
  "agent": "Beer, Stafford",
  "angle": "projection-semantics",
  "artifacts": [
    {
      "facet": "representation",
      "classification": "genuine-owner-gate",
      "current_status": "unresolved",
      "selectors": [
        "relationships.yml#/signatures/14",
        "relationships.yml#/signatures/14/projection/markdown",
        "DEFINITIONS.md#domainspec-v2-d22",
        "DEFINITIONS.md#ds-d8",
        "BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md#bmc-rel-d01--numeric-evidence-policy",
        "BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json#/rows/14/proposed_decision/representation",
        "BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json#/$defs/representationDecision",
        "N34-EMITS-OCCURRENCE-SEMANTICS/decisions/BMC-REL-NONNUMERIC-34-OWNER-SELECTION-RECEIPT.json#/selection_effect",
        "N35-EMITS-ORDERING/decisions/BMC-REL-NONNUMERIC-35-OWNER-SELECTION-RECEIPT.json#/selection_effect"
      ],
      "finding": "Current authority fixes one authored Entity-to-Event fact and subordinate projections, but does not choose edge-only versus a separately governed generated projection.",
      "option_shapes": [
        "authored canonical edge only",
        "canonical edge plus provenance-bound non-authoritative generated projection",
        "defer",
        "stop"
      ],
      "inadmissible": [
        "generated projection as sole authority",
        "attribute-only replacement",
        "dual authored representation"
      ],
      "recommendation": null,
      "missing_evidence": [
        "closed representation token meanings",
        "projection target and consumer",
        "derivation/provenance/authorship rule",
        "discriminating validator or generator witness"
      ]
    },
    {
      "facet": "runtime_cardinality",
      "classification": "genuine-owner-gate",
      "current_status": "unresolved",
      "selectors": [
        "BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md#bmc-rel-d01--numeric-evidence-policy",
        "BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md#bmc-rel-d08--event-provenance-across-produces-and-emits",
        "BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json#/rows/14/proposed_decision/runtime_cardinality",
        "BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json#/$defs/runtimeCardinalityDecision",
        "N34-EMITS-OCCURRENCE-SEMANTICS/decisions/BMC-REL-NONNUMERIC-34-OWNER-SELECTION-RECEIPT.json#/scope_binding",
        "N35-EMITS-ORDERING/decisions/BMC-REL-NONNUMERIC-35-OWNER-SELECTION-RECEIPT.json#/selection_effect/does_not_select"
      ],
      "finding": "D01 makes runtime cardinality independent; D08 and N34 leave it open. No runtime substrate means the answer is not source-determined.",
      "option_shapes": [
        "separate-from-concept without selecting any runtime unit or bound",
        "not-applicable on the canonical Design profile only",
        "defer",
        "stop"
      ],
      "inadmissible": [
        "same-as-concept without identity/measurement contract",
        "numeric runtime bounds",
        "Event-Sourcing/retry/replay/delivery/payload semantics"
      ],
      "recommendation": null,
      "missing_evidence": [
        "runtime identity/lifecycle",
        "population/window",
        "retry/replay/delivery treatment",
        "runtime completeness",
        "downstream consumer and distinct consequence"
      ]
    },
    {
      "facet": "compatibility_token",
      "classification": "source-determined",
      "current_status": "packet-unresolved",
      "value": "retain",
      "selectors": [
        "relationships.yml#/signatures/14/multiplicity",
        "BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json#/rows/14/current_authority/multiplicity_token",
        "BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json#/rows/14/proposed_decision/compatibility_token",
        "BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json#/$defs/compatibilityTokenDecision",
        "validate-bmc-rel-001-decision-packet.mjs#validateRow"
      ],
      "finding": "Retain one_to_many only as exact current compatibility vocabulary. It carries no numeric, occurrence, ordering, representation, runtime, or cross-verb authority.",
      "recommendation": "retain-canonical",
      "unsupported": [
        "replace",
        "deprecate"
      ]
    }
  ],
  "validation": {
    "result": "pass",
    "checks": [
      "declared JSON parsed",
      "canonical and candidate bindings verified",
      "N34/N35 owner receipt bindings verified",
      "static validator inspection completed"
    ]
  },
  "blockers": [
    "representation needs owner choice",
    "runtime_cardinality needs owner choice"
  ],
  "residue": [
    "No packet projection authorized.",
    "No Event-Sourcing, storage, delivery, payload, runtime-count, or produces coupling inferred."
  ]
}
```

## Agent 3 — Peirce, Charles Sanders

```json
{
  "task_status": "completed",
  "domain_gate_status": "blocked",
  "agent": "Peirce, Charles Sanders",
  "angle": "structural-applicability",
  "artifacts": [
    {
      "facet": "multi_endpoint_semantics",
      "classification": "source-determined",
      "value": "not-applicable",
      "binding_status": "missing-validator-consequence",
      "selectors": [
        "relationships.yml#/signatures/14/source_type",
        "relationships.yml#/signatures/14/target_type",
        "BMC-REL-D03 lines 177-179",
        "BMC-REL-D03 lines 217-229"
      ],
      "finding": "emits admits one Entity source type and one Event target type; no pooled or per-type union bucket exists.",
      "gap": "The current validator does not force not-applicable when endpointCount equals two."
    },
    {
      "facet": "inverse_semantics",
      "classification": "source-determined",
      "value": "none",
      "binding_status": "partially-enforced",
      "selectors": [
        "relationships.yml#/signatures/14/inverse/kind",
        "relationships.yml#/generated_views",
        "candidate packet#/rows/14/current_authority/inverse",
        "DEFINITIONS.md#ds-d8"
      ],
      "finding": "No authored or generated reverse relation is admitted by current authority.",
      "gap": "The proposed facet remains unresolved and lacks an emits-specific negative validator rule."
    },
    {
      "facet": "self_relations",
      "classification": "source-determined",
      "value": "not-applicable-by-endpoint-types",
      "binding_status": "partially-enforced",
      "selectors": [
        "DEFINITIONS.md#domainspec-v2-D6",
        "relationships.yml#/signatures/14/source_type",
        "relationships.yml#/signatures/14/target_type",
        "DEFINITIONS.md#ds-d8"
      ],
      "finding": "One concept ID cannot be both an Entity source and Event target.",
      "gap": "The proposed facet lacks an emits-specific binding to not-applicable-by-endpoint-types."
    },
    {
      "facet": "duplicates",
      "classification": "owner-selected-design-only",
      "value": "reject",
      "selectors": [
        "N33 owner receipt#/selection/selected_option_id",
        "N33 owner receipt#/selection_effect",
        "N33 owner receipt#/scope_binding"
      ],
      "gap": "Packet projection and validator/generator consequence remain unauthorized and absent."
    },
    {
      "facet": "occurrence_semantics",
      "classification": "owner-selected-design-only",
      "value": "concept-level",
      "selectors": [
        "N34 owner receipt#/selection/selected_option_id",
        "N34 owner receipt#/scope_binding"
      ],
      "gap": "The packet facet remains unresolved; runtime occurrences remain excluded."
    },
    {
      "facet": "ordering",
      "classification": "owner-selected-design-only",
      "value": "not-applicable",
      "selectors": [
        "N35 owner receipt#/selection/selected_option_id",
        "N35 owner receipt#/scope_binding"
      ],
      "gap": "The packet facet remains unresolved; no authored order identity exists."
    }
  ],
  "validation": {
    "result": "pass",
    "checks": [
      "pinned packet validator passed",
      "31 row decisions and 356 facet decisions remain unresolved",
      "owner disposition pending",
      "authority effect none",
      "no files edited"
    ]
  },
  "blockers": [
    "source-determined structural values lack exact packet-facet validator bindings",
    "N33-N35 remain Design-only and unprojected",
    "no generator source proves the structural consequences"
  ],
  "residue": [
    "Reject endpoint-role invention, hyperedges, Event-Sourcing collapse, authored inverse, cross-type self confusion, copied relationship tokens, and one_to_many overreach.",
    "Do not reopen N33-N35 as owner gates; later projection requires separate authority."
  ]
}
```
