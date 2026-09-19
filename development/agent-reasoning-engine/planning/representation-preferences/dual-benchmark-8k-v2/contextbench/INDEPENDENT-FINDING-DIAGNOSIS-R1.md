# Independent finding failure diagnosis

The deterministic replay in [analyze-independent-findings-r1.mjs](analyze-independent-findings-r1.mjs)
reproduces both original validator errors from the exact saved model responses,
branch captures and receipts. [Machine evidence](INDEPENDENT-FINDING-DIAGNOSIS-R1.json)
binds the script, validator source and four input files. No model calls were made
and no original result was changed.

| Task slot | Confirmed branch reads | Finding claims | Exact rejection |
| --- | ---: | ---: | --- |
| 00 | 61 | 5 | Claim 3 contains a 63-character ID missing one character from a confirmed ID. The claim also cites the correctly spelled ID. |
| 03 | 17 | 1 | Claim 0 cites the invented label `list_files:html-tag-hydration-samples`, which is not a confirmed read ID. |

All other per-claim checks in the original validator pass for these responses.
Both errors occurred in the third investigation. The validator enforces exact
confirmed membership; that rule must remain intact. Similarity in the diagnostic
is explanatory only and never authorizes correction or evidence promotion.

The current tool schema accepts arbitrary string IDs, while the runtime requires
membership in confirmed branch evidence. The runner aborts the entire task on
a rejected submission and has no correction exchange. These are measured
interface and recovery gaps; they do not establish that the underlying source
claims or eventual benchmark selections would have been correct.

## Candidate hypothesis for prospective registration

H-F: A finalization interface with short, deterministic references mapped only
to confirmed branch reads, plus structured validation feedback within a fixed
reserved budget, reduces invalid finding terminations without increasing total
tokens enough to erase quality gains.

Competing explanations: evidence acquisition is still insufficient; valid
references may support irrelevant claims; a reference catalog and correction
exchange may consume too much of the 8K window or phase budget.

Before implementation, register this as a successor to the audited independent
experiment, with exact task cohort, token ceiling and candidate source scope.
Test mappings, cross-branch rejection, fabricated/duplicate references, empty
claims, all field violations, budget exhaustion and delivery after projection.
Do not use fuzzy ID repair. Qualify finalization prompts as well as initial
prompts. Keep the original failed campaign frozen.

## Ordered next work

1. Prepare separate descriptive native scoring for completed slots 01 and 02.
   Preserve all four assignments and all 200,173 tokens; this cannot pass the
   original campaign or prove savings.
2. Register the result and successor hypothesis using the existing research
   ontology and DAG, with counterevidence and explicit quality limitations.
3. Implement and test an additive finding interface candidate; qualify and
   review it before live execution.
4. Develop the radical query-driven archive hypothesis independently. Its
   readiness must not block a ready improvement candidate.

Product frontier: strict provenance with a model-usable submission interface.
Operational support: research operator maintains exact freezes, two-worker
ceiling, D:/WSL disk admission and clean process settlement. No operational
blocker currently prevents local construction. Controls remain suspended.
Release and worker expansion are deferred, not construction prerequisites.

## Open Questions

Does the catalog fit within 8K for observed branches? Can corrections fit inside
the existing 24K investigation cap without displacing useful source reads?
Should non-read evidence types have a separately defined claim contract?
What do native scores of the two completed outputs show about acquisition
versus final selection? Perfect quality and the original 15% token reduction
target remain unproven.
