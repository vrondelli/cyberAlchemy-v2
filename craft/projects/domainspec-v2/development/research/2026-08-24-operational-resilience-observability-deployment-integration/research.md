# Operational resilience, observability, and deployment integration — research corpus

This parent-assembled corpus preserves the four explorer returns verbatim. Section headings identify the route role; the JSON bodies are unchanged research receipts and carry no authority effect.

## Agent 1 — legacy-v1-explorer

```json
{
  "task_status": "completed",
  "domain_gate_status": "not_evaluated",
  "lane_id": "spawn-0001",
  "source_bindings": [
    {
      "path": "projects/domainspec-v2/development/research/2026-08-24-operational-resilience-observability-deployment-integration/dispatch-sheet.json",
      "sha256": "419b70508cfd98a84568725fb15d1e5f7f581a4a6151945e4316c739ec271386",
      "selector": "groups[group_id=explorers].agents[agent_name=\"Shannon, Claude\"]"
    },
    {
      "path": "projects/domainspec-v2/development/research/2026-08-24-operational-resilience-observability-deployment-integration/strategy-inventory-packet.json",
      "sha256": "7a25208b41cfd163e999816dac3127ec58aea22294fe4071c74a19b0a3bbcdfc",
      "selector": "legacy_source_leads, unresolved_gaps, design_consequences, non_authority_notice"
    },
    {
      "path": "projects/domainspec-v2/research/2026-06-29-v1-import-triage/findings.md",
      "sha256": "4ea7a9416176a8664e81ba362535b9f09511d16d45c5ac4a2c6d8139c70c4657",
      "selector": "lines 29-67, especially rows 1-9 and 29-31; lines 69-75"
    },
    {
      "path": "implementation/domainspec/tools/test-derivation-engine/CRAFT.md",
      "sha256": "9279cb26aad11d329d881bc0d9dc27abd1f53c47529ef65b22b094d9383d931d",
      "selector": "#current-state, #blockers-enablers-gate, #gaps"
    },
    {
      "path": "implementation/domainspec/OBSERVABILITY.md",
      "sha256": "49c389bb3b3cd329a513907b0dd4d6f76fdd55e6bfe1e358ea3f75df7bc8b35f",
      "selector": "#otel-instrumentation-standard, #the-three-metric-layers, #observability-derivation-summary, #metric-naming-convention, #alert-severity-mapping"
    },
    {
      "path": "implementation/domainspec/copilot/skills/domainspec-pipeline/SKILL.md",
      "sha256": "2e450141c36913ce604b3d35fa395a948b2654ecd0be0c495e487dd014461ddd",
      "selector": "lines 183-205 and 220-331"
    },
    {
      "path": "implementation/domainspec/tools/run-async-observer.ts",
      "sha256": "11b7a907f6350388c63008b5d7bfb6c9e9f03e189de0bcb7fb7bf30fc2f0a939",
      "selector": "lines 31-145"
    },
    {
      "path": "implementation/domainspec/tools/build-telemetry-bundle.ts",
      "sha256": "b317717ad848723c85e2b0ff7552d8177cafae603ee96fdc57db75b8a0356d01",
      "selector": "lines 11-48 and 50-94"
    },
    {
      "path": "implementation/domainspec/.codex/hooks.json",
      "sha256": "951ae1b2303bb16f97d05071f42df8957452f863be741dc1431c4e2c624a6e51",
      "selector": "hooks.UserPromptSubmit, hooks.PostToolUse, hooks.Stop"
    },
    {
      "path": "implementation/domainspec/.codex/hooks/arcanum-post-tool-use.sh",
      "sha256": "9f80e8ed169297ac57cecf5bba7ceb98c930d55e4f3aeee6f74d40f64014b153",
      "selector": "lines 9-53"
    },
    {
      "path": "implementation/domainspec/.codex/hooks/arcanum-stop.sh",
      "sha256": "ee7c3274923d6c4716ad39d7af78ff1fbd3084b41a30d1c298ba092cf970ddf4",
      "selector": "lines 27-64 and 83-142"
    },
    {
      "path": "implementation/domainspec/copilot/skills/domainspec-infra-architecture/SKILL.md",
      "sha256": "aa2a31926ee00acc9494ba7c5c724f0563432413f8476e2e9006b4db8150af4f",
      "selector": "#presets, #process, #prometheus-generation, #graduation-triggers, #constraints"
    },
    {
      "path": "implementation/domainspec/copilot/skills/domainspec-infra-deploy/SKILL.md",
      "sha256": "13c9bf1f82a0537143924bd3f5b1848cfa73da323a54ad5bcb3ca6200d3a1d45",
      "selector": "#process, #prometheus-naming, #constraints"
    },
    {
      "path": "implementation/domainspec/templates/slos.md",
      "sha256": "541bacccfa5b02eee39bc5d84ab7be68153e65496c762063d85d91095d52a1fd",
      "selector": "#global-slos, #per-feature-slos, #error-budget, #alert-routing"
    },
    {
      "path": "implementation/domainspec/infra/prometheus.yml",
      "sha256": "44d9c9cbefb941fdae4b687c9c60f2c42788c75bc2bc10032efab343c45ff67d",
      "selector": "complete file"
    },
    {
      "path": "implementation/domainspec/infra/alerts/knowledge-graph-visualization.rules.yml",
      "sha256": "c3a369f88b3f109f800a479ce11909e05c6f51794a6faf72b0c7369db050b51d",
      "selector": "complete file"
    }
  ],
  "status_matrix": [
    {
      "capability": "error handling and failure taxonomy",
      "owner": "DomainSpec specification templates; concrete application adapters below the adapter line",
      "mechanism": "Error mapping with code and retryability, workflow compensation tables, negative/error-state and endpoint-status test obligations; app-local typed error unions",
      "inputs_outputs": "operations, states, workflows and interfaces -> error outcomes, rejection tests and implementation-local error objects",
      "present_executable_status": "observed: reusable documentation/test contract exists; app-local error constructors exist; no repository-wide normalized failure taxonomy, propagation contract or recovery evaluator was found",
      "validation_evidence": "TEST-PIPELINE.md lines 48-64, 88-104, 141-173 and 228-234; templates/use-case.md lines 65-100; templates/workflows.md lines 9-39",
      "privacy_boundary": "Application exception classes and private domain prose remain under implementation/domainspec and cannot be copied to public Arcanum",
      "import_verdict": "reformulate"
    },
    {
      "capability": "deterministic specification-to-test controls",
      "owner": "implementation/domainspec/tools/test-derivation-engine",
      "mechanism": "parse -> derive -> stable obligation identity -> emit -> round-trip/negative-control gates",
      "inputs_outputs": "canonical feature documents -> byte-stable obligation and test artifacts",
      "present_executable_status": "executed: current typecheck passed and Vitest 2.1.9 reported 8 files and 97 tests passed",
      "validation_evidence": "pnpm run typecheck passed; pnpm exec vitest run --reporter=verbose passed 97/97, including second-feature and corpus-round-trip checks",
      "privacy_boundary": "Private engine/mechanism; only bounded behavior or results may cross a publication boundary",
      "import_verdict": "build-from-owned"
    },
    {
      "capability": "product monitoring and OpenTelemetry derivation",
      "owner": "DomainSpec observability contract plus a consumer-local implementation or technology profile",
      "mechanism": "O1-O16 metrics derived from feature documents, using OTel-style instruments and source annotations",
      "inputs_outputs": "feature semantics -> metric declarations, instrument obligations and alert references",
      "present_executable_status": "designed: two feature observability documents exist, but backend/src/infrastructure/telemetry is absent and no direct OpenTelemetry API import or dependency was found",
      "validation_evidence": "OBSERVABILITY.md and templates/observability.md inspected; repository search found no implementation imports",
      "privacy_boundary": "Metric attributes are claimed bounded, but no validator enforces cardinality, sensitive-value exclusion or evidence expiry",
      "import_verdict": "reformulate"
    },
    {
      "capability": "OTel instrumentation and verification loop",
      "owner": "consumer-local application/profile owner",
      "mechanism": "instrument skill writes counters/histograms; verifier performs static coverage and optional Prometheus queries",
      "inputs_outputs": "observability.md plus source -> modified source and OBSERVABILITY-REPORT.md",
      "present_executable_status": "blocked: skills are procedural designs; no OBSERVABILITY-REPORT.md exists, required telemetry source directory is absent, and live verification covers metrics rather than logs/traces",
      "validation_evidence": "domainspec-instrument-otel and domainspec-otel-verify exact bytes inspected",
      "privacy_boundary": "Instrumentation mutation is app-runtime work below the DomainSpec adapter line",
      "import_verdict": "reformulate"
    },
    {
      "capability": "Prometheus monitoring and alerts",
      "owner": "consumer infrastructure profile",
      "mechanism": "one scrape target and one feature alert-rule file",
      "inputs_outputs": "declared SLO/observability names -> Prometheus configuration and alerts",
      "present_executable_status": "blocked: configs exist, but docker-compose.dev.yml contains only PostgreSQL; no Prometheus service, backend /metrics implementation, project slos.md or observability verification report was found",
      "validation_evidence": "infra/prometheus.yml and alert rules observed; referenced metric names were not found in backend source",
      "privacy_boundary": "Operational data must remain consumer-local unless separately redacted and export-authorized",
      "import_verdict": "reformulate"
    },
    {
      "capability": "legacy async observer",
      "owner": "DomainSpec workflow-governance telemetry",
      "mechanism": "classifies fail/pass strings and changed-file shapes, then appends signals",
      "inputs_outputs": "telemetry bundle -> docs/signals/pipeline-signals.jsonl",
      "present_executable_status": "blocked in current probe: root workspace lacks a callable tsx; fallback tsx hit WSL IPC ENOTSUP. Source is executable-looking but not proven end-to-end here",
      "validation_evidence": "run-async-observer.ts exact bytes inspected; read-only missing-bundle probe attempted",
      "privacy_boundary": "Observer writes governance signals; it is not read-only in the zero-write sense and must never write authority or promotion state",
      "import_verdict": "build-from-owned"
    },
    {
      "capability": "Arcanum hook telemetry",
      "owner": "Arcanum workflow observability, not DomainSpec product observability",
      "mechanism": "UserPromptSubmit opens, PostToolUse records, Stop closes and appends an invocation envelope",
      "inputs_outputs": "raw prompt, tool input/response and final-message excerpt -> private .arcanum observability ledgers",
      "present_executable_status": "observed: hooks are installed and every shell script passed bash -n; no live invocation receipt was read or claimed",
      "validation_evidence": ".codex/hooks.json plus framework and installed hook scripts",
      "privacy_boundary": "Current hooks persist raw prompts and full tool inputs/responses without visible redaction; private storage does not remove the need for filtering and retention controls",
      "import_verdict": "build-from-owned"
    },
    {
      "capability": "SLI, SLO, error-budget and alert policy",
      "owner": "service/release-operability profile",
      "mechanism": "template targets, rolling windows, PromQL expressions, severity and response-time tables",
      "inputs_outputs": "feature observability declarations -> targets, budgets and alert rules",
      "present_executable_status": "designed: template only; no project docs/slos.md, measured baseline, burn-rate policy, evidence expiry or accepted thresholds found",
      "validation_evidence": "templates/slos.md complete file",
      "privacy_boundary": "Service evidence is not semantic or release authority",
      "import_verdict": "reformulate"
    },
    {
      "capability": "load, stress, soak and capacity testing",
      "owner": "consumer technology profile and release evidence owner",
      "mechanism": "none beyond throughput placeholders and latency SLO fields",
      "inputs_outputs": "not implemented",
      "present_executable_status": "absent: no dedicated file, command, dependency or configuration for k6, Artillery, Locust, JMeter, Vegeta, load, stress, soak or capacity tests was found in the scoped architecture, skill, template, tool or infra surfaces",
      "validation_evidence": "targeted filename and content searches returned no matches",
      "privacy_boundary": "Load fixtures must not contain production secrets or private datasets",
      "import_verdict": "net-new"
    },
    {
      "capability": "infrastructure definitions",
      "owner": "consumer infrastructure/profile owner",
      "mechanism": "Dev, single-VPS, split-VPS and HA templates proposing Docker Compose, Pulumi, Caddy, Prometheus and Grafana",
      "inputs_outputs": "preset and feature observability -> proposed IaC, topology and CI/CD scaffold",
      "present_executable_status": "designed/partial: actual infra contains PostgreSQL compose, Prometheus config and one alert file; no project INFRA-ARCHITECTURE.md, Pulumi project, production compose, Caddyfile or owned CI/CD workflow exists",
      "validation_evidence": "scoped file inventory and exact infra files",
      "privacy_boundary": "Provider tokens, secrets, topology and private product identifiers stay profile-local",
      "import_verdict": "reformulate"
    },
    {
      "capability": "deployment gates and delivery",
      "owner": "release/deployment authority, never the research or monitoring owner",
      "mechanism": "template proposes PR preview, push-to-main build, Pulumi apply and HTTP-200 health check",
      "inputs_outputs": "Git change -> proposed image, IaC apply and health probe",
      "present_executable_status": "proposed: no repository-owned deployment workflow exists; migration compatibility, artifact provenance, immutable receipt and rollback outcome are not specified",
      "validation_evidence": "infra template lines 143-180 and infra skill lines 188-203",
      "privacy_boundary": "No deployment or external transport was invoked",
      "import_verdict": "reformulate"
    },
    {
      "capability": "canary, blue-green and rollback controls",
      "owner": "deployment policy plus release authority owner",
      "mechanism": "HA preset contains only a canary-workflow promise; application workflow template separately mentions compensation/rollback",
      "inputs_outputs": "not concretely specified",
      "present_executable_status": "absent: no canary analysis, cohort/traffic split, automated rollback trigger, rollback receipt or blue-green implementation was found",
      "validation_evidence": "targeted canary/blue-green/rollback search found only HA-preset bullets and application compensation prose",
      "privacy_boundary": "Deployment rollback must not be conflated with domain saga compensation",
      "import_verdict": "net-new"
    },
    {
      "capability": "pilot readiness",
      "owner": "planning/decision and verification owners",
      "mechanism": "research, plan, human decisions, spec/test updates and must-pass verification",
      "inputs_outputs": "feature documents -> readiness verdict and evidence plan",
      "present_executable_status": "designed: it prepares a pilot but does not run traffic, canary analysis, deployment or rollback",
      "validation_evidence": "domainspec-pilot-readiness lines 24-85",
      "privacy_boundary": "A readiness report cannot authorize release or production",
      "import_verdict": "reformulate"
    },
    {
      "capability": "full legacy domainspec-pipeline",
      "owner": "legacy application-builder orchestration",
      "mechanism": "single command sequences spec, implementation, telemetry and infrastructure mutation",
      "inputs_outputs": "feature name -> wide product and governance mutation surface",
      "present_executable_status": "observed as procedural skill; not executed in this lane",
      "validation_evidence": "pipeline exact bytes and prior triage row 9",
      "privacy_boundary": "Crosses the v2 adapter line and collapses separately owned stages",
      "import_verdict": "drop"
    }
  ],
  "owner_map": {
    "domain_failure_meaning": "DomainSpec semantic/specification owner",
    "application_exception_and_recovery": "consumer application adapter owner",
    "test_derivation": "private deterministic test-derivation-engine owner",
    "product_runtime_signals": "consumer implementation/technology profile owner",
    "workflow_invocation_telemetry": "Arcanum observability owner",
    "sli_slo_and_load_evidence": "service operability and evaluation-receipt owner",
    "infrastructure_and_deployment": "consumer infrastructure profile plus deployment owner",
    "canary_and_rollback_decision": "release authority owner using evidence; monitoring cannot decide authority",
    "promotion_or_release": "human/accepted authority gate only"
  },
  "blockers": [
    "No normalized cross-system failure-outcome schema or executable recovery evaluator exists.",
    "Product observability is metrics-oriented scaffolding; runtime OTel instrumentation, logs, traces and correlation evidence are absent.",
    "Prometheus and alert files are not connected to a running monitored service in the scoped repository.",
    "Load, stress, soak and capacity evidence is absent.",
    "Canary, compatibility, migration and rollback controls are absent beyond template prose.",
    "Infrastructure and deployment tool versions are unpinned or absent; provider-specific defaults are not portable architecture.",
    "Telemetry capture stores raw prompts, tool inputs/responses, command-log lines and diff snippets without an enforced redaction/retention contract.",
    "Hook closeout can label quality pass from a non-empty final message plus zero detected tool failures; it does not prove output-contract or task-semantic completion.",
    "The async observer uses substring heuristics and Array.every on possibly empty non-test changes, permitting false classifications.",
    "The 2026-06-29 triage and current engine CRAFT/README status prose are stale: they mention 33 tests and a failing second feature or skeleton stubs, while current execution passed 97 tests including second-feature and corpus checks."
  ],
  "residue": [
    "The earlier IMPORT classification for the test executor and obligation-key seam should now be interpreted as build-from-owned current capability, not permission to transplant private bytes.",
    "The engine's current tests materially exceed the old triage evidence, but passing repository tests still do not prove complete corpus coverage or v2 admission.",
    "Observer, product telemetry, SLO evidence, deployment evidence and authority decisions must remain distinct receipt types.",
    "Prometheus alert rules are evidence-shaped artifacts, not proof that their metrics exist or that alerts have fired correctly.",
    "Application saga compensation and infrastructure rollback are different mechanisms and require separate owners and witnesses.",
    "No direct import, implementation, profile admission, ontology promotion, infrastructure mutation, deployment or release action was performed."
  ],
  "authority_ceiling_check": {
    "summary": "Read and classify legacy evidence only; no import, implementation, authority or deployment effect.",
    "allowed_actions_performed": [
      "read_declared_inputs",
      "inspect selector-resolved files under allowed scopes",
      "run bash syntax validation",
      "run test-engine typecheck and Vitest read-only validation",
      "attempt a non-writing observer startup probe"
    ],
    "forbidden_actions_performed": [],
    "repository_writes": false,
    "external_effects": false,
    "claim_ceiling": "Current private repository evidence and read-only validation only; domain gate, v2 admission, tool selection, promotion, deployment, release and production readiness remain undecided."
  }
}
```

