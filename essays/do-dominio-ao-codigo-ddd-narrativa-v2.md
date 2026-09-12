# “Em estoque” para quem? Do domínio ao código com DDD

*Como a investigação de um produto devolvido evolui a Linguagem Ubíqua, os Bounded Contexts e as regras no código.*

Status: narrativa completa, draft v2 para revisão e ensaio.  
Data: 2026-09-09.  
Formato: texto de fala em português, com trechos de código para acompanhar a apresentação.  
Referência de duração: 35 minutos de palestra e 5 de perguntas; duração efetiva a confirmar em ensaio, incluindo pausas e leitura dos exemplos.  
Caso: cenário fictício composto; personagens, identificadores e resultados pertencem à narrativa.

---

São oito e quarenta e três de uma segunda-feira quando um ticket chega ao backlog.

“Laptops devolvidos aparecem como em estoque antes da inspeção de qualidade.”

O atendimento anexou o identificador da unidade, uma captura da loja e o número de um pedido. Um cliente conseguiu comprar um laptop que estava no armazém, esperando avaliação. A equipe agora precisa explicar por que prometeu entregar uma unidade que ainda não sabia se poderia vender.

O ticket parece bom. Tem comportamento observado, resultado esperado e evidência suficiente para reproduzir a falha. A expectativa está escrita de maneira direta: produtos devolvidos devem permanecer indisponíveis até passar pela inspeção.

A engenheira responsável abre o chamado e pensa no caminho habitual. Talvez uma mensagem tenha chegado fora de ordem. Talvez o cache da loja tenha sido atualizado antes da qualidade. Talvez alguém tenha incrementado o saldo duas vezes.

Ela começa a investigação.

Vamos acompanhá-la até o fechamento desse ticket. O que me interessa nesse percurso é como uma equipe descobre uma regra, decide onde ela pertence e faz essa decisão sobreviver no código. Vamos usar DDD para conduzir esse trabalho. Em um momento da investigação, a Ontology Engineering vai ajudar a tornar algumas distinções mais precisas. Essas distinções voltarão ao modelo como linguagem, limites e comportamento.

O laptop será o mesmo durante toda a história. O que vai mudar é a nossa compreensão do que significa dizer que ele está “em estoque”.

## O defeito que se repete corretamente

A unidade do ticket é a `LP-2041`. Ela foi vendida, devolvida e recebida no armazém. A engenheira cria uma unidade equivalente no ambiente de testes: recebida, sem reserva e aguardando inspeção.

Ela publica o evento de recebimento e acompanha o resultado. Um segundo depois, a quantidade disponível sobe. A loja passa a exibir “em estoque”. O problema se reproduz.

A trilha de eventos parece normal:

```text
09:17:04  Devolução recebida
09:17:05  Unidade registrada no armazém
09:17:05  Posição de estoque atualizada
09:17:06  Disponibilidade recalculada
09:17:07  Cache da loja atualizado
```

Ela verifica os identificadores das mensagens. Não há duplicação. Confere a ordem. Está correta. Consulta o cache e compara com a projeção persistida. Os valores coincidem. Repete o processamento e obtém o mesmo resultado.

Também existe informação sobre a inspeção. O sistema de qualidade registra que a unidade ainda aguarda avaliação. O dado não desapareceu no caminho. Ele simplesmente não participa do cálculo de disponibilidade.

A engenheira encontra três condições no componente que alimenta a loja: existe quantidade física, a unidade não está reservada e o canal de venda está habilitado.

Para aquelas três condições, o resultado está correto.

Esse é um ponto importante da investigação. A reprodução confirmou o comportamento indesejado, mas ainda precisamos entender a regra de negócio. Acrescentar `qualidade == APROVADA` parece uma correção evidente. Antes de fazê-la, precisamos descobrir o que essa aprovação significa, a que ela se aplica e quem responde pela decisão de liberar uma devolução.

