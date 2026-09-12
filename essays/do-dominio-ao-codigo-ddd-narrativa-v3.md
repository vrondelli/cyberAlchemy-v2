# “Em estoque” para quem? Do domínio ao código com DDD

Status: narrativa v3, candidata para revisão e ensaio.  
Data: 2026-09-11.  
Formato: narrativa condensada com demonstrações visuais e pseudocódigo.  
Caso fictício: laptop devolvido `LP-2041`.

## O ticket revela uma decisão escondida

Um laptop devolvido aparece como “em estoque” antes de passar pela inspeção. Um cliente consegue comprá-lo. A equipe abre o ticket, reproduz o problema e procura mensagens duplicadas, eventos fora de ordem e cache desatualizado.

Tudo está funcionando conforme implementado. O armazém recebeu a unidade, o inventário atualizou a quantidade e a loja publicou a disponibilidade.

A engenheira coloca os estados lado a lado:

```text
LP-2041
  Armazém:       fisicamente presente
  Qualidade:     aguardando inspeção
  Inventário:    uma unidade não reservada
  Loja:          em estoque — compra permitida
```

A regra da loja considera presença e ausência de reserva. A regra esperada pelo atendimento exige qualidade aprovada. Antes de acrescentar uma condição, a equipe chama quem recebe, inspeciona e decide sobre a revenda.

“Quando vocês dizem ‘em estoque’, qual decisão estão tomando?”

O armazém está afirmando que tem a unidade sob sua custódia. Qualidade ainda não aprovou seu estado. Comercialização precisa decidir se ela pode voltar à venda. A loja está oferecendo ao cliente a possibilidade de comprar.

A expressão compartilhada escondia significados diferentes. Essa descoberta começa a mudar a Linguagem Ubíqua.

## Das palavras às fronteiras

Com os especialistas, a equipe passa a distinguir recebimento, aprovação, comerciabilidade, disponibilidade e reserva. Esses termos ganham um lugar no modelo:

| Bounded Context proposto | Pergunta que responde | Linguagem do contexto |
| --- | --- | --- |
| Armazém | Onde está a unidade? | Recebimento, localização, custódia. |
| Qualidade | Qual inspeção se aplica e qual foi o resultado? | Inspeção, aprovação, validade. |
| Comercialização | A unidade pode ser vendida e comprometida com um pedido? | Comerciabilidade, destino de revenda, bloqueio, alocação. |
| Loja | O que mostramos ao cliente? | Disponibilidade exibida, solicitação de compra. |

Essas fronteiras são hipóteses de Design Estratégico, a validar pela linguagem e pelas responsabilidades. Podemos começar implementando-as em módulos. O desenho não exige um microsserviço por contexto.

A primeira mudança é retirar da projeção da loja a decisão implícita de que “recebido” significa “comerciável”. Comercialização passa a interpretar os fatos de Armazém e Qualidade segundo uma política comercial explícita.

## Descobrindo os eventos de domínio

Com essas fronteiras ainda provisórias, a equipe reconstrói o percurso da unidade com os especialistas: “O que aconteceu para que o laptop saísse da devolução e aparecesse na loja?”

Cada acontecimento relevante ganha um nome no passado. Começamos pelo recebimento e seguimos os caminhos possíveis:

```text
UnidadeRecebida → InspecaoConcluida
                       ├─ InspecaoReprovada → UnidadeEncaminhadaParaReparo
                       └─ InspecaoAprovada
                                  │
                       avaliar política comercial
                       e demais condições da unidade
                                  │ se satisfeitas
                                  v
                       UnidadeLiberadaParaVenda
                                  │ solicitação aceita
                                  v
                           UnidadeReservada
```

Esse é um percurso candidato, a validar com o negócio. A reprovação leva sempre a reparo ou também pode levar a descarte? Quem decide o destino? A aprovação libera a venda sozinha? As dúvidas ficam no desenho e ajudam a revisar as fronteiras propostas.

Também separamos uma intenção de seu resultado:

| Comando — o que se pede | Evento — o que aconteceu |
| --- | --- |
| Receber unidade | UnidadeRecebida |
| Concluir inspeção | InspecaoConcluida, com seu resultado |
| Reservar unidade | UnidadeReservada, quando a regra permite |

Para cada evento, perguntamos quem reconhece o fato, a qual unidade e ciclo ele se refere e que decisão ele pode provocar. `InspecaoAprovada` pertence à linguagem de Qualidade; `UnidadeReservada` expressa um compromisso de Comercialização. Os especialistas também podem preferir representar a aprovação como resultado de `InspecaoConcluida`, sem criar dois eventos internos para a mesma conclusão.