## Agent 2 — current-v2-explorer

```json
{
  "task_status": "completed",
  "domain_gate_status": "blocked",
  "lane_id": "spawn-0002/current-v2-explorer",
  "source_bindings": [
    {
      "path": "projects/domainspec-v2/.craft/ledger.yml",
      "sha256": "d9dacf28911b81539e4de8e6a0fff87fe8224ebcddba5b8b26673b3610b994ab",
      "selectors": [
        "contexts[context_id=CTX-DSV2-APE]",
        "contexts[context_id=CTX-DSV2-FIRST-PRODUCTION-RELEASE]",
        "contexts[context_id=CTX-DSV2-SFC]",
        "contexts[context_id=CTX-DSV2-SICL]",
        "contexts[context_id=CTX-DSV2-SPEC-ONTOLOGY]",
        "contexts[context_id=CTX-DSV2-EVF]",
        "contexts[context_id=CTX-DSV2-AGENT-SPEC-CONFORMANCE]"
      ],
      "status": "discovery-only"
    },
    {
      "path": "projects/domainspec-v2/definitions/minted-project/supported-profiles.yml",
      "sha256": "2a339fb1eaf7a9913be42a2c6b07a68c33254cd56c770b0c32b1d189a83cfc85",
      "selectors": [
        "/authority",
        "/profiles/0",
        "/profiles/1"
      ],
      "status": "observed"
    },
    {
      "path": "projects/domainspec-v2/development/first-production-release/ROADMAP.md",
      "sha256": "3a5b35c1f9ead0d08778f36920b49985e8d9e82e737b07888193e11e8033f53b",
      "selectors": [
        "#release-claim",
        "#authority-and-evidence-separation",
        "#ordered-route",
        "#persistent-frontiers",
        "#binding-exclusions",
        "#release-rule"
      ],
      "status": "observed"
    },
    {
      "path": "projects/domainspec-v2/development/first-production-release/decisions/2026-07-12-product-release-contract.md",
      "sha256": "a5852275365563fc2378e3b6a86d9f4da03cc9efbaef249ffa41f329c3bf5b43",
      "selectors": [
        "#decision",
        "#product-and-operating-boundary",
        "#release-authority-and-separation",
        "#evidence-and-release-rule"
      ],
      "status": "observed"
    },
    {
      "path": "projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md",
      "sha256": "bf15e7fc0c35eec9bfebedbf0a3965277a8515fec448d8bbe0a2746b909ca90c",
      "selectors": [
        "#control-fields",
        "#objective-and-completion-boundary",
        "#task-board",
        "#global-acceptance",
        "#open-blockers"
      ],
      "status": "partially-executed-candidate-local"
    },
    {
      "path": "projects/domainspec-v2/development/first-production-release/stable-foundation-cli/WORK-PACK.md",
      "sha256": "2a14330d789ee0066bc90c7bec4d06d0ce75de92712bb792cea853ce1eec8791",
      "selectors": [
        "#objective",
        "#delivery-slices",
        "#task-status-board",
        "#blockers-and-prerequisites",
        "#current-state-and-next-route"
      ],
      "status": "designed-unexecuted-stale-denominator"
    },
    {
      "path": "projects/domainspec-v2/development/research/2026-08-13-system-integration-contracts/receipts/evidence-closure.json",
      "sha256": "399d0e63bbc06bc0fe6e00c6b7b496415db88a7a03332c6aec331fa8df5e745f",
      "selectors": [
        "/status",
        "/research_claim_closure",
        "/executable_fixture_closure",
        "/blockers",
        "/claim_ceiling"
      ],
      "status": "blocked"
    },
    {
      "path": "projects/domainspec-v2/development/system-integration-contract-layer/SIC-FAC-000-REPAIR-B/RESULT.json",
      "sha256": "6af7aaed61061efc8bd69919b2b3e75fb54990cf5014726d7afcd9aa42094d6b",
      "selectors": [
        "/result",
        "/execution_status",
        "/authority_effect",
        "/returned_route",
        "/claim_ceiling"
      ],
      "status": "candidate-revalidated"
    },
    {
      "path": "projects/domainspec-v2/development/research/2026-07-30-implementation-structure-enforcement/findings.md",
      "sha256": "ba6f3a537cf4abd408aedf46eb308f8d8e0574fc56adb6331a41a45ab7550027",
      "selectors": [
        "#answer-and-current-state-classification",
        "#enforcement-model",
        "#candidate-vocabulary-and-authority-map",
        "#typeScript-python-and-rust-toolchain-matrix",
        "#blind-spots-and-typed-residue",
        "#claim-ceiling"
      ],
      "status": "evidence-closed-research-implementation-open"
    },
    {
      "path": "projects/domainspec-v2/development/spec-ontology-branch-decision/decision-gate/DECISION.md",
      "sha256": "c776bc0008ec66aa3c7f23d940f62da2bc059006df20cbbbc510bf2e5beff68c",
      "selectors": [
        "#recorded-selection",
        "#formal-claims-ownership-invariant",
        "#selected-architecture-contract",
        "#remaining-protected-admissions",
        "#current-gate-state"
      ],
      "status": "architecture-selected-protected-admission-blocked"
    },
    {
      "path": "projects/domainspec-v2/development/spec-ontology-branch-decision/invoke-design/20260823T222046Z-spec-ontology-contract-hardening-r4/owner-admission/VICTOR-VERIFIER-REQUEST.json",
      "sha256": "7c9ee5ae59f5eec0814018131369fa8f4e3b68701eb63479095c1fe8072c9cd6",
      "selectors": [
        "/status",
        "/authority_effect",
        "/requested_direct_responses",
        "/claim_ceiling"
      ],
      "status": "prepared-not-sent-no-response"
    },
    {
      "path": "projects/domainspec-v2/development/evolvable-validation-framework/WORK-PACK.md",
      "sha256": "1af7784bef6aa8f056659fc2dcfe5e93d2881993f7cf33e7e1e5dd9f412be9b3",
      "selectors": [
        "#objective-summary",
        "#gate-and-scope",
        "#observed-evidence-overlay",
        "#blockers-and-gaps",
        "#external-consumer-handoff"
      ],
      "status": "bounded-candidate-evidence-with-governed-gaps"
    },
    {
      "path": "projects/domainspec-v2/development/agent-spec-conformance/DESIGN.md",
      "sha256": "4210cd6a79a76ad189efbaa311a5ab91082e7f9c41c604b768ff9f64517aa79b",
      "selectors": [
        "#1-the-boundary-av-d2-recommended-resolution",
        "#2-the-one-thing-that-must-not-be-baked-in-a-plural-certify-substrate",
        "#6-design-plan-handoff"
      ],
      "status": "designed-unimplemented"
    },
    {
      "path": "projects/domainspec-v2/authority/AUTHORITY-MODEL.md",
      "sha256": "a6080927d265c2064792acca788548dbdea2497e767d822730b7d616e663f073",
      "selectors": [
        "#core-rule",
        "#authority-kinds",
        "#non-collapse-rules"
      ],
      "status": "authority"
    },
    {
      "path": "cyberAlchemy-v2/authority/AUTHORITY-MODEL.md",
      "sha256": "8e9d39eb39399cef051b71eb1d37daaad87c2409329151a077e01c5a772b3407",
      "selectors": [
        "#authority-kinds",
        "#narrowest-owner-rule",
        "#non-collapse-rules"
      ],
      "status": "authority"
    },
    {
      "path": "arcanum/framework/observability/ARCHITECTURE-OVERVIEW.md",
      "sha256": "1ab38224db8fafa9aad3a0f41c6ce77b6108449ab214e681fca6000ab8d8a461",
      "selectors": [
        "#current-architecture-in-one-sentence",
        "#runtime-data-model",
        "#execution-paths",
        "#scattered-or-conflicting-surfaces",
        "#tension-ledger"
      ],
      "status": "observed-workflow-telemetry-boundary"
    }
  ],
  "context_state": [
    {
      "context": "CTX-DSV2-APE",
      "state": "partial",
      "finding": "Operation and Workflow evaluators have passing candidate-local verification; Enum TypeScript is complete, Python/Rust remain unselected. This owns structural/profile enforcement and instrumentation-placement checks, not product telemetry or release."
    },
    {
      "context": "CTX-DSV2-FIRST-PRODUCTION-RELEASE",
      "state": "blocked",
      "finding": "FPR owns the release-path gates for operability, bounded performance, clean reproducibility, pilot, rollback/revocation/support, independent verification, and external authorization. FPR-03 through FPR-15 remain partial, absent, blocked, or unauthorized."
    },
    {
      "context": "CTX-DSV2-SFC",
      "state": "designed-unexecuted",
      "finding": "The CLI plan names dependency/canary/network/permission campaigns, resource measurement, N-1 compatibility, migration, rollback/withdrawal/quarantine, and independent pilot evidence. No SWU is selected and no CLI byte or operational result is established."
    },
    {
      "context": "CTX-DSV2-SICL",
      "state": "blocked-after-candidate-revalidation",
      "finding": "The generic factory candidate passes its declared 14-file validation surface, but Revision 2 refresh is unexecuted and unauthorized. The broader integration-contract research has no admitted FailureOutcomeBinding, runtime evaluator registry, EvaluationReceipt, provider resources, or executed fault fixtures."
    },
    {
      "context": "CTX-DSV2-SPEC-ONTOLOGY",
      "state": "blocked",
      "finding": "One connected semantic graph with separately owned business, formal-claims/specification, proof-bridge, and system branches is selected. Owner-local catalogs are canonical; integrated graphs and operational views are generated with authority_effect none. Protected verification remains absent."
    },
    {
      "context": "CTX-DSV2-EVF",
      "state": "partial-blocked",
      "finding": "EVF owns the bounded graph-to-obligation-to-evaluator-to-receipt evidence chain. Existing L0/L1 and bounded L2 evidence does not supply a generic operational evaluator registry, operational EvaluationReceipt, or release effect."
    },
    {
      "context": "CTX-DSV2-AGENT-SPEC-CONFORMANCE",
      "state": "designed-unimplemented",
      "finding": "A runtime-monitor certification backend and real-time safe-state are proposed only at L2/robot witness. No plan, implementation, runtime evidence, deployment guarantee, or generality claim exists."
    },
    {
      "context": "Arcanum observability",
      "state": "observed-with-gaps",
      "finding": "Arcanum owns append-only capability-invocation telemetry. Direct native skill observation is incomplete. This is workflow evidence, not DomainSpec product monitoring, an SLI/SLO source, deployment control, or promotion authority."
    }
  ],
  "owner_map": [
    {
      "concern": "domain error and recovery meaning",
      "current_owner": "Existing DomainSpec Operation, Query, Policy, Workflow, Event, Interface, Mapping, and State Machine owners",
      "insertion_point": "Reuse Policy and Workflow for domain strategy and compensation; route any normalized integration failure outcome through SICL after NC-01 and NC-02 are repaired and owners admit the exact contract.",
      "non_collapse": "Implementation exceptions, retry mechanics, telemetry events, and owner decisions are not domain error meaning."
    },
    {
      "concern": "integration bindings and runtime failure outcomes",
      "current_owner": "CTX-DSV2-SICL plus versioned technology/implementation profile owners",
      "insertion_point": "SICL may own admitted binding/guarantee record shapes; concrete databases, brokers, clients, infrastructure resources, credentials, topology, retry engines, and adapters remain profile-local.",
      "non_collapse": "A provider or infrastructure product is not a DomainSpec meta-type by default."
    },
    {
      "concern": "product monitoring signals and observability receipts",
      "current_owner": "missing for product signals; EVF is the nearest evidence-chain owner",
      "insertion_point": "Define profile-bound runtime-signal and correlation inputs under the product/runtime owner, bind them through SICL where integration-specific, and normalize immutable evidence through EVF.",
      "non_collapse": "Arcanum invocation telemetry must remain separate from product logs, metrics, traces, health, readiness, and operational receipts."
    },
    {
      "concern": "architecture and instrumentation enforcement",
      "current_owner": "CTX-DSV2-APE",
      "insertion_point": "Add only portable structural obligations to APE; place language/tool-specific instrumentation checks in admitted implementation profiles.",
      "non_collapse": "APE findings do not admit profiles, establish runtime behavior, or authorize release."
    },
    {
      "concern": "SLI/SLO, load, stress, soak, capacity, and evidence expiry",
      "current_owner": "no admitted schema or evaluator owner",
      "insertion_point": "EVF should own normalized evidence contracts; product/runtime owners define measurable indicators and thresholds; FPR owns applicability and release-gate consumption.",
      "non_collapse": "A metric, benchmark, or green threshold is evidence, not semantic or release authority."
    },
    {
      "concern": "deployment, canary, rollback, infrastructure, compatibility, and release",
      "current_owner": "FPR for gates and claim boundaries; SFC for the private CLI candidate plan; implementation/technology and external operator owners for mechanics",
      "insertion_point": "Keep infrastructure definitions, canary implementation, environment bindings, and deployment tools in versioned profiles; feed their receipts into FPR/SFC without giving tools release authority.",
      "non_collapse": "Deployment success, rollback execution, or a receipt does not equal external release authorization."
    },
    {
      "concern": "ontology branches and operational views",
      "current_owner": "CTX-DSV2-SPEC-ONTOLOGY plus each branch owner",
      "insertion_point": "Represent operational concepts in the separately owned system branch or profile bindings; generate cross-branch operational views with authority_effect none.",
      "non_collapse": "No duplicated semantic truth, inverse canonical edge, or promotion authority may arise from a generated view."
    },
    {
      "concern": "tool selection",
      "current_owner": "implementation or technology profile owner",
      "insertion_point": "Pin exact versions, runtime, configuration, source roots, alternatives, unsupported behavior, evidence obligations, and invalidation conditions before admission.",
      "non_collapse": "Tool popularity, documentation, or research precedent cannot define canonical DomainSpec meaning."
    }
  ],
  "gaps": [
    "No admitted product-observability signal schema, correlation contract, collector boundary, privacy/cardinality contract, health/readiness contract, or operational receipt schema.",
    "No admitted SLI/SLO/error-budget/alerting model or evaluator, and no evidence-expiry policy for operational guarantees.",
    "No executed DomainSpec-v2 load, stress, soak, capacity, canary, rollback, infrastructure-plan, drift, or deployment witness.",
    "No generic runtime evaluator registry or admitted operational EvaluationReceipt owner.",
    "SICL remains blocked on NC-01, NC-02, missing logical records, missing binding/guarantee schemas, provider resources, fault seams, and executed hostile fixtures.",
    "The current registry contains complete-backend-criteria@2 at 13 kinds and 17 relationships, status candidate, release_admission not-granted; SFC still binds stale 13/16 assumptions.",
    "Agent runtime-monitor remains design-only and cannot be treated as current product monitoring.",
    "Spec-ontology protected admissions lack Victor identity, role/policy acceptance, and V1/V2 verification receipts.",
    "Arcanum native-skill telemetry coverage and storage/default drift remain unresolved, independently of product observability.",
    "Load, canary, infrastructure, deployment, and observability tools have no selected versioned profile or current executed evidence."
  ],
  "blockers": [
    {
      "id": "BLK-DSV2-P2-DENOMINATOR-DRIFT",
      "effect": "Blocks exact 17/17 owner re-ratification and SFC/FPR two-lane integration."
    },
    {
      "id": "GAP-DSV2-SFC-UNEXECUTED",
      "effect": "All 20 CLI SWUs remain unexecuted; no operational behavior is proved."
    },
    {
      "id": "GAP-DSV2-SFC-004-FUSED",
      "effect": "The current unit shape stops the executable chain before the profile-positive case."
    },
    {
      "id": "BLK-DSV2-SICL-REV2-REFRESH",
      "effect": "The validated generic-factory candidate does not select or implement a system-integration target."
    },
    {
      "id": "BLK-DSV2-SPEC-ONTOLOGY-VERIFIER-ADMISSION",
      "effect": "Prevents protected branch contracts, validators, migration, promotion, or publication."
    },
    {
      "id": "BLK-DSV2-EVF-P0-EXECUTION-ADMISSION",
      "effect": "Original owner/readiness/apply/retry gates remain closed despite bounded candidate evidence."
    },
    {
      "id": "FR-FPR-ONTOLOGY-DIRECTION/FR-FPR-SOLVER-PROFILE/FR-FPR-BW-ORIGIN-ROUTE/FR-FPR-I-ROOT-DISPOSITIONS/FR-FPR-APE-SELF-CONTAINMENT",
      "effect": "The first-production release path remains blocked and production unauthorized."
    }
  ],
  "residue": [
    "Route the smallest next architecture through existing owners: semantic error/recovery meaning to DomainSpec/SICL; structural instrumentation obligations to APE; product signals and evaluator receipts to product-runtime owners plus EVF; infrastructure and delivery mechanics to versioned technology profiles; release consumption to FPR/SFC.",
    "Require one later finite witness to bind an injected failure, normalized failure outcome, correlated product signal set, SLI/SLO decision, bounded load result, canary comparison, infrastructure plan, rollback trigger/outcome, privacy/cardinality checks, immutable receipt, and expiry condition. This lane did not execute or authorize that witness.",
    "Refresh SFC and FPR bindings to the exact 13-kind/17-relationship candidate only after owner re-ratification and profile admission; do not stretch the stale 13/16 package.",
    "Preserve one connected ontology with separately owned branches and non-authoritative generated operational views.",
    "Keep current classifications explicit: observed, candidate-local executed, designed, absent, blocked, stale, proposed, and unauthorized."
  ],
  "authority_ceiling_check": {
    "result": "pass",
    "briefing_digest": "cd475b5a0c5392478ab3e325f365a9deea2b17ba0b26c7c2dc1b9efbc8493a95",
    "reads_within_declared_scope": true,
    "repository_writes": false,
    "craft_mutation": false,
    "definition_change": false,
    "profile_admission": false,
    "ontology_promotion": false,
    "deployment": false,
    "release": false,
    "git_transport": false,
    "claim_ceiling": "Current v2 ownership and gaps mapped only. Research completion does not clear the blocked domain gate or authorize definitions, profiles, ontology, implementation, deployment, release, or production claims."
  }
}
```

