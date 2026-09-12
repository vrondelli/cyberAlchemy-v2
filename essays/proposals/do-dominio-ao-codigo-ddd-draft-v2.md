# Proposta de palestra — Do domínio ao código com DDD

Status: draft v2, candidato para revisão humana  
Data: 2026-09-09  
Formato: proposta de palestra com roteiro e exemplos para desenvolvimento da fala  
Duração proposta: 35 minutos + 5 minutos de perguntas  
Idioma: português

## Material de submissão

### Título

**“Em estoque” para quem? Do domínio ao código com DDD**

*Como a investigação de um produto devolvido evolui a Linguagem Ubíqua, os Bounded Contexts e as regras no código.*

### Resumo curto

Um laptop devolvido aparece como “em estoque” antes de passar pela inspeção de qualidade. Os eventos chegam corretamente e cada serviço cumpre sua regra. Mesmo assim, a loja vende uma unidade que deveria estar bloqueada.

Vamos acompanhar essa investigação usando Domain-Driven Design: conversar com especialistas, descobrir os diferentes significados de “em estoque”, refinar a Linguagem Ubíqua e revisar as fronteiras dos Bounded Contexts. Depois, levaremos essas descobertas ao Design Tático, com um Aggregate Root que protege a regra de vendabilidade e Domain Events que dão origem à integração entre armazém, qualidade e loja. A Ontology Engineering entra como complemento para explicitar relações e restrições que ajudam a melhorar essas decisões de design.

### Resumo completo

O ticket parece simples: “laptops devolvidos aparecem como disponíveis antes da inspeção”. A equipe procura mensagens duplicadas, cache desatualizado e eventos fora de ordem. Nenhuma dessas hipóteses explica o problema. O sistema reproduz o defeito de maneira determinística.

A investigação avança quando desenvolvedores e especialistas do negócio comparam o que cada área entende por “em estoque”. Para o armazém, significa que a unidade chegou. Para a qualidade, ela ainda precisa ser avaliada. Para a loja, significa que pode ser oferecida a um cliente. Uma expressão aparentemente compartilhada estava escondendo decisões diferentes.

Usaremos esse caso fictício para mostrar DDD em ação. No Design Estratégico, veremos como as conversas com o negócio evoluem a Linguagem Ubíqua e revelam limites de modelo: quem registra presença física, quem decide a aprovação de qualidade e quem responde pela elegibilidade de uma unidade para venda. Construiremos um Context Map e discutiremos como mudar uma integração que tratava o recebimento no armazém como autorização para vender.

A Ontology Engineering participará dessa descoberta como uma ferramenta complementar. Ao explicitar que presença física e vendabilidade são condições distintas, e que uma aprovação se refere a uma inspeção de uma unidade em determinado ciclo de devolução, ela nos ajuda a formular perguntas melhores. As respostas voltam ao DDD como termos mais precisos, responsabilidades mais claras e contratos entre contextos.

No Design Tático, transformaremos a regra acordada com o negócio em comportamento de um Aggregate Root: uma unidade devolvida só pode ser liberada para venda quando o recebimento e a aprovação da inspeção do ciclo atual estiverem registrados. Veremos o código dessa decisão, os eventos que comunicam seus resultados e os testes que impedem a repetição do bug. Também discutiremos por que a loja pode manter uma projeção de disponibilidade, enquanto a reserva precisa ser validada pelo modelo responsável pela unidade.

Ao final, teremos seguido o caminho do ticket até a mudança de software: descoberta com especialistas, evolução da linguagem, revisão das fronteiras, proteção de invariantes, integração por eventos e testes de comportamento. O objetivo é mostrar como o conhecimento produzido durante uma investigação muda o design e permanece reconhecível no código.

### O que a audiência levará

- Perguntas para revelar diferentes significados por trás de uma palavra compartilhada entre equipes.
- Um exemplo de evolução da Linguagem Ubíqua e de revisão de Bounded Contexts a partir de um bug.
- Um Context Map que separa fatos logísticos, decisões de qualidade e decisões comerciais.
- Um exemplo de Aggregate Root que protege uma invariante de vendabilidade.
- Um fluxo de Domain Events e eventos de integração, com os limites de consistência que precisam ser tratados.
- Uma forma de usar Ontology Engineering para enriquecer a modelagem conduzida por DDD.

