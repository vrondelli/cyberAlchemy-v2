# Proposta de palestra — Do domínio à ontologia

Status: candidata para revisão humana
Transporte: Call for Speakers
Duração proposta: 35 minutos de palestra + 5 minutos de perguntas
Idioma: português

## Material de submissão

### Título

**Do domínio à ontologia**
*Como DDD e Ontology Engineering transformam a investigação de um bug em conhecimento de negócio reutilizável*

### Resumo curto

Nesta sessão, vamos acompanhar um caso fictício a partir da abertura de um ticket de bug e seguir seu percurso até o fechamento. Ao longo dessa jornada, veremos como Domain-Driven Design e Ontology Engineering podem trabalhar juntos na descoberta, modelagem e implementação de regras de negócio.

Partiremos de um laptop devolvido que aparece como “em estoque” antes de passar pela inspeção de qualidade. Os eventos chegam na ordem correta e o resultado é determinístico. Ao investigar por que o sistema funciona exatamente como foi programado e ainda assim produz um resultado incorreto para o negócio, vamos separar presença física, estoque, elegibilidade para alocação, vendabilidade e disponibilidade; localizar a regra incompleta; identificar quem pode decidi-la; e transformar o significado aceito em contrato, implementação e evidência executável.

O objetivo é apresentar uma disciplina prática para tornar explícitas as diferenças de significado, conectar decisões de negócio ao software e preservar o conhecimento produzido durante a investigação.

### Resumo completo

Nesta sessão, vamos acompanhar um caso fictício, construído a partir de padrões recorrentes em sistemas distribuídos, desde a abertura de um ticket de bug até seu fechamento. Ao longo desse percurso, veremos como Domain-Driven Design e Ontology Engineering podem trabalhar juntos na investigação de uma falha de negócio e na preservação do conhecimento descoberto.

Começaremos com um laptop devolvido que entra fisicamente no armazém e, segundos depois, aparece como “em estoque” na loja. A equipe suspeita de mensagens duplicadas, eventos fora de ordem, cache desatualizado e contagem incorreta. Nenhuma hipótese se confirma. O replay é determinístico e todos os componentes executam corretamente suas regras locais.

O defeito está em outro lugar: para o armazém, a unidade está presente; para o inventário, ela está disponível e não reservada; para a qualidade, ainda aguarda inspeção; para a loja, já pode ser comprada. A contradição só aparece quando colocamos esses significados lado a lado.

A partir dessa investigação, responderemos a uma pergunta incômoda: quando um ticket descreve um bug e quando ele está propondo uma nova regra de negócio?

Usaremos DDD estratégico para separar contextos e recuperar uma linguagem que distingue presença física, posição de estoque, elegibilidade para alocação, vendabilidade e sinal de disponibilidade. Em seguida, veremos o que Ontology Engineering acrescenta: representar relações importantes com fonte, direção, escopo, validade temporal, responsável pela decisão, estado de aceitação e inferências proibidas.

Essa combinação permite explicitar, por exemplo, a relação “liberação de qualidade restringe vendabilidade” sem fingir que desenhar a relação já autoriza a política. O modelo organiza a decisão; ele não substitui quem tem autoridade para tomá-la.

Por fim, seguiremos a cadeia completa: ticket, reprodução, documentação da falha semântica, relação candidata, decisão do responsável, contrato de sistema, mudança na regra implementada, teste de regressão e observação em runtime. O resultado é uma abordagem prática para conectar linguagem de negócio, limites de contexto, decisões organizacionais e software executável sem transformar toda divergência semântica em mais um `if` sem história.

### O que a audiência levará

- Um roteiro para distinguir defeitos de execução de lacunas ou mudanças em regras de negócio.
- Uma técnica para encontrar decisões de negócio escondidas em código, serviços e integrações.
- Uma forma de combinar bounded contexts e linguagem ubíqua com relações semânticas explícitas, rastreáveis e temporais.
- Um critério para separar evidência, interpretação e decisão de autoridade.
- Uma cadeia de construção que conecta significado aceito a contratos, testes e evidência de runtime sem confundir uma camada com a outra.

### Público-alvo e nível

Nível intermediário. Indicada para pessoas desenvolvedoras, arquitetas, tech leads, product engineers e profissionais de produto que trabalham com regras distribuídas entre serviços, eventos, modelos e equipes.

Não é necessário conhecimento prévio de ontologias ou knowledge graphs. Familiaridade básica com DDD, arquitetura orientada a eventos ou sistemas distribuídos ajuda, mas os conceitos serão introduzidos a partir do caso.

### Formato e roteiro

1. **0–7 min — O bug visível:** reprodução, trilha de eventos e descarte das hipóteses operacionais.
2. **7–14 min — O sistema está certo; o significado está incompleto:** comparação das regras locais e documentação da falha semântica.
3. **14–22 min — O movimento de DDD:** linguagem ubíqua, bounded contexts e a distinção entre estoque, vendabilidade e disponibilidade.
4. **22–30 min — O movimento de ontology engineering:** relações com fonte, escopo, tempo, responsável, postura de aceitação e inferências proibidas.
5. **30–35 min — Do significado ao software:** decisão, contrato, implementação, teste e evidência de runtime.
6. **35–40 min — Perguntas.**

### Por que esta palestra se encaixa no meetup

A proposta parte de uma situação comum de entrega de software e a reconstrói como um problema de modelagem estratégica, design tático e responsabilidade organizacional. Em vez de apresentar DDD como um catálogo de padrões, mostra como ele muda uma investigação real: quais perguntas fazemos, onde uma regra deve viver, quem pode decidi-la e como preservamos o conhecimento recuperado depois que o ticket é fechado.

Ontology engineering aparece como uma extensão disciplinada desse trabalho, útil quando conceitos atravessam contextos e precisam carregar proveniência, escopo, validade e limites de inferência. O foco permanece na evolução segura do produto e do software.

### Títulos alternativos

- **Quando o sistema funciona e o negócio falha: DDD além do código**
- **“Em estoque” para quem? DDD, ontologias e regras de negócio mal definidas**
- **Do bug à regra: como ligar linguagem de negócio, autoridade e software executável**

## Notas internas de construção

Estas notas não fazem parte do texto a ser submetido.

### Tese

Alguns bugs persistem porque o sistema move os dados corretamente enquanto comprime significados de negócio distintos. DDD recupera os limites e a linguagem; ontology engineering torna relações, fontes, escopos, decisões e inferências explícitos; a construção governada leva o significado aceito até evidência executável.

### Caso e honestidade da evidência

O caso `BUG-4821` é um cenário técnico composto e realista. A proposta não deve apresentá-lo como incidente real de uma empresa nem inventar resultados de adoção, métricas ou impacto de produção.

### Distinções que não podem ser perdidas

- Evidência de comportamento não decide a regra correta.
- Uma política encontrada não equivale automaticamente a uma interpretação aceita.
- Uma relação representada em uma ontologia não ganha autoridade por existir no grafo.
- Significado aceito não prova implementação.
- Teste aprovado não prova toda a promessa do produto.

### Limite de posicionamento

CyberAlchemy pode ser mencionado oralmente como o trabalho de onde o método foi extraído. A palestra deve ensinar um método transferível e não funcionar como demonstração ou venda de ferramenta.

### Fonte principal

- [`../the-bug-ticket-that-became-an-ontology.md`](../the-bug-ticket-that-became-an-ontology.md)

### Próximo gate

Revisão humana do título, do resumo completo e da adequação do tom à experiência real do palestrante antes de qualquer submissão.