O desenho expõe a passagem que causou o bug: de `UnidadeRecebida` para disponibilidade na loja, faltava uma decisão comercial explícita. Descobrir os eventos torna essa lacuna discutível antes de escolher mensagens, handlers ou um broker.

## As relações mostram o que falta

Agora podemos enriquecer a descoberta com a análise ontológica. Os conceitos importam pelas relações que mantêm:

```text
UnidadeFisica --observada_em--> LocalizacaoNoArmazem
UnidadeFisica --tem_destino--> DestinoDaDevolucao
UnidadeFisica --passa_por--> InspecaoDeQualidade
InspecaoDeQualidade --produz--> EstadoDeQualidade
EstadoDeQualidade --restringe--> Comerciabilidade
PosicaoDeEstoque --contribui_para--> ElegibilidadeParaAlocacao
SinalDeDisponibilidade --afirma_representar--> Comerciabilidade
CompromissoDeCompra --depende_de--> SinalDeDisponibilidade
```

Leiam a relação central: o estado de qualidade restringe a comerciabilidade. Ela descreve uma dependência que o cálculo anterior não expressava.

Outra relação merece atenção: o sinal da loja afirma representar a comerciabilidade. Precisamos demonstrar essa correspondência. Dar aos campos nomes parecidos não basta.

As perguntas também refinam a identidade. A inspeção aprova uma unidade física, identificada por número de série, e não todos os produtos de um SKU. Além disso, uma aprovação da devolução anterior não libera automaticamente a devolução atual.

Essas descobertas voltam ao DDD: `UnidadeId` e `CicloDevolucaoId` entram nos contratos; Qualidade continua responsável pela inspeção; Comercialização verifica se a aprovação se aplica à decisão atual. A análise ontológica complementa a modelagem e torna suas consequências visíveis no design.

## A comerciabilidade muda com o estado da unidade

A mesma unidade evolui ao longo do processo: após o recebimento, aguarda inspeção e permanece bloqueada. Com a aprovação e as demais condições satisfeitas, torna-se comerciável. Depois de reservada, deixa de estar disponível para uma nova venda. Cada coluna mostra o estado da unidade após uma dessas transições.

| Estado de LP-2041 | Após o recebimento | Após a aprovação | Após a reserva |
| --- | --- | --- | --- |
| Fisicamente presente | Sim | Sim | Sim |
| Aprovação válida no ciclo atual | Não | Sim | Sim |
| Destino = revenda | Sim | Sim | Sim |
| Alocada a um pedido | Não | Não | Sim |
| Em quarentena | Não | Não | Não |
| **Comerciável para nova venda** | **Não** | **Sim** | **Não** |

Para esse recorte, propomos a seguinte regra:

```text
Sellable(unit, time) :=
    PhysicallyPresent(unit, time)
    AND QualityCleared(unit, time)
    AND Disposition(unit, time) = RESALE
    AND NOT Allocated(unit, time)
    AND NOT Quarantined(unit, time)
```

Comerciabilidade é uma decisão sobre condições que mudam. A expressão ainda é candidata: precisamos confirmar seu escopo e sua aceitação com quem responde pela política de revenda. O modelo explicita a regra e suas consequências; a organização decide adotá-la.

Na continuação do caso, o responsável confirma essas condições para o fluxo de devoluções em análise. Podemos então levá-las ao código.

## A regra dentro do Aggregate Root

Em Comercialização, o Aggregate Root `UnidadeComerciavel` protege a decisão sobre uma unidade. Ele mantém os fatos necessários à política, recebidos e traduzidos dos outros contextos. Não precisa conter os agregados de Armazém e Qualidade.

O predicado aparece inteiro no modelo, e a operação de reserva é obrigada a consultá-lo:

```typescript
// Pseudocódigo: estado atual conhecido pelo agregado.
class UnidadeComerciavel {
  private presente: boolean = false;
  private aprovacao: AprovacaoQualidade | null = null;
  private destino: Destino = "AGUARDANDO_DECISAO";
  private pedidoAlocado: PedidoId | null = null;
  private emQuarentena: boolean = false;

  constructor(
    readonly id: UnidadeId,
    readonly ciclo: CicloDevolucaoId,
  ) {}

  comerciavel(agora: Instante): boolean {
    return this.presente
      && this.aprovacao?.validaPara(this.id, this.ciclo, agora) === true
      && this.destino === "REVENDA"
      && this.pedidoAlocado === null
      && !this.emQuarentena;
  }

  reservar(pedido: PedidoId, agora: Instante) {
    if (!this.comerciavel(agora)) {
      throw new UnidadeNaoComerciavel();
    }

    this.pedidoAlocado = pedido;
    this.registrarEvento(new UnidadeReservada(this.id, pedido, agora));
  }
}
```