### Público-alvo e nível

Nível intermediário. Pessoas desenvolvedoras, arquitetas, tech leads e profissionais de produto que trabalham com regras distribuídas entre equipes, serviços e eventos. Os conceitos de DDD serão apresentados pelo caso; conhecimento prévio de ontologias não é necessário.

### Roteiro de 35 minutos

| Tempo | Movimento da palestra | Resultado mostrado |
| --- | --- | --- |
| 0–5 min | Reproduzir o bug do laptop devolvido | A trilha de eventos funciona, mas a decisão de venda está incompleta. |
| 5–13 min | Investigar o domínio com especialistas | “Em estoque” se desdobra em termos que expressam decisões diferentes. |
| 13–19 min | Revisar os limites e as integrações | Context Map e contratos; a análise ontológica ajuda a precisar duas relações do caso. |
| 19–29 min | Levar as descobertas ao Design Tático | Aggregate Root, invariante, Domain Events e integração com a loja. |
| 29–35 min | Fechar o ticket com testes e consequências | Regressão, mensagens repetidas e limites da projeção de disponibilidade. |
| 35–40 min | Perguntas | Discussão com o público. |

## Desenvolvimento da fala e exemplos

### 1. A descoberta muda a Linguagem Ubíqua

“Antes de alterar a condição no código, vamos chamar quem recebe a devolução, quem inspeciona a unidade e quem promete a entrega ao cliente. Quando cada pessoa diz ‘em estoque’, qual decisão está tomando?”

| Expressão inicial | Pergunta ao especialista | Termo proposto no respectivo modelo |
| --- | --- | --- |
| “Entrou no estoque.” | A unidade chegou fisicamente ou já pode ser vendida? | Unidade recebida, no Armazém. |
| “O produto está aprovado.” | Qual unidade foi inspecionada? A aprovação é de qual devolução? | Inspeção aprovada para o ciclo atual, em Qualidade. |
| “Está disponível.” | A unidade atende às condições de venda ou aparece em uma consulta da loja? | Unidade liberada para venda, em Comercialização; disponibilidade exibida, na Loja. |
| “Pode vender.” | A unidade ainda está livre ou já foi prometida a outro pedido? | Unidade reservada para um pedido, em Comercialização. |

