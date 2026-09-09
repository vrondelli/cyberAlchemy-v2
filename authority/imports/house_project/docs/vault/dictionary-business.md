---
tags:
  - vault
  - dictionary
  - business
layer: market
nature: reference
status: draft
audience: agent, engineer, product
version: 1.2.0
last_updated: 2026-04-19
node_type: conceptual
is_session: false

---

# Business Dictionary

> The canonical glossary of business-domain terms. Every term here represents a
> concept that would appear in a conversation with operators, fund managers, or
> analysts. Code symbols tagged with `@biz` should reference terms from this
> dictionary. Synonyms are strictly forbidden in code.
>
> **Companion:** `dictionary-sys.md` covers system/infrastructure terms tagged
> with `@sys`.
>
> **When to consult:** if you encounter a business term in code or docs that you
> don't recognize, check here first. If the term is missing, it does not
> officially exist in the business vocabulary — flag it to the user.

---

## Objective

This document is the **canonical glossary** of the company's business language. It answers the question: *"What does this term mean in our domain?"*

It enforces ubiquitous language (DDD): every business term has one definition and no synonyms. This is the first trust gate — if a term is not here, it does not officially exist in the domain vocabulary.

---

## Index

1. [Core / Shared](#core--shared) — Direitos Creditórios, FIDC, Emissor, Sacado, Cedente, Zefra
2. [Aquisição](#aquisição) — AquisicaoManual, Parcela, ContratoCCB, Remessa, UploadFile, RemessaStatus, ApproveRemessa, RejectRemessa, DeleteRemessa, CancelRemessa, EligibilityFilter, FilterResult, FilterEvaluation, EntityType, FilterResultReason, Override
3. [Documents & OCR](#documents--ocr) — TipoProduto, TipoInstrumento, ProdutoKitConfig, KitType, DocumentChecklist, DocumentTemplate, DocumentVersion, BulkImportBatch, DocumentsFolderResult, CrossCheck, Dígito Verificador, ExtractionOutcome, CriticalCheck, NonCriticalCheck, ComprovanteEmprestimo
4. [Liquidação](#liquidação) — LiquidacaoManual, LiquidacaoManualSemParcela
5. [Estoque](#estoque) — EstoqueManual, EstoqueAgregado, CalcularEstoque, QueueEstoque, GestaoResumo

---

## Core / Shared

### Direitos Creditórios (Credit Rights)
The abstract legal and financial concept of the asset itself — the right to receive a future payment. While the CCB is the *document* that proves it, the "Direito Creditório" is the actual asset being traded.

### FIDC (Fundo de Investimento em Direitos Creditórios)
The investment fund structured to acquire the credit rights. It is the legal entity that not only owns the `Estoque`, but actively buys debts, receives their payments, manages the risk, and orchestrates the lifecycle of the assets.

### Emissor
The financial institution or entity that originally issues the CCB and originates the credit right before it is assigned to the FIDC. (Historically referred to as `Bancarizador`, but the codebase is migrating to `Emissor`).
- **Aliases in conversation:** `bancarizador`, `cnpj emissor`

### Sacado (Debtor)
The entity or individual that owes the money defined in the credit right.

### Cedente (Originator/Assignor)
The entity that transfers/assigns the credit right to the FIDC.

### Zefra
The primary end-user facing application interface. The web application where fund operators, managers, and administrators interact with the system to manage acquisitions, remessas, documents, and fund operations.
- **Aliases in conversation:** `application`, `app`, `interface`, `UI`.

---

## Aquisição

### AquisicaoManual (Acquisition Installment)
A future cash flow that the fund has acquired the right to receive. It represents
a debt — if the sacado (debtor) pays, the cash flow goes to the fund. One row per
installment being purchased. The staging/production lifecycle uses two separate
models: `AquisicaoManualStaging` holds rows during review, and `AquisicaoManual`
holds promoted production rows after remessa approval. Carries filter results,
eligibility state, and the link back to its parent ContratoCCB and Remessa.
Note: the `Manual` suffix is a legacy artifact reflecting the current manual CSV upload workflow — the name will be revised as the acquisition process becomes automated.
- **Aliases in codebase:** `installment`, `parcela` (informal).
- **Aliases in conversation:** `parcela`, `installment`, `aquisição manual`.

### Parcela (Installment)
The abstract business concept of a single financial installment — one scheduled
cash flow that the fund has acquired the right to receive. Not a database model;
the domain-level abstraction that `AquisicaoManual` concretely implements. Used
in shared system services (e.g. `StageRemessaService`) to refer to installments
independently of domain-specific implementation details.
- **Aliases in codebase:** `parcela`, `installment` (informal references to AquisicaoManual rows).
- **Aliases in conversation:** `installment`, `prestação`, `parcela de aquisição`.

### ContratoCCB (Acquisition Contract)
The aquisição-domain grouping of installments by `numero_titulo` within a remessa.
A CCB (Cédula de Crédito Bancário) is the legal instrument that proves the
existence of a debt — the ContratoCCB is its concrete representation in code.
All AquisicaoManual rows sharing the same CCB number belong to one ContratoCCB.
Tracks contract-level status and filter outcomes.
- **Aliases in codebase:** `contrato`, `contract`.
- **Aliases in conversation:** `contrato`, `contract`, `contrato parcela`, `ccb`, `contrato remessa`, `contrato aquisicao`.

### Remessa
This represents a payment or a batch of transactions the fund did (aquisição) or received (liquidação) for its debts. In the code, this is structurally divided by domain:
- **Remessa de Aquisição:** Groups installments submitted for purchase by `[cnpj_fundo, data_aquisicao, id_cessao]`. Represents a batch the fund bought. (Code: `RemessaAquisicaoId`).
- **Remessa de Liquidação:** Groups installments submitted for settlement/payment by `[cnpj_fundo, movimento, data_baixa_custod]`. Represents a batch of payments the fund received. (Code: `RemessaLiquidacaoId`).
- **Aliases in codebase:** `remessa_aquisicao`, `remessa_liquidacao`, `remessa`.
- **Aliases in conversation:** `remessa de aquisição`, `remessa de liquidação`, `batch`, `lote`.

### UploadFile (Batch Upload)
A CSV file submitted by an operator containing a batch of installments for
aquisição or liquidação. It is the root entity of the upload lifecycle — every
remessa, installment, and contract created from the batch traces back to one
`UploadFile`. Carries a `stream_id` that links all downstream events in the
event log, making the full history of a batch queryable from a single UUID.
- **Aliases in conversation:** `upload`, `csv`, `arquivo`.

### RemessaStatus (Remessa Lifecycle)
The state machine governing remessa headers and their child records (installments,
contracts) through the acquisition/settlement lifecycle. Defines the canonical set
of states a remessa can be in and the allowed transitions between them.
- **States:** `Pendente` (awaiting review) → `Aprovado` (production) | `Rejeitado` (rejected, staging deleted) | `Rollback` (reverted from Aprovado) | `Finalizado` (legacy terminal state) | `Deletado` (soft-deleted).
- **Aliases in codebase:** `remessa_status`, `status` (on remessa, contract, installment models).
- **Aliases in conversation:** `status da remessa`, `estado da remessa`.

### ApproveRemessa (Remessa Approval)
The business operation that promotes a remessa from staging to production. Copies
staging installments into the production table, approves pending contracts, and
sets the remessa status to Aprovado. Blocked by the mandatory filter gate: if any
active filter has failed without an override, approval is refused.
- **Aliases in conversation:** `aprovar remessa`, `approve`, `promote to production`.

### RejectRemessa (Remessa Rejection)
The business operation that rejects a pending remessa. Deletes staging installments
and pending contracts, sets the remessa status to Rejeitado.
- **Aliases in conversation:** `rejeitar remessa`, `reject`.

### DeleteRemessa (Remessa Rollback)
The business operation that reverts an approved remessa. Copies production
installments back to staging, resets contracts to Pendente, deletes production
installment rows, and sets the remessa status to Rollback.
- **Aliases in conversation:** `rollback remessa`, `desfazer aprovação`, `delete remessa`.

### CancelRemessa (Remessa Cancellation)
The business operation that cancels a *Pendente* aquisição remessa — a pure status flip
with no staging data deletion. Enforces the Pendente precondition then delegates to
`CancelRemessaService`, which sets the remessa status to Rejeitado and emits a canonical event.
No installment or contract rows are removed.
- **Aliases in conversation:** `cancelar remessa`, `cancel remessa`.

### EligibilityFilter (Eligibility Criteria / Filter Gate)
A stateless, side-effect-free business rule that determines whether a remessa or its installments may pass a specific eligibility check for a given fund. Each filter is a subclass of `EligibilityFilter`, registered in `FILTER_REGISTRY` under a unique `filter_key`, and configured per fund via `FundFilterConfig`. Filters are fund-configurable — each fund can have any subset of filters attached with custom parameters.
- **Aliases in codebase:** `eligibility_criteria`, `filter_criteria`, `eligibility filter gates`, `filter gates` — all refer to this same concept.
- **Aliases in conversation:** `filtro de elegibilidade`, `filter gate`, `eligibility criteria`.

### FilterResult (Filtros)
The outcome of running an `EligibilityFilter` against an installment or contract. Represents whether the installment passed, failed, or is pending a specific eligibility check.
- **FilterResult values:** `pending` (awaiting evaluation), `pass` (passed), `fail` (failed), `vacuous_pass` (stub filter — always passes, no real implementation).
- **FilterOutcome fields:** `status` (`pass` | `fail` | `skipped`), `detail` (human-readable explanation), `metadata` (reserved dict).
- **Aliases in codebase:** `filtros`, `filter_status`, `filter_outcome`, `last_filter_result` — all refer to this same concept.
- **Aliases in conversation:** `filtros`, `resultado do filtro`, `filter outcome`.

### FilterEvaluation (Filter Evaluation Record)

The polymorphic, persisted record of a single filter's execution against one
business object — a remessa, a contract, or an installment. Replaces
`RemessaFilterResult` with a unified, three-level model. Uniquely identified by
`(object_type, object_id, entity_type, fund_filter)`. Carries the filter outcome
(`FilterResult`), a `FilterResultReason` (direct vs. cascaded), and timing
metadata. One row is written per filter per object evaluated, including rows
propagated by the bidirectional cascade.

### EntityType

The enum that identifies which business concept a filter evaluates: `remessa`,
`contrato`, or `parcela`. An `EligibilityFilter` declares its `entity_type` as a
class attribute. At runtime, the filter service uses `entity_type` to select the
correct objects from the resolved hierarchy and write `FilterEvaluation` rows at
the correct level.

### FilterResultReason

Attribution metadata on a `FilterEvaluation` row that explains why the row has
its status: `direct` (the object failed its own filter), `from_remessa` (status
cascaded down from a failed remessa-level filter), `from_contract` (status
cascaded down from a failed contract-level filter), or `from_installment` (status
cascaded up from a failed installment-level filter). Enables auditors to
distinguish genuine failures from inherited ones without re-running filters.

### Override (Eligibility Override / Justificativa de Override)
The exceptional business action by which a fund manager (administrador do fundo) bypasses a
failed mandatory eligibility filter by submitting a written justification. An override does not
change the filter result — it unlocks the remessa for operator approval despite the failure,
and records the justification for audit. Requires a minimum justification length. A result can be
overridden more than once; each submission replaces the previous justification.
- **Actor:** Fund manager / administrador do fundo (admin-level user). Not available to regular operators.
- **Aliases in conversation:** `override`, `justificativa de override`, `exceção de filtro`, `sobrescrever filtro`.

---

## Documents & OCR

### TipoProduto (Product Type)
The registry of known product types (e.g., "Consignado Privado", "Crédito Pessoal").
Links a product category to its required document kits via `ProdutoKitConfig`.
ContratoCCB stores the raw string from the CSV; resolution to this registry happens
at checklist-generation time.
- **Aliases in codebase:** `tipo_produto`, `product type`.

### TipoInstrumento (Instrument Type)
The registry of known financial instrument types (e.g., CCB, CRI, CRA). Validated
at upload time: if the CSV contains an unregistered tipo_instrumento, the upload
is rejected.
- **Aliases in codebase:** `tipo_instrumento`, `instrument type`.

### ProdutoKitConfig (Product-Kit Binding)
The append-only audit log that links a (TipoProduto, Emissor) pair to a KitType.
Follows the same immutable-row pattern as FundFilterConfig: every configuration
change creates a new row, never mutates an existing one.
- **Aliases in conversation:** `product kit config`, `kit binding`.

### KitType
A named bundle defining which document types are required **and their expected templates** for a specific product/emissor combination (e.g., "Consignado Privado" requires ["CCB", "AVERBAÇÃO", "RG"]). It does not just list the names of the documents, it links to the specific visual expectations for that transaction.

### DocumentChecklist (Contract Document Checklist)
The set of document requirements derived for a specific `ContratoCCB` at checklist-generation
time. One row per (contract, kit_type, doc_type) combination. Represents the question:
*"for this contract, which documents are expected and have they been received?"*
Created by `generate_checklist_for_contrato()` in Phase 3 of the document pipeline, after a
ContratoCCB match is confirmed. Idempotent — a second generation call on the same contract
with the same active kits produces no new rows.
- **Aliases in codebase:** `checklist`, `document_checklist`.
- **Aliases in conversation:** `checklist`, `checklist de documentos`, `document checklist`.

### DocumentTemplate
The global library of known document layouts. Incoming documents are cross-referenced against templates to identify what they are.
- **Identification Flow:**
  1. The system first narrows candidates by the expected **Document Name** (e.g., it knows it is looking for a "CCB").
  2. It evaluates text content using **Jaccard similarity** (word-set overlap).
  3. If text evaluation is insufficient or the document is an image, it uses **Perceptual Hashing** (`pHash` for images, `dHash` for PDFs).

### DocumentVersion
One row per uploaded file — the living record of a document's lifecycle through
identification, extraction, cross-check, and approval. Tracks the document's
status, OCR text, extraction confidence, matched template, and perceptual hash.
Each new upload for the same doc_type in a folder creates a new version; only one
is marked `is_current=True`.
- **Status lifecycle:** `pendente` → `completado` (OCR done) → `aprovado` / `rejeitado` / `deletado` / `failed`.
- **Aliases in codebase:** `document_version`, `version`.

### BulkImportBatch (Document Batch Upload)
A zip file uploaded by an operator containing document folders for multiple contracts.
Tracks the entire batch lifecycle from staging through approval/rejection. Contains
counters for OCR completion, CCB matching, and document acceptance.
- **Status lifecycle:** `pendente` → `aprovado` / `rejeitado` / `failed`.
- **Aliases in conversation:** `batch`, `bulk import`, `importação em lote`.

### DocumentsFolderResult (Folder Processing Result)

The per-folder outcome record of the bulk import CCB pipeline. Tracks which
processing step a folder reached, its terminal reason code
(e.g., `no_ccb_found`, `cross_check_failed`, `matched`), the matched
ContratoCCB, and kit evaluation results. One row per leaf folder in a
BulkImportBatch zip.
- **Aliases in conversation:** `folder result`, `resultado da pasta`, `pipeline result`.

### CrossCheck (Document Field Validation)
The validation step that compares OCR-extracted fields from a document against the corresponding `AquisicaoManual` installment rows. Answers: "does the physical document match what's on record?" Type-aware comparison: numeric with ±0.01 tolerance, date format normalization, case-insensitive string fallback. OR semantics across rows — a field passes if it matches any installment.
- **Aliases in conversation:** `cross check`, `cross validation`, `ccb check`, `documents check`, `field validation`.

### Dígito Verificador (Check Digit)
A trailing numeric suffix appended to a CCB number on the printed document (e.g., `600913767-7`). Upstream custodiante systems (Vortx) strip this suffix before storing the `numero_titulo`, so the database contains only the base number (e.g., `600913767`). The check digit has the format `-D` where `D` is one or more digits, always at the end of the number.

### Identificação (ID Document)
The identity document required for individuals in credit transactions (e.g., RG, CPF, CNH). Extracted via OCR with optional AI assistance (Gemini API). A key document for sacado (debtor) verification.
- **Aliases in conversation:** `ID`, `documento de identidade`, `RG`, `CPF card`.

### Holerite (Payroll Statement)
The payroll statement or income document proving the debtor's employment and income. Required for proof of capacity to repay in certain credit products.
- **Aliases in conversation:** `payroll`, `contracheque`, `contra-cheque`, `income proof`.

### Averbação (Legal Endorsement)
A legal endorsement or registration marking on a document, commonly required for consignment operations (consignado). Indicates that the credit has been legally registered.
- **Aliases in conversation:** `averbação`, `legal endorsement`, `registration mark`.

### Antifraude (Anti-Fraud Verification)
A specialized verification document or extraction process to validate authenticity and prevent fraud (e.g., biometric verification, anti-fraud certificate). Applied selectively based on risk profile.
- **Aliases in conversation:** `fraud check`, `anti-fraud`, `verification`, `authenticity check`.

### ExtractionOutcome
The immutable result of running an `Extractor` against a `DocumentVersion`: the extracted fields, the extraction method used (`gemini`, `template`, `universal`, or `none`), a confidence level (`ALTA` / `MEDIA` / `BAIXA` / `NENHUMA`), and — when available — the associated `CriticalCheck` and `NonCriticalCheck` results. Produced by extractors; applied to a `DocumentVersion` by `apply_extraction_outcome_to_dv`, which writes `extracted_data`, `extraction_confidence`, `applied_policy_version`, and derives the DV's status/reason.
- **Aliases in conversation:** `extraction result`, `resultado da extração`, `outcome`.

### CriticalCheck
The evaluation of a document's critical-field completeness: whether all fields listed in the template's `critical_fields` config were populated by extraction. Carries the list of missing vs. checked fields. When the check fails, the `DocumentVersion` is marked `REASON_MISSING_CRITICAL` and blocked from cross-check. Never evaluated for unmatched documents.
- **Aliases in conversation:** `critical check`, `critical field check`, `quality gate 2`, `gate de campos críticos`.

### NonCriticalCheck
The evaluation of a document's non-critical-field coverage: the percentage of fields in the template's `non_critical_fields` list that extraction populated, compared against the template's `non_critical_threshold`. Carries the actual percentage, threshold, and missing fields. When coverage falls below threshold, the `DocumentVersion` is marked `REASON_LOW_NON_CRITICAL`. Never evaluated for CCB documents or documents without a matched template.
- **Aliases in conversation:** `non-critical check`, `coverage check`, `quality gate 3`, `threshold check`.

### ComprovanteEmprestimo
The document that proves the loan was granted. Can be part of a KitType, and passes through the documents extraction and validation pipeline.

---

## Liquidação

### LiquidacaoManual (Settlement Installment)

A single production settlement installment — the smallest indivisible unit of a
liquidacao batch. Represents a payment the fund received for a previously acquired
credit right. Created by splitting staging rows into matched (with acquisition
counterpart) and unmatched (no counterpart) during approval.
- **Aliases in codebase:** `liquidacao_manual`, `settlement installment`.
- **Aliases in conversation:** `parcela de liquidacao`, `settlement installment`, `baixa`.

### LiquidacaoManualSemParcela (Unmatched Settlement)

A settlement installment that has no matching acquisition record in `AquisicaoManual`.
Created during liquidacao approval when the `campo_chave`/`numero_titulo` lookup
against the acquisition table finds no match. Stored in a separate table for
reconciliation and audit purposes.
- **Aliases in conversation:** `liquidacao sem parcela`, `unmatched settlement`,
  `baixa sem correspondencia`.

---

## Estoque

### EstoqueManual (Stock Position Row)

A single row-level stock position for one contract on a given date. Imported
from external custodiante data. Contains per-installment present value (VP),
overdue amounts, PDD provisions, and payment status.
- **Aliases in codebase:** `estoque_manual`, `stock row`.
- **Aliases in conversation:** `posição do estoque`, `stock position`, `estoque row`.

### EstoqueAgregado (Aggregated Stock Position)

Aggregated stock totals per fund and date: total VP (present value), total PDD
(provision for doubtful debts), overdue totals, and execution status. Powers the
Gestao dashboard and the Pendentes/Concluidos tabs.
Note: the model class has a typo (`EstoqueFundoAgregagado` vs `EstoqueAgregado`); the canonical term is `EstoqueAgregado`.
- **Aliases in codebase:** `estoque_agregado`, `aggregated stock`.
- **Aliases in conversation:** `estoque agregado`, `aggregated position`, `posicao consolidada`.

### CalcularEstoque (Stock Calculation)

The business operation that computes a fund's aggregated stock position for a
given date. Fetches raw SQL matrix from the database, transforms via Polars
DataFrame processing, and persists the result. Can be triggered synchronously
or queued asynchronously via Celery.
- **Aliases in conversation:** `calcular estoque`, `stock calculation`, `aggregation run`.

### QueueEstoque (Async Stock Dispatch)

The operation that validates request parameters, marks the aggregate row as
"Processando", and dispatches a Celery task for async stock calculation.
Returns a task_id and status_url for polling.
- **Aliases in conversation:** `queue estoque`, `enqueue stock`, `dispatch estoque`.

### GestaoResumo (Management Dashboard Summary)

The query operation that calculates the Gestao dashboard payload: total VP,
total PDD, per-fund breakdown, and time-series arrays. Read-only, no side
effects.
- **Aliases in conversation:** `gestao resumo`, `dashboard summary`, `resumo de gestao`.