O ticket diz o que o atendimento espera. O código mostra o que foi implementado. A diferença entre os dois precisa de uma conversa com o negócio.

A engenheira registra a descoberta: a disponibilidade considera presença física, reserva e canal, mas não considera inspeção. Em seguida, procura as pessoas que conhecem cada parte do processo.

## Uma palavra, decisões diferentes

Na conversa estão alguém do armazém, uma especialista de qualidade, uma pessoa de comercialização e a equipe que mantém a loja.

A engenheira coloca a unidade `LP-2041` no centro da discussão e pede que cada pessoa explique o que aconteceu.

O armazém começa: “Nós recebemos a devolução, lemos o número de série e guardamos a unidade. Ela entrou no estoque.”

A qualidade completa: “Sim, ela chegou. Mas ainda está na fila de inspeção.”

A loja explica: “Recebemos o aumento de estoque. Como não havia reserva, mostramos disponibilidade.”

A pessoa de comercialização interrompe: “Mas receber uma devolução não libera a unidade para revenda.”

Até esse momento, todos usavam a palavra estoque com aparente concordância. A diferença aparece quando cada um descreve a decisão que toma a partir dela.

No armazém, a informação responde: onde está a unidade e quem está com sua custódia?

Na qualidade, a pergunta é: essa unidade foi avaliada e qual foi o resultado?

Na comercialização, a pergunta é: essa unidade atende às condições para ser oferecida novamente?

Na loja, a informação precisa ajudar o cliente a decidir se pode iniciar uma compra.

As quatro perguntas se relacionam, mas pedem respostas diferentes.

A engenheira volta ao exemplo concreto. “Se a unidade está fisicamente aqui e tem a tela quebrada, ela está em estoque?”

O armazém responde que sim. Precisa contar a unidade, localizá-la e impedir que ela desapareça.

“E ela pode ser vendida?”

A resposta depende da avaliação e da política comercial. Pode haver conserto, descarte ou outro destino. Para o fluxo de revenda que estamos investigando, a inspeção precisa aprová-la.

A equipe começa a trocar expressões vagas por frases mais específicas. O armazém registra uma **unidade recebida**. Qualidade registra uma **inspeção aprovada ou reprovada**. Comercialização decide se a unidade está **liberada para venda**. A loja mantém uma **disponibilidade exibida**. Quando um pedido obtém o compromisso sobre aquela unidade, existe uma **reserva**.

É assim que a Linguagem Ubíqua começa a evoluir nesta história. Ela é trabalhada nas conversas e nos exemplos, depois testada no modelo e no código. Um desenvolvedor passa a poder perguntar “essa unidade foi recebida?” sem induzir a resposta “então ela pode ser vendida”.

Também percebemos que a expressão precisa de um contexto. A linguagem do armazém pode continuar usando estoque para falar de posições físicas. O problema surge quando importamos esse termo para uma decisão comercial sem discutir a tradução.

Eu perguntaria à plateia neste ponto: no sistema de vocês, existe alguma palavra parecida? “Ativo”, “aprovado”, “concluído”, “cliente”? Uma palavra que circula por várias equipes e parece simples até alguém precisar decidir o que ela permite fazer?

No nosso caso, o bug abriu espaço para essa conversa. O resultado da conversa agora precisa mudar o design.

## As fronteiras aparecem nas responsabilidades

A equipe desenha o fluxo existente. O armazém informa recebimento. Uma projeção interpreta esse fato como aumento do saldo vendável. A loja consome o saldo.

Há uma decisão comercial dentro da tradução entre duas estruturas de dados. Ninguém a reconhecia como decisão porque ela estava implementada como atualização de quantidade.

Essa descoberta nos leva ao Design Estratégico. Precisamos estabelecer em qual modelo cada termo tem significado e quem mantém as decisões que dependem dele.

Para este caso, a equipe propõe quatro Bounded Contexts: Armazém, Qualidade, Comercialização e Loja.

