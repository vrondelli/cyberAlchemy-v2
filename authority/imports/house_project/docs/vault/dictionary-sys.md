---
tags:
  - vault
  - dictionary
  - system
layer: architecture
nature: reference
status: draft
audience: agent, engineer
version: 0.9.0
last_updated: 2026-04-19
node_type: conceptual
is_session: false
version_history: "0.9.0 (2026-04-19): added pipeline infrastructure terms (FolderState, PipelineStep, RerunScope, ExtractionApplicationResult) and all 11 ExtractionPipeline step implementations; removed TransientExtractorError orphan anchor (exception classes must not be tagged). 0.8.0 (2026-04-19): added FilterEvaluation-related sys terms (ObjectType, ObjectResolver, OBJECT_RESOLVERS, IFilterEvaluationRepository, IHierarchyRepository, FilterConfigBinding); updated RunFiltersService to reflect polymorphic filter refactor. 0.7.0 (2026-04-14): added ExtractionOutcome; added proposed EscalationGate and FieldValidationState from extraction tier-2 refinement discovery. 0.6.0 (2026-04-12): stripped to term + description + aliases only"

---

# System Dictionary

> The canonical glossary of system/infrastructure terms. Every term here
> represents a concept that engineers and agents use when discussing the
> platform's internal machinery — services, registries, event infrastructure,
> orchestrators.
>
> **Companion:** `dictionary-business.md` covers business-domain terms tagged
> with `@biz`. For domain-specific state machines and event lifecycles
> (aquisição, liquidação, documents), see `dictionary-events.md` — this
> dictionary covers infrastructure layers shared across domains.
>
> **When to consult:** if you encounter a system/infrastructure term in code or
> docs that you don't recognize, check here first. If the term is missing, it
> does not officially exist in the system vocabulary — flag it to the user.

---

## Objective

This document is the **canonical glossary** of the platform's system language.
It answers: *"What does this infrastructure component do and how does it connect
to other components?"*

It complements the business dictionary. The business dictionary defines *what*
the system does (domain concepts). This dictionary defines *how* it does it
(infrastructure, services, registries, event plumbing).

---

## Index

