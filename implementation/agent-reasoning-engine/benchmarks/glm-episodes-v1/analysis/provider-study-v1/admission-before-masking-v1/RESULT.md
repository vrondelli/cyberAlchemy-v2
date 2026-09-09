# Local H21 result

The candidate tries complete inspected history before masking, using the same transport/token admission and existing one-exchange fallback. It changes one projection site in the isolated H15-derived candidate; live H20 remains unchanged.

[Independent verification](verification.json) passed all 54 scripted cases' receipt, source, effect and admission checks. Both arms passed all nine immediate controls. Admission-first passed all nine unpressured delayed cases versus baseline zero, with the same seven model calls per delayed case. No provider calls were made; traffic was 342 scripted model and 378 scripted tokenizer calls.

All 18 pressured cases remain incorrect, equally across both arms. They exercise the unchanged fallback and are retained as an unresolved semantic gap. This result supports avoiding premature masking when evidence fits; it does not qualify recovery under pressure, larger request bodies or actual GLM behavior.

The [canonical observation and learning decision](research.json) call for a separately frozen live comparison after H20 review. H20's original 24-row schedule, candidate and thresholds are untouched. No serving policy, core source or default profile is activated by this candidate.

## Open Questions

Can real tokenizer admission preserve the short documents at each tested window with the expected call savings? How should recovered working evidence be retained when fallback is truly necessary? Do full-history prompts hit byte limits before token admission on long documents? README.md owns these construction and live-study boundaries.
