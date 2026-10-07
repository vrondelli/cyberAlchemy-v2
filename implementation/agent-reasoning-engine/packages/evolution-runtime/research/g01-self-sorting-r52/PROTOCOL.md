# G01 exposed Self-Sorting escalation r52

Status: prospectively fixed before packet construction or GLM calls  
Scope: private exposed development evidence only  
Authority effect: none

## Objective

Test whether one selection-time comparison of the four sealed r51 ranking
lists adds useful cross-list preference to their within-list ranks. This is the
precommitted escalation after r51 failed its strict response-validity gate.

## Fixed inputs and construction

- the 71 sealed r51 predictions and their prediction seal;
- four top-eight lists per case: graph, historical raw GLM, reverse-view GLM,
  and half-rotation-view GLM;
- the failure context from the sealed r51 packet, without entity cards;
- anonymous list identities and a deterministic presentation rotation by case
  sequence, so arm names and a fixed display position are not model evidence;
- exactly one selection-time ranking call per case.

The model must return all four displayed list IDs, best to worst. The response
is mapped back to the four sealed ranking identities before scoring.

## Fixed Self-Sorting rule

Use Algorithm 1 from *Beyond Sampling: Self-Sorting for Long-Context Ranking*
with `m=4`, `n=1`, top-list length `k=8`, and `lambda=0.5`.

For every item at position `p` in a list placed at cross-list rank `r`, add:

`(1/r)^0.5 * (1/p)^0.5`

to its score. Rank the union of the four top-eight lists by descending score;
break ties by the sealed r51 RRF rank, then graph rank, then path. Append the
remaining sealed r51 RRF ranking unchanged. No parameter may change after
labels are opened.

## Prospective advancement gate

All conditions are required:

1. `71/71` tokenizer admissions and strict valid generations;
2. every response is an exact permutation of the four displayed list IDs;
3. every Self-Sorting result preserves exactly the complete graph universe;
4. combined Self-Sorting MRR@8 exceeds r51 RRF by at least `0.01`, with a
   paired-bootstrap 95% lower bound above zero;
5. combined Hit@3 is at least r51 RRF Hit@3;
6. Self-Sorting MRR@8 exceeds r51 RRF in at least two of three cohorts;
7. no cohort loses more than `0.01` MRR@8 versus r51 RRF.

Passing is exposed development evidence only. It cannot establish superiority
or replace an independent confirmation population.

## Cost and failure bounds

- model `glm-5.3-flash`, reasoning effort `low`;
- exactly 71 tokenizer calls and at most 71 generation calls;
- 256 completion tokens per call, 8,192 prompt-plus-reserve limit;
- no automatic retries; transport failure stops dispatch;
- malformed HTTP-200 responses are recorded and dispatch continues.

## Open questions

- Does one cross-list judgment improve over fixed RRF enough to justify its
  extra production call?
- If it does not, can RRF advance through a prospectively robust response
  contract and fresh confirmation without further exposed tuning?
