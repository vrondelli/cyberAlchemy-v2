---
tags: [infrastructure, cloud-run, celery, remessa, upload, memory-optimization, worker-vm, backlog]
node_type: discovery
is_session: true
layer: architecture
nature: technical
status: active
created: 2026-03-31
timestamp: 2026-03-31T15:00:00-03:00
expires: 2026-05-30
conversation_id: worker-vm-cost-analysis-2026-03-31
decisions_made: true
contradictions_found: true
contradictions_resolved: false
specs_updated:
  - specs/003-remessa-upload-with-events/2026-03-31-csv-upload-cloud-run-discovery.md
promoted_candidates:
  - "CSV upload cannot be migrated to Cloud Run Jobs without replacing the Celery task_id polling contract (candidate premise)"
  - "No SLA defined for CSV upload processing (candidate spec gap)"
expected_importance: 6
importance_rationale: "This session formally mapped the path to eliminating the worker VM and surfaced the Celery task_id coupling as a concrete blocker that any future implementation plan must resolve first."
---

# Worker VM Cost Analysis — Path to Elimination

**Date:** 2026-03-31
**Tags:** #infrastructure #cloud-run #celery #remessa #upload #memory-optimization #worker-vm

---

## Summary

Esta sessão foi focada em entender os custos de infraestrutura do worker VM e o que seria necessário para eliminá-lo. O usuário queria saber se era possível desligar o VM após a migração do bulk import para Cloud Run Jobs, e se havia caminhos para reduzir o custo mensal (~$55/mês de `e2-standard-2`).

### Thread 1 — Capacidade do worker VM

**Problema:** entender os limites de memória de cada componente de cloud.

Mapeamos a partir do Terraform e do deploy workflow:
- Worker MIG: `e2-standard-2` — **8 GB RAM**, 2 vCPU (~$55/mês)
- Cloud Run API (`zefra-hub-api`): **1 GiB**, 1 CPU
- Cloud Run Jobs (`zefra-bulk-import-worker`, `django-migrate`): **512 MiB default** (sem `--memory` configurado)

A razão para o VM precisar de 8 GB é o pipeline de upload de CSV, que usa `pl.read_csv()` carregando arquivos inteiros na RAM.

### Thread 2 — Escopo da migração de bulk import

**Problema:** o usuário queria saber se as mudanças em andamento (bulk import → Cloud Run Jobs) permitiriam desligar o VM.

**Conclusão:** não. O plano (`2026-03-31-cloud-run-jobs-bulk-import.md`) é explícito: o VM continua ligado porque `finalize_batch_task` é consumido pelo Celery worker no VM, celery-beat roda no VM, e todas as outras filas (`default`, `remessa-validation`, `remessa-recovery`) continuam no VM. A migração de bulk import resolve o OOM durante processamento de pastas, não o custo fixo do VM.

### Thread 3 — Análise de memória do upload de CSV

**Problema:** CSVs chegam a 2 GB — seria possível usar `e2-micro` ou `e2-small` para economizar?

Rastreamos o pipeline completo em `upload_rules_base.py` e `upload_service.py`:
1. `pl.read_csv()` → DataFrame completo na RAM (~3 GB para 2 GB CSV)
2. `map_elements(_parse_date)` → Python UDF, sem streaming possível
3. `split_intra_file_duplicates()` → `group_by + join + filter` — operações globais
4. Três DataFrames coexistem: `df`, `unique_df`, `to_insert_df` → pico ~9 GB

Exploramos `scan_csv` como solução. **Conclusão: scan_csv não ajudaria.** `map_elements` com função Python força `.collect()` imediatamente, e `group_by`/`unique` são operações globais independentemente do LazyFrame. Mudar para `scan_csv` sem reescrever as operações seria apenas cosmético.

**Soluções reais identificadas:**
1. Substituir `map_elements(_parse_date)` por `pl.col().str.strptime()` nativo (streamável)
2. Adicionar `del df` e `del unique_df` nos pontos certos para liberar intermediários
3. Resultado: pico cai de ~9 GB para ~4–5 GB

**Descoberta:** ao verificar o código, essas otimizações já estão implementadas (`upload_service.py` tem os `del` statements, `upload_rules_base.py` usa `str.strptime`). A sessão que fez essas mudanças não tem registro no vault.

### Thread 4 — Discovery document e perguntas abertas

Criamos `specs/003-remessa-upload-with-events/2026-03-31-csv-upload-cloud-run-discovery.md` mapeando três opções para mover o upload de CSV para fora do VM:

