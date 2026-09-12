# “Em estoque” para quem? — apresentação v3

Apresentação em português baseada na [narrativa v3](../../do-dominio-ao-codigo-ddd-narrativa-v3.md), incluindo descoberta de eventos, mapa traduzido, comerciabilidade e evolução de estados sem horários.

## Abrir e apresentar

- Abra [index.html](index.html) no navegador. HTML, estilos, diagramas SVG e comportamento estão no mesmo arquivo; não há fontes, scripts ou serviços externos.
- Use as setas, Page Up / Page Down ou os botões para navegar; Home / End vão ao início e ao fim.
- `I` abre o índice. `N` mostra notas de fala na mesma tela, para ensaio. `F` solicita tela cheia.
- Os controles de formulário preservam seu comportamento de teclado quando estão em foco. Clique na área do slide para retomar os atalhos de navegação.
- No slide de estados, selecione uma etapa. No slide da regra, altere as condições para demonstrar o resultado.
- A impressão usa uma página horizontal por slide, sem controles ou notas. O PDF exportado é a versão estática: [apresentacao.pdf](apresentacao.pdf).

## Escopo e fontes

O caso LP-2041 é fictício. O código projetado é pseudocódigo do modelo comercial; a interação demonstra o predicado e não executa reservas. Aprovação e garantias de um sistema real não são estabelecidas por esta apresentação.

Fonte editorial: [narrativa v3](../../do-dominio-ao-codigo-ddd-narrativa-v3.md). O mapa de oito relações foi preservado em dois slides para legibilidade. Os trechos do Aggregate Root foram separados em predicado e operação. As condições da fórmula original aparecem integralmente na demonstração e no método `comerciavel`.

Referências conceituais herdadas da narrativa: [Linguagem Ubíqua](https://martinfowler.com/bliki/UbiquitousLanguage.html), [Bounded Context](https://martinfowler.com/bliki/BoundedContext.html), [eventos de domínio e integração](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation).

## Verificação local

Em 2026-09-12, os 16 slides foram renderizados em Chromium. Navegação por teclado, índice, notas, seleção das três etapas e todas as 32 combinações das cinco condições foram conferidos. Não houve erros de JavaScript, requisições externas ou conteúdo ultrapassando a área verificada dos slides. A navegação também foi conferida em viewport móvel.

O PDF foi verificado com 16 páginas em proporção 16:9, texto em todas as páginas e notas de ensaio excluídas. Capa, diagramas, tabela temporal e código tiveram inspeção visual. Essa verificação cobre a apresentação, não a implementação de um sistema comercial.

## Open Questions

- Confirmar em ensaio a duração e a legibilidade na projeção do evento.
- Confirmar com os responsáveis do domínio as condições e o escopo da política antes de adotá-la em um produto.
- Para uma implementação real, definir validade, ordenação por fonte e tratamento de revogação, quarentena e novos ciclos.
