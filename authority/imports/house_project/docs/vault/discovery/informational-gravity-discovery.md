---
tags: [agents, workflows, ontology, discovery, conceptual]
node_type: discovery
layer: architecture
nature: conceptual
status: exploratory
veracidade: medium
convicção: low
version: 0.1.0
last_updated: 2026-03-19
---

# Discovery: Topologia Informacional e Gravidade no Espaço-Tempo

> **Contexto:** Artefato exploratório para registrar uma fundação conceitual sobre como organizar o conhecimento e otimizar o fluxo dos agentes no projeto. Nenhuma implementação é proposta aqui; o objetivo é alinhar vocabulário, hipóteses e levantar dúvidas para o futuro.

---

## 1. O Conceito Central: Gravidade e Espaço-Tempo Informacional

Em vez de enxergar o contexto do agente apenas como uma "pasta de arquivos" (onde todos têm peso igual), propomos pensar no ecossistema do projeto como um **tecido espaço-tempo de informação**. Essa topologia informacional possui uma propriedade **gravitacional**: documentos e regras essenciais (como Constituições e Workflows) criam "distorções" no tecido, puxando (atraindo) o agente naturalmente para onde as respostas certas estão localizadas.

O Roteador de Contexto no `AGENTS.md` é a nossa primeira tentativa manual de criar essa "ladeira" gravitacional, empurrando o agente para os documentos mais densos de significado logo no início do movimento. 

### Por que acreditamos nisso? (A Hipótese)

Um modelo puramente baseado em restrições ("never do X") exige esforço constante de policiamento (energia). Um espaço topológico bem desenhado **reduz o custo energético de raciocínio**. Se a rota natural que o agente percorre já converge para o documento correto, o agente comete menos erros de premissa (alucinações arquiteturais) e toma decisões mais precisas sem precisar de supervisão explícita constante.

## 2. A Evolução: Rastros, Entropia e Modelos Observadores

No mundo ideal (uma fase muito mais avançada deste ecossistema), a gravidade de um documento não seria definida estaticamente por nós, mas emergiria dinamicamente pelo uso.

A proposta é que **SLMs (Small Language Models)** ou modelos de baixo custo atuem como observadores passivos (uma "camada sensória") acompanhando o trabalho dos agentes principais ao longo do tempo.

O papel desses observadores seria juntar dados através das seguintes métricas de navegação:

- **Rastro do Agente:** Quais arquivos o agente leu, na ordem em que leu, antes de conseguir formular um plano válido ou realizar uma refatoração correta?
- **Medição de Entropia:** Quão confuso ou incerto o agente estava em determinado ponto? (Métricas proxy: uso de verbos de incerteza em seus pensamentos, número de retentativas de comandos no terminal, buscas repetidas pelo mesmo termo com slight changes).
- **Colapso da Entropia:** Quando e com qual documento a entropia caiu vertiginosamente? Ou seja, "qual contexto lido fez com que o agente destravasse completamente e finalizasse a task com sucesso?".

## 3. Em Que Isso Pode Ajudar?

- **Ponderação Real do Vault:** Arquivos que historicamente "curam a entropia" do agente ganhariam massa gravitacional e passariam a ser os primeiros no roteamento dinâmico. Arquivos que apenas incham o contexto sem reduzir a incerteza perderiam densidade.
- **RAG Ponderado pelo Uso:** Em mecanismos de Graph-Dropping RAG futuros, o *retrieval* não dependeria apenas de similaridade de embeddings (vetores), mas da histórica probabilidade daquele nó ter sido o que resolveu um bloqueio (grafo de sucesso interativo).
- **Detecção Pró-ativa de Documentos Falhos:** Se o agente lê um arquivo X e sua entropia *aumenta* (ele passa a dar voltas e cometer mais erros no código logado), o SLM pode marcar o arquivo com uma flag de `requires-review` ou `low-signal-to-noise`, indicando que ele é fonte de confusão.

## 4. Questões em Aberto e Dúvidas (Para Explorar)

- **Como medir a entropia (incerteza) do agente de forma sistemática e com baixo custo de API?** Será que SLMs baratos são capazes de perceber o grau de variação no pensamento de um modelo maior (Frontier/Main Agent)?
- **Cálculo de Massa e Distorção:** Como traduzir "número de bloqueios curados" em "peso/gravidade" que o roteamento dinâmico do contexto possa consumir matematicamente?
- **Como isolar covariáveis?** Se o agente leu 3 documentos simultaneamente (A, B e C), como o SLM atribui qual deles colapsou a entropia e resolveu o problema inicial? 
- **Privacy/Storage:** Como armazenar eficientemente essas sessões e telemetria para treinar os pesos gravitacionais do RAG depois?

## 5. Referências para Estudo e Exploração Futura

- **Hierarchical/Supervisor Agent Patterns:** Literaturas sobre arquitetura multi-agente, em que a delegação ou supervisão da execução é feita por agentes secundários. E.g., o framework [AutoGen (Microsoft)](https://microsoft.github.io/autogen/) ou o [LangGraph](https://python.langchain.com/v0.1/docs/langgraph/).
- **Entropy in Attention Mechanisms:** Pesquisas em inferência de Language Models sobre medir "uncertainty / perplexity" nas distribuições de token. Como adaptar essas métricas de baixo nível para "incerteza no fluxo de pensamento ou decisão em loop".
- **Lost in the Middle (Liu et al., 2023) [citado anteriormente]:** Retomando a literatura de Information Retrieval em LLMs para entender o quão ineficiente é quando o tecido gravitacional não coloca a informação correta na "visão principal" do agente.
- **Reinforcement Learning from AI Feedback (RLAIF) / Reward Models:** A ideia de usar um LLM menor para recompensar comportamentos e atualizar pesos é conceitualmente análoga a como os LLMs modernos são treinados com preferência.