Esses nomes são hipóteses para validar com as pessoas do negócio. A Linguagem Ubíqua evolui dentro de cada Bounded Context, nas conversas, nos exemplos e no código. Não precisamos impor um único significado de “disponível” a toda a empresa. Precisamos tornar explícito onde cada significado vale e como atravessa uma fronteira. [Referência: Linguagem Ubíqua](https://martinfowler.com/bliki/UbiquitousLanguage.html).

### 2. A descoberta muda os Bounded Contexts

No desenho inicial do caso, uma projeção consumia `UnidadeRecebida` e incrementava o saldo vendável. A regra comercial estava escondida nessa tradução.

O desenho proposto torna a decisão explícita:

```text
Armazém ── recebimento da unidade ───────────┐
                                           v
                                  Comercialização ── elegibilidade ──> Loja
                                           ^
Qualidade ── resultado da inspeção ──────────┘
```

Armazém e Qualidade fornecem fatos em contratos publicados. Comercialização traduz esses contratos para seu próprio modelo, combinando os fatos com a política comercial acordada. A Loja projeta o resultado para consulta e solicita uma reserva a Comercialização quando o cliente tenta comprar.

Essa tradução pode ser implementada por uma camada anticorrupção: `RECEIVED` do Armazém passa a significar recebimento confirmado, sem importar a interpretação de que a unidade está vendável.

Os contextos são uma proposta para o caso, a validar pelas responsabilidades, pela linguagem e pela evolução de cada modelo. Um serviço existente não determina sozinho um Bounded Context; também não precisamos criar um novo microsserviço para cada termo descoberto. A revisão pode começar dentro de um monólito modular. [Referência: Bounded Context](https://martinfowler.com/bliki/BoundedContext.html).

### 3. A Ontology Engineering enriquece a decisão de design

Neste ponto, usamos duas perguntas complementares de modelagem:

- **Estamos falando da mesma coisa?** Um SKU identifica um tipo de produto; a inspeção se refere a uma unidade física. A aprovação de um laptop não libera todas as unidades daquele SKU.
- **Essa relação ainda vale?** Uma inspeção pertence a um ciclo de devolução. Uma aprovação anterior não libera automaticamente a unidade que voltou ao armazém depois de outra venda.

As distinções viram decisões de DDD: `UnidadeId` e `CicloDevolucaoId` passam a integrar os contratos; Qualidade continua responsável pelo resultado da inspeção; Comercialização passa a exigir uma aprovação aplicável ao ciclo atual. A relação “aprovação de qualidade condiciona a vendabilidade” é discutida com o responsável pela política comercial antes de entrar no modelo.

O ganho aparece na Linguagem Ubíqua, nas fronteiras e nos invariantes. Não é necessário introduzir um grafo ou uma plataforma de ontologias para demonstrar esse ganho na palestra.

### 4. O Aggregate Root protege a regra

Para o recorte didático, o agregado `UnidadeComercializavel` pertence a Comercialização e representa uma unidade física em seu ciclo atual de devolução. Seu Aggregate Root concentra a decisão de liberação. Ele recebe fatos traduzidos pelos handlers de aplicação; não acessa diretamente o banco de Qualidade nem contém o agregado do Armazém.

Regra acordada para o exemplo: **liberar a unidade exige recebimento confirmado e inspeção aprovada para o mesmo ciclo de devolução**. A reserva exige, adicionalmente, que a unidade esteja liberada e ainda não reservada.

Pseudocódigo com sintaxe próxima de TypeScript; os tipos de identificação representam Value Objects. Persistência, coleta de eventos e controle de concorrência foram omitidos do trecho para destacar o comportamento:

```typescript
class UnidadeComercializavel {
  private recebida = false;
  private qualidade: "PENDENTE" | "APROVADA" | "REPROVADA" = "PENDENTE";
  private estado: "BLOQUEADA" | "LIBERADA" | "RESERVADA" = "BLOQUEADA";

  constructor(
    readonly id: UnidadeId,
    readonly ciclo: CicloDevolucaoId,
  ) {}

  confirmarRecebimento(ciclo: CicloDevolucaoId) {
    this.exigirCicloAtual(ciclo);
    this.recebida = true;
    this.tentarLiberar();
  }

  registrarInspecaoFinal(
    ciclo: CicloDevolucaoId,
    resultado: "APROVADA" | "REPROVADA",
  ) {
    this.exigirCicloAtual(ciclo);
    if (this.qualidade === resultado) return; // repetição do mesmo resultado
    if (this.qualidade !== "PENDENTE") {
      throw new ResultadoConflitante();
    }
    this.qualidade = resultado;
    this.tentarLiberar();
  }

  private tentarLiberar() {
    if (this.estado !== "BLOQUEADA") return;
    if (!this.recebida || this.qualidade !== "APROVADA") return;
    this.estado = "LIBERADA";
    this.registrarEvento(new UnidadeLiberadaParaVenda(this.id, this.ciclo));
  }

  reservar(pedido: PedidoId) {
    if (this.estado !== "LIBERADA") throw new UnidadeNaoReservavel();
    this.estado = "RESERVADA";
    this.registrarEvento(new UnidadeReservada(this.id, pedido));
  }

  private exigirCicloAtual(ciclo: CicloDevolucaoId) {
    if (!this.ciclo.equals(ciclo)) throw new CicloIncompativel();
  }
}
```

O agregado protege suas transições com os fatos que conhece. O recorte assume um resultado final de inspeção por ciclo; revogação, reinspeção e abertura de novo ciclo exigem operações e políticas adicionais. A ordem de chegada entre recebimento e aprovação não altera a condição de liberação.

Centralizar a invariante no Aggregate Root não significa reunir todo o processo de devolução em um agregado global. A fronteira de consistência é a decisão comercial sobre aquela unidade. Duas reservas concorrentes precisam ser serializadas ou detectar conflito de versão na persistência do agregado.

### 5. Os eventos conectam as decisões

Na narrativa, o recebimento gera um Domain Event no Armazém. Depois da persistência, sua aplicação publica um contrato de integração consumido por Comercialização. Qualidade faz o mesmo com o resultado da inspeção. Os handlers traduzem esses fatos e chamam os métodos do agregado.

Quando as condições são satisfeitas, `UnidadeLiberadaParaVenda` registra o resultado da decisão no domínio comercial. Um evento de integração correspondente permite que a Loja atualize sua projeção. Ao reservar, uma nova mudança de disponibilidade também precisa ser projetada.

Adotamos aqui a distinção entre Domain Events internos ao modelo e eventos de integração publicados entre contextos. O contrato externo pode ter um formato e uma versão diferentes do evento interno. [Referência: eventos de domínio e integração](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation).

Para a fala, mostrar um único percurso: recebimento → unidade bloqueada → aprovação → unidade liberada → atualização da loja. Nas notas técnicas, registrar que o fluxo precisa de publicação confiável após a gravação, como uma outbox transacional, e consumo idempotente. O agregado e os eventos não resolvem sozinhos falhas de entrega ou concorrência.

Uma projeção atrasada pode exibir disponibilidade antiga. Por isso, a confirmação da reserva passa pelo agregado e pode falhar mesmo quando a tela ainda mostra “disponível”. Se o negócio exigir bloqueio imediato após uma revogação de qualidade, será necessário definir uma coordenação adicional; a propagação assíncrona isolada não oferece essa garantia.

### 6. Os testes preservam a descoberta

Estes são cenários propostos para a apresentação, não testes executados de um produto:

| Dado / quando | Resultado esperado | Descoberta preservada |
| --- | --- | --- |
| Unidade recebida, sem inspeção aprovada | Continua bloqueada; reserva recusada. | Presença física não implica vendabilidade. |
| Aprovação chega antes do recebimento | Permanece bloqueada até registrar o recebimento. | A regra exige os dois fatos, independentemente da ordem entre eles. |
| Recebimento e aprovação pertencem ao ciclo atual | Liberação e evento correspondente. | A regra comercial tem um responsável no modelo. |
| Aprovação pertence a um ciclo anterior | Rejeição, sem liberar a unidade. | Uma aprovação tem escopo. |
| O mesmo resultado aprovado é entregue novamente | Nenhuma segunda liberação. | Repetir uma mensagem não repete a transição. |
| Duas reservas disputam a mesma unidade | Apenas uma confirma, com controle de concorrência na persistência. | Consulta de disponibilidade não equivale a reserva. |

Fechamento sugerido: “O ticket começou com uma palavra: estoque. Para encerrá-lo, tivemos de descobrir quais decisões essa palavra escondia. DDD nos ajudou a dar nomes a essas decisões, localizar suas fronteiras e protegê-las no código. A análise ontológica tornou algumas distinções mais precisas. O aprendizado agora aparece nos contratos, nos comportamentos e nos testes.”

## Fontes e estado editorial

- [Proposta anterior — Do domínio à ontologia](o-bug-que-virou-ontologia-cfp.md).
- [Narrativa de origem — The Bug Ticket That Became an Ontology](../the-bug-ticket-that-became-an-ontology.md).
- Direção editorial: feedback do organizador reproduzido pelo usuário nesta conversa em 2026-09-09.

O caso é fictício e composto. Este arquivo é um novo candidato editorial; os exemplos de código expressam escolhas didáticas para a palestra, sem implementar um sistema. A aprovação editorial e a submissão continuam pendentes.

## Open Questions — questões para revisão

- Confirmar o título revisado e o limite de caracteres do resumo no formulário do evento.
- Confirmar se os 35 minutos de fala e 5 de perguntas continuam adequados.
- Escolher a linguagem final dos exemplos conforme o público; neste draft, usamos pseudocódigo próximo de TypeScript.
- Decidir, no ensaio da fala, quanto detalhar a reserva concorrente e a revogação de qualidade sem perder o foco na descoberta e na modelagem com DDD.
