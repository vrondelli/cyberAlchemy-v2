---
tags: [infrastructure, aquisicao]
node_type: spec
is_session: true
layer: [architecture, domain]
nature: technical
status: active
created: 2026-03-23
timestamp: 2026-03-23T13:55:00-03:00
expires: 2026-05-22
conversation_id: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-23

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 4
importance_rationale: "Configurou as credenciais do Terraform (tfvars) e o nome do Artifact Registry para o primeiro deploy na GCP, além de um ajuste pontual na extração de Holerites."
---

# Infrastructure Terraform Setup & Holerite Regex

**Date:** 2026-03-23 13:55 (UTC-3)
**Tags:** #infrastructure #aquisicao

## Summary

Esta sessão foi focada em preparar o ambiente local do desenvolvedor para a execução inicial do Terraform (Fase 1 da migração GCP), resolvendo os artefatos de configuração necessários. Revisamos a documentação de infraestrutura (`migration-preflight-checklist.md`), identificamos a necessidade do arquivo `terraform.tfvars` preenchido e das ferramentas de CLI (`gcloud` e `terraform`) autenticadas.
Durante a sessão, o repositório Docker base no código do Terraform foi alterado de `house-project` para o nome de produção real `zefra-hub-prod`, refletindo-se em diversos `.tf` e artefatos em markdown. Aproveitamos também para adicionar as pastas padrão do Terraform ao `.gitignore`. Em paralelo, o usuário realizou uma alteração manual no código de domínio para adicionar suporte à sigla `HOL_` nos arquivos de Holerite.

### Configuração Inicial do Terraform
- **Problem/Goal:** Habilitar o desenvolvedor a rodar o pipeline do Terraform para provisionar a infraestrutura básica na GCP.
- **Decision:** As senhas do banco e cache deveriam ser geradas de forma nova, exclusivas para a infra. A secret_key do Django também foi gerada via script.
- **Changes:** Criação do arquivo `terraform.tfvars`, não versionado no git.

### Padronização de Nomenclatura GCP
- **Problem/Goal:** O código `.tf` referia-se abstratamente a `house-project-django` no Artifact Registry, o que divergia da intenção de produção informada pelo usuário (`zefra-hub-prod/zefra-hub:latest`).
- **Decision:** Renomear as labels e ids de todos os recursos da GCP no Terraform e nos MDs anexos, trocando "house-project" pela nomenclatura-alvo "zefra-hub".
- **Changes:** Global replace em scripts, tf e docs na pasta `/refactors/infrastructure/`.

### Segurança do Git
- **Problem/Goal:** Ao gerar arquivos locais estaticos do Terraform, há risco de commitar estado (tfstate) ou segredos (tfvars).
- **Decision:** Bloquear no repositório geral qualquer state e configuração sensível.
- **Changes:** Inseridas as diretrizes de Terraform no rodapé do `.gitignore`.

### Suporte a Holerites Abreviados
- **Problem/Goal:** A classificação de arquivos falhava caso um Holerite contivesse nome `HOL_` ao invés de `HOLERITE` explicitamente.
- **Decision:** Flexibilizar o template matching do domínio de aquisição.
- **Changes:** Adicionado regex `HOL_` em `template_matching_config.py`.

## Key Decisions

- **Infrastructure Credentials:** As credenciais e secrets do Cloud SQL, Redis e Django foram consolidadas no arquivo `.tfvars` visando uso no Secret Manager.
- **Artifact Registry Repository:** O repositório foi batizado como `zefra-hub-prod` para comportar as imagens `zefra-hub`.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `refactors/infrastructure/terraform.tfvars` | `created` | Arquivo contendo input das variáveis confidenciais. |
| `refactors/infrastructure/gcp-infrastructure-migration.tf` | `modified` | Renomeado o sufixo "house-project" para "zefra-hub" nos resources. |
| `.gitignore` | `modified` | Adicionados patterns para ocultar `.terraform/`, `*.tfstate`, e `*.tfvars`. |
| `domains/aquisicao/domain/template_matching_config.py` | `modified` | Adicionada sintaxe regex para "HOL_" na captura de Holerite. |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `refactors/infrastructure/gcp-infrastructure-migration.md` | `modified` | Atualização do nome do app para manter paridade. |
| `refactors/infrastructure/migration-phase-guide.md` | `modified` | Atualização dos comandos substituindo house-project por zefra-hub. |
| `refactors/infrastructure/terraform-decisions.md` | `modified` | Reflete IDs de repositório alterados para Terraform provision. |
| `refactors/infrastructure/pre-migration-code-changes.md` | `modified` | Reflete CLI atualizada. |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Executar as Fases 0 e 1 localmente (`terraform apply`). | Checklist migração | ⚠️ HIGH | Pending |