Armazém conhece recebimento, localização e movimentação física. Qualidade conhece inspeções, critérios e resultados. Comercialização conhece a elegibilidade da unidade para venda e sua reserva. Loja organiza a experiência de consulta e compra, apresentando ao cliente uma visão da disponibilidade.

Esses limites são hipóteses de design. Vamos validá-los olhando para a linguagem, as responsabilidades e como cada modelo precisa evoluir. O organograma e os serviços existentes ajudam a entender o cenário, mas não decidem sozinhos as fronteiras.

Também não precisamos criar quatro microsserviços para começar. Podemos dar forma a esses limites em módulos, com contratos explícitos e dependências controladas. A decisão de distribuição exige outras considerações.

No Context Map, Armazém e Qualidade passam a fornecer fatos para Comercialização. Comercialização mantém a decisão de elegibilidade que a Loja precisa conhecer.

```text
Armazém ── recebimento ──────────┐
                                v
                        Comercialização ── disponibilidade ──> Loja
                                ^                               │
Qualidade ── inspeção ───────────┘                               │
                                └──── solicitação de reserva ───┘
```

A mudança pode parecer pequena no desenho. Seu efeito é grande na responsabilidade: receber deixa de liberar implicitamente. Comercialização interpreta o recebimento como um dos fatos necessários para decidir.

Na fronteira, um adaptador traduz o contrato do armazém. Se o sistema externo usa `RECEIVED`, essa informação se torna “recebimento confirmado” no modelo comercial. Ela não se transforma automaticamente em “vendável”. Essa proteção do significado do modelo consumidor é o papel que uma camada anticorrupção pode cumprir aqui.

Isso também muda a conversa entre equipes. Armazém pode explicar e manter seu contrato de recebimento. Comercialização precisa explicitar quais informações consome e como reage quando elas chegam. Se Qualidade mudar o formato de um resultado, a tradução terá um lugar identificável para ser revisada.

O DDD nos deu uma forma de organizar o que descobrimos. A linguagem separou as decisões. Os contextos localizaram essas decisões. Os contratos agora precisam preservar as distinções.

## Qual unidade foi aprovada?

Quando a equipe começa a desenhar o contrato de qualidade, alguém sugere uma mensagem curta: produto aprovado, código do produto e data.

A especialista faz uma pergunta: “Vocês precisam do código do modelo ou do número de série?”

Precisamos parar outra vez.

O catálogo identifica o modelo de laptop por um SKU. O armazém recebeu uma unidade física daquele modelo. Qualidade inspecionou uma unidade específica. Se comunicarmos a aprovação apenas pelo SKU, podemos atribuir a várias unidades uma conclusão que foi produzida sobre uma única delas.

Agora imaginemos outra situação. A `LP-2041` passou pela inspeção, foi revendida e voltou dois meses depois. Podemos usar a aprovação anterior?

A especialista responde que não. A unidade precisa de uma avaliação referente à nova devolução.

É nesse tipo de investigação que a Ontology Engineering pode complementar o DDD. Ela oferece recursos para examinar identidade, relações e condições de validade de uma afirmação. Aqui, fazemos duas distinções: tipo de produto e unidade física; unidade física e ciclo de devolução.

A frase “produto aprovado” perde informação importante. A frase que precisamos representar é mais próxima de: “a inspeção desta unidade, neste ciclo de devolução, foi aprovada”.

O efeito dessa análise aparece imediatamente no design. O contrato passa a carregar `UnidadeId` e `CicloDevolucaoId`. O modelo comercial precisa conferir o ciclo ao aplicar o resultado. Uma aprovação antiga não pode liberar a devolução atual.

A fronteira de Qualidade também fica mais clara. Qualidade decide o resultado da inspeção. Comercialização usa esse resultado na política de liberação. Ter uma inspeção aprovada pode ser necessário para vender, mas outras condições comerciais ainda podem existir.

