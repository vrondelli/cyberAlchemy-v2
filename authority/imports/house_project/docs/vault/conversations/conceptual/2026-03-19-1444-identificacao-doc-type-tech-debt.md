---
tags: [ccb, spec, architecture]
node_type: conceptual
is_session: true
layer: [domain, architecture]
nature: [explanatory, technical]
status: active
created: 2026-03-19
timestamp: 2026-03-19T14:44:00-03:00
expires: 2026-05-18
conversation_id: 996e1c5f-71a1-4218-bd9b-18dba207cd0d
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: ["specs/002-ccb-validation-workflow/identificacao-doc-type-discovery.md"]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Evaluated Identificacao doc type discovery and assessed tech debt, domain architecture exploration."
version: 0.1.0
last_updated: 2026-03-19
---

# Avaliação do Discovery de Identificacao Doc Type e Tech Debt

**Date:** 2026-03-19 14:44 (UTC-3)
**Tags:** #ccb #spec #architecture

## Summary

Esta sessão teve como foco a revisão do documento de discovery `identificacao-doc-type-discovery.md` da pipeline de CCB. O documento original propunha unir RG, CNH, RNE e Passaporte sob um único `doc_type = "Identificacao"`, empurrando a distinção granular para o payload JSON (`id_subtype`).
Durante a avaliação, apontamos fragilidades arquiteturais como a perda de especificidade nos Kit Types e o perigo de se criar um "God Object" no `extraction_config` (misturando regexes muito diferentes em um só lugar). 
Decidimos mitigar a questão dos Kit Types adicionando suporte a restrições opcionais (`allowed_subtypes`) na engine de validação. Sobre o "God Object", decidimos que a mudança estrutural necessária para rotear templates inteligentemente no pipeline traria muita fricção e atrasaria a entrega. Portanto, aceitamos o acoplamento das regexes no template genérico provisoriamente. Para que esse débito técnico não se perca, criamos um catálogo isolado em `system-fragilities.md` restrito inicialmente ao escopo da CCB, viabilizando o desenvolvimento rápido ao mesmo tempo que mapeamos o refatoro arquitetural futuro.

### Ajuste de Modelagem e Kit Types
- **Problem/Goal:** Ao fundir diversos documentos em "Identificacao", perdíamos a capacidade de barrar envios inválidos num Kit Type rigoroso (ex: exigir estritamente CNH).
- **Decision:** Kit Types ganharão suporte dinâmico. Poderão cobrar apenas o genérico "Identificacao" (aceita qualquer sub-tipo) ou poderão receber o filtro `"allowed_subtypes": ["CNH"]`.
- **Changes:** O documento de discovery foi atualizado para prever essa flexibilidade, unindo o melhor de uma tabela de banco limpa com regras de negócios restritas quando necessário.

### Mapeamento do Débito Arquitetural (God Object Template)
- **Problem/Goal:** O uso de um único template OCR para gerenciar layouts radicalmente diferentes é uma fragilidade crônica de manutenção. Ajustar de um lado pode quebrar outro.
- **Decision:** Adiaremos a refatoração profunda do pipeline (que idealmente faria um *Multi-Template Cascade* ou *Pre-Classification Routing*). Vamos adotar a proposta atual para não engarrafar a entrega.
- **Changes:** Registramos essa limitação no novo artefato `specs/002-ccb-validation-workflow/system-fragilities.md` (F-001) para acompanhamento e posterior amortização. O discovery doc também foi adendado com referência direta a essa fragilidade documentada.

## Key Decisions

- **Kit Types:** O modelo de Kit Type deve suportar validação opcional de sub-tipos (`allowed_subtypes`) quando o `doc_type` for genérico.
- **Pragmatismo de Template:** A implementação avançará com um template massivo (God Object) para "Identificacao", assumindo o débito técnico em prol da velocidade da entrega do fluxo principal.
- **Gestão de Fragilidades:** Débitos técnicos estruturantes serão registrados em arquivos locais de contexto (`system-fragilities.md`) antes de se pensar em políticas globais de todo o Vault.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/identificacao-doc-type-discovery.md` | `modified` | Adicionado refinamentos de Kit Types e link explícito ao Tech Debt de templates. |
| `specs/002-ccb-validation-workflow/system-fragilities.md` | `created` | Catálogo de débitos técnicos registrando a limitação F-001 do God Object Template. |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/identificacao-doc-type-discovery.md]] | `refines` | Refina a proposta técnica aceita provisoriamente. |
| [[002-ccb-validation-workflow/system-fragilities.md]] | `derives-from` | A fragilidade registrada derivou da análise feita nesta sessão. |