- **Opção A** (`scan_csv` + `del`): não resolve o VM, só reduz RAM. Já implementado.
- **Opção B** (Cloud Run Jobs para upload): elimina a dependência do VM para essa carga. Esforço médio (~3–5 dias).
- **Opção C** (migrar `remessa-validation` também): remove mais dependências do VM. Depende de B.

Respondemos 4 perguntas em aberto lendo o código:

1. **task_id — acoplamento forte:** o frontend pollar `celery.result.AsyncResult(task_id)` via `/dashboard/check_upload_status/<task_id>/` a cada 3 segundos. Migrar para Cloud Run Jobs quebra esse contrato inteiramente. Seria necessário uma tabela `UploadJob` no DB + endpoint de polling próprio + atualização do frontend.

2. **SLA:** nenhum definido no código. O task Celery não tem timeout. O Cloud Run Job de bulk import usa 10 min como referência.

3. **Filtros de elegibilidade:** são bloqueantes — `RunFiltersService.run()` roda dentro do mesmo Celery task de upload, síncronos. A fila `remessa-validation` não tem nada a ver com upload — existe apenas para `approve/reject_remessa` (ações manuais do operador).

4. **Monitoramento:** nenhum (sem Sentry, sem Flower). Apenas EventLog no DB + gcplogs. Cloud Run Jobs seria uma melhoria de observabilidade nesse aspecto.

### Thread 5 — Backlog

Criamos `refactors/infrastructure/backlog.md` com 3 itens priorizados:
- **HIGH** (✅ DONE): otimização de memória com `str.strptime` + `del` — já implementado
- **MEDIUM** (❌): migrar upload CSV para Cloud Run Jobs — bloqueado pelo contrato de task_id
- **LOW** (❌): eliminar VM completamente — bloqueado pelos itens MEDIUM + migração de beat + demais filas

---

## Epistemic Impact

**Crença contestada:** havia uma suposição implícita de que a migração do bulk import para Cloud Run Jobs seria suficiente para viabilizar o desligamento do VM. Esta sessão demonstrou que é falsa — o VM permanece necessário para beat, finalize_batch_task e todas as outras filas. Essa suposição não tinha registro explícito no vault.

**Drift descoberto:** as otimizações de memória do pipeline de upload (`del` statements + `str.strptime`) foram implementadas em uma sessão anterior sem registro no vault. O backlog foi criado já com esse item como DONE para preservar a informação.

**Candidates para promoção:**
- *"CSV upload não pode ser migrado para Cloud Run Jobs sem substituir o contrato de polling por task_id Celery"* — merece tornar-se premise quando a Opção B for planejada.
- *"Não há SLA definido para processamento de upload de CSV"* — merece spec ou ADR antes de configurar timeout no Cloud Run Job.

---

## Modified Artifacts

| Artifact | Action | What changed and why |
|---|---|---|
| `specs/003-remessa-upload-with-events/2026-03-31-csv-upload-cloud-run-discovery.md` | created | Discovery mapeando 3 opções para eliminar dependência do VM no upload de CSV, com 4 perguntas abertas respondidas via leitura do código |
| `refactors/infrastructure/backlog.md` | created | Backlog de infraestrutura com caminho priorizado para eliminação do VM; memória já otimizada (DONE), upload CSV para Cloud Run (MEDIUM), VM elimination completa (LOW) |

---

## Connections

- `contextualizes` → `refactors/infrastructure/2026-03-31-cloud-run-jobs-bulk-import.md` — esta sessão explica por que o plano de bulk import não é suficiente para desligar o VM
- `extends` → `specs/003-remessa-upload-with-events/discovery.md` — adiciona análise de infraestrutura ao pipeline de upload já documentado

---

## Gaps & Backlog

| Item | Source | Priority | Status |
|---|---|---|---|
| Migrar upload CSV para Cloud Run Jobs (Opção B) | Discovery + backlog | MEDIUM | open |
| Quebrar acoplamento do `task_id` Celery — substituir polling frontend por mecanismo durável | Thread 4, pergunta 1 | MEDIUM | open — blocker para Cloud Run migration |
| Definir SLA para processamento de upload de CSV | Thread 4, pergunta 2 | MEDIUM | open |
| Adicionar monitoramento além do EventLog (alertas por tempo de processamento, taxa de falha) | Thread 4, pergunta 4 | LOW | open |
| Eliminar worker VM completamente | Backlog | LOW | blocked — depende de Cloud Run migration + extração do celery-beat |

---

## Open Questions

- O frontend React/JS usa a mesma URL de polling para o upload via API (`api_views.py`) ou só o template Django (`upload_movimentations.html`)? Apenas o template foi confirmado.
- Qual é o tempo real de processamento de um CSV de 2 GB com as otimizações já implementadas? Sem benchmark registrado.