Essas perguntas também podem surgir em uma boa sessão de modelagem com DDD. O complemento ontológico ajuda a examiná-las de maneira disciplinada e a preservar as relações encontradas. Seu valor, nesta palestra, está no que melhora na linguagem, nos contratos e nas regras do modelo.

Não precisamos construir um catálogo de todos os conceitos da empresa para resolver esse problema. Precisamos representar suficientemente bem as distinções que mudam a decisão sobre a unidade.

## A regra ganha um lugar no modelo

A pessoa responsável pela política de revenda confirma o recorte: uma unidade eletrônica devolvida não pode ser liberada para venda antes do recebimento e da aprovação da inspeção aplicável àquela devolução.

Para acompanhar o exemplo de código, vamos assumir que a unidade pertence ao canal de revenda elegível e não tem outros bloqueios comerciais. Políticas de descarte, conserto, quarentena e canais alternativos exigiriam comportamentos adicionais. A equipe registra esse recorte para evitar que o exemplo seja tratado como política universal.

Com a regra acordada, chegamos ao Design Tático.

Criamos, em Comercialização, o agregado `UnidadeComercializavel`. Ele representa a decisão comercial sobre uma unidade no ciclo de devolução em análise. Seu estado inicial é bloqueado. O nome indica a responsabilidade do modelo; a instância ainda precisa cumprir as condições para ser liberada.

O Aggregate Root controla as transições. Quem precisa registrar recebimento ou resultado de inspeção chama um comportamento do agregado. Não recebe acesso para alterar livremente um campo `liberada`.

Por que essa diferença importa? Porque vários caminhos da aplicação podem atuar sobre a unidade: um consumidor de eventos, uma rotina de recuperação ou uma operação administrativa. Todos precisam passar pela mesma regra quando tentam produzir a mesma transição.

Vamos olhar primeiro para a parte central do pseudocódigo. A sintaxe é próxima de TypeScript. Os identificadores são Value Objects; detalhes de persistência e coleta de eventos estão fora do trecho.

```typescript
private tentarLiberar() {
  if (this.estado !== "BLOQUEADA") return;
  if (!this.recebida) return;
  if (this.qualidade !== "APROVADA") return;

  this.estado = "LIBERADA";
  this.registrarEvento(
    new UnidadeLiberadaParaVenda(this.id, this.ciclo)
  );
}
```

Há uma regra de negócio reconhecível aqui. Enquanto falta recebimento ou aprovação, a unidade permanece bloqueada. Quando os dois fatos estão registrados, a transição ocorre e o domínio registra que a unidade foi liberada.

O método é privado. As operações públicas recebem fatos com significado e verificam se eles podem participar dessa decisão.

```typescript
confirmarRecebimento(ciclo: CicloDevolucaoId) {
  this.exigirCicloAtual(ciclo);
  this.recebida = true;
  this.tentarLiberar();
}

registrarInspecaoFinal(
  ciclo: CicloDevolucaoId,
  resultado: "APROVADA" | "REPROVADA"
) {
  this.exigirCicloAtual(ciclo);
  if (this.qualidade === resultado) return;
  if (this.qualidade !== "PENDENTE") {
    throw new ResultadoConflitante();
  }

  this.qualidade = resultado;
  this.tentarLiberar();
}
```

Reparem como a conversa com Qualidade entrou no código. Cada operação exige o ciclo atual. O tipo `CicloDevolucaoId` permite expressar e comparar essa identidade sem confundi-la com o identificador da unidade.

Também assumimos, neste recorte, um resultado final por ciclo. Repetir o mesmo resultado não cria uma nova decisão. Receber outro resultado depois do primeiro exige tratamento explícito, em vez de sobrescrever silenciosamente a informação. Reinspeção ou revogação precisariam de operações próprias e de uma política acordada com o negócio.

