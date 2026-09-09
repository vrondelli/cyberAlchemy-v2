---
tags:
  - vault
  - dictionary
  - events
layer: architecture, market
nature: reference
status: draft
audience: agent, engineer
version: 0.1.0
last_updated: 2026-04-07
node_type: conceptual
is_session: false
---

# Event Dictionary

> The canonical glossary of domain events. Every term here represents a state-changing
> action that is tracked by the EventLog. Events sit between the business and system layers:
> they are triggered by business operations but recorded by system infrastructure.
>
> **This dictionary does not duplicate `event_catalog.py`.** The catalog owns: `tier`,
> `entity_domain`, `object_type`, `action`, `label`, `template`, `payload_schema`, `ontology_links`.
> This dictionary owns: prose semantics, emission sites, edges, and conversation aliases.
>
> **Companions:**
> - `dictionary-business.md` — operations, states, entities that produce/transition events
> - `dictionary-sys.md` — infrastructure services that emit events and shared infrastructure layers
>
> **This is the canonical reference for domain-specific state machines and lifecycles** (aquisição, liquidação, documents). System infrastructure is organized by concern in `dictionary-sys.md`, not by domain.
>
> **When to consult:** before emitting a new event, before querying event history, or when an agent
> needs to answer "what does this event mean and where does it fire?"

---

## Objective

This document is the **semantic layer** on top of the event catalog. It answers:
*"What does this event mean in the business context, where in code does it fire, and what does it connect to?"*

Every event emitted via `log_event_safe` must have an entry here. Entries reference but never
duplicate the structural metadata in `infrastructure/messaging/event_catalog.py`.

---

## Index

