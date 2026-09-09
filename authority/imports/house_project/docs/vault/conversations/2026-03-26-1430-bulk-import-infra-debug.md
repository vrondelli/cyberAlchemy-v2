---
tags: [infrastructure, pipeline, ccb, frontend]
node_type: spec
is_session: true
layer: application, infrastructure
nature: technical
status: active
created: 2026-03-26
timestamp: 2026-03-26T14:30:00-03:00
expires: 2026-05-25
conversation_id: bulk-import-infra-debug-2026-03-26
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 3
importance_rationale: "Fixed three compounding infrastructure bugs (whitenoise not installed in Docker image, collectstatic in wrong Docker phase, Celery never registering bulk_import tasks) that together blocked the entire CCB bulk import pipeline from functioning locally."
---

# Bulk Import — Debug de Infraestrutura e Pipeline

**Date:** 2026-03-26 14:30 (UTC-3)
**Tags:** #infrastructure #pipeline #ccb #frontend

## Summary

Sessão de debugging iniciada pelo usuário reportando que a aba "Importar Documentos" em `/contratos` não exibia os lotes já importados e que tentativas de upload falhavam. A investigação revelou três bugs independentes em camadas distintas do sistema que se somavam para bloquear completamente o funcionamento do bulk import localmente.

O primeiro bug era no frontend: `loadHistory` captura todos os erros silenciosamente (`catch { /* silent */ }`), então qualquer falha na API simplesmente deixa o histórico vazio sem feedback ao usuário. O segundo bug era de infraestrutura: o `whitenoise` foi adicionado ao `MIDDLEWARE` do Django mas o container Docker usava uma imagem buildada antes do pacote ser adicionado ao `requirements.txt`, causando `ModuleNotFoundError` que impedia o servidor de subir. O terceiro bug era de configuração do Celery: as tasks de bulk import estavam em `domains/documents_validation/tasks/bulk_import_tasks.py` mas o `__init__.py` do pacote `tasks/` estava vazio, impedindo o `autodiscover_tasks` de registrá-las.

O fix do Docker envolveu mover o `collectstatic` do build-time para o runtime via `entrypoint.sh`, resolvendo também o problema de env vars não disponíveis durante o build. O fix do Celery foi popular o `__init__.py` com os imports das tasks.

### Histórico de lotes não exibido

- **Problem/Goal:** Aba "Importar Documentos" não mostrava lotes anteriores apesar de existirem no banco.
- **Decision:** O bug primário era o `catch { }` silencioso em `loadHistory` mascarando falhas reais. A condição `history.length > 0 && status === "idle"` não era o problema pois o componente remonta a cada troca de aba.
- **Changes:** Não corrigido no código frontend (ficou como backlog). A causa raiz era o backend indisponível.

### Docker — ModuleNotFoundError whitenoise

- **Problem/Goal:** Container `house_project_api` falhava ao iniciar com `ModuleNotFoundError: No module named 'whitenoise'` — imagem buildada antes do pacote ser adicionado.
- **Decision:** Rebuild com `--build` força reinstalação dos pacotes. Descoberto também que `collectstatic` no Dockerfile falha porque `SECRET_KEY` e `POSTGRES_PASSWORD` só existem no runtime.
- **Changes:** Criado `entrypoint.sh` que roda `collectstatic` no startup; Dockerfile atualizado para usar `ENTRYPOINT ["/app/entrypoint.sh"]` removendo o `RUN collectstatic` do build.

### entrypoint.sh — permission denied

- **Problem/Goal:** Após criar o entrypoint, containers falhavam com `exec /app/entrypoint.sh: permission denied`.
- **Decision:** O volume mount `. :/app` do docker-compose sobrescreve os arquivos do container com os do host, incluindo permissões. O `chmod +x` no Dockerfile é ineficaz quando há volume mount.
- **Changes:** `chmod +x entrypoint.sh` executado no host para que a permissão seja preservada no volume mount.

### Celery — tasks de bulk import não registradas

- **Problem/Goal:** Upload funcionava mas pastas carregavam infinitamente — Celery nunca processava as tasks. Log do worker confirmou: nenhuma task `bulk_import.*` na lista de tasks registradas.
- **Decision:** `autodiscover_tasks` do Celery procura por módulo `tasks` em cada app. Encontrou o pacote `tasks/` mas `__init__.py` vazio não importava `bulk_import_tasks.py`.
- **Changes:** `domains/documents_validation/tasks/__init__.py` populado com imports de `process_bulk_import_task`, `run_ocr_task`, `process_folder_task`, `finalize_batch_task`.

Key outputs:
- `entrypoint.sh` — criado; roda collectstatic antes de iniciar o servidor
- `Dockerfile` — modificado; collectstatic removido do build, entrypoint adicionado
- `domains/documents_validation/tasks/__init__.py` — modificado; tasks de bulk import agora registradas no Celery

## Key Decisions

- **Entrypoint para collectstatic:** Mover `collectstatic` do Dockerfile (`RUN`) para `entrypoint.sh` é o padrão correto quando settings.py requer env vars obrigatórias — o build não tem acesso a essas vars, o runtime sim.
- **Volume mount sobrescreve chmod:** Em dev com `volumes: .:/app`, permissões de arquivo devem ser definidas no host, não no Dockerfile.
- **Celery autodiscovery requer `__init__.py` não-vazio:** Quando tasks estão em submódulos (ex: `tasks/bulk_import_tasks.py`), o `__init__.py` do pacote `tasks/` precisa importá-las explicitamente para o autodiscover funcionar.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `entrypoint.sh` | `created` | Script de startup que roda collectstatic antes do CMD |
| `Dockerfile` | `modified` | Removido `RUN collectstatic`, adicionado `ENTRYPOINT` |
| `domains/documents_validation/tasks/__init__.py` | `modified` | Imports das 4 tasks de bulk import para registro no Celery |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| `loadHistory` catch silencioso em `BulkImportTab` | Diagnóstico frontend | MEDIUM | Aberto — falhas de API não têm feedback visual |

## Open Questions

- As pastas carregaram corretamente após o fix do Celery? (sessão encerrada antes de confirmar)