Se o recebimento chegar primeiro, a unidade espera aprovação. Se a aprovação chegar primeiro ao consumidor, a unidade espera recebimento. A condição de liberação depende dos dois fatos, sem depender dessa ordem de entrega. Para isso, os handlers precisam conseguir localizar ou preparar o registro do ciclo; os métodos, isoladamente, não resolvem a criação e a recuperação desse estado.

Também precisamos estabelecer o que fica fora do agregado. Ele não contém o armazém, o laudo completo e o pedido. Conhece os fatos comerciais necessários para proteger sua transição. Qualidade continua responsável pela inspeção, e Armazém continua responsável pela presença física.

Essa separação evita transformar o processo inteiro de devolução em um único objeto que precisa mudar quando qualquer equipe muda.

## Um fato atravessa a fronteira

Voltemos à unidade `LP-2041`. Ela acaba de chegar ao armazém.

A operação de recebimento registra esse acontecimento no domínio do Armazém. Podemos chamá-lo de `UnidadeRecebida`. A aplicação persiste a mudança e prepara a publicação de um contrato que outros contextos podem consumir.

Vou usar uma distinção explícita nesta fala: Domain Event é o fato registrado dentro do modelo; evento de integração é o contrato publicado para atravessar a fronteira. Eles podem ter nomes semelhantes, mas seus formatos e suas versões não precisam ser iguais.

Essa diferença nos permite mudar a implementação interna sem obrigar todos os consumidores a conhecer suas classes. Quem consome precisa entender o contrato publicado e as garantias associadas a ele.

Em Comercialização, um handler recebe o contrato, valida e traduz os dados, carrega o agregado correspondente e chama `confirmarRecebimento`. A unidade continua bloqueada porque a inspeção está pendente.

O armazém concluiu seu trabalho de recebimento. Ele não precisa chamar a loja e decidir qual mensagem o cliente verá. A consequência comercial tem seu próprio responsável.

Mais tarde, Qualidade conclui a inspeção da unidade no ciclo atual. Registra o resultado e publica o contrato correspondente. O handler comercial chama `registrarInspecaoFinal`. Agora as duas condições estão presentes.

O agregado passa para liberado e registra `UnidadeLiberadaParaVenda`. A aplicação publica a mudança de elegibilidade. A Loja a consome e atualiza sua visão de disponibilidade.

Percebam a diferença em relação ao início. O recebimento continua sendo um fato importante. Seu significado, porém, é preservado durante a integração. A liberação aparece como uma decisão comercial explícita, com condições próprias.

Há trabalho de infraestrutura necessário para que isso funcione. Se a gravação tiver sucesso e a publicação falhar, precisamos recuperar a mensagem. Uma outbox transacional é uma opção: a intenção de publicar é persistida junto com a mudança local e enviada posteriormente. Isso exige consumidores preparados para repetição, porque uma tentativa de entrega pode acontecer mais de uma vez.

Os eventos desacoplam os produtores dos consumidores e permitem reações independentes. Eles ainda carregam contratos semânticos: identificadores, significado, versão e escopo precisam ser compreendidos entre as equipes. Um broker não corrige uma interpretação errada de “recebido”.

Neste ponto, temos domínio e integração trabalhando juntos. A regra fica no modelo responsável; o transporte permite comunicar os fatos e resultados sem colocar todas as decisões no mesmo componente.

## A tela ainda não é uma reserva

Depois da aprovação, a Loja exibe disponibilidade. Dois clientes abrem a página ao mesmo tempo. Existe apenas uma unidade livre.

Se a loja consultar sua projeção e cada requisição concluir que pode comprar, podemos prometer a mesma unidade duas vezes.

A investigação nos levou a outra distinção da Linguagem Ubíqua: disponibilidade exibida e reserva confirmada.

A disponibilidade é informação para consulta. A reserva muda o compromisso sobre a unidade. Por isso, a tentativa de reservar volta a Comercialização e passa pelo agregado.