## Agent 3 — reliability-explorer

```json
{
  "task_status": "completed",
  "domain_gate_status": "not_evaluated",
  "lane_id": "spawn-0003",
  "identity": "Ashby, W. Ross",
  "briefing_digest": "b1b402f84b4aa0b41853ccb7458cc752b0190a6201198f6834e0a7b951373deb",
  "as_of": "2026-08-24",
  "binding_status": "external-precedent",
  "primary_sources": [
    {
      "id": "SRC-ERR-HTTP",
      "version": "RFC 9457",
      "url": "https://www.rfc-editor.org/rfc/rfc9457.html",
      "sections": ["3.1 Members of a Problem Details Object", "5 Security Considerations"],
      "binding": "HTTP failure representation and safe disclosure; does not define domain error meaning."
    },
    {
      "id": "SRC-ERR-GRPC",
      "version": "current official guide",
      "url": "https://grpc.io/docs/guides/status-codes/",
      "sections": ["Overview", "The full list of status codes"],
      "binding": "Transport-level RPC outcome classification; application-defined codes remain application-owned."
    },
    {
      "id": "SRC-TRACE-W3C",
      "version": "W3C Recommendation 2021-11-23",
      "url": "https://www.w3.org/TR/trace-context/",
      "sections": ["2.3 Design Overview", "3 Trace Context HTTP Headers Format", "6 Privacy Considerations"],
      "binding": "Portable trace propagation plus trust-boundary and PII constraints."
    },
    {
      "id": "SRC-OTEL-SPEC",
      "version": "OpenTelemetry Specification 1.60.0",
      "url": "https://opentelemetry.io/docs/specs/otel/error-handling/",
      "sections": ["Basic error handling principles", "Self-diagnostics"],
      "binding": "Telemetry failures must not create later runtime failures; telemetry loss must be self-diagnosable."
    },
    {
      "id": "SRC-OTEL-ERROR",
      "version": "OpenTelemetry Semantic Conventions 1.44.0",
      "url": "https://opentelemetry.io/docs/specs/semconv/general/recording-errors/",
      "sections": ["What constitutes an error", "Recording errors on spans", "Recording errors on metrics", "Recording exceptions"],
      "binding": "Context-sensitive error recording and single-recording expectations; page is development status."
    },
    {
      "id": "SRC-OTEL-ERROR-TYPE",
      "version": "OpenTelemetry Semantic Conventions 1.44.0",
      "url": "https://opentelemetry.io/docs/specs/semconv/registry/attributes/error/",
      "sections": ["Error Attributes"],
      "binding": "Predictable, low-cardinality error.type; human messages are not metric dimensions."
    },
    {
      "id": "SRC-OTEL-LOGS",
      "version": "OpenTelemetry Specification 1.60.0",
      "url": "https://opentelemetry.io/docs/specs/otel/logs/data-model/",
      "sections": ["Log and Event Record Definition", "Trace Context Fields"],
      "binding": "Log timestamp, resource, severity, TraceId and SpanId evidence fields."
    },
    {
      "id": "SRC-OTEL-CARDINALITY",
      "version": "OpenTelemetry Specification 1.60.0",
      "url": "https://opentelemetry.io/docs/specs/otel/metrics/sdk/",
      "sections": ["Cardinality Limits", "Overflow attribute", "Exemplar"],
      "binding": "Configurable metric cardinality limit, overflow accounting, and trace-metric exemplars."
    },
    {
      "id": "SRC-OTEL-PRIVACY",
      "version": "current official guidance",
      "url": "https://opentelemetry.io/docs/security/handling-sensitive-data/",
      "sections": ["Your responsibility", "Data minimization", "Protecting sensitive data"],
      "binding": "Data inventory, minimization and allowlist/redaction processing remain implementer-owned."
    },
    {
      "id": "SRC-OTEL-COLLECTOR",
      "version": "Collector 0.158.0",
      "url": "https://opentelemetry.io/docs/collector/",
      "sections": ["Introduction", "Status", "Distributions and releases"],
      "binding": "Vendor-neutral receive/process/export boundary; individual component maturity remains mixed."
    },
    {
      "id": "SRC-OTEL-RESILIENCY",
      "version": "Collector 0.158.0 documentation",
      "url": "https://opentelemetry.io/docs/collector/resiliency/",
      "sections": ["Sending queue (in-memory buffering)", "Persistent storage"],
      "binding": "Bounded retry/queue behavior and explicit telemetry-loss conditions."
    },
    {
      "id": "SRC-K8S-PROBES",
      "version": "Kubernetes v1.36 documentation",
      "url": "https://kubernetes.io/docs/concepts/workloads/pods/probes/",
      "sections": ["Types of probe", "Liveness probe", "Readiness probe", "Startup probe"],
      "binding": "Startup, restart and traffic-admission checks are distinct controls."
    },
    {
      "id": "SRC-SLO",
      "version": "Google SRE Workbook",
      "url": "https://sre.google/workbook/implementing-slos/",
      "sections": ["Reliability Targets and Error Budgets", "Establishing an Error Budget Policy", "Documenting the SLO and Error Budget Policy"],
      "binding": "User-centered good/total SLIs, owner-approved objectives, budget policy and explicit review dates."
    },
    {
      "id": "SRC-ALERT",
      "version": "Google SRE Workbook",
      "url": "https://sre.google/workbook/alerting-on-slos/",
      "sections": ["Alerting Considerations", "Multiwindow, Multi-Burn-Rate Alerts", "Low-Traffic Services and Error Budget Alerting"],
      "binding": "Actionable burn-rate alerts with hostile low-traffic treatment."
    },
    {
      "id": "SRC-PROM-CARDINALITY",
      "version": "current official documentation",
      "url": "https://prometheus.io/docs/practices/instrumentation/",
      "sections": ["How to instrument", "Do not overuse labels"],
      "binding": "Signal selection and explicit label-cardinality risk."
    },
    {
      "id": "SRC-LOG-SECURITY",
      "version": "current OWASP Cheat Sheet",
      "url": "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html",
      "sections": ["Data to exclude", "Verification", "Protection", "Disposal of logs"],
      "binding": "Secret/PII exclusion, hostile logging verification, tamper protection and bounded retention."
    },
    {
      "id": "SRC-LOAD-K6",
      "version": "k6 2.2.0 current container release observed",
      "url": "https://grafana.com/docs/k6/latest/testing-guides/api-load-testing/",
      "sections": ["Determine the reason for the test", "Model the workload"],
      "binding": "Smoke, average, stress, spike, breakpoint and soak profiles."
    },
    {
      "id": "SRC-LOAD-K6-THRESHOLD",
      "version": "k6 latest documentation",
      "url": "https://grafana.com/docs/k6/latest/using-k6/thresholds/",
      "sections": ["Threshold examples"],
      "binding": "Machine-evaluable latency and failure-rate thresholds."
    },
    {
      "id": "SRC-CHAOS",
      "version": "Chaos Mesh 2.8.3",
      "url": "https://github.com/chaos-mesh/chaos-mesh/releases/tag/v2.8.3",
      "sections": ["v2.8.3 Release Notes"],
      "binding": "Version candidate for Kubernetes-scoped fault injection; installation is not authorized."
    }
  ],
  "control_matrix": [
    {
      "control": "error-contract-and-propagation",
      "applicability_trigger": "Any HTTP, RPC, messaging or generated integration boundary.",
      "source_binding": ["SRC-ERR-HTTP", "SRC-ERR-GRPC"],
      "tool_profile_boundary": "DomainSpec owns declared failure meaning; protocol profile maps it to RFC 9457 or gRPC status without redefining it.",
      "positive_witness": "A declared timeout maps to one stable domain failure identifier and one protocol outcome; a client can discriminate retryable from terminal failure.",
      "hostile_witness": "An exception message or HTTP 500 is treated as the domain taxonomy, or internal details cross the boundary.",
      "evidence_artifact": "Versioned error-mapping table plus success/error fixtures and redacted response capture.",
      "failure_rollback_behavior": "Reject the binding or retain the prior admitted mapping; never infer retry/compensation from telemetry.",
      "unverified": "No current admitted v2 error schema or evaluator was established by this lane."
    },
    {
      "control": "runtime-error-observation",
      "applicability_trigger": "An operation ends exceptionally or returns an error outcome.",
      "source_binding": ["SRC-OTEL-ERROR", "SRC-OTEL-ERROR-TYPE"],
      "tool_profile_boundary": "Instrumentation profile records outcome; it cannot decide domain meaning, recovery, acceptance or release.",
      "positive_witness": "Failed operation has Error span status and predictable low-cardinality error.type; corresponding metric uses the same type; propagated exception is recorded once.",
      "hostile_witness": "Handled/retried error is counted as terminal, exception is duplicated, or message/user identifier becomes a metric label.",
      "evidence_artifact": "Correlated span/metric/log fixture and cardinality report.",
      "failure_rollback_behavior": "Fail validation and disable/revert the faulty instrumentation profile without changing business behavior.",
      "unverified": "Recording-errors guidance is development status and must be pinned with the exact semantic-convention version."
    },
    {
      "control": "correlation-and-trace-context",
      "applicability_trigger": "A request crosses a process, service or integration boundary.",
      "source_binding": ["SRC-TRACE-W3C", "SRC-OTEL-LOGS"],
      "tool_profile_boundary": "Transport profile injects/extracts context; trust policy may restart context at a boundary.",
      "positive_witness": "One request preserves valid traceparent across allowed boundaries and emits matching TraceId/SpanId in logs.",
      "hostile_witness": "Malformed traceparent, forged tracestate, broken context, or PII appears in propagation headers.",
      "evidence_artifact": "Header fixture, trace graph and correlated log record with no sensitive payload.",
      "failure_rollback_behavior": "Reject malformed context, start a new trace where policy requires, and preserve the product request path.",
      "unverified": "Non-HTTP carrier mappings and the v2 trust-boundary owner remain unresolved."
    },
    {
      "control": "signal-and-collector-boundary",
      "applicability_trigger": "A bounded system claims observable runtime behavior.",
      "source_binding": ["SRC-OTEL-SPEC", "SRC-OTEL-COLLECTOR", "SRC-OTEL-RESILIENCY"],
      "tool_profile_boundary": "Logs, metrics and traces are distinct evidence signals; Collector is a profile-local transport/processing boundary, not semantic or authority truth.",
      "positive_witness": "A fault produces correlated signals while Collector queue, retry and drop metrics expose exporter failure.",
      "hostile_witness": "Backend outage silently loses data, instrumentation crashes the application, or missing telemetry is interpreted as success.",
      "evidence_artifact": "Pinned Collector config, component-stability inventory, self-telemetry, queue/drop counters and backend receipt.",
      "failure_rollback_behavior": "Bound retries and queues; surface loss explicitly; telemetry degradation must not mutate product or promotion state.",
      "unverified": "Topology, buffer capacity, loss tolerance and backend retention need environment-specific admission."
    },
    {
      "control": "health-startup-readiness-liveness",
      "applicability_trigger": "A runtime supports automated start, restart or traffic admission.",
      "source_binding": ["SRC-K8S-PROBES"],
      "tool_profile_boundary": "Deployment/runtime profile owns probe mechanism; DomainSpec may declare health intent but not Kubernetes mechanics.",
      "positive_witness": "Startup gates slow initialization, readiness removes traffic during transient dependency failure, and liveness restarts only an unrecoverable deadlock.",
      "hostile_witness": "Liveness checks a dependency and creates a restart cascade under load, or readiness success masks functional failure.",
      "evidence_artifact": "Probe manifest, transition timeline and expected routing/restart events.",
      "failure_rollback_behavior": "Revert probe configuration or stop rollout; do not treat probe success as release approval.",
      "unverified": "Kubernetes applicability and service-specific probe semantics are not admitted."
    },
    {
      "control": "sli-slo-error-budget-alerting",
      "applicability_trigger": "A service makes a reliability or production-operability claim.",
      "source_binding": ["SRC-SLO", "SRC-ALERT"],
      "tool_profile_boundary": "Product/domain owners approve SLI meaning and SLO; monitoring profile computes it; alerting cannot approve release.",
      "positive_witness": "Good/total events and window are explicit; owner-approved budget policy names actions; multiwindow burn-rate tests page and reset as expected.",
      "hostile_witness": "Server availability substitutes for user outcome, missing samples create 100% success, or low traffic triggers a false-green/false-page.",
      "evidence_artifact": "Versioned SLO document, numerator/denominator query, replay fixture, alert rule test and notification receipt.",
      "failure_rollback_behavior": "Block the reliability claim; route threshold changes to SLO owners; monitoring failure must alarm separately.",
      "unverified": "No v2 SLI denominator, objective, budget or approver is admitted."
    },
    {
      "control": "failure-injection",
      "applicability_trigger": "A recovery, timeout, retry, fallback or resilience guarantee is proposed.",
      "source_binding": ["SRC-CHAOS"],
      "tool_profile_boundary": "Fault tool is environment/profile-local; declared fault and expected residue remain system-owner artifacts.",
      "positive_witness": "One bounded pod/network/resource fault yields the expected error, telemetry, containment and recovery within a declared blast radius.",
      "hostile_witness": "Selector escapes scope, cleanup fails, control plane is damaged, or the same result occurs with injection disabled.",
      "evidence_artifact": "Immutable experiment manifest, target inventory, pre/post state, abort/cleanup receipt and negative-control result.",
      "failure_rollback_behavior": "Predeclared abort and cleanup are mandatory; quarantine evidence if restoration is not proven.",
      "unverified": "No cluster, privilege model or safe fault target was inspected; execution remains forbidden."
    },
    {
      "control": "load-stress-soak-capacity",
      "applicability_trigger": "Latency, throughput, saturation, bounded performance or capacity is claimed.",
      "source_binding": ["SRC-LOAD-K6", "SRC-LOAD-K6-THRESHOLD"],
      "tool_profile_boundary": "Workload model and thresholds are owned evidence; generator choice is a versioned profile.",
      "positive_witness": "Smoke validates script, average load establishes baseline, stress finds peak behavior, soak checks time-dependent degradation, and thresholds fail the run.",
      "hostile_witness": "Generator saturates first, coordinated workload differs from declared arrivals, warm-up contaminates baseline, checks pass while thresholds are disabled, or sample size is insufficient.",
      "evidence_artifact": "Pinned script/tool/runtime, environment fingerprint, generator utilization, raw summary, threshold verdict and baseline comparison.",
      "failure_rollback_behavior": "Abort on safety limits, discard invalid runs, restore test state, and make no capacity claim.",
      "unverified": "Representative workload, allowed load, duration, data reset and environment parity are absent."
    },
    {
      "control": "cardinality-privacy-retention",
      "applicability_trigger": "Telemetry includes attributes, user/context data, dynamic labels or retained logs.",
      "source_binding": ["SRC-OTEL-CARDINALITY", "SRC-OTEL-PRIVACY", "SRC-PROM-CARDINALITY", "SRC-LOG-SECURITY"],
      "tool_profile_boundary": "Data owner defines allowlist, purpose, retention and access; SDK/Collector/backend enforce profile-local limits.",
      "positive_witness": "PII/secret mutants are removed, bounded labels remain queryable, overflow is visible, access is audited and expiry deletes only after required retention.",
      "hostile_witness": "User ID/error message creates unbounded series, redaction misses nested data, hash is treated as anonymous, or logs persist indefinitely.",
      "evidence_artifact": "Attribute allowlist, privacy fixture, series-count/overflow report, access policy and retention/deletion receipt.",
      "failure_rollback_behavior": "Stop export or drop disallowed fields at the earliest boundary; do not silently truncate evidence needed for a claim.",
      "unverified": "Applicable legal retention, consent, classification and acceptable cardinality budgets require owners."
    },
    {
      "control": "evidence-expiry",
      "applicability_trigger": "Operational evidence is reused for a later claim, release candidate or changed environment.",
      "source_binding": ["SRC-SLO", "SRC-LOG-SECURITY"],
      "tool_profile_boundary": "Evidence schema records freshness; the relevant claim owner defines validity and renewal triggers.",
      "positive_witness": "Receipt binds subject digest, tool/version, environment, observation window, generated time, valid-until/review date and supersession reason.",
      "hostile_witness": "A passing result survives changed code/config/workload/tool semantics, expired SLO review or missing telemetry.",
      "evidence_artifact": "Freshness tuple and invalidation decision attached to each EvaluationReceipt candidate.",
      "failure_rollback_behavior": "Mark stale and rerun; never stretch old evidence over changed bytes.",
      "unverified": "Primary sources support SLO review dates and retention limits, but no universal expiry period exists for runtime/load evidence."
    }
  ],
  "tool_options": [
    {
      "family": "telemetry transport and processing",
      "options": [
        {
          "tool": "OpenTelemetry Collector",
          "version": "0.158.0",
          "fit": "Vendor-neutral OTLP receive/process/export boundary with retry, queue and redaction controls.",
          "rejection_criteria": "Required component is development/unsupported, loss is unobservable, or resource/privacy limits cannot be enforced."
        }
      ],
      "decision": "candidate only; component-by-component stability and artifact digest must be pinned."
    },
    {
      "family": "metrics, traces and logs backends",
      "options": [
        {
          "tool": "Prometheus",
          "version": "3.13.1 LTS",
          "official_url": "https://prometheus.io/download/",
          "fit": "Metrics, recording rules and alert evaluation.",
          "boundary": "Not a log/trace store or SLO authority."
        },
        {
          "tool": "Jaeger",
          "version": "2.20.0",
          "official_url": "https://www.jaegertracing.io/download/",
          "fit": "Trace query/backend built on Collector framework.",
          "boundary": "Jaeger v1 is EOL; storage and retention remain profile-specific."
        },
        {
          "tool": "Loki",
          "version": "3.7.6",
          "official_url": "https://grafana.com/docs/loki/latest/release-notes/v3-7/",
          "fit": "Label-indexed log backend.",
          "boundary": "Promtail is removed; ingestion and label design need separate admission."
        }
      ],
      "decision": "Composable profile alternatives; no stack or vendor selected."
    },
    {
      "family": "load generation",
      "options": [
        {
          "tool": "k6",
          "version": "2.2.0 container tag observed",
          "official_url": "https://github.com/grafana/k6/pkgs/container/k6/versions",
          "fit": "JS/TS scenarios, arrival/VU models, thresholds and structured summaries.",
          "rejection_criteria": "Required protocol unsupported, generator saturation unmeasured, or cloud/external execution would be required."
        },
        {
          "tool": "Locust",
          "version": "2.46.4 documentation observed",
          "official_url": "https://docs.locust.io/en/stable/api.html",
          "fit": "Python-defined user behavior and distributed runners.",
          "rejection_criteria": "Custom failure criteria cannot be made deterministic or Python/event-loop overhead dominates."
        },
        {
          "tool": "Apache JMeter",
          "version": "5.6.3",
          "official_url": "https://jmeter.apache.org/download_jmeter.cgi",
          "fit": "Java, broad protocol/plugin ecosystem, CLI CSV/XML and HTML reports.",
          "rejection_criteria": "Plugin/runtime closure cannot be pinned or GUI-mode execution contaminates evidence."
        }
      ],
      "decision": "Select only from workload/protocol/runtime constraints after a generator calibration witness."
    },
    {
      "family": "fault injection",
      "options": [
        {
          "tool": "Chaos Mesh",
          "version": "2.8.3",
          "official_url": "https://github.com/chaos-mesh/chaos-mesh/releases/tag/v2.8.3",
          "fit": "Kubernetes pod, network, I/O and resource faults with explicit selectors.",
          "rejection_criteria": "Non-Kubernetes target, excessive privilege/blast radius, or cleanup cannot be independently proved."
        },
        {
          "tool": "application/integration fault fixtures",
          "version": "system-owned",
          "fit": "Smallest deterministic option for non-Kubernetes protocol errors and hostile integration outcomes.",
          "rejection_criteria": "Fixture bypasses the real binding or cannot prove propagation and recovery."
        }
      ],
      "decision": "Prefer the smallest fault surface that discriminates the guarantee; no installation authorized."
    }
  ],
  "witnesses": [
    {
      "id": "W-REL-001",
      "kind": "proposed-positive",
      "scenario": "A bounded declared service receives a pinned average-load profile; one dependency call is forced to timeout. The adapter emits the declared normalized failure, W3C context remains valid, one error is recorded across span/metric/log, the SLI denominator counts the request as bad, the alert rule evaluates as expected, readiness changes only if the declared dependency policy requires it, and the system recovers after injection removal.",
      "required_evidence": [
        "subject and environment digests",
        "error mapping",
        "fault manifest and cleanup",
        "correlated log/metric/trace",
        "SLI numerator/denominator and burn computation",
        "load-generator and system saturation",
        "privacy/cardinality report",
        "freshness tuple"
      ],
      "authority_effect": "none"
    },
    {
      "id": "W-REL-NEG-001",
      "kind": "hostile-mutants",
      "mutants": [
        "disable the fault while retaining expected-failure fixture",
        "drop traceparent at one integration hop",
        "emit user ID and exception message as labels",
        "disable k6 thresholds",
        "saturate the generator before the target",
        "make the telemetry backend unavailable until its queue overflows",
        "return ready while the declared critical path fails",
        "replay the receipt after subject or environment digest changes"
      ],
      "expected_result": "Each mutant must fail a named control or mark evidence stale; none may yield a release or production claim."
    }
  ],
  "gaps": [
    "No admitted DomainSpec v2 runtime error taxonomy, protocol mapping schema or operational EvaluationReceipt owner was verified.",
    "No service, deployment environment, trust boundary, workload, SLI denominator, SLO, error budget, alert recipient or retention owner is declared.",
    "OpenTelemetry recording-errors and several semantic-convention areas are not wholly stable; exact emitted conventions require a pinned schema URL and instrumentation compatibility proof.",
    "Collector component maturity, buffer sizing, outage tolerance and acceptable telemetry loss are environment-specific.",
    "No universal primary-source expiry duration exists for load, fault or runtime evidence; claim owners must define invalidation triggers.",
    "Tool release pages are moving surfaces. Final profiles must bind binary/container digest, dependency closure and documentation/spec versions, not a floating latest tag.",
    "No tools were installed or executed, so all witnesses remain proposed."
  ],
  "residue": [
    "Route domain error meaning, protocol mapping, recovery policy, runtime signal, SLI/SLO, load evidence and authority decision to separate owners.",
    "Require a versioned observability profile binding OTel spec 1.60.0, semantic conventions 1.44.0, Collector components and backend formats.",
    "Require explicit missing-data, telemetry-loss, overflow and low-traffic behavior so absence cannot become success.",
    "Admit a tool only after calibration, privacy/cardinality, hostile-mutant and cleanup witnesses pass.",
    "Represent evidence freshness as subject_digest, environment_digest, tool_digest, generated_at, review_or_valid_until and invalidation_triggers.",
    "Keep product observability distinct from Arcanum workflow telemetry and keep every observer read-only/proposal-only."
  ],
  "authority_ceiling_check": {
    "status": "pass",
    "performed": [
      "read_declared_inputs",
      "browsed_official_primary_sources",
      "compared_versioned_tool_options",
      "returned_research_receipt"
    ],
    "not_performed": [
      "repository_write",
      "tool_installation",
      "external_mutation",
      "vendor_commitment",
      "deployment",
      "release",
      "production_claim",
      "git_transport"
    ],
    "repository_mutation": false,
    "vendor_selected": false,
    "claim_ceiling": "External precedent and proposed evidence contracts only. This receipt does not admit vocabulary, select a tool, authorize implementation, validate a live system, approve deployment or establish production readiness."
  }
}
```