Cada linha corresponde a uma condição da expressão. A aprovação é um Value Object cujo contrato verifica unidade, ciclo, resultado aprovado e intervalo de validade. O instante vem de um relógio controlado pela aplicação. Não é escolhido pelo cliente para contornar a regra.

O trecho omite os métodos que registram recebimento, aprovação, destino e quarentena, além da persistência e coleta de eventos. Na implementação, essas alterações também passam por comportamentos controlados do agregado, com validação dos fatos recebidos. Não existem setters públicos para contornar a política.

Também não existe um booleano permanente `comerciavel = true`. A elegibilidade é recalculada a partir das condições atuais. Se a aprovação expirar ou a unidade for alocada, o resultado muda.

O método consulta o estado atual conhecido. Passar um horário antigo não reconstitui a história da unidade; uma consulta histórica exigiria recuperar o estado correspondente àquele momento.

Essa é a contribuição do Aggregate Root: a operação que compromete a unidade protege a regra completa. Para duas reservas concorrentes, a persistência também precisa serializar a alteração ou detectar conflito de versão. Só uma delas pode confirmar.

## Os eventos fazem os contextos cooperarem

O percurso corrigido fica visível:

```text
Armazém                 Qualidade
UnidadeRecebida          InspecaoAprovada
      │                       │
      └──── contratos de integração ────┐
                                       v
                         Comercialização
                    UnidadeComerciavel
                    [regra de comerciabilidade]
                         │              ^
            mudança de   │              │ reservar(pedido)
          disponibilidade│              │
                         v              │
                              Loja
                       [projeção de consulta]
```

O Armazém registra um Domain Event ao receber a unidade. Sua aplicação publica um contrato de integração após a gravação. Qualidade faz o mesmo com a inspeção. Os handlers comerciais traduzem os contratos e atualizam o agregado. A avaliação de comerciabilidade considera também destino, alocação e quarentena, segundo os comportamentos comerciais definidos.

Uma mudança relevante produz um Domain Event comercial e pode originar uma atualização para a Loja. O evento interno e o contrato externo podem ter formatos diferentes. Publicação confiável, consumo idempotente e tratamento de versões sustentam esse fluxo.

A Loja apresenta uma projeção, sujeita a atraso. A tentativa de reserva volta ao agregado e reavalia todas as condições. Assim, uma tela antiga não é suficiente para confirmar uma compra.

Se a validade expirar sem chegar uma mensagem, a projeção precisa de expiração programada ou reavaliação para atualizar a tela. A reserva já consulta o instante atual. Revogações e quarentenas ainda não recebidas pelo agregado exigem uma garantia de integração adicional quando o negócio pede bloqueio imediato.

## O teste preserva o significado

Voltamos ao ticket com a mesma unidade. Ela chegou, mas sua qualidade está pendente: a reserva deve falhar. A inspeção válida chega e as demais condições são satisfeitas: a reserva pode confirmar.

Testamos também a regra inteira:

```text
Presente + aprovada + revenda + livre + sem quarentena → permite reservar
Mesmo cenário, mas ausente                            → recusa
Mesmo cenário, mas aprovação expirada ou de outro ciclo→ recusa
Mesmo cenário, mas destino diferente de revenda        → recusa
Mesmo cenário, mas já alocada                          → recusa
Mesmo cenário, mas em quarentena                       → recusa
```

São cenários didáticos, ainda não uma implementação testada. Eles mostram o que o código precisa preservar e permitem discutir a regra com os especialistas.

Ao fechar o ticket, registramos a decisão descoberta: o recebimento estava sendo confundido com autorização de venda. Agora a linguagem distingue os estados, os contextos têm responsabilidades explícitas e o agregado protege o compromisso comercial.

DDD conduziu o caminho da descoberta ao código. A análise ontológica ajudou a explicitar as relações e sua validade. O resultado aparece tanto no desenho quanto na operação `reservar`: sabemos quais fatos permitem a decisão e quais condições a impedem.

## Fontes e questões em aberto

Fontes: [narrativa v2](do-dominio-ao-codigo-ddd-narrativa-v2.md), [texto original e mapa de relações](the-bug-ticket-that-became-an-ontology.md) e correção enviada pelo usuário em 2026-09-11. Esta versão é um candidato editorial; os diagramas e o código são demonstrações do caso fictício.

### Open Questions

- Confirmar no ensaio a duração e a legibilidade dos diagramas.
- Definir na implementação real a validade das aprovações, a ordenação por fonte e o tratamento de revogação, quarentena e novo ciclo.
- Confirmar com os responsáveis do domínio as condições e o escopo da política antes de adotá-la em um produto.