```typescript
reservar(pedido: PedidoId) {
  if (this.estado !== "LIBERADA") {
    throw new UnidadeNaoReservavel();
  }

  this.estado = "RESERVADA";
  this.registrarEvento(new UnidadeReservada(this.id, pedido));
}
```

O código expressa a regra local, mas duas instâncias em memória poderiam ter sido carregadas no mesmo estado. Precisamos combinar a regra com persistência que serialize as alterações ou detecte conflito de versão. Assim, apenas uma reserva confirma. A segunda operação encontra conflito e precisa reler o estado ou retornar a indisponibilidade conforme o contrato da aplicação.

Essa é a relação entre agregado e consistência. A fronteira do agregado diz qual decisão precisa ser protegida em conjunto. A implementação precisa preservar essa fronteira quando existem requisições concorrentes.

Quando a reserva confirma, uma nova mudança atualiza a disponibilidade da Loja. Até essa atualização chegar, outra pessoa pode ver uma informação antiga. A aplicação precisa tratar esse intervalo com uma resposta compreensível, sem confirmar uma reserva que não conseguiu obter.

E se Qualidade revogar uma aprovação? Essa pergunta muda o problema. O modelo comercial protege decisões com os fatos que já recebeu. Se o negócio exigir que uma revogação impeça imediatamente qualquer nova reserva, a propagação assíncrona, sozinha, não satisfaz essa exigência. Precisaremos discutir como a reserva se coordena com essa informação e quais garantias são necessárias.

Para o ticket de hoje, o recorte é a liberação inicial de uma devolução aguardando inspeção. A questão da revogação fica registrada com seu impacto. Essa delimitação permite resolver o problema conhecido sem anunciar uma garantia que o desenho ainda não oferece.

## O teste conta a história que aprendemos

A equipe volta à reprodução inicial. Temos a mesma unidade, recebida e aguardando inspeção. Antes, essa combinação aumentava a quantidade vendável. Agora precisamos demonstrar que a correção preserva a regra acordada.

O primeiro teste pode ser lido por quem participou da conversa:

```text
Dada uma unidade devolvida no ciclo atual,
quando o recebimento é confirmado
e ainda não existe inspeção aprovada,
então a unidade permanece bloqueada para venda
e uma tentativa de reserva é recusada.
```

Esse cenário documenta a diferença que faltava ao modelo. Presença física participa da decisão, mas não a completa.

Em seguida, registramos a aprovação do ciclo atual. A unidade deve ser liberada. A entrega repetida do mesmo resultado não deve produzir uma segunda transição de liberação. Uma aprovação de outro ciclo deve ser rejeitada sem liberar a unidade.

Também invertimos a ordem de entrega entre aprovação e recebimento. O resultado final deve respeitar as mesmas condições. A reserva concorrente exige um teste na fronteira de persistência, porque um teste de método em memória não demonstra a garantia entre duas requisições.

Cada teste protege uma descoberta diferente. O teste do agregado verifica o comportamento comercial. O teste de contrato verifica se unidade e ciclo atravessam a integração com seu significado preservado. O teste da projeção verifica a reação da Loja. O teste do percurso completo volta ao sintoma que abriu o ticket.

Na história, a equipe executa esse conjunto no ambiente de testes e acompanha a trilha corrigida: recebimento, bloqueio, inspeção, liberação, projeção e reserva. Esse resultado pertence ao cenário fictício; os trechos desta apresentação são exemplos didáticos, não um relatório de validação de um sistema real.

Agora podemos pensar em como fechar o chamado.

Seria possível escrever: “Adicionada condição de qualidade no filtro de disponibilidade”. Essa descrição registra uma mudança técnica, mas deixa de fora a maior parte do que aprendemos.

A equipe registra que o recebimento físico estava sendo interpretado como liberação comercial. Relaciona a política discutida, o contexto responsável, os contratos alterados e os testes de regressão. Também mantém visível a questão de revogação e reinspeção, que não foi resolvida por esse recorte.