## Agent 4 — deployment-explorer

```json
{
  "task_status": "completed",
  "domain_gate_status": "not_evaluated",
  "lane_id": "spawn-0004",
  "output_ref": "receipts/explorer-deployment.json",
  "mutation_result": "No repository or external mutation performed; receipt returned inline because the lane is read-only.",
  "binding": {
    "briefing_digest": "87f1ee50e5b2728b2db8dca8ff963226784b5f58c79335b7fb3c83ee5fe23a8c",
    "dispatch_sheet_sha256": "419b70508cfd98a84568725fb15d1e5f7f581a4a6151945e4316c739ec271386",
    "strategy_inventory_packet_sha256": "7a25208b41cfd163e999816dac3127ec58aea22294fe4071c74a19b0a3bbcdfc",
    "researched_at": "2026-08-24",
    "claim_status": "external-precedent and proposed architecture only"
  },
  "primary_sources": [
    {
      "id": "PS-IAC",
      "version": "Terraform 1.15.9 stable; OpenTofu 1.12.1 stable",
      "sources": [
        "[Terraform releases](https://github.com/hashicorp/terraform/releases)",
        "[terraform plan: Introduction, saved-plan workflow, planning options](https://developer.hashicorp.com/terraform/cli/commands/plan)",
        "[Terraform JSON output: Plan Representation, resource_drift, checks](https://developer.hashicorp.com/terraform/internals/json-format)",
        "[OpenTofu 1.12.1 release](https://github.com/opentofu/opentofu/releases)",
        "[OpenTofu plan command](https://opentofu.org/docs/cli/commands/plan/)",
        "[OpenTofu state and plan encryption: guidance, compatibility, rollover](https://opentofu.org/docs/language/state/encryption/)"
      ],
      "binding": "A plan is a proposal, not an effect or authorization. Applying a saved plan executes its recorded operations. Plan/state can contain secrets; encryption and exact engine/provider locks are profile obligations.",
      "limit": "A speculative or stale plan cannot prove eventual effect; policy-relevant unknown values require a stop."
    },
    {
      "id": "PS-POLICY",
      "version": "OPA 1.16.2",
      "sources": [
        "[OPA release and project record](https://github.com/open-policy-agent/OPA)",
        "[OPA Terraform plan policy: goals and plan limitations](https://www.openpolicyagent.org/docs/terraform)"
      ],
      "binding": "Policy may evaluate machine-readable plans before apply.",
      "limit": "Unknown values, dynamic blocks, and unevaluated function results can make a plan insufficient; policy is not deployment authority."
    },
    {
      "id": "PS-K8S",
      "version": "Kubernetes 1.36 series; official release page reported 1.36.2",
      "sources": [
        "[Kubernetes 1.36 release series](https://kubernetes.io/releases/1.36/)",
        "[Server-Side Apply: field ownership and conflicts](https://kubernetes.io/docs/reference/using-api/server-side-apply/)",
        "[Liveness, readiness, and startup probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/)",
        "[Secrets good practices](https://kubernetes.io/docs/concepts/security/secrets-good-practices/)"
      ],
      "binding": "Field ownership, readiness removal from traffic, restart behavior, and secret protection are distinct controls.",
      "limit": "Kubernetes is one technology profile, not a portable DomainSpec semantic requirement."
    },
    {
      "id": "PS-PROGRESSIVE",
      "version": "Argo Rollouts 1.8.4; Flagger 1.44.0",
      "sources": [
        "[Argo Rollouts 1.8.4 release](https://github.com/argoproj/argo-rollouts/releases)",
        "[Argo Rollouts analysis and progressive delivery](https://argo-rollouts.readthedocs.io/en/latest/features/analysis/)",
        "[Argo Rollouts rollback windows](https://argo-rollouts.readthedocs.io/en/latest/features/rollback/)",
        "[Flagger 1.44.0 changelog](https://github.com/fluxcd/flagger/blob/main/CHANGELOG.md)"
      ],
      "binding": "Canary or blue-green progression may be driven by explicit analysis outcomes; failed analysis can abort and return traffic to stable.",
      "limit": "Traffic weighting depends on ingress, service mesh, Gateway API, or replica ratios; metric-provider semantics and fast rollback behavior are profile-local."
    },
    {
      "id": "PS-GITOPS",
      "version": "Flux 2.9.3; Argo CD 3.5.1",
      "sources": [
        "[Flux 2.9.3 release](https://github.com/fluxcd/flux2/releases)",
        "[Flux Kustomization: source artifact, dry-run drift detection, health, suspend, field ownership](https://fluxcd.io/flux/components/kustomize/kustomizations/)",
        "[Argo CD 3.5.1 release](https://github.com/argoproj/argo-cd/releases)",
        "[Argo CD automated sync policy](https://argo-cd.readthedocs.io/en/stable/user-guide/auto_sync/)"
      ],
      "binding": "Version-controlled desired state can be reconciled and audited without granting CI direct cluster access.",
      "limit": "Reconciliation is an external effect. Flux can correct drift; Argo CD documents that rollback cannot run while automated sync is enabled. Observer-only detection must remain separate from remediation."
    },
    {
      "id": "PS-SUPPLY",
      "version": "SLSA 1.2; Cosign 3.0.6",
      "sources": [
        "[SLSA 1.2 specification](https://slsa.dev/spec/v1.2/)",
        "[SLSA provenance](https://slsa.dev/spec/v1.2/provenance)",
        "[Cosign 3.0.6 release](https://github.com/sigstore/cosign/releases)",
        "[Cosign signature and attestation verification](https://docs.sigstore.dev/cosign/verifying/verify/)"
      ],
      "binding": "Artifact digest, signature identity, provenance, and verification outcome can be immutable deployment inputs.",
      "limit": "Provenance describes origin; neither provenance nor signature verification authorizes promotion or release."
    },
    {
      "id": "PS-SECRETS",
      "version": "Vault documentation current on 2026-08-24",
      "sources": [
        "[Vault lease, renew, and revoke](https://developer.hashicorp.com/vault/docs/concepts/lease)",
        "[Vault documentation](https://developer.hashicorp.com/vault/docs)"
      ],
      "binding": "Dynamic credentials have explicit leases, TTLs, renewal, and revocation.",
      "limit": "Backend choice, identity federation, rotation overlap, and emergency revocation are environment-specific; secret values must not enter receipts."
    },
    {
      "id": "PS-INTEGRATION",
      "version": "OpenAPI 3.2.0; AsyncAPI 3.0.0; CloudEvents 1.0.2; OTLP 1.11.0",
      "sources": [
        "[OpenAPI 3.2.0 specification](https://spec.openapis.org/oas/v3.2.0.html)",
        "[AsyncAPI 3.0.0 specification](https://www.asyncapi.com/docs/reference/specification/v3.0.0)",
        "[CloudEvents 1.0.2 specification](https://github.com/cloudevents/spec/blob/main/cloudevents/spec.md)",
        "[OTLP 1.11.0 specification](https://opentelemetry.io/docs/specs/otlp/)"
      ],
      "binding": "API, message, event-envelope, and telemetry transport contracts can be versioned independently.",
      "limit": "These specifications do not define business compatibility, delivery guarantees, authorization, privacy, or release authority."
    },
    {
      "id": "PS-DATABASE",
      "version": "Flyway 13.3.0; Liquibase 5.0.3; PostgreSQL 18",
      "sources": [
        "[Flyway validate and checksum behavior](https://documentation.red-gate.com/flyway/reference/commands/validate)",
        "[Liquibase 5.0.3 release](https://github.com/liquibase/liquibase)",
        "[PostgreSQL 18 ALTER TABLE lock behavior](https://www.postgresql.org/docs/current/sql-altertable.html)"
      ],
      "binding": "Migration identity/checksum and target-engine lock behavior are evidence inputs.",
      "limit": "Migration-tool history is not proof of backward compatibility. DDL transactionality, lock level, restore, and rollback differ by database and operation."
    }
  ],
  "delivery_matrix": [
    {
      "mechanism": "Declarative infrastructure candidate",
      "trigger": "A governed system or environment requires infrastructure change.",
      "owner_profile": "Infrastructure owner plus versioned provider-specific technology profile.",
      "primary_source": ["PS-IAC"],
      "required_witness": "Canonical configuration digest, engine/provider locks, environment identity, read-only plan, machine-readable changes, destructive-change classification, and plan digest.",
      "failure_containment": "No apply when validation fails, policy inputs are unknown, provider lock differs, target environment is ambiguous, or plan contains an undeclared destructive action.",
      "rollback": "Predeclare provider/resource-specific recovery; never claim generic IaC undo.",
      "evidence": "InfrastructurePlanReceipt with inputs, tool versions, proposed changes, unknowns, drift, policy results, expiry, and no authority effect.",
      "stop_condition": "Credentials, apply authority, import/adoption, destroy, state mutation, or provider-specific decision is required."
    },
    {
      "mechanism": "Plan/apply and policy separation",
      "trigger": "An accepted plan is proposed for execution.",
      "owner_profile": "Plan producer, independent policy evaluator, environment approver, and apply executor remain separate roles.",
      "primary_source": ["PS-IAC", "PS-POLICY"],
      "required_witness": "Apply references the exact saved-plan digest; policy result binds evaluator/version/bundle/input; final approver binds environment and expiry.",
      "failure_containment": "Reject regenerated plans, `refresh=false` without an explicit exception, material unknowns, stale plans, mutable targets, or mismatched provider locks.",
      "rollback": "Apply is not started; after partial apply, freeze and produce a fresh observed-state corrective plan.",
      "evidence": "Approval binding plus immutable apply receipt; prompts or auto-approve flags are not authority.",
      "stop_condition": "Required policy fact is unavailable at plan time or acceptance has expired."
    },
    {
      "mechanism": "Drift detection",
      "trigger": "Periodic observation, pre-apply refresh, or declared configuration change.",
      "owner_profile": "Read-only observer reports; infrastructure/environment owner decides reconciliation.",
      "primary_source": ["PS-IAC", "PS-GITOPS"],
      "required_witness": "Desired digest, observed snapshot, normalized drift set, ignored-field ownership, timestamp, and freshness limit.",
      "failure_containment": "Observer cannot remediate, mutate promotion status, or rewrite authority.",
      "rollback": "Not applicable to observation; remediation requires a new governed candidate.",
      "evidence": "DriftReceipt with `authority_effect: none`.",
      "stop_condition": "Detection requires write access, disputed field ownership, or secrets in evidence."
    },
    {
      "mechanism": "Secrets and sensitive state",
      "trigger": "A plan, deployment, or integration needs confidential material.",
      "owner_profile": "Security/environment profile resolves opaque references at execution time.",
      "primary_source": ["PS-SECRETS", "PS-K8S", "PS-IAC"],
      "required_witness": "Reference identity, least-privilege consumer, lease/rotation policy, redaction test, state/plan storage protection, and break-glass owner.",
      "failure_containment": "No plaintext in source, plan export, logs, telemetry, or receipt; revoke on suspected exposure.",
      "rollback": "Prefer dual-key overlap and revocation; never restore a compromised secret merely to roll back.",
      "evidence": "Redacted SecretBindingReceipt containing references and policy metadata only.",
      "stop_condition": "Credential value must cross the research/specification boundary."
    },
    {
      "mechanism": "Artifact and configuration promotion",
      "trigger": "A previously built artifact/configuration is proposed for another environment.",
      "owner_profile": "Build owner produces; supply-chain verifier verifies; environment owner promotes; release owner remains separate.",
      "primary_source": ["PS-SUPPLY", "PS-GITOPS"],
      "required_witness": "Immutable artifact/config digests, signature identity, provenance predicate, environment contract, compatibility results, and prior stable digest.",
      "failure_containment": "Reject mutable tags, rebuild-on-promotion, unverifiable provenance, or environment mismatch.",
      "rollback": "Re-point to the prior accepted digest; suspend auto-reconciliation if it would immediately reapply the failed revision.",
      "evidence": "PromotionCandidateReceipt and later DeploymentReceipt; neither alone grants release authority.",
      "stop_condition": "Provenance, compatibility, or owner acceptance is absent."
    },
    {
      "mechanism": "API, messaging, database, and telemetry compatibility gates",
      "trigger": "A release changes a boundary contract or dependency.",
      "owner_profile": "SICL/integration owner defines the binding; runtime/database/observability profiles provide executable evaluators.",
      "primary_source": ["PS-INTEGRATION", "PS-DATABASE"],
      "required_witness": "Producer/consumer version matrix; positive and breaking mutants; event deduplication/correlation; schema migration checksum and lock analysis; OTLP partial-success/failure behavior.",
      "failure_containment": "Block promotion on incompatible consumer, ambiguous event semantics, unsafe lock duration, missing compensator, or unbounded telemetry loss.",
      "rollback": "API/message version coexistence; database expand-contract or tested restore/forward repair; telemetry failure degrades observation but cannot fabricate success.",
      "evidence": "CompatibilityEvaluationReceipt with exact evaluator/tool/version and expiry.",
      "stop_condition": "Runtime evaluator registry or receipt owner remains unadmitted."
    },
    {
      "mechanism": "Canary or blue-green delivery",
      "trigger": "Artifact and environment candidates have passed pre-deployment gates.",
      "owner_profile": "Deployment technology profile executes; SLO owner supplies thresholds; environment/release owner authorizes progression.",
      "primary_source": ["PS-PROGRESSIVE", "PS-K8S"],
      "required_witness": "Stable/candidate digests, cohort/traffic rule, observation window, minimum sample, readiness, baseline comparison, SLO queries, failed/inconclusive behavior, and manual abort.",
      "failure_containment": "Failed analysis aborts; inconclusive pauses; readiness alone cannot promote; controller/metric unavailability fails closed.",
      "rollback": "Shift traffic to stable, preserve failed candidate evidence, verify stable health, then scale down or quarantine candidate.",
      "evidence": "Stepwise AnalysisReceipts plus final DeploymentReceipt.",
      "stop_condition": "Traffic control, metric semantics, minimum evidence, stable capacity, or rollback route is unverified."
    },
    {
      "mechanism": "Reconciliation and deployment receipt",
      "trigger": "An authorized apply or rollout step executes.",
      "owner_profile": "Environment executor records facts; observer validates without writing verdicts; release authority decides separately.",
      "primary_source": ["PS-GITOPS", "PS-SUPPLY"],
      "required_witness": "Actor/workload identity, authorization reference, environment, input and resulting digests, tool/controller versions, timestamps, resource outcomes, health/analysis snapshots, partial failures, rollback state, and expiry.",
      "failure_containment": "Append-only receipt; missing or partial result is not success.",
      "rollback": "Bind the rollback receipt to the failed deployment receipt and resulting stable state.",
      "evidence": "Immutable DeploymentReceipt with explicit `authority_effect: none` until separately accepted.",
      "stop_condition": "Receipt would expose credentials or falsely imply promotion, release, or production readiness."
    }
  ],
  "tool_options": [
    {
      "family": "Infrastructure as code",
      "options": ["Terraform 1.15.9", "OpenTofu 1.12.1"],
      "comparison": "Both provide declarative plans and saved-plan workflows. OpenTofu additionally documents native state/plan encryption. Provider behavior, state backend, licensing, and syntax compatibility require profile-local verification.",
      "selection": "deferred",
      "rejection_criteria": "No exact provider lock, machine-readable plan, protected state, drift witness, or reliable exact-plan apply."
    },
    {
      "family": "Policy as code",
      "options": ["OPA 1.16.2", "native platform policy only if it produces an equivalent exact-binding result"],
      "comparison": "OPA is portable over JSON inputs but cannot decide facts absent from plan JSON.",
      "selection": "deferred",
      "rejection_criteria": "Fail-open unknowns, unversioned policy bundle, or policy decision conflated with deployment approval."
    },
    {
      "family": "Kubernetes reconciliation",
      "options": ["Flux 2.9.3", "Argo CD 3.5.1"],
      "comparison": "Flux exposes periodic dry-run drift detection/correction and suspension; Argo CD exposes automated sync/self-heal but requires auto-sync handling before rollback.",
      "selection": "deferred and Kubernetes-profile-only",
      "rejection_criteria": "No field-ownership contract, no suspend/abort route, mutable source reference, or reconciliation bypasses owner gates."
    },
    {
      "family": "Progressive delivery",
      "options": ["Argo Rollouts 1.8.4", "Flagger 1.44.0", "native platform rollout only with equivalent analysis and abort evidence"],
      "comparison": "Argo Rollouts models AnalysisRun outcomes and rollback windows; Flagger integrates metric analysis and multiple traffic providers.",
      "selection": "deferred",
      "rejection_criteria": "No baseline comparison, inconclusive handling, traffic-provider proof, manual abort, or stable-capacity witness."
    },
    {
      "family": "Supply-chain verification",
      "options": ["SLSA 1.2 predicates plus Cosign 3.0.6", "equivalent verifier producing digest- and identity-bound evidence"],
      "comparison": "Portable attestation semantics, profile-local identity roots and artifact registry.",
      "selection": "deferred",
      "rejection_criteria": "Mutable tag trust, unbound identity, unverifiable predicate, or provenance treated as deployment authority."
    },
    {
      "family": "Database migration",
      "options": ["Flyway 13.3.0", "Liquibase 5.0.3", "database-native migration runner with equivalent history/checksum/lock evidence"],
      "comparison": "Tool history and checksum detect drift; actual rollback and lock safety remain database- and migration-specific.",
      "selection": "deferred",
      "rejection_criteria": "Edited applied migration, unbounded lock, missing compatibility window, destructive change without tested restore, or generic undo claim."
    },
    {
      "family": "Integration description",
      "options": ["OpenAPI 3.2.0", "AsyncAPI 3.0.0", "CloudEvents 1.0.2", "OTLP 1.11.0"],
      "comparison": "Use per seam, not as substitutes: request/response API, message API, event envelope, and telemetry transport.",
      "selection": "conditional by seam",
      "rejection_criteria": "Specification presence without hostile compatibility execution, delivery semantics, privacy control, or owner mapping."
    }
  ],
  "rollback_contracts": [
    {
      "kind": "application_traffic",
      "preconditions": "Prior stable artifact is resident or rapidly recoverable; capacity and routing are verified.",
      "trigger": "Failed SLO/health/compatibility analysis, operator abort, or controller failure.",
      "action": "Stop progression, route to stable, verify stable health, preserve candidate evidence.",
      "false_green": "Rollback command accepted but traffic, sessions, background jobs, or consumers still reach the candidate."
    },
    {
      "kind": "configuration",
      "preconditions": "Prior configuration is immutable, compatible, and separately addressable.",
      "trigger": "Configuration-specific regression or invalid environment binding.",
      "action": "Promote prior digest; suspend any reconciler that would restore the failed revision.",
      "false_green": "Application image rolled back while incompatible configuration remains."
    },
    {
      "kind": "infrastructure",
      "preconditions": "Resource-specific recovery, state backup, dependency order, and data-retention behavior are declared.",
      "trigger": "Partial apply, health failure, or unacceptable drift.",
      "action": "Freeze further applies, observe actual state, produce a fresh corrective plan, and obtain new authorization.",
      "false_green": "Applying the previous configuration is assumed to reverse irreversible or provider-side effects."
    },
    {
      "kind": "database",
      "preconditions": "Expand-contract window or tested backup/restore/forward-fix exists; old and new application versions have declared schema compatibility.",
      "trigger": "Migration failure, excessive locking, or incompatibility.",
      "action": "Abort transaction where supported; otherwise restore or apply the predeclared compensating/forward migration.",
      "false_green": "Application traffic returns to old code while schema or data is no longer backward compatible."
    },
    {
      "kind": "credentials_and_integrations",
      "preconditions": "Dual credential/key overlap, revocation owner, provider idempotency/deduplication, and compensator are declared.",
      "trigger": "Authentication failure, exposure, duplicate side effect, or downstream incompatibility.",
      "action": "Switch to safe credential/reference, revoke compromised material, stop retries where non-idempotent, and compensate explicitly.",
      "false_green": "Old compromised credential is restored, or retries duplicate an external side effect."
    }
  ],
  "gaps": [
    "Current v2 has no admitted runtime evaluator registry or EvaluationReceipt owner for these operational guarantees.",
    "Exact FPR/SFC/SICL insertion selectors were not inspected in this lane and must be owner-routed by synthesis.",
    "No environment topology, provider, region, state backend, traffic controller, database engine, secret backend, or integration inventory was authorized for selection.",
    "No measured SLO queries, canary sample/window, capacity baseline, rollback-time objective, or evidence-expiry interval exists.",
    "No exact policy for plan unknowns, destructive changes, imports, state moves, or partial apply exists.",
    "No executable API/message/database compatibility fixture or hostile mutant was supplied.",
    "No supply-chain trust root, signing identity policy, or private artifact registry contract was supplied.",
    "Argo Rollouts metric and traffic plugins, Flagger providers, Flux/Argo CD reconciliation, and Kubernetes field managers remain profile-local integration risks.",
    "Terraform/OpenTofu compatibility and provider behavior must be tested; they are alternatives, not interchangeable evidence.",
    "Migration checksum validation does not prove semantic compatibility or rollback safety.",
    "CloudEvents and AsyncAPI do not define delivery guarantees, deduplication storage, authorization, or compensation.",
    "OTLP partial success can reject telemetry under an HTTP success response; deployment analysis must detect missing/partial evidence."
  ],
  "residue": [
    "Route the portable evidence schema and owner separation into existing FPR/SFC/SICL/EVF owners; create no parallel deployment authority.",
    "Admit technology profiles only after exact engine/controller/provider versions, artifact hashes, compatibility matrix, and hostile fixtures are accepted.",
    "Define separate InfrastructurePlanReceipt, CompatibilityEvaluationReceipt, AnalysisReceipt, DeploymentReceipt, and RollbackReceipt schemas; receipts remain evidence, not authority.",
    "Require the smallest future witness to stop before apply while proving: immutable artifact/provenance, read-only infrastructure plan, hostile policy mutant, API/message/database compatibility, canary decision inputs, and simulated rollback expectations.",
    "A later execution witness requires fresh credentials and environment authority and must not inherit this research completion.",
    "Keep the observer read-only and proposal-only; drift or telemetry may trigger a candidate but cannot mutate promotion state.",
    "Re-resolve all patch versions and official digests at profile admission; current-version research expires on material release, CVE, API, or provider change."
  ],
  "authority_ceiling_check": {
    "status": "pass",
    "allowed_actions_used": [
      "read_declared_inputs",
      "browse_primary_sources",
      "compare_tool_options",
      "return_research_receipt"
    ],
    "forbidden_actions_used": [],
    "external_effects": "none",
    "repository_writes": "none",
    "credentials_used": "none",
    "infrastructure_plan_or_apply": "none",
    "deployment_or_release": "none",
    "git_transport": "none",
    "claim_ceiling": "This receipt supplies current external precedent and a proposed ownership-preserving control architecture. It does not select a vendor, admit a profile or ontology concept, authorize implementation or apply, promote an artifact, deploy infrastructure, release software, or establish production readiness."
  }
}
```