1. [Aquisição](#aquisição)
   - [File Upload Events](#file-upload-events) — 9 events
   - [Remessa Lifecycle Events](#remessa-lifecycle-events) — 15 events
   - [Installment & Filter Events](#installment--filter-events) — 5 events
   - [Contract Events](#contract-events) — 3 events
   - [Document Events](#document-events) — 17 events
   - [Kit Type Events](#kit-type-events) — 3 events
   - [Cadastros Events](#cadastros-events) — 7 events (4 ⚠️ not yet emitted)
   - [Template Field Mapping Events](#template-field-mapping-events) — 2 events
   - [Document Management Events](#document-management-events) — 5 events (⚠️ none emitted yet)
2. [Liquidação](#liquidação) — 5 events (remessa lifecycle + installment creation)
3. [Estoque](#estoque) — 5 events (stock lifecycle + download)
4. [Tech-Tier Events](#tech-tier-events) — 3 events (→ `dictionary-sys.md` companion)

---

## Aquisição

### File Upload Events

#### ACQUISITION_UPLOAD_STARTED
A user has submitted a CSV file for acquisition processing. The upload pipeline has received the
file and begun parsing. This is the opening event of the upload stream — all subsequent upload
events share the same `stream_id`.

- **event_catalog:** `E.ACQUISITION_UPLOAD_STARTED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/upload_service.py:122` (ProcessUploadService)
- **triggered_by:** ProcessUploadService (operator submits CSV via UI)
- **aliases_conversation:** upload iniciado, início do upload
- **distinct_from:** ACQUISITION_UPLOAD_COMPLETED (start vs. finish of the same stream)
- **edges:**
  - `produced-by` ← ProcessUploadService

---

#### ACQUISITION_UPLOAD_COMPLETED
The CSV file was fully parsed, all accepted rows were committed, and the upload stream closed
successfully. All rows were accepted — no blocking or partial rejection occurred.

- **event_catalog:** `E.ACQUISITION_UPLOAD_COMPLETED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/upload_service.py:167` (ProcessUploadService)
- **triggered_by:** ProcessUploadService (CSV parsing and row import succeed)
- **aliases_conversation:** upload completo, upload finalizado
- **distinct_from:** ACQUISITION_UPLOAD_PARTIAL_ACCEPTED (partial = some rows blocked), ACQUISITION_UPLOAD_BLOCKED (all rows rejected)
- **edges:**
  - `produced-by` ← ProcessUploadService

---

#### ACQUISITION_UPLOAD_FAILED
The upload pipeline encountered an unrecoverable technical error. No rows were committed. The
failure is infrastructure-level, not a business rule rejection — the stream is closed in an
error state.

- **event_catalog:** `E.ACQUISITION_UPLOAD_FAILED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/upload_service.py:187` (ProcessUploadService)
- **triggered_by:** ProcessUploadService (unhandled exception or unrecoverable parsing error)
- **aliases_conversation:** upload falhou, falha no upload
- **distinct_from:** ACQUISITION_UPLOAD_BLOCKED (blocked = business rule rejection, failed = technical failure)
- **edges:**
  - `produced-by` ← ProcessUploadService

---

#### ACQUISITION_UPLOAD_BLOCKED
All rows in the uploaded CSV were rejected because each one matched an already-active remessa.
No new data was committed. This is a business rule outcome, not a technical failure.

- **event_catalog:** `E.ACQUISITION_UPLOAD_BLOCKED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/upload_service.py:~200` (ProcessUploadService)
- **triggered_by:** ProcessUploadService (every row duplicates an active remessa)
- **aliases_conversation:** upload bloqueado, todas as parcelas duplicadas
- **distinct_from:** ACQUISITION_UPLOAD_FAILED (failed = technical error, blocked = business rejection)
- **edges:**
  - `produced-by` ← ProcessUploadService

---

#### ACQUISITION_UPLOAD_CHECKSUM_DUPLICATE
The SHA checksum of the uploaded CSV is identical to an already-processed file. The entire file
is rejected before row-level processing. This is a file-level deduplication guard.

- **event_catalog:** `E.ACQUISITION_UPLOAD_CHECKSUM_DUPLICATE` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/upload_service.py:~210` (ProcessUploadService)
- **triggered_by:** ProcessUploadService (checksum of incoming CSV matches existing batch)
- **aliases_conversation:** arquivo duplicado, checksum idêntico, mesmo arquivo
- **distinct_from:** ACQUISITION_REMESSA_DUPLICATED (checksum = file-level guard, duplicated = remessa-level business rule)
- **edges:**
  - `produced-by` ← ProcessUploadService

---

#### ACQUISITION_UPLOAD_PARTIAL_ACCEPTED
Some rows in the CSV were accepted and committed; others were blocked (typically because they
matched active remessas). The upload completes with mixed results — a partial staging is created.

- **event_catalog:** `E.ACQUISITION_UPLOAD_PARTIAL_ACCEPTED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/upload_service.py:~220` (ProcessUploadService)
- **triggered_by:** ProcessUploadService (at least one row accepted, at least one blocked)
- **aliases_conversation:** parcialmente aceito, upload parcial, aceite parcial
- **distinct_from:** ACQUISITION_UPLOAD_COMPLETED (partial = not all rows accepted), ACQUISITION_UPLOAD_BLOCKED (blocked = zero rows accepted)
- **edges:**
  - `produced-by` ← ProcessUploadService

---

#### UPLOAD_DUPLICATE_ROWS
The uploaded CSV contains internal duplicate rows (same installment data appears more than once
within the file itself). Distinct from cross-file duplication.

- **event_catalog:** `E.UPLOAD_DUPLICATE_ROWS` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/upload_service.py:~230` (ProcessUploadService)
- **triggered_by:** ProcessUploadService (duplicate rows detected within the file being processed)
- **aliases_conversation:** linhas duplicadas, parcelas duplicadas no arquivo
- **distinct_from:** ACQUISITION_UPLOAD_CHECKSUM_DUPLICATE (within-file row duplicates vs. whole-file checksum match)
- **edges:**
  - `produced-by` ← ProcessUploadService

---

#### ACQUISITION_REMESSA_DUPLICATED
A remessa batch was blocked because an active batch for the same set of installments already
exists in the system. This is the business-level guard against double-importing the same debt set.

- **event_catalog:** `E.ACQUISITION_REMESSA_DUPLICATED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/upload_service.py:~240` (ProcessUploadService)
- **triggered_by:** ProcessUploadService (remessa already active for these installments)
- **aliases_conversation:** remessa duplicada, remessa já ativa, lote duplicado
- **distinct_from:** ACQUISITION_UPLOAD_CHECKSUM_DUPLICATE (remessa-level business rule vs. file-level checksum)
- **edges:**
  - `produced-by` ← ProcessUploadService

---

#### ACQUISITION_FILE_DOWNLOADED
A user downloaded an acquisition file from the system. Recorded for audit — establishes who
accessed the raw acquisition data and when.

- **event_catalog:** `E.ACQUISITION_FILE_DOWNLOADED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/download_log_service.py:137` (DownloadLogService)
- **triggered_by:** DownloadLogService (operator downloads acquisition CSV from UI)
- **aliases_conversation:** download do arquivo, arquivo baixado, exportação
- **edges:**
  - `produced-by` ← ProcessUploadService

---

### Remessa Lifecycle Events

#### ACQUISITION_REMESSA_IMPORTED
CSV rows have been parsed and committed to the staging area. The remessa now exists in the system
as a staged batch awaiting operator review. This is the first event that creates a traceable batch identity.

- **event_catalog:** `E.ACQUISITION_REMESSA_IMPORTED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/stage_remessa_service.py:~150` (StageRemessaService)
- **triggered_by:** StageRemessaService (rows committed to staging after upload)
- **aliases_conversation:** remessa importada, dados na staging, lote importado
- **distinct_from:** ACQUISITION_STAGING_UPLOADED (imported = rows written, staging_uploaded = new staging record created)
- **edges:**
  - `produced-by` ← StageRemessaService
  - `transitions` → RemessaStatus (→ Staged)

---

#### ACQUISITION_STAGING_UPLOADED
A new staging record was created for the first time for this upload stream. Fires on first upload only
(not on re-uploads, which produce ACQUISITION_STAGING_REPLACED instead).

- **event_catalog:** `E.ACQUISITION_STAGING_UPLOADED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/stage_remessa_service.py:~160` (StageRemessaService)
- **triggered_by:** StageRemessaService (new staging record created, no prior staging existed)
- **aliases_conversation:** staging criado, primeira remessa, novo lote
- **distinct_from:** ACQUISITION_STAGING_REPLACED (first creation vs. replacement of existing)
- **edges:**
  - `produced-by` ← StageRemessaService

---

#### ACQUISITION_STAGING_REPLACED
A new upload has overwritten an existing staging batch. The previous staging data was discarded and
replaced with the new file's rows. Compensates the prior ACQUISITION_REMESSA_IMPORTED.

- **event_catalog:** `E.ACQUISITION_STAGING_REPLACED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/stage_remessa_service.py:~170` (StageRemessaService)
- **triggered_by:** StageRemessaService (re-upload replaces existing staging)
- **aliases_conversation:** staging substituído, remessa substituída, reenvio de arquivo
- **distinct_from:** ACQUISITION_STAGING_UPLOADED (replacement vs. first creation)
- **edges:**
  - `produced-by` ← StageRemessaService
  - `compensates` → ACQUISITION_REMESSA_IMPORTED

---

#### ACQUISITION_REMESSA_AUTO_EXPIRED
A nightly TTL job detected that this remessa batch exceeded its configured time-to-live without
being approved or rejected. The system automatically expired it to prevent stale pending batches.

- **event_catalog:** `E.ACQUISITION_REMESSA_AUTO_EXPIRED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/ttl_tasks.py:75` (TTL nightly task)
- **triggered_by:** Automated TTL task (batch age > configured TTL, system-triggered)
- **aliases_conversation:** remessa expirada automaticamente, expiração automática
- **distinct_from:** BATCH_TTL_EXPIRED (remessa = the specific remessa record, batch_ttl = the batch container level)
- **edges:**
  - `transitions` → RemessaStatus (→ Expirado)

---

#### ACQUISITION_REMESSA_SUPERSEDED
A new upload was submitted for an existing non-pending remessa (already processed). The old remessa
was superseded — it remains in history but is no longer the active batch for this installment set.

- **event_catalog:** `E.ACQUISITION_REMESSA_SUPERSEDED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/upload_service.py:~250` (ProcessUploadService)
- **triggered_by:** ProcessUploadService (new upload overrides a previously processed batch)
- **aliases_conversation:** remessa supersedida, remessa substituída por nova versão
- **distinct_from:** ACQUISITION_STAGING_REPLACED (superseded = non-pending batch replaced, staging_replaced = active staging)
- **edges:**
  - `produced-by` ← ProcessUploadService
  - `transitions` → RemessaStatus (→ Superseded)

---

#### REMESSA_USER_APPROVED
The fund operator approved a remessa batch, promoting all staging installments and contracts to
production. This is an irreversible financial commitment — the fund is now the legal holder of
the acquired credit rights. Emitted after the transaction commits.

- **event_catalog:** `E.REMESSA_USER_APPROVED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/aquisicao/use_cases/approve_remessa.py:143` (ApproveRemessa.execute())
- **triggered_by:** ApproveRemessa (operator clicks "Approve" in UI)
- **aliases_conversation:** aprovar remessa, remessa aprovada, aprovação do lote
- **distinct_from:** REMESSA_USER_REJECTED (opposite decision on pending batch), REMESSA_USER_ROLLEDBACK (reverts an already-approved batch)
- **edges:**
  - `produced-by` ← ApproveRemessa
  - `transitions` → RemessaStatus (Pendente → Aprovado)
  - `enforced-by` ← EligibilityFilter
  - `compensated-by` ← REMESSA_USER_ROLLEDBACK

---

#### REMESSA_USER_REJECTED
The fund operator explicitly rejected a remessa batch. The batch is closed without any installments
or contracts reaching production. The operator must provide a reason.

- **event_catalog:** `E.REMESSA_USER_REJECTED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/aquisicao/use_cases/reject_remessa.py:67` (RejectRemessa.execute())
- **triggered_by:** RejectRemessa (operator clicks "Reject" with reason)
- **aliases_conversation:** rejeitar remessa, remessa rejeitada, rejeição do lote
- **distinct_from:** REMESSA_USER_APPROVED (opposite path), REMESSA_USER_ROLLEDBACK (rollback = reverts approval, reject = denies pending)
- **edges:**
  - `produced-by` ← RejectRemessa
  - `transitions` → RemessaStatus (Pendente → Rejeitado)

---

#### REMESSA_USER_ROLLEDBACK
The fund operator rolled back an already-approved remessa. All production installments and
contracts created by the original approval are deleted. This is the only mechanism to undo
an approval — compensates REMESSA_USER_APPROVED.

- **event_catalog:** `E.REMESSA_USER_ROLLEDBACK` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/delete_remessa_service.py:84` (DeleteRemessaService)
- **triggered_by:** DeleteRemessa (operator rolls back an approved batch)
- **aliases_conversation:** rollback de remessa, desfazer aprovação, estornar remessa
- **distinct_from:** REMESSA_USER_REJECTED (rejected = denies pending batch, rolledback = reverses approved batch)
- **edges:**
  - `produced-by` ← DeleteRemessa
  - `transitions` → RemessaStatus (Aprovado → Pendente)
  - `compensates` → REMESSA_USER_APPROVED

---

#### FILTER_RUN_STARTED
The filter execution pipeline has been triggered for a remessa. All configured EligibilityFilters
will be evaluated sequentially. This is the entry event of the filter stream.

- **event_catalog:** `E.FILTER_RUN_STARTED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/run_filters_service.py:125` (RunFiltersService)
- **triggered_by:** RunFiltersService (filter execution initiated for a remessa batch)
- **aliases_conversation:** filtro iniciado, execução de filtros
- **distinct_from:** FILTER_RUN_APPROVED / FILTER_RUN_REJECTED / FILTER_RUN_PARTIALLY_APPROVED (start vs. outcome events)
- **edges:**
  - `produced-by` ← RunFiltersService

---

#### FILTER_RUN_APPROVED
All active EligibilityFilters passed for this remessa. The batch is now eligible for operator
approval. No mandatory filters failed.

- **event_catalog:** `E.FILTER_RUN_APPROVED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/run_filters_service.py:180` (RunFiltersService)
- **triggered_by:** RunFiltersService (all active filters evaluate to pass)
- **aliases_conversation:** filtro aprovado, remessa passou nos filtros, elegível para aprovação
- **distinct_from:** FILTER_RUN_PARTIALLY_APPROVED (all vs. some non-mandatory), FILTER_RUN_REJECTED (opposite)
- **edges:**
  - `produced-by` ← RunFiltersService
  - `transitions` → FilterResult (→ Aprovado)

---

#### FILTER_RUN_PARTIALLY_APPROVED
Non-mandatory filters failed, but all mandatory filters passed. The remessa can still proceed to
operator approval — the partial failure is informational, not blocking.

- **event_catalog:** `E.FILTER_RUN_PARTIALLY_APPROVED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/run_filters_service.py:195` (RunFiltersService)
- **triggered_by:** RunFiltersService (at least one non-mandatory filter fails, no mandatory failures)
- **aliases_conversation:** parcialmente aprovado, aprovação parcial nos filtros
- **distinct_from:** FILTER_RUN_APPROVED (all passed), FILTER_RUN_REJECTED (mandatory failure blocks)
- **edges:**
  - `produced-by` ← RunFiltersService
  - `transitions` → FilterResult (→ ParcialmenteAprovado)

---

#### FILTER_RUN_REJECTED
At least one mandatory EligibilityFilter rejected the remessa. The batch is blocked from operator
approval until the underlying issue is resolved or the filter is overridden.

- **event_catalog:** `E.FILTER_RUN_REJECTED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/run_filters_service.py:210` (RunFiltersService)
- **triggered_by:** RunFiltersService (at least one mandatory filter fails)
- **aliases_conversation:** filtro rejeitado, remessa reprovada nos filtros, bloqueado por filtro
- **distinct_from:** FILTER_RUN_PARTIALLY_APPROVED (non-mandatory vs. mandatory failure)
- **edges:**
  - `produced-by` ← RunFiltersService
  - `transitions` → FilterResult (→ Rejeitado)

---

#### FILTER_VACUOUS_PASSED
No active EligibilityFilters are configured for this fund. The filter run completed trivially —
not because all filters passed, but because none exist. The remessa proceeds as if filters passed.

- **event_catalog:** `E.FILTER_VACUOUS_PASSED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/run_filters_service.py:229` (RunFiltersService)
- **triggered_by:** RunFiltersService (no active filters found for the fund)
- **aliases_conversation:** filtro vazio, passou sem filtros, sem configuração de filtro
- **distinct_from:** FILTER_RUN_APPROVED (vacuous = no filters existed to run, approved = filters ran and all passed)
- **edges:**
  - `produced-by` ← RunFiltersService

---

#### FILTER_OVERRIDE_JUSTIFIED
An admin user (fund manager / administrador) has explicitly overridden a mandatory filter rejection,
providing a written justification. Unlocks the remessa for approval despite the failed filter.
This is an exceptional event — it bypasses the normal eligibility gate and must be audited.

- **event_catalog:** `E.FILTER_OVERRIDE_JUSTIFIED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `shared_services/use_cases/justify_filter_override.py:121` (JustifyFilterOverrideUseCase)
- **triggered_by:** JustifyFilterOverrideUseCase (admin submits justification for a failed RemessaFilterResult)
- **aliases_conversation:** override justificado, filtro sobrescrito, exceção de filtro, justificativa de override
- **edges:**
  - `produced-by` ← JustifyFilterOverrideUseCase
  - `compensates` → FILTER_RUN_REJECTED

---

#### BATCH_TTL_EXPIRED
The nightly TTL job archived a batch that exceeded its configured time-to-live. Operates at the
batch container level — one event per expired batch, regardless of how many remessas are inside.

- **event_catalog:** `E.BATCH_TTL_EXPIRED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/ttl_tasks.py:80` (TTL nightly task)
- **triggered_by:** Automated TTL task (batch age > configured TTL, system-triggered)
- **aliases_conversation:** batch expirado, TTL expirado, lote arquivado
- **distinct_from:** ACQUISITION_REMESSA_AUTO_EXPIRED (batch = container level, remessa = individual remessa record)
- **edges:**
  - `transitions` → RemessaStatus (→ Expirado)

---

### Installment & Filter Events

#### ACQUISITION_INSTALLMENTS_CREATED
All staging installments in a remessa batch were promoted to production records. Fires as part of
the approval transaction — emitted after the database commit.

- **event_catalog:** `E.ACQUISITION_INSTALLMENTS_CREATED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/aquisicao/use_cases/approve_remessa.py:160` (ApproveRemessa.execute())
- **triggered_by:** ApproveRemessa (staging → production promotion during approval)
- **aliases_conversation:** parcelas criadas, parcelas importadas para produção
- **distinct_from:** ACQUISITION_INSTALLMENTS_DELETED (creation vs. deletion during rollback)
- **edges:**
  - `produced-by` ← ApproveRemessa

---

#### ACQUISITION_INSTALLMENTS_DELETED
All production installments belonging to a rolled-back remessa were deleted. Part of the rollback
transaction — compensates ACQUISITION_INSTALLMENTS_CREATED.

- **event_catalog:** `E.ACQUISITION_INSTALLMENTS_DELETED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/delete_remessa_service.py:~94` (DeleteRemessaService)
- **triggered_by:** DeleteRemessa (remessa rollback removes production installments)
- **aliases_conversation:** parcelas deletadas, parcelas removidas do portfólio
- **distinct_from:** ACQUISITION_INSTALLMENTS_DENIED (deleted = rollback removes existing, denied = filter rejects before creation)
- **edges:**
  - `produced-by` ← DeleteRemessa
  - `compensates` → ACQUISITION_INSTALLMENTS_CREATED

---

#### ACQUISITION_INSTALLMENTS_DENIED
One or more installments were rejected by the filter pipeline. They will not be promoted to
production even if the broader remessa proceeds.

- **event_catalog:** `E.ACQUISITION_INSTALLMENTS_DENIED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/run_filters_service.py:~240` (RunFiltersService)
- **triggered_by:** RunFiltersService (filter evaluation rejects specific installments)
- **aliases_conversation:** parcelas negadas, parcelas rejeitadas pelo filtro
- **distinct_from:** ACQUISITION_INSTALLMENTS_DELETED (denied = never created, deleted = existed and removed)
- **edges:**
  - `produced-by` ← RunFiltersService
  - `produced-by` ← EligibilityFilter

---

#### FILTER_GATE_PASSED
An individual installment cleared a specific filter gate. Emitted per installment per filter —
high-cardinality event. The dictionary documents the type; instances live in EventLogEntities.

- **event_catalog:** `E.FILTER_GATE_PASSED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/run_filters_service.py:~250` (RunFiltersService)
- **triggered_by:** RunFiltersService (per-installment filter gate evaluation succeeds)
- **aliases_conversation:** parcela passou no gate, gate aprovado, elegível por filtro
- **distinct_from:** FILTER_GATE_REJECTED (opposite outcome per installment per gate)
- **edges:**
  - `produced-by` ← RunFiltersService

---

#### FILTER_GATE_REJECTED
An individual installment failed a specific filter gate. The installment is denied. Emitted
per installment per filter — high-cardinality event.

- **event_catalog:** `E.FILTER_GATE_REJECTED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/run_filters_service.py:~260` (RunFiltersService)
- **triggered_by:** RunFiltersService (per-installment filter gate evaluation fails)
- **aliases_conversation:** parcela reprovada no gate, gate rejeitado, inelegível por filtro
- **distinct_from:** FILTER_GATE_PASSED (opposite outcome per installment per gate)
- **edges:**
  - `produced-by` ← RunFiltersService

---

### Contract Events

#### ACQUISITION_CONTRACTS_CREATED
Contract records (CCBs) were created in production as part of approving a remessa. Fires alongside
ACQUISITION_INSTALLMENTS_CREATED in the same approval transaction.

- **event_catalog:** `E.ACQUISITION_CONTRACTS_CREATED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/aquisicao/use_cases/approve_remessa.py:170` (ApproveRemessa.execute())
- **triggered_by:** ApproveRemessa (contract records created during staging → production promotion)
- **aliases_conversation:** contratos criados, CCBs importados, contratos registrados
- **distinct_from:** ACQUISITION_CONTRACTS_DELETED (creation vs. rollback deletion)
- **edges:**
  - `produced-by` ← ApproveRemessa

---

#### ACQUISITION_CONTRACTS_DELETED
Contract records were removed as part of a remessa rollback. Compensates
ACQUISITION_CONTRACTS_CREATED — the contracts are gone as if the approval never happened.

- **event_catalog:** `E.ACQUISITION_CONTRACTS_DELETED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/delete_remessa_service.py:~100` (DeleteRemessaService)
- **triggered_by:** DeleteRemessa (rollback removes contracts created during approval)
- **aliases_conversation:** contratos deletados, CCBs removidos, contratos estornados
- **distinct_from:** ACQUISITION_CONTRACTS_CANCELLED (deleted = rollback, cancelled = explicit admin action on active contract)
- **edges:**
  - `produced-by` ← DeleteRemessa
  - `compensates` → ACQUISITION_CONTRACTS_CREATED

---

#### ACQUISITION_CONTRACTS_CANCELLED
One or more active contracts were explicitly cancelled by an admin action. Distinct from deletion
(which happens as part of rollback) — cancellation applies to already-active contracts.

- **event_catalog:** `E.ACQUISITION_CONTRACTS_CANCELLED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** ⚠️ `domains/aquisicao/endpoints/...` (emission site not confirmed during extraction)
- **triggered_by:** CancelRemessa (explicit admin cancellation of active contracts)
- **aliases_conversation:** contratos cancelados, CCBs cancelados, cancelamento de contratos
- **distinct_from:** ACQUISITION_CONTRACTS_DELETED (cancelled = intentional admin action, deleted = automatic rollback)
- **edges:**
  - `produced-by` ← CancelRemessa

---

### Document Events

#### DOCUMENT_BULK_UPLOAD_INITIATED
A user has submitted a bulk import ZIP containing document packages. The pipeline has received
the file and will begin scanning. Opening event of the bulk import stream.

- **event_catalog:** `E.DOCUMENT_BULK_UPLOAD_INITIATED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/documents_validation/use_cases/process_bulk_import.py:271`
- **triggered_by:** ProcessBulkImportUseCase (operator submits ZIP via UI)
- **aliases_conversation:** upload em lote iniciado, bulk upload iniciado
- **distinct_from:** DOCUMENT_BULK_IMPORT_COMPLETED (start vs. finish of the stream)
- **edges:**
  - `produced-by` ← BulkImportBatch

---

#### DOCUMENT_BULK_IMPORT_APPROVED
The fund operator reviewed and approved a bulk import batch. Documents in the batch are
accepted into the validation pipeline.

- **event_catalog:** `E.DOCUMENT_BULK_IMPORT_APPROVED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/documents_validation/use_cases/process_bulk_import.py:1122`
- **triggered_by:** ProcessBulkImportUseCase (operator action: approve batch)
- **aliases_conversation:** lote aprovado, batch aprovado, documentos aprovados
- **distinct_from:** DOCUMENT_BULK_IMPORT_DECLINED (opposite operator decision)
- **edges:**
  - `produced-by` ← BulkImportBatch

---

#### DOCUMENT_BULK_IMPORT_DECLINED
The fund operator reviewed and declined a bulk import batch. Documents are rejected and not
processed further.

- **event_catalog:** `E.DOCUMENT_BULK_IMPORT_DECLINED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/documents_validation/use_cases/process_bulk_import.py:1171`
- **triggered_by:** ProcessBulkImportUseCase (operator action: decline batch)
- **aliases_conversation:** lote recusado, batch recusado, documentos recusados
- **distinct_from:** DOCUMENT_BULK_IMPORT_APPROVED (opposite operator decision)
- **edges:**
  - `produced-by` ← BulkImportBatch

---

#### DOCUMENT_BULK_IMPORT_COMPLETED
The finalization background task completed all post-processing for the batch. This closes the
bulk import stream — all documents have been processed, validated, and stored.

- **event_catalog:** `E.DOCUMENT_BULK_IMPORT_COMPLETED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/documents_validation/tasks/bulk_import_tasks.py:250`
- **triggered_by:** BulkImportTasks (finalization task completes asynchronously)
- **aliases_conversation:** importação concluída, lote finalizado, batch completo
- **distinct_from:** DOCUMENT_BULK_UPLOAD_INITIATED (start vs. finish)
- **edges:**
  - `produced-by` ← BulkImportBatch

---

#### DOCUMENT_BULK_IMPORT_FAILED
An unrecoverable error occurred during bulk import processing. The batch cannot proceed. Distinct
from declined (which is an operator decision) — this is a system/data failure.

- **event_catalog:** `E.DOCUMENT_BULK_IMPORT_FAILED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/documents_validation/use_cases/process_bulk_import.py:694`
- **triggered_by:** ProcessBulkImportUseCase (unrecoverable exception during processing)
- **aliases_conversation:** importação falhou, lote com erro, batch com falha
- **distinct_from:** DOCUMENT_BULK_IMPORT_DECLINED (failed = system/data error, declined = operator rejection)
- **edges:**
  - `produced-by` ← BulkImportBatch

---

#### DOCUMENT_EXTRACTION_RESULT
OCR extraction completed for a document version. Captures whether extraction succeeded and what
raw data was found. One event per document version per extraction pass.

- **event_catalog:** `E.DOCUMENT_EXTRACTION_RESULT` in `infrastructure/messaging/event_catalog.py`
- **entity_domain:** documents_validation
- **emitted_to:** EventLogEntities (via `log_entity_event_safe`) — not EventLog
- **emitted_from:** `domains/documents_validation/use_cases/extraction_steps.py:255` (failure), `:954` (success)
- **triggered_by:** ExtractionStepsUseCase (OCR extraction completes for a document version)
- **aliases_conversation:** resultado da extração, extração OCR concluída, dados extraídos
- **edges:**
  - `produced-by` ← ExtractionStepsUseCase

---

#### DOCUMENT_MERGE_RESULT
Duplicate document versions for the same folder were merged — one survivor DV is kept, victims
are deleted. Records the audit trail of which DVs were merged.

- **event_catalog:** `E.DOCUMENT_MERGE_RESULT` in `infrastructure/messaging/event_catalog.py`
- **entity_domain:** documents_validation
- **emitted_to:** EventLogEntities (via `log_entity_event_safe`) — not EventLog
- **emitted_from:** `domains/documents_validation/use_cases/extraction_steps.py:495`
- **triggered_by:** ExtractionStepsUseCase (duplicate DV merge completes)
- **aliases_conversation:** resultado do merge, merge validado, campos reconciliados
- **edges:**
  - `produced-by` ← ExtractionStepsUseCase

---

#### DOCUMENT_CRITICAL_FIELDS_EVALUATED
Critical field validation completed for a document version. Critical fields are mandatory — failure
here blocks the document from approval.

- **event_catalog:** `E.DOCUMENT_CRITICAL_FIELDS_EVALUATED` in `infrastructure/messaging/event_catalog.py`
- **entity_domain:** documents_validation
- **emitted_to:** EventLogEntities (via `log_entity_event_safe`) — not EventLog
- **emitted_from:** `domains/documents_validation/use_cases/extraction_steps.py:979`
- **triggered_by:** ExtractionStepsUseCase (critical field validation step completes)
- **aliases_conversation:** campos críticos avaliados, validação de campos obrigatórios
- **distinct_from:** DOCUMENT_NON_CRITICAL_FIELDS_EVALUATED (critical = blocking, non-critical = informational)
- **edges:**
  - `produced-by` ← ExtractionStepsUseCase

---

#### DOCUMENT_NON_CRITICAL_FIELDS_EVALUATED
Non-critical field validation completed for a document version. Failures are informational — they
do not block the document from approval.

- **event_catalog:** `E.DOCUMENT_NON_CRITICAL_FIELDS_EVALUATED` in `infrastructure/messaging/event_catalog.py`
- **entity_domain:** documents_validation
- **emitted_to:** EventLogEntities (via `log_entity_event_safe`) — not EventLog
- **emitted_from:** `domains/documents_validation/use_cases/extraction_steps.py:996`
- **triggered_by:** ExtractionStepsUseCase (non-critical field validation step completes)
- **aliases_conversation:** campos não críticos avaliados, validação opcional
- **distinct_from:** DOCUMENT_CRITICAL_FIELDS_EVALUATED (non-critical = non-blocking, critical = blocking)
- **edges:**
  - `produced-by` ← ExtractionStepsUseCase

---

#### DOCUMENT_CONTRATO_EVALUATED
Contract lookup validation completed for a document version. Verifies that the CCB referenced
in the document exists in the system's contract registry. Weight=8 — blocking if unmatched.

- **event_catalog:** `E.DOCUMENT_CONTRATO_EVALUATED` in `infrastructure/messaging/event_catalog.py`
- **entity_domain:** documents_validation
- **emitted_to:** EventLogEntities (via `log_entity_event_safe`) — not EventLog
- **emitted_from:** `domains/documents_validation/use_cases/extraction_steps.py:1164`
- **triggered_by:** ExtractionStepsUseCase (contract existence lookup validation completes)
- **aliases_conversation:** contrato avaliado, CCB avaliado, verificação do contrato
- **edges:**
  - `produced-by` ← ExtractionStepsUseCase

---

#### DOCUMENT_CROSS_CHECK_RESULT
Cross-check validation completed for a document version. Reconciles extracted document data
against installment data already in the system to detect field-level inconsistencies. Weight=8.

- **event_catalog:** `E.DOCUMENT_CROSS_CHECK_RESULT` in `infrastructure/messaging/event_catalog.py`
- **entity_domain:** documents_validation
- **emitted_to:** EventLogEntities (via `log_entity_event_safe`) — not EventLog
- **emitted_from:** `domains/documents_validation/use_cases/extraction_steps.py:1356`
- **triggered_by:** ExtractionStepsUseCase (cross-check validation step completes)
- **aliases_conversation:** resultado do cross-check, validação cruzada, conferência de dados
- **compensated-by:** DOCUMENT_CROSS_CHECK_OVERRIDDEN (admin override bypasses this result)
- **edges:**
  - `produced-by` ← ExtractionStepsUseCase

---

#### DOCUMENT_KIT_EVALUATED
Kit evaluation completed for a document folder. Determines whether the folder's documents match
a known KitType for the detected CCB empresa. One event per folder per pipeline run.

- **event_catalog:** `E.DOCUMENT_KIT_EVALUATED` in `infrastructure/messaging/event_catalog.py`
- **entity_domain:** documents_validation
- **emitted_to:** EventLogEntities (via `log_entity_event_safe`) — not EventLog
- **emitted_from:** `domains/documents_validation/use_cases/extraction_steps.py:1130`
- **triggered_by:** ExtractionStepsUseCase (kit evaluation step completes for a folder)
- **aliases_conversation:** kit avaliado, avaliação do kit, correspondência de kit
- **distinct_from:** DOCUMENT_KIT_TYPE_CREATED/UPDATED/DELETED (those are registry management events — this is the per-folder runtime evaluation)
- **edges:**
  - `produced-by` ← ExtractionStepsUseCase

---

#### DOCUMENT_CROSS_CHECK_OVERRIDDEN
An admin user overrode a failed cross-check result for a specific document version, providing a
written justification. Allows the document to proceed despite the cross-check failure.
This is an exceptional, high-weight (9) audit event. Compensates DOCUMENT_CROSS_CHECK_RESULT.

- **event_catalog:** `E.DOCUMENT_CROSS_CHECK_OVERRIDDEN` in `infrastructure/messaging/event_catalog.py`
- **entity_domain:** documents_validation
- **emitted_to:** EventLog (via `log_event_safe`)
- **emitted_from:** ⚠️ no emission site found in `domains/` — event is defined but not yet emitted
- **triggered_by:** (pending — expected to be emitted by a document cross-check override use case)
- **aliases_conversation:** override do cross-check, cross-check sobrescrito, justificativa de cross-check
- **distinct_from:** FILTER_OVERRIDE_JUSTIFIED (filter-level remessa override), CCB_OVERRIDE_JUSTIFICATION (CCB-level override) — this one is specifically cross-check result override
- **edges:**
  - `compensates` → DOCUMENT_CROSS_CHECK_RESULT

---

#### DOCUMENT_TEMPLATE_CREATED
A new document template was registered in the system. Templates define the expected field
structure and extraction rules for a document type.

- **event_catalog:** `E.DOCUMENT_TEMPLATE_CREATED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/documents_validation/use_cases/manage_document_template.py:~200`
- **triggered_by:** ManageDocumentTemplateUseCase (admin creates a new template entry)
- **aliases_conversation:** template criado, modelo de documento criado, novo template
- **edges:**
  - `produced-by` ← DocumentTemplate

---

#### DOCUMENT_TEMPLATE_UPDATED
An existing document template was modified. Extraction rules or field definitions were changed.
May affect documents currently in the validation pipeline that use this template.

- **event_catalog:** `E.DOCUMENT_TEMPLATE_UPDATED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/documents_validation/use_cases/manage_document_template.py:321`
- **triggered_by:** ManageDocumentTemplateUseCase (admin updates an existing template)
- **aliases_conversation:** template atualizado, modelo atualizado
- **edges:**
  - `produced-by` ← DocumentTemplate

---

#### DOCUMENT_TEMPLATE_DELETED
A document template was removed from the registry. Documents that reference this template
may no longer be processable.

- **event_catalog:** `E.DOCUMENT_TEMPLATE_DELETED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/documents_validation/use_cases/manage_document_template.py:236`
- **triggered_by:** ManageDocumentTemplateUseCase (admin deletes a template)
- **aliases_conversation:** template deletado, modelo removido
- **edges:**
  - `produced-by` ← DocumentTemplate

---

#### CCB_OVERRIDE_JUSTIFICATION
An admin user submitted a written justification to override a failed validation check on a
specific CCB contract document. Allows the document to proceed despite the validation failure.
Distinct from `FILTER_OVERRIDE_JUSTIFIED` — this override applies at the document/CCB level
within the document validation pipeline, not at the remessa filter level.

- **event_catalog:** `E.CCB_OVERRIDE_JUSTIFICATION` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** ⚠️ no emission site found in codebase — event is defined but not yet emitted
- **triggered_by:** (pending — expected to be emitted by a document validation override use case)
- **aliases_conversation:** override de CCB, justificativa de documento, exceção de validação de contrato
- **distinct_from:** FILTER_OVERRIDE_JUSTIFIED (filter-level remessa override vs. document-level CCB override)
- **edges:**
  - `produced-by` ← (pending — no use case identified)

---

### Kit Type Events

#### DOCUMENT_KIT_TYPE_CREATED
A new KitType was created — a new named bundle of document checklist requirements was registered.
Operators will now be able to assign this kit type to product configurations.

- **event_catalog:** `E.DOCUMENT_KIT_TYPE_CREATED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/aquisicao/use_cases/manage_kit_type.py:117`
- **triggered_by:** ManageKitTypeUseCase (create operation)
- **aliases_conversation:** kit type criado, tipo de kit criado, novo kit
- **edges:**
  - `produced-by` ← KitType

---

#### DOCUMENT_KIT_TYPE_UPDATED
An existing KitType was modified — its checklist requirements or metadata were changed.
Documents already validated against this kit type are not retroactively affected.

- **event_catalog:** `E.DOCUMENT_KIT_TYPE_UPDATED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/aquisicao/use_cases/manage_kit_type.py:200`
- **triggered_by:** ManageKitTypeUseCase (update operation)
- **aliases_conversation:** kit type atualizado, tipo de kit modificado
- **edges:**
  - `produced-by` ← KitType

---

#### DOCUMENT_KIT_TYPE_DELETED
A KitType was removed from the registry. Products configured to use this kit type will need to
be updated before new document validation batches can be submitted.

- **event_catalog:** `E.DOCUMENT_KIT_TYPE_DELETED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/aquisicao/use_cases/manage_kit_type.py:335`
- **triggered_by:** ManageKitTypeUseCase (delete operation)
- **aliases_conversation:** kit type deletado, tipo de kit removido
- **edges:**
  - `produced-by` ← KitType

---

### Cadastros Events

#### AQUISICAO_TIPO_PRODUTO_CREATED
A new TipoProduto was registered in the cadastros registry. From this point on, the product
type is available for linking to KitTypes via ProdutoKitConfig.

- **event_catalog:** `E.AQUISICAO_TIPO_PRODUTO_CREATED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** ⚠️ no emission site found in `domains/` — event is defined but not yet emitted
- **triggered_by:** (pending — expected from a TipoProduto management use case)
- **aliases_conversation:** tipo produto criado, novo tipo de produto
- **edges:**
  - `produced-by` ← TipoProduto

---

#### AQUISICAO_TIPO_PRODUTO_DELETED
A TipoProduto was removed from the cadastros registry. Compensates AQUISICAO_TIPO_PRODUTO_CREATED.

- **event_catalog:** `E.AQUISICAO_TIPO_PRODUTO_DELETED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** ⚠️ no emission site found in `domains/` — event is defined but not yet emitted
- **triggered_by:** (pending — expected from a TipoProduto management use case)
- **aliases_conversation:** tipo produto deletado, tipo de produto removido
- **edges:**
  - `compensates` → AQUISICAO_TIPO_PRODUTO_CREATED

---

#### AQUISICAO_BANCARIZADOR_CREATED
A new Bancarizador (Emissor) was registered in the cadastros registry, identified by name and CNPJ.

- **event_catalog:** `E.AQUISICAO_BANCARIZADOR_CREATED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** ⚠️ no emission site found in `domains/` — event is defined but not yet emitted
- **triggered_by:** (pending — expected from a Bancarizador management use case)
- **aliases_conversation:** bancarizador criado, emissor registrado, novo emissor
- **edges:**
  - `produced-by` ← Emissor (Bancarizador)

---

#### AQUISICAO_BANCARIZADOR_DELETED
A Bancarizador (Emissor) was removed from the cadastros registry. Compensates AQUISICAO_BANCARIZADOR_CREATED.

- **event_catalog:** `E.AQUISICAO_BANCARIZADOR_DELETED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** ⚠️ no emission site found in `domains/` — event is defined but not yet emitted
- **triggered_by:** (pending — expected from a Bancarizador management use case)
- **aliases_conversation:** bancarizador deletado, emissor removido
- **edges:**
  - `compensates` → AQUISICAO_BANCARIZADOR_CREATED

---

#### AQUISICAO_KIT_CONFIG_CREATED
A new ProdutoKitConfig binding was created — a (TipoProduto, Emissor) pair was linked to a KitType.
This is the event that makes a document kit active for a specific product/emissor combination.

- **event_catalog:** `E.AQUISICAO_KIT_CONFIG_CREATED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/documents_validation/use_cases/process_bulk_import.py:1262`
- **triggered_by:** ProcessBulkImportUseCase (admin assigns a kit to a product/emissor pair)
- **aliases_conversation:** kit config criado, configuração de kit criada, kit vinculado ao produto
- **edges:**
  - `produced-by` ← ProdutoKitConfig

---

#### AQUISICAO_KIT_CONFIG_DEACTIVATED
An existing ProdutoKitConfig was deactivated. The (TipoProduto, Emissor) pair will no longer
use this kit for new document validation batches. Compensates AQUISICAO_KIT_CONFIG_CREATED.

- **event_catalog:** `E.AQUISICAO_KIT_CONFIG_DEACTIVATED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** ⚠️ no emission site found in `domains/` — event is defined but not yet emitted
- **triggered_by:** (pending — expected from a ProdutoKitConfig management use case)
- **aliases_conversation:** kit config desativado, configuração de kit desativada
- **edges:**
  - `compensates` → AQUISICAO_KIT_CONFIG_CREATED

---

#### AQUISICAO_KIT_CONFIG_ACTIVATED
A previously deactivated ProdutoKitConfig was reactivated. Compensates AQUISICAO_KIT_CONFIG_DEACTIVATED.

- **event_catalog:** `E.AQUISICAO_KIT_CONFIG_ACTIVATED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** ⚠️ no emission site found in `domains/` — event is defined but not yet emitted
- **triggered_by:** (pending — expected from a ProdutoKitConfig management use case)
- **aliases_conversation:** kit config ativado, configuração de kit reativada
- **edges:**
  - `compensates` → AQUISICAO_KIT_CONFIG_DEACTIVATED

---

### Template Field Mapping Events

#### TEMPLATE_FIELD_MAPPING_SET
A complete set of field-to-column mappings was configured for a DocumentTemplate — defines how
extracted fields from OCR map to AquisicaoManual columns used for cross-check validation.
This is a full replace: all existing mappings for the template are deleted and recreated atomically.

- **event_catalog:** `E.TEMPLATE_FIELD_MAPPING_SET` in `infrastructure/messaging/event_catalog.py`
- **entity_domain:** documents_validation
- **emitted_from:** `domains/aquisicao/use_cases/manage_field_column_mapping.py:172`
- **triggered_by:** `set_field_mappings()` (admin configures field mappings for a template)
- **aliases_conversation:** mapeamento de campos configurado, campos mapeados, mapping do template
- **⚠️ rule violation:** uses `log_event` instead of `log_event_safe` — violates Rule 11
- **edges:**
  - `produced-by` ← DocumentTemplate

---

#### TEMPLATE_FIELD_MAPPING_DELETED
A single field-to-column mapping was removed from a DocumentTemplate. Compensates TEMPLATE_FIELD_MAPPING_SET.

- **event_catalog:** `E.TEMPLATE_FIELD_MAPPING_DELETED` in `infrastructure/messaging/event_catalog.py`
- **entity_domain:** documents_validation
- **emitted_from:** `domains/aquisicao/use_cases/manage_field_column_mapping.py:198`
- **triggered_by:** `delete_field_mapping()` (admin removes a single mapping entry)
- **aliases_conversation:** mapeamento deletado, campo desmapeado
- **⚠️ rule violation:** uses `log_event` instead of `log_event_safe` — violates Rule 11
- **edges:**
  - `compensates` → TEMPLATE_FIELD_MAPPING_SET

---

### Document Management Events

> These events cover individual document lifecycle operations outside the bulk import pipeline.
> **None are currently emitted** — all are registered in the catalog and models but have no
> emission sites in `domains/` yet.

#### DOCUMENT_UPLOADED
A single document was uploaded for a specific CCB contract. This is the individual-document
upload path — distinct from the bulk ZIP import flow. Opens a new extraction pipeline for the
document version.

- **event_catalog:** `E.DOCUMENT_UPLOADED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** ⚠️ not yet emitted
- **triggered_by:** (pending — expected from a single-document upload use case)
- **aliases_conversation:** documento enviado, upload de documento, documento carregado
- **distinct_from:** DOCUMENT_BULK_UPLOAD_INITIATED (bulk ZIP vs. single document upload)
- **edges:**
  - `valid_next` → DOCUMENT_EXTRACTION_RESULT

---

#### DOCUMENT_UPLOAD_FAILED
A single document upload failed due to a technical error. No document version was created.
Compensates DOCUMENT_UPLOADED.

- **event_catalog:** `E.DOCUMENT_UPLOAD_FAILED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** ⚠️ not yet emitted
- **triggered_by:** (pending)
- **aliases_conversation:** upload de documento falhou, falha no envio do documento
- **edges:**
  - `compensates` → DOCUMENT_UPLOADED

---

#### DOCUMENT_SOFT_DELETED
A document version was soft-deleted — removed from the active view but retained in audit history.
The physical file is not removed; the record is flagged as deleted.

- **event_catalog:** `E.DOCUMENT_SOFT_DELETED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** ⚠️ not yet emitted
- **triggered_by:** (pending — expected from a document management use case)
- **aliases_conversation:** documento deletado, documento removido, soft delete de documento

---

#### DOCUMENT_RENAMED
A document version was renamed. Tracks the old and new filename for audit. Does not affect
extraction or validation state.

- **event_catalog:** `E.DOCUMENT_RENAMED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** ⚠️ not yet emitted
- **triggered_by:** (pending — expected from a document management use case)
- **aliases_conversation:** documento renomeado, nome do documento alterado

---

#### DOCUMENT_UNMATCHED_FLAGGED
A document arrived in the system but could not be matched to any checklist item for its contract.
The document is stored under a generated name (`UNMATCHED_DOCUMENT_{index}_{date}`) and flagged
for manual review. Represents an anomaly — something arrived that wasn't expected.

- **event_catalog:** `E.DOCUMENT_UNMATCHED_FLAGGED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** ⚠️ not yet emitted
- **triggered_by:** (pending — expected during document matching step)
- **aliases_conversation:** documento sem correspondência, documento não identificado, documento órfão
- **distinct_from:** DOCUMENT_UPLOADED (unmatched = no checklist item found; uploaded = normal path with a known contract)

---

## Tech-Tier Events

> Tech-tier events are infrastructure signals — they record system transitions that have no
> direct business meaning to operators. These complement `dictionary-sys.md` event infrastructure
> terms. Operators do not act on these events; engineers and monitoring systems do.

### Aquisição (Tech)

#### DOCUMENT_OCR_ERROR
A transient OCR error occurred during extraction for a document version. This is a recoverable
infrastructure signal — the pipeline may retry. Not a business decision; engineers and monitoring
systems act on this, not operators.

- **event_catalog:** `E.DOCUMENT_OCR_ERROR` in `infrastructure/messaging/event_catalog.py`
- **entity_domain:** documents_validation
- **emitted_from:** ⚠️ no emission site found — event is defined but not yet emitted
- **triggered_by:** (pending — expected during OCR processing on transient failure)
- **aliases_conversation:** erro de OCR, falha transitória de extração

---

#### DOCUMENT_BULK_UPLOAD_STAGED
The uploaded ZIP was unpacked and its contents staged in the processing area. This is an
internal infrastructure checkpoint — files are now accessible to the background scan job.

- **event_catalog:** `E.DOCUMENT_BULK_UPLOAD_STAGED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/documents_validation/use_cases/process_bulk_import.py:283`
- **triggered_by:** ProcessBulkImportUseCase (ZIP unpacked to staging directory)
- **edges:**
  - `produced-by` ← BulkImportBatch

---

#### DOCUMENT_BULK_SCAN_STARTED
The background file scanner has begun processing the staged ZIP contents. This marks the transition
from file receipt to active OCR and extraction pipeline work.

- **event_catalog:** `E.DOCUMENT_BULK_SCAN_STARTED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/documents_validation/use_cases/process_bulk_import.py:406`
- **triggered_by:** ProcessBulkImportUseCase (background scan task begins)
- **edges:**
  - `produced-by` ← BulkImportBatch

---

## Liquidação

> Liquidação reuses shared remessa lifecycle event types with
> `entity_domain=liquidacao`. The events are distinct enum values in
> `EventLog.EventType` but follow the same semantic pattern as aquisição events.

### Remessa Lifecycle Events (Liquidação)

#### LIQUIDACAO_REMESSA_APPROVED
The liquidação remessa has been approved — staging installments split into matched
(`LiquidacaoManual`) and unmatched (`LiquidacaoManualSemParcela`) production rows,
staging deleted, remessa status set to Aprovado.

- **event_catalog:** `E.LIQUIDACAO_REMESSA_APPROVED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/liquidacao/use_cases/approve_remessa.py:164`
- **triggered_by:** ApproveRemessaLiquidacaoUseCase
- **edges:**
  - `produced-by` ← Remessa
  - `transitions` → RemessaStatus (Pendente → Aprovado)

#### LIQUIDACAO_REMESSA_REJECTED
The liquidação remessa has been rejected — staging installments deleted,
remessa status set to Rejeitado.

- **event_catalog:** `E.LIQUIDACAO_REMESSA_REJECTED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/liquidacao/use_cases/reject_remessa.py:51`
- **triggered_by:** RejectRemessaLiquidacaoUseCase
- **edges:**
  - `produced-by` ← Remessa
  - `transitions` → RemessaStatus (Pendente → Rejeitado)
  - `compensates` → LIQUIDACAO_REMESSA_APPROVED

#### LIQUIDACAO_REMESSA_ROLLEDBACK
An approved liquidação remessa has been rolled back — production rows deleted,
remessa status set to Rollback.

- **event_catalog:** `E.LIQUIDACAO_REMESSA_ROLLEDBACK` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `infrastructure/remessa/delete_remessa_service.py` (shared, via DeleteRemessaLiquidacaoUseCase)
- **triggered_by:** DeleteRemessaLiquidacaoUseCase
- **edges:**
  - `produced-by` ← Remessa
  - `transitions` → RemessaStatus (Aprovado → Rollback)
  - `compensates` → LIQUIDACAO_REMESSA_APPROVED

### Installment Events (Liquidação)

#### LIQUIDATION_INSTALLMENTS_CREATED
Matched settlement installments have been created in the production
`liquidacao_manual` table during approval.

- **event_catalog:** `E.LIQUIDATION_INSTALLMENTS_CREATED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/liquidacao/use_cases/approve_remessa.py:180`
- **triggered_by:** ApproveRemessaLiquidacaoUseCase (approval split — matched path)
- **edges:**
  - `produced-by` ← LiquidacaoManual

#### LIQUIDATION_PARCELA_SEM_REMESSA_CREATED
Unmatched settlement installments (no acquisition counterpart) have been created
in the `liquidacao_manual_sem_parcela` table during approval.

- **event_catalog:** `E.LIQUIDATION_PARCELA_SEM_REMESSA_CREATED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/liquidacao/use_cases/approve_remessa.py:199`
- **triggered_by:** ApproveRemessaLiquidacaoUseCase (approval split — unmatched path)
- **edges:**
  - `produced-by` ← LiquidacaoManualSemParcela

---

## Estoque

### Stock Lifecycle Events

#### INVENTORY_RUN_STARTED
A stock calculation run has been queued or started for a fund/date combination.
Emitted when QueueEstoqueUseCase dispatches the Celery task.

- **event_catalog:** `E.INVENTORY_RUN_STARTED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/estoque/use_cases/queue_estoque.py`
- **triggered_by:** QueueEstoqueUseCase
- **edges:**
  - `produced-by` ← QueueEstoque

#### INVENTORY_RUN_COMPLETED
A stock calculation run has completed successfully — the aggregated stock
position has been persisted.

- **event_catalog:** `E.INVENTORY_RUN_COMPLETED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/estoque/use_cases/orquestrador.py`
- **triggered_by:** CalcularEstoqueUseCase
- **edges:**
  - `produced-by` ← CalcularEstoque
  - `produces` → EstoqueAgregado

#### INVENTORY_RERUN_STARTED
An operator has re-triggered a stock calculation for a fund/date that was
previously computed. Distinct from INVENTORY_RUN_STARTED to distinguish first
runs from recalculations.

- **event_catalog:** `E.INVENTORY_RERUN_STARTED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/estoque/use_cases/queue_estoque.py`
- **triggered_by:** QueueEstoqueUseCase (rerun path)
- **edges:**
  - `produced-by` ← QueueEstoque

#### INVENTORY_RERUN_COMPLETED
A stock recalculation has completed successfully.

- **event_catalog:** `E.INVENTORY_RERUN_COMPLETED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/estoque/use_cases/orquestrador.py`
- **triggered_by:** CalcularEstoqueUseCase (rerun path)
- **edges:**
  - `produced-by` ← CalcularEstoque

#### ESTOQUE_FILE_DOWNLOADED
An estoque report file has been downloaded by a user.

- **event_catalog:** `E.ESTOQUE_FILE_DOWNLOADED` in `infrastructure/messaging/event_catalog.py`
- **emitted_from:** `domains/estoque/use_cases/download.py`
- **triggered_by:** DownloadEstoqueUseCase
- **edges:**
  - `produced-by` ← EstoqueAgregado

---

## Connections

| Document | Edge | Notes |
|----------|------|-------|
| `dictionary-business.md` | `references` | Operations, States, and Entities that events `produced-by`, `transitions`, or `enforced-by` |
| `dictionary-sys.md` | `references` | Infrastructure services (ProcessUploadService, RunFiltersService, etc.) that emit events |
| `infrastructure/messaging/event_catalog.py` | `sourced-from` | Canonical structural metadata for every event listed here |
| `domain-tagging-constitution.md` | `governed-by` | Approved edge vocabulary (Rule 6) |
| `discovery-aquisicao-events-ontology.md` | `implements` | Discovery that motivated this dictionary |
| `implementation-plan-aquisicao-events-ontology.md` | `implements` | Extraction plan that produced the emission site mappings |
