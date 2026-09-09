---
tags: [agents, knowledge-graph, graph-rag, workflow, tools]
node_type: discovery
layer: architecture
nature: technical
status: exploratory
veracidade: medium
convicção: medium
version: 0.1.0
last_updated: 2026-03-19
---

# Knowledge Graph como Topologia para Agentes — Hipóteses e Ferramentas

A premissa que estamos assumindo: um knowledge graph rico semanticamente — com tipos de nó, arestas tipadas, hierarquia de confiança e entry points bem definidos — é o melhor mecanismo de organização de contexto para agentes LLM em um repositório de software. Agentes entram no grafo por um nó de entrada determinado pelo tipo de trabalho, traversam arestas para encontrar o contexto necessário, e tomam decisões mais precisas do que com contexto flat ou retrieval vetorial cego.

Por que isso importa nesse projeto especificamente: temos semanas de conversas acumuladas, constituições arquiteturais versionadas, specs em evolução e um grafo de símbolos de código — e cada nova sessão começa como se nada disso existisse. O problema não é falta de conhecimento, é que o conhecimento não tem forma navegável. Um grafo bem topografado resolve isso sem depender de contexto estático empacotado em todo início de sessão.

---

## Hipóteses

**H1 — Entry points determinam o alcance do traversal** *(confiança: alta)*

O nó onde o agente entra no grafo define o que ele vai conseguir encontrar dentro de um número razoável de hops. Se o entry point está errado — ou não existe — o traversal começa no lugar errado e não converge. Hoje o `AGENTS.md` não aponta para nenhum nó do vault. É como ter um grafo rico e uma porta de entrada que dá para uma sala vazia.

**H2 — Triggers contextuais são mais eficientes que carga upfront** *(confiança: alta)*

"Antes de criar um arquivo, leia `constitution_folders_structure`" carregado sob demanda consome zero tokens até ser necessário e carga total quando importa. O alternativo — carregar as constituições sempre — gasta atenção em docs que frequentemente não são relevantes. A pergunta em aberto: o agente consegue reconhecer os triggers corretamente, ou vai ignorar a instrução?

**H3 — Embeddings contextuais com grafo ao redor resolvem o handoff** *(confiança: média)*

Quando você embeda um nó do vault com o contexto relacional ao redor (quais nós apontam para ele, quais arestas tem, qual a hierarquia de confiança), o embedding captura posição semântica no grafo, não só conteúdo textual. Isso permite retrieval que respeita a estrutura — você não pega um chunk semanticamente similar mas em contexto de baixa confiança. O Google Gemini Embedding 2 suporta isso via Vertex AI com modo "document with context".

**H4 — Vocabulário compartilhado é pré-requisito do traversal** *(confiança: alta)*

Um agente que não sabe o que `derives-from` ou `evergreen` significam nesse grafo vai ler os nós como markdown genérico. A semântica estrutural some. O ponto de entrada tem que ensinar o vocabulário antes do traversal — seja inline no `AGENTS.md`, seja via um nó de dicionário que é sempre o primeiro a ser lido.

**H5 — Os dois grafos precisam de uma ponte, não de fusão** *(confiança: média)*

Vault (conhecimento de domínio) e GitNexus (símbolos de código) cobrem espaços diferentes e têm audiências diferentes. Fundir os dois cria ruído para humanos. A solução são arestas de ponte explícitas: um nó do vault sobre o sistema de eventos aponta para os símbolos do GitNexus que o implementam. O agente traversa a ponte quando relevante; o humano pode ignorar essa camada. Arestas do tipo `implements`, `violates`, `tests` são candidatas.

---

## Incertezas e problemas reais

**O problema da entropia do grafo.** Um grafo que cresce sem curadoria ativa decai. Nós de sessão acumulam sem se conectar ao grafo principal. Arestas ficam obsoletas quando o código muda. `evergreen` deixa de ser evergreen sem quem atualize. Esse é o maior risco operacional da abordagem — não é técnico, é de processo. O Bayesian Agent descrito no `ontology-architecture-draft` é a resposta arquitetural, mas é infraestrutura pesada.

**Não sabemos se o agente traversa espontaneamente.** A topologia cria gravidade, mas pressupõe que o agente vai "entrar no grafo" quando há uma questão relevante. Se ele não receber instrução explícita de que o vault existe e de como entrar, pode simplesmente agir sem buscar contexto. Isso precisa ser testado — não assumido.

**A latência do traversal é real.** Cada hop no grafo é uma leitura de arquivo ou uma chamada de ferramenta. Para um agente que precisa de 4-5 hops antes de escrever código, isso pode ser 5 tool calls só de "orientação". Precisamos entender qual é a profundidade média de traversal necessária para o trabalho que fazemos.

**Triggers contextuais requerem classificação de intenção.** "Antes de criar um arquivo" pressupõe que o agente sabe que vai criar um arquivo antes de criar. Isso é verdadeiro para ações planejadas, mas pode falhar em sequências de ações emergentes onde o agente decide o passo seguinte step-by-step. O trigger pode aparecer tarde demais.

---

## Ferramentas necessárias

**Para a estrutura do grafo:**

*Neo4j* é o candidato mais natural para hospedar o knowledge graph em produção. Tem Cypher nativo, suporta grafos tipados, tem drivers para Python e integração com LangChain/LangGraph. No momento atual, arquivos markdown com frontmatter YAML funcionam como representação flat — mas não são queryáveis. A transição para Neo4j faria sentido quando o grafo crescer além do que é gerenciável manualmente.

*PostgreSQL* já está no stack e pode hospedar a tabela `ontology_events` de audit log imutável. Isso é separável do grafo navegável: log de eventos em SQL, grafo em Neo4j.

**Para retrieval:**

*Google Gemini Embedding 2* — melhor embedding disponível do Google para texto em português e inglês misturado, que é o caso desse vault. Com Vertex AI, é possível fazer embeddings com contexto de documento (não só chunk), que é o que o Graph-Dropping RAG precisa.

*Vertex AI Vector Search* — banco de vetores gerenciado do Google. Alternativas: Weaviate (hybrid search nativo — vetor + filtros estruturais, perfeito para filtrar por `status: evergreen` antes de rankear por similaridade) e Qdrant (mais simples, também suporta payload filtering).

Para o estado atual do projeto — sem infra de embeddings — o traversal funciona com leitura direta de arquivos via tools do agente. Graph RAG com embeddings é a evolução natural quando o grafo não for mais navegável manualmente.

**Para orquestração do agente:**

*LangGraph* — extensão do LangChain para agentes com estado explícito e grafos de execução. Permite modelar o workflow do agente como um grafo (planning → traversal → execution → validation) com loops e branching. É a ferramenta mais alinhada com o modelo mental que estamos construindo.

*GitNexus MCP* — já está no stack. Para a ponte entre vault e código, o agente vai precisar traversar do vault para o GitNexus e vice-versa. A ponte de arestas `implements/violates` tornaria isso um traversal contínuo em vez de duas chamadas separadas.

**Para curadoria do grafo:**

A resposta de longo prazo é o Bayesian Agent — que periodicamente avalia edge density, age dos nós, e propõe promoções/downgrades. No curto prazo, isso é processo manual com o workflow de `close-session` existente.

---

## Conexões

| Documento | Tipo | Descrição |
|-----------|------|-----------|
| [[vault/ontology-architecture-draft.md]] | `derives-from` | Blueprint original — Graph-Dropping RAG e sistema de agentes especializados |
| [[vault/agent-navigation.md]] | `contextualizes` | Entry point existente que precisa estar linkado — resolve H4 (vocabulário) |
