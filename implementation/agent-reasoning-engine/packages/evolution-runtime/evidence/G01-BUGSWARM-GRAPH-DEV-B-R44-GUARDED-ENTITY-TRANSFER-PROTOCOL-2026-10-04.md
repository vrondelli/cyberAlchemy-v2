# G01 BugSwarm cohort-B r44 guarded entity transfer protocol — 2026-10-04

Status: prospectively frozen before r44 packet construction and model calls  
Population: unchanged 24-case exposed development cohort B  
Claim ceiling: cross-development transfer evidence only

## Objective

Transfer r43's entity-card construction unchanged to the distinct 12-Python /
12-Java cohort B, and prospectively test the fixed graph-prefix-4 guard that
was selected post-hoc in r43. R44 may qualify a candidate for a new untouched
confirmation cohort; it cannot repair r43 or support superiority itself.

## Frozen inputs

- cohort-B source projection:
  `ac0e840cad602ac5b5f80ba7579389ab95cc6efdb4ae682c1744103b29db5d92`
- cohort-B queries:
  `696c742d96c69f7260f94a70d5159620c3bef8bb82e0d34b44beaddc31cdfe8b`
- cohort-B graph-r2 rankings:
  `86b39c47e9ce166d4db66068d5894f3e9cbac1275b11d549df1e17ee121cb32d`
- cohort-B graph seal:
  `bef3ad37a6c4f87d08e3254df47a7ae1c52e641b58a672859511a47737639813`
- cohort-B evaluator labels:
  `ac3ef81c36088dc305508c940df9a86d583c8601ba41874c1369197a14ec376e`
- cohort-B graph evaluation:
  `82b8ce048c7d77d09ea1bfc04bab11e3c68e7d7f12e84cfd2e199c4c43b86fd8`
- unchanged r43 entity-card implementation:
  `f6781792d07cb4ea25e083732e192529d5cb7ac3c07300ca44642e567e34025b`
- r43 terminal result:
  `43cc737f4214a56f562f6e9054610ba15ae2b832dc863252c914b89b5f975b34`
- r43 post-hoc guard diagnosis:
  `bec517676a0223fe96db371668b6f88206147aaf7fd0329a67d9c06b1c325738`

Evaluator labels are pinned for later scoring but forbidden from packet
construction, VPS transfer, tokenizer requests, and generation requests.

## Packet and provider rule

Use the byte-pinned r43 `words` and `card` functions without alteration. For
each case, package `N = min(30, candidate_count)` graph-r2 candidates in graph
order with the same 262,144-byte file-read, 480-byte card, and 24,000-byte
prompt limits.

Run the same private `glm-5.3-flash` configuration as r43:

- 24 tokenizer calls followed by at most 24 generation calls;
- prompt tokens plus 512 at most 8,192;
- aggregate prompt-token cap 240,000;
- reasoning effort low, maximum output 512;
- zero retries, 120-second generation timeout, stop on failure.

## Frozen treatment

Independently reparse each response. Produce two rankings:

1. **raw entity GLM:** selected paths, then unchanged graph remainder;
2. **guarded entity GLM:** unchanged graph ranks 1–4, then selected paths not
   already in that prefix, then unchanged graph remainder.

Both treatments may select only graph top-`N` paths and must preserve the
graph top-`N` set. The four-file guard is fixed from the r43 post-hoc diagnosis
before any r44 model outcome or evaluator label is opened.

## Metrics and transfer gate

Score graph, raw, and guarded rankings with RR@8, MRR@8, Hit@1, Hit@3, and
top-30 reach. The primary contrast is guarded minus graph MRR@8. Use 200,000
paired bootstrap samples with seed `440044` and the r42 empirical percentile
indexes.

The guarded candidate qualifies for a new untouched confirmation cohort only
if:

1. 24/24 tokenizer admissions, valid one-shot generations, independently
   sealed predictions, and independently reproduced scores;
2. 24/24 guarded top-`N` sets exactly equal graph top-`N` sets;
3. guarded MRR@8 exceeds graph and the paired 95% lower bound is above zero;
4. guarded Hit@3 is at least graph Hit@3; and
5. all 24 attempts and every regression remain reported.

Raw entity scores are secondary transfer diagnostics and cannot substitute for
the guarded gate.

## Open questions

- Does the r43 four-file guard transfer without eliminating useful movement?
- Is entity-card value consistent across the balanced language mix?
- If r44 passes, what untouched source supply can support a fully
  pre-screened confirmation population?

