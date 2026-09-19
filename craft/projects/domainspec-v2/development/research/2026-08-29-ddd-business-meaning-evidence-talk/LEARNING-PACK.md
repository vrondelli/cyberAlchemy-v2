# Submission Learning Pack

## Recommendation

Submit a DDD experience talk about using bounded evidence to challenge and evolve
business meaning. Keep CyberAlchemy and DomainSpec v2 as the laboratory, not the
headline.

## Recommended Title

**Da linguagem ubíqua à evidência executável**

Subtitle:

**Um experimento para transformar regras de negócio em obrigações verificáveis sem perder o domínio**

## Alternative Titles

1. **DDD além do código: significado de negócio, contraexemplos e verificação evolutiva**
2. **Quando a regra de negócio precisa provar o que diz**
3. **Do significado ao contraexemplo: um laboratório de DDD com modelos executáveis**

## Abstract Seed In Portuguese

Em DDD, construímos uma linguagem compartilhada para aproximar especialistas de
domínio e pessoas de tecnologia. Mas, quando uma regra atravessa modelos, código,
testes e decisões arquiteturais, nem sempre conseguimos responder: qual significado
foi implementado, qual evidência o sustenta e o que ainda não sabemos?

Nesta palestra, apresento um experimento que parte de uma regra de negócio em um
contexto delimitado e a conecta a um modelo tipado, uma obrigação explícita, uma
implementação e casos positivos e negativos. O resultado não é uma promessa de
“provar o negócio”. É uma evidência com limites claros, capaz de mostrar o que foi
verificado, rejeitar interpretações deliberadamente erradas e devolver
contraexemplos para a conversa de domínio.

Vamos percorrer um exemplo de ponta a ponta e separar teste executável, modelo
limitado, prova formal e comportamento em runtime. Ao final, você terá uma forma
incremental de aplicar mais rigor às regras de maior risco sem transformar toda a
equipe em especialista em métodos formais — e sem trocar linguagem ubíqua por uma
linguagem que só a ferramenta entende.

## Core Promise To The Audience

The audience will leave able to choose one important domain rule and create a
traceable, challengeable evidence path without pretending that one passing proof
or test validates the whole domain.

## What To Demonstrate

```text
business phrase
  -> typed domain claim
  -> explicit obligation
  -> implementation binding
  -> valid example
  -> deliberately wrong examples
  -> observed result
  -> bounded evidence statement
  -> new domain question
```

## What To Say About CyberAlchemy

CyberAlchemy is the broader product hypothesis: people and machines should be
able to continue complex work without losing meaning, evidence, ownership, or
open questions. In this talk, DomainSpec v2 and EVF are one experiment inside
that hypothesis.

Do not describe CyberAlchemy as an adopted or validated product. Do not make the
audience learn its complete ontology or governance model.

## Claim-Safe Vocabulary

| Prefer | Avoid |
| --- | --- |
| bounded evidence | proof of the business |
| selected domain rule | complete business meaning |
| explicit obligation | automatic semantics |
| deliberately wrong case / mutation | guaranteed correctness |
| observed within this scope | formally verified system |
| unknown or unresolved result | failed tool means false rule |
| owner decision supported by evidence | evidence made the decision |

## Reviewer-Facing Strengths

- The talk starts from a real DDD tension, not from a tool.
- It connects strategic meaning and ownership to tactical rules and operations.
- It has a concrete end-to-end example.
- It offers practical adoption steps.
- It explains failure, uncertainty, and limits instead of presenting a magic
  formal-method solution.

## Next Evidence Before Submission

The evidence program is now defined in
[EXP-DDD-EVF-001](./EXPERIMENT-PLAN.md). The immediate sequence is:

1. Confirm the live CFP and its fields or proceed as preparation for the next
   call.
2. Review and select `EXP-001`: the public fictional example, planted ambiguity,
   and disclosure boundary.
3. Rehearse the explanation with one DDD practitioner and one product/domain
   participant.
4. Record where they misunderstand “obligation,” “proof,” “bounded,” or
   “receipt.”
5. Revise the abstract and talk arc from those observations.
6. Run a separate public/private content review before submission or recording.
