---
tags: [infrastructure, pipeline, frontend]
node_type: implementation-plan
is_session: true
layer: architecture, application
nature: technical, procedural
status: active
created: 2026-03-27
timestamp: 2026-03-27T18:00:00-03:00
expires: 2026-05-26
conversation_id: signed-url-upload-plan-2026-03-27
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "Produced a 7-task implementation plan resolving the Cloud Run 32 MB request limit that blocks 100% of large-file uploads (CSV remessas up to 500 MB, ZIP bulk imports over 1 GB) by migrating to a 3-step signed URL flow."
---

# Signed URL Upload Migration — Discovery Evaluation and Implementation Plan

**Date:** 2026-03-27 18:00 (UTC-3)
**Tags:** #infrastructure #pipeline #frontend

## Summary

Esta sessão avaliou o discovery document `refactors/infrastructure/signed-url-upload-discovery.md`, que propõe migrar os dois fluxos de upload de arquivos grandes do projeto para um modelo de signed URL direto ao GCS/MinIO. O problema central é que o Cloud Run impõe um limite de 32 MB no corpo de qualquer requisição HTTP, o que bloqueia completamente os uploads de CSVs de remessa (até 500 MB) e ZIPs de bulk import (acima de 1 GB).

A análise confirmou o problema no código real: `UploadMovimentationsAPI` usa `MultiPartParser/FormParser`, e `BulkImportUploadView` chama `uploaded_file.read()` carregando o ZIP inteiro em memória antes de passá-lo para `create_bulk_import_batch(zip_bytes=zip_bytes, ...)`. Com um container de 1 Gi de memória no Cloud Run, um ZIP de 1 GB causaria OOM antes mesmo do HTTP 413 entrar em cena.

A solução proposta no discovery — fluxo 3 passos: request signed URL → PUT direto ao GCS → confirmação JSON ao backend — foi validada como correta e implementável sem alterar os Celery workers. O MinIO SDK já suporta `presigned_put_object` nativamente para o ambiente local.

Uma nuance importante foi identificada que o discovery não detalhou explicitamente: `create_bulk_import_batch` atualmente valida o ZIP (tamanho e integridade) sobre os bytes em memória. Com signed URL, esse arquivo chega direto ao storage sem passar pelo Django, então essa validação precisa migrar para o Celery worker — que já re-lê o ZIP de qualquer forma. O plano contempla isso com uma nova função `create_bulk_import_batch_from_key`.

O plano de implementação foi escrito com 7 tasks, todas com código completo, testes TDD e comandos exatos, e salvo em `refactors/infrastructure/2026-03-27-signed-url-upload.md`.

### Análise do problema

- **Problem/Goal:** Verificar se o problema levantado no discovery é real e se a solução faz sentido antes de investir em implementação.
- **Decision:** Problema 100% confirmado no código. Solução válida e bem delimitada — Celery tasks não mudam, apenas os endpoints de upload e os hooks de frontend.
- **Changes:** Nenhuma alteração de código nesta sessão — apenas análise.

### Nuance de validação do ZIP

- **Problem/Goal:** O discovery não detalha o que acontece com a validação de tamanho e integridade do ZIP que hoje ocorre em `create_bulk_import_batch(zip_bytes)`.
- **Decision:** Com signed URL, a validação precisa ser adiada para o worker Celery. Isso é aceitável porque o worker já precisa re-ler o ZIP para processá-lo — a validação não se perde, apenas se desloca.
- **Changes:** O plano define `create_bulk_import_batch_from_key(gcs_key, filename, actor)` como nova função que recebe o caminho no storage em vez dos bytes, e delega a validação ao worker.

### Plano de implementação

- **Problem/Goal:** Traduzir o discovery em tarefas concretas com código completo, testes e commits.
- **Decision:** 7 tasks cobrindo: (1) `generate_presigned_upload_url` na camada de storage, (2) endpoint CSV + confirmação, (3) endpoint ZIP + `create_bulk_import_batch_from_key`, (4) CORS no Terraform, (5) hook frontend CSV, (6) componente frontend ZIP, (7) CORS local MinIO.
- **Changes:** Criado `refactors/infrastructure/2026-03-27-signed-url-upload.md`.

Key outputs:
- `refactors/infrastructure/2026-03-27-signed-url-upload.md` — plano completo de implementação com 7 tasks, TDD, código completo

## Key Decisions

- **Signed URL como solução:** A abordagem de 3 passos (request URL → PUT direto → confirmação) é a solução correta para o limite de 32 MB do Cloud Run. Não existe alternativa que mantenha o modelo de upload via Django.
- **Validação do ZIP adiada para Celery:** Com signed URL, o Django não vê mais o binário — a validação de tamanho e integridade do ZIP migra para o worker, que já processa o arquivo de qualquer forma. Tradeoff aceitável.
- **`create_bulk_import_batch_from_key` como nova função:** Em vez de modificar `create_bulk_import_batch` (que tem testes extensivos e é chamada em outros contextos), cria-se uma nova função paralela que aceita `gcs_key` em vez de `zip_bytes`. Mantém backward compatibility.
- **MinIO suporta presigned PUT nativamente:** O SDK `minio-py` tem `presigned_put_object` — o fluxo funciona localmente sem dependência de GCP.
- **Celery tasks inalteradas:** Ambas as tasks (CSV e ZIP) já recebem um storage path — não precisam mudar.

## Files Changed

### Code

Nenhum código alterado nesta sessão — apenas análise e planejamento.

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `refactors/infrastructure/signed-url-upload-discovery.md` | `read` | Discovery document avaliado — problema e solução confirmados |
| `refactors/infrastructure/2026-03-27-signed-url-upload.md` | `created` | Plano de implementação com 7 tasks, TDD completo |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| MinIO CORS local (Task 7) | Plano | MEDIUM | Pendente — requer setup manual de ambiente, não vai para código |
| Upload progress tracking via XHR | Discovery (mencionado como possível) | LOW | Não incluído no plano — melhoria futura após a migração |

## Open Questions (Resolved)

- **`default_storage.exists()` vs MinIO direto:** RESOLVIDO. `default_storage` é Django FileSystemStorage em dev (só aponta para GCS quando `STORAGE_BACKEND=gcs`). O plano foi atualizado para usar `get_minio_client().stat_object()` direto, que funciona tanto em dev (MinIO) quanto em produção (GCS via MinIO gateway). A checagem de existência via `stat_object` é suficiente — o Celery worker valida integridade e tamanho ao processar.
- **Celery timeout vs Cloud Run:** RESOLVIDO. Celery workers rodam em Compute Engine (MIG com Docker), não no Cloud Run. O timeout do Cloud Run não afeta o processamento dos workers. Confirmado em `gcp-infrastructure-migration.tf` (resource `google_compute_instance_group_manager.worker`).