1. [Event Infrastructure](#event-infrastructure) — EventLog, log_event_safe, log_event, stream_id, parent_event, event_key, EventCatalog, EventLogEntities
2. [Filter Infrastructure](#filter-infrastructure) — RunFiltersService, FILTER_REGISTRY, filter_key, FundFilterConfig, RemessaFilterResult, is_stub, FilterDefinition, ObjectType, ObjectResolver, OBJECT_RESOLVERS, IFilterEvaluationRepository, IHierarchyRepository, FilterConfigBinding
3. [Upload Pipeline](#upload-pipeline) — ProcessUploadService, StageRemessaService, BaseUploadRules
4. [Remessa Lifecycle Services](#remessa-lifecycle-services) — CancelRemessaService, DeleteRemessaService
5. [Identity & Hashing](#identity--hashing) — entity_identity
6. [Document Processing Infrastructure](#document-processing-infrastructure) — GeminiExtraction, OCRService, ExtractionPipeline, ExtractionGate, UniversalExtraction, Extractor, ExtractionPolicy, ExtractionOutcome, EscalationGate, FieldValidationState, FolderState, PipelineStep, RerunScope, ExtractionApplicationResult, DocTypeIdentificationStep, EmpresaIdentificationStep, MergeIdentificacaoStep, MultipleCCBGuardStep, ExtractStep, ContratoLookupStep, KitEvaluationStep, CrossCheckStep, ChecklistGenerationStep, RenameStep, PersistStep

---

## Event Infrastructure

### EventLog
The append-only, immutable event store. Every significant system action — human
or automated — leaves a trace here. The EventLog is the platform's audit
substrate.
- **Aliases in codebase:** `event_log`, `event log` — all refer to this table.
- **Aliases in conversation:** `event store`, `log de eventos`, `audit trail`, `event log`.

### log_event_safe
The single entry point for writing events to the EventLog. Fail-open: never
raises exceptions in production. Centralizes idempotency, description
generation, TTL policy, and exception capture. All production code that needs
to record an event must go through this function.
- **Aliases in codebase:** `log_event_safe` only. Do not abbreviate.
- **Aliases in conversation:** `log event`, `logar evento`, `registrar evento`, `log safe`.

### log_event
The strict, exception-raising variant of the event write interface. Raises on
failure instead of swallowing the exception. Used in tests and in explicitly
critical paths where silent failures are unacceptable.
- **Aliases in codebase:** `log_event` only.
- **Aliases in conversation:** `log event strict`, `log event que lança exceção`.

### stream_id
The identifier of a lifecycle — a sequence of events with a defined start,
middle, and end. Not a global session UUID. Distinct lifecycles receive
distinct stream_ids. The link between related sub-streams is the `parent_event` FK.
- **Aliases in conversation:** `stream`, `lifecycle stream`, `lifecycle id`, `stream identifier`.

### parent_event
The FK on `EventLog` that links a sub-event to its originating parent event,
enabling hierarchical event chains within a stream. A root event has no
parent_event. Sub-events (e.g. per-filter result events within a filter run)
carry the root event's PK as parent_event.
- **Aliases in conversation:** `parent event`, `evento pai`, `event parent`.

### event_key
The idempotency key for retryable flows. Ensures that a Celery task retried
multiple times does not create duplicate events. Unique per logical event,
not per execution.
- **Aliases in conversation:** `event key`, `chave de idempotência`, `idempotency key`, `dedup key`.

### EventCatalog
The central ontology contract of the event system. Defines all registered event
types with their tier, domain, description template, payload schema, and
ontology links. An event type only exists if registered here.
- **Aliases in codebase:** `event_catalog`, `CATALOG`.
- **Aliases in conversation:** `event catalog`, `catálogo de eventos`, `catalog`, `event type registry`.

### EventLogEntities
The granular, per-entity event table. Co-equal to EventLog but for high-volume
observations: OCR results, cross-check outcomes, document views, per-installment
filter results. No FK between them — hierarchy expressed via deterministic
hashes.
- **Aliases in conversation:** `entity log`, `entity events`, `log de entidades`, `granular event log`.

---

## Filter Infrastructure

### RunFiltersService
The orchestrator that executes all active filters for a given business object
(remessa, contrato, or parcela) and its fund. Resolves the full object hierarchy
via an `ObjectResolver`, reads `FundFilterConfig` entries, calls each
`EligibilityFilter.run()` per `entity_type`, writes `FilterEvaluation` rows via
`IFilterEvaluationRepository`, propagates results via bidirectional cascade, and
emits semantic pipeline events. Receives all dependencies (`filter_registry`,
`object_resolvers`, `evaluation_repo`, `hierarchy_repo`) via constructor injection.
- **Aliases in conversation:** `filter runner`, `run filters`, `executar filtros`, `filter orchestrator`.

### FILTER_REGISTRY
The runtime registry that maps `filter_key` strings to `EligibilityFilter`
subclass instances. Infrastructure-level wiring — it connects the configuration
(`FundFilterConfig.filter_key`) to the executable filter class.
- **Aliases in conversation:** `filter registry`, `registry de filtros`, `filter map`.

### filter_key
The string identifier that uniquely names an eligibility filter implementation.
Used as the lookup key in `FILTER_REGISTRY` and as a FK-equivalent in
`FundFilterConfig` and `FilterDefinition`. Follows a convention of
`SCREAMING_SNAKE_CASE` (e.g. `CONCENTRACAO_MAX`, `CCB_FRESHNESS`).
- **Aliases in conversation:** `filter key`, `chave do filtro`, `filter identifier`.

### FundFilterConfig
The per-fund filter configuration. Defines which filters are active for a
given fund and with what parameters. The join point between fund identity and
filter execution.
- **Aliases in codebase:** `fund_filter_config`, `filter config`.
- **Aliases in conversation:** `filter config`, `fund filter`, `configuração de filtros`, `filter configuration`.

### RemessaFilterResult
The per-filter execution record. One row per filter per remessa. Stores status
(pass/fail/skipped), detail message, `is_stub` flag, and timing metadata.
- **Aliases in codebase:** `filter_result_row`, `remessa_filter_result`.
- **Aliases in conversation:** `filter result`, `resultado do filtro`, `filter result row`.

### is_stub
A boolean flag on `RemessaFilterResult` indicating that the filter which
produced this result has no real implementation — it is a registered placeholder
that always passes (vacuous pass). Stubs allow the filter pipeline to run
without breaking while a filter's logic is not yet implemented. A stub result
must never be treated as a genuine eligibility signal.
- **Aliases in conversation:** `stub filter`, `filtro stub`, `vacuous pass`, `filtro sem implementação`.

### FilterDefinition
The registry of all eligibility filter definitions. Each row describes a filter's
key, category, scope, parameters schema, and whether real logic is implemented.
`filter_key` maps 1-to-1 with a class in `FILTER_REGISTRY`. Unimplemented
definitions have `is_stub = True` — they act as stub gates whose result is always
pass and must not be treated as genuine eligibility signals.
- **Aliases in codebase:** `filter_definition`, `filter_def`.
- **Aliases in conversation:** `filter definition`, `definição de filtro`, `filter catalog entry`.

### ObjectType

The dispatch enum for the polymorphic filter service. Maps `remessa`, `contrato`,
and `parcela` to their respective `ObjectResolver` implementations in
`OBJECT_RESOLVERS`. The caller passes an `ObjectType` value; `RunFiltersService`
uses it as a lookup key to select which resolver to instantiate, then evaluates
all configured filters against the resolved hierarchy.

### ObjectResolver

The abstract port (ABC) through which `RunFiltersService` fetches the full object
hierarchy — remessa, contracts, installments — for a given input object. Concrete
implementations live in `infrastructure/repositories/` and receive the `object_id`
plus contextual metadata. The resolved hierarchy is passed unchanged to all filter
classes, so filters never touch the database directly.

### OBJECT_RESOLVERS

The runtime dispatch table: a dict mapping each `ObjectType` enum value to its
concrete `ObjectResolver` class. Infrastructure-level wiring — registered at
application startup and injected into `RunFiltersService` via dependency injection.
Analogous to `FILTER_REGISTRY` but for object resolution rather than filter
execution.

### IFilterEvaluationRepository

The abstract persistence port for `FilterEvaluation` records. Declares the upsert
and query operations the filter service needs to write results and check prior
evaluations. Replaces the implicit ORM access previously embedded in
`RunFiltersService`. Concrete implementation lives in `infrastructure/repositories/`.

### IHierarchyRepository

The abstract read port for fetching the object hierarchy (contracts and
installments under a remessa, or the remessa above a contract or installment).
Used by `ObjectResolver` implementations and by the cascade propagation logic
inside `RunFiltersService`. Read-only — no side effects.

### FilterConfigBinding

The frozen dataclass that carries one filter's resolved runtime configuration:
the filter class, its `parameters` dict, and the caller-supplied `context` merged
in. Created per filter per service invocation; passed directly to
`EligibilityFilter.run()`. Immutable — any enrichment requires a new instance via
`dataclasses.replace`, never mutation of the existing one.

---

## Upload Pipeline

### ProcessUploadService
The orchestrator for CSV upload processing. Receives an uploaded file, parses
rows, creates remessas and installments, and kicks off the downstream pipeline
(staging, filtering, events).
- **Aliases in conversation:** `upload service`, `serviço de upload`, `upload processor`, `upload pipeline`.

### StageRemessaService
The atomic staging write service. Domain-agnostic — parameterized by model classes,
identity keys, and builder functions. Receives the clean DataFrame from
ProcessUploadService, groups rows into remessas, creates remessa headers, builds
staging installments and contracts, and writes everything in a single atomic
transaction. Also uploads the clean CSV to MinIO and emits staging events.
- **Aliases in conversation:** `staging service`, `serviço de staging`, `stage service`, `esteira de staging`.

### BaseUploadRules
The abstract base class defining the contract for domain-specific upload
configuration: column mappings, required/optional columns, date/decimal/string
column types, deduplication keys, grouping columns, and derived column logic.
Each domain (aquisição, liquidação) subclasses this with its specific constants.
- **Aliases in conversation:** `upload rules`, `regras de upload`, `upload config`, `upload configuration`.

---

## Remessa Lifecycle Services

### CancelRemessaService
Generic cancel service for all domains. Pure ORM adapter: fetches a remessa, sets
its status to Rejeitado, and emits a canonical event. Business rules (which
statuses are cancellable) belong in the calling use case, not here.
- **Aliases in conversation:** `cancel service`, `serviço de cancelamento`, `cancel remessa service`.

### DeleteRemessaService
Generic rollback service for all domains. Reverts an approved remessa: optionally
restores production rows to staging, deletes child records, and sets status to
Rollback. Parameterized by model class, child deletion specs, and an optional
staging restorer function.
- **Aliases in conversation:** `delete service`, `rollback service`, `serviço de rollback`, `serviço de deleção`.

---

## Identity & Hashing

### entity_identity
The module that computes deterministic hashes for granular entities (remessa
entries, filter results, contracts). Provides stable cross-table and
cross-upload traceability without relying on auto-increment PKs.
- **Aliases in conversation:** `entity hash`, `hash de entidade`, `deterministic hash`, `hash`, `identity hash`.

---

## Document Processing Infrastructure

### GeminiExtraction
AI-based document field extraction using Google Gemini vision API. Converts PDF pages to images, sends to Gemini with structured prompts, and parses JSON responses into field dictionaries. Handles multiple document types (Identificação, Holerite, CCB, Averbação, Antifraude, Comprovante de Empréstimo) with per-type prompts and normalization.
- **Aliases in conversation:** `gemini extraction`, `extração gemini`, `AI extraction`.

### OCRService
Text extraction from PDF documents using PyMuPDF (native text) and Tesseract (OCR fallback). Extracts raw text, then applies regex-based field extraction using extraction configs. Handles rotation detection, garbled text detection, and multi-page extraction.
- **Aliases in conversation:** `OCR`, `text extraction`, `extração de texto`.

### ExtractionPipeline
The step-based document processing pipeline. Processes a folder of documents through sequential steps: classification, merging, template matching, field extraction, contrato lookup, kit evaluation, cross-check, and renaming. Each step is a pure function operating on folder state.
- **Aliases in conversation:** `pipeline`, `document pipeline`, `processing steps`.

### ExtractionGate
Pure calculation that evaluates whether the critical-field subset of extracted fields satisfies a template's `critical_fields` requirement. Sets `_critical_*` transient attributes on a `DocumentVersion`, but does not persist, set `reason`, or touch `_non_critical_*` attributes.
- **Aliases in conversation:** `critical gate`, `critical completeness gate`, `gate de campos críticos`.

### UniversalExtraction
Regex-based field extraction fallback. Uses JSON config files with field-specific regex patterns to extract structured data from raw OCR text. Also infers empresa (company) from document text using keyword matching.
- **Aliases in conversation:** `universal extraction`, `regex extraction`, `extração universal`.

### Extractor
The strategy interface (abstract base class) for turning a `DocumentVersion`'s text and bytes into an `ExtractionOutcome`. Concrete implementations (`PrimaryGeminiExtractor`, `TemplateRegexExtractor`, `UniversalRegexExtractor`, `FallbackGeminiExtractor`, `TemplateOrUniversalCascade`) are registered as singletons in `EXTRACTOR_SINGLETONS` and composed per `doc_type` by `EXTRACTION_STRATEGIES`. The dispatcher iterates the resolved list and returns the first non-None outcome; each concrete extractor controls its own applicability via `supports(doc_type)` and `applies(doc_type, matched)`.
- **Aliases in conversation:** `extractor strategy`, `extraction strategy`, `estratégia de extração`.

### ExtractionPolicy
A per-`(tenant_id, empresa_geradora, doc_type)` override that selects which `Extractor`s run and in what order, and optionally overrides the non-critical-field threshold. Policies are loaded from `extraction_policies.yaml` with a four-level precedence lookup (exact match → tenant+doc_type → empresa+doc_type → doc_type-only → registry defaults). Each resolved policy produces a stable 16-hex-char `applied_policy_version` hash (sha256 of effective config), persisted on `DocumentVersion.applied_policy_version` and emitted in extraction events for auditability.
- **Aliases in conversation:** `extraction policy`, `policy override`, `política de extração`.

### ExtractionOutcome
The immutable value object returned by an `Extractor.try_extract()` call. Carries the extracted `fields` dict, the `extraction_method` that produced them, an `extraction_confidence` enum, a `low_quality_image` flag, and optional `CriticalCheck` / `NonCriticalCheck` evaluations. Declared `frozen=True` — once an extractor instantiates it, the value cannot be mutated; any enrichment downstream (e.g. dispatcher-level audit fields) requires creating a new instance via `dataclasses.replace`. An outcome of `None` is the extractor's way of saying "I produced nothing" and signals the dispatcher to try the next strategy.
- **Aliases in conversation:** `extraction outcome`, `outcome`, `resultado da extração`.

### EscalationGate
A policy-driven decision object that evaluates an `ExtractionOutcome` and decides
whether the dispatcher should escalate to the next `Extractor` in the cascade or
accept the current outcome. Separates the *quality judgment* ("is this outcome
good enough?") from the *extraction mechanics* ("did extraction run without
raising?"). Concrete gates implement rules such as "escalate if critical fields
are missing" or "escalate if non-critical coverage is below threshold". Composed
per `ExtractionPolicy` so that tenants and doc_types can define their own
escalation rules without touching dispatcher code. Distinct from `ExtractionGate`:
`ExtractionGate` is a specific critical-field completeness calculation;
`EscalationGate` is the dispatcher-level decision that may consume one or more
gate results (including `ExtractionGate`) to reach an escalation verdict.
Status: proposed — not yet implemented.
- **Aliases in conversation:** `escalation gate`, `cascade gate`, `gate de escalação`.

### FieldValidationState
The consolidated, typed record of field-level validation for one
`DocumentVersion`. Holds the result of critical-field completeness checks and
non-critical coverage evaluation in a single dataclass, persisted as a JSON
column on `DocumentVersion.field_validation_state`. Replaces the ad-hoc
`_critical_*` / `_non_critical_*` transient attributes previously set on the
model instance — those have no schema, no type checking, and are set dynamically
across multiple functions. `FieldValidationState` is computed once by the
validation step from an `ExtractionOutcome` + template, becomes the single source
of truth consumed by decision logic (status/reason derivation) and by downstream
steps, and survives process boundaries because it is persisted.
Status: proposed — not yet implemented.
- **Aliases in conversation:** `validation state`, `field validation`, `estado de validação`.

### FolderState

The mutable accumulator dataclass that carries all state for a single pipeline folder run. Initialized once per folder and passed sequentially through every `PipelineStep.run()` call. Holds batch identity (`batch_id`, `folder_path`, `batch`), the resolved `Contrato`, collected `DocumentVersion` instances (`dvs`), classification results (`classified_files`, `ccb_dv`, `folder_docs`), borrower and contrato identifiers (`id_titulo`, `contrato`), and an abort signal (`aborted`, `abort_reason`). Steps read from and write to `FolderState` — each step mutates the shared accumulator and returns it.
- **Aliases in conversation:** `folder state`, `pipeline state`, `estado da pasta`.

### PipelineStep

The Protocol that every extraction pipeline step must implement. Declares two members: `name: str` (a stable, human-readable identifier used by `RerunScope` to address individual steps) and `run(state: FolderState, scope: RerunScope) -> FolderState` (the step's execution contract). Steps that check `scope` may skip their work if their `name` is not in `scope.steps`; steps that ignore `scope` always run.
- **Aliases in conversation:** `pipeline step`, `step`, `etapa do pipeline`.

### RerunScope

The selective-rerun control dataclass. Passed to every `PipelineStep.run()` call. `steps: set[str] | None` lists the step names to execute (None = all steps). `dvs: set[DocumentVersion] | None` restricts which documents are processed within a step (None = all documents). A step that honors both fields skips itself entirely if its name is absent and processes only the listed documents if `dvs` is set.
- **Aliases in conversation:** `rerun scope`, `scope de rerun`, `selective rerun`.

### ExtractionApplicationResult

The frozen value object returned after applying an `Extractor` strategy to a `DocumentVersion`. Carries the extracted `fields` dict and the `extraction_method` string that produced them. Replaces the transient `_extraction_*` attributes previously mutated directly on `DocumentVersion` — making the extraction result an explicit, typed value instead of implicit model-side state. Consumed by the event emission layer to report which extraction method was used.
- **Aliases in conversation:** `extraction result`, `application result`, `resultado da aplicação`.

### DocTypeIdentificationStep

The pipeline step that classifies each document in the folder by document type. Reads the raw file bytes and applies classification logic (template matching, regex heuristics) to assign a `doc_type` to each `DocumentVersion`. A prerequisite for all extraction and kit steps downstream.
- **Aliases in conversation:** `doc type step`, `classification step`, `etapa de identificação de tipo`.

### EmpresaIdentificationStep

The pipeline step that infers the `empresa` (originating company) for each document in the folder. Reads extracted text and applies keyword matching rules from `UniversalExtraction`. Enriches `DocumentVersion.empresa` before steps that depend on it (e.g. `KitEvaluationStep`, `ExtractStep`).
- **Aliases in conversation:** `empresa step`, `company identification step`, `etapa de identificação de empresa`.

### MergeIdentificacaoStep

The pipeline step that merges the Identificação (identification) documents for a folder. Handles the case where a borrower's identification is split across multiple pages or files — merges them into a single logical document before extraction runs.
- **Aliases in conversation:** `merge step`, `identificação merge step`, `etapa de merge de identificação`.

### MultipleCCBGuardStep

The pipeline step that detects and rejects folders that contain more than one CCB document. A folder must have exactly one CCB to proceed through extraction — multiple CCBs signal a data integrity error upstream. Sets `FolderState.aborted` if the guard triggers.
- **Aliases in conversation:** `CCB guard`, `multiple CCB step`, `etapa de guarda de CCB`.

### ExtractStep

The pipeline step that runs field extraction for each classified document in the folder. Dispatches to the configured `Extractor` strategy (resolved via `ExtractionPolicy`) and stores the resulting `ExtractionApplicationResult`, which is then consumed by subsequent steps.
- **Aliases in conversation:** `extract step`, `extraction step`, `etapa de extração`.

### ContratoLookupStep

The pipeline step that resolves the `Contrato` for the folder by querying the database using the CCB's extracted fields (typically the CCB number or borrower identity). Populates `FolderState.contrato` for use by all downstream steps that require a resolved contract.
- **Aliases in conversation:** `contrato lookup`, `contract lookup step`, `etapa de lookup de contrato`.

### KitEvaluationStep

The pipeline step that evaluates whether the document kit for the folder is complete. Checks that all required document types for the resolved `Contrato` are present and that each passes the `ExtractionGate` critical-field check. A failed kit evaluation blocks kit approval but does not abort the pipeline.
- **Aliases in conversation:** `kit step`, `kit evaluation`, `etapa de avaliação de kit`.

### CrossCheckStep

The pipeline step that cross-validates extracted field values across documents in the folder — e.g. confirming that the borrower name on the Identificação matches the name on the CCB. Emits per-entity cross-check events via `EventLogEntities`.
- **Aliases in conversation:** `cross check step`, `cross-check`, `etapa de validação cruzada`.

### ChecklistGenerationStep

The pipeline step that generates the `DocumentChecklist` record after a successful CCB match. Runs after `ContratoLookupStep`. Additive and non-blocking — if checklist generation fails, the pipeline continues and the failure is logged rather than propagated.
- **Aliases in conversation:** `checklist step`, `checklist generation`, `etapa de geração de checklist`.

### RenameStep

The pipeline step that renames processed document files to the system's canonical naming scheme (incorporating `doc_type`, `contrato_id`, and sequence number). Runs last in the domain pipeline, after all extraction and cross-check steps have completed.
- **Aliases in conversation:** `rename step`, `etapa de renomeação`.

### PersistStep

A no-op compatibility step registered in the pipeline for historical reasons. Was previously responsible for persisting `DocumentVersion` records; persistence is now handled within other steps. Retained to avoid breaking rerun configurations that reference it by `name`.
- **Aliases in conversation:** `persist step`, `etapa de persistência`.