Quem abrir o código daqui a seis meses terá mais do que uma condição adicional. Encontrará operações com nomes do negócio, uma fronteira que protege a decisão e exemplos que explicam por que a regra existe.

## Voltar ao ticket

Vamos voltar às oito e quarenta e três da segunda-feira.

O atendimento tinha encontrado um laptop devolvido à venda antes da inspeção. A investigação começou pelos lugares em que estamos acostumados a procurar: mensagens, cache, contagem e ordem de processamento. Essas verificações foram úteis. Elas mostraram o comportamento implementado e eliminaram hipóteses.

A conversa com especialistas revelou outra camada. “Em estoque” tinha adquirido significados diferentes ao atravessar o processo. O sistema tratava essas passagens como equivalências, e uma regra comercial havia ficado escondida em uma projeção.

DDD conduziu a mudança. A Linguagem Ubíqua ganhou precisão por meio de exemplos. Os Bounded Contexts deram lugar às responsabilidades. O Context Map tornou visíveis os contratos e as traduções. No Design Tático, o Aggregate Root passou a proteger a liberação e a reserva. Os eventos comunicaram fatos e decisões entre os modelos.

A Ontology Engineering enriqueceu esse percurso ao nos ajudar a examinar a identidade da unidade e a validade da aprovação. Seu efeito apareceu em detalhes concretos: um identificador de ciclo no contrato, uma verificação antes da liberação e uma pergunta de negócio que deixamos de tratar como detalhe técnico.

Esse é o convite que eu gostaria de deixar. Quando um bug atravessar várias equipes e cada parte do sistema parecer correta isoladamente, coloquem as palavras do processo lado a lado. Peçam um exemplo. Descubram qual decisão cada palavra sustenta e quem pode explicá-la.

Depois levem essa descoberta até o software. Deem à regra um lugar, façam os contratos expressarem suas condições e escrevam testes que preservem o que foi aprendido.

O ticket começou com a expressão “em estoque”. Ao fechá-lo, sabemos dizer onde a unidade está, qual inspeção se aplica a ela, por que pode ser vendida e quando existe uma reserva. Essa compreensão agora pode orientar tanto a próxima conversa com o negócio quanto a próxima mudança no código.

---

## Fontes e notas editoriais

- [Draft revisado da proposta](proposals/do-dominio-ao-codigo-ddd-draft-v2.md): direção editorial, recorte e exemplos que esta narrativa desenvolve.
- [Narrativa original](the-bug-ticket-that-became-an-ontology.md): caso do laptop devolvido e investigação da regra de vendabilidade.
- [Linguagem Ubíqua — Martin Fowler](https://martinfowler.com/bliki/UbiquitousLanguage.html): apoio à discussão sobre linguagem compartilhada com especialistas e evolução do modelo.
- [Bounded Context — Martin Fowler](https://martinfowler.com/bliki/BoundedContext.html): apoio à discussão dos limites de significado e das relações entre modelos.
- [Domain events: Design and implementation — Microsoft](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation): apoio à distinção adotada entre eventos de domínio e de integração.

Os nomes de contextos, o agregado e os contratos são escolhas didáticas para este caso, sujeitas a validação em um domínio real. Os fragmentos de código não compõem uma implementação executável e não demonstram garantias de infraestrutura. O documento preserva o protagonismo de DDD solicitado no feedback do organizador, com Ontology Engineering como complemento da modelagem.

## Open Questions — questões para revisão e ensaio

- Aferir a duração da leitura com pausas, interação com a plateia e explicação dos trechos de código.
- Confirmar os termos com os quais o palestrante se sente mais confortável, especialmente “vendabilidade” e “Comercialização”.
- Confirmar a linguagem dos exemplos e o nível de detalhe de concorrência adequado ao público.
- Definir quais diagramas e trechos de código serão projetados quando a apresentação visual for produzida.
- Avaliar no ensaio se revogação e reinspeção devem permanecer na fala principal ou ser retomadas durante as perguntas.
