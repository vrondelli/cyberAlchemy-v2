# Interrogation refine-design-review — Due-Diligence Re-attack (s7)

The skeptic re-reads the final EXPLAINER as a buyer's technical advisor.

- **Check 1 — overclaims killed?** Yes. No "bug-free" (FAQ says "no tool makes
  that honest claim"); no "fully automated" (human key is explicit); no "done
  today" (explicit built-vs-roadmap box). PASS.
- **Check 2 — assurance ladder accurate?** Yes. "Proven" tier limited to the
  well-formedness theorem; consistency/dependency checks correctly sit in
  "machine-checked (reproducible, not a grand proof)"; intent + sign-off in
  "human-judged". Matches the engineering evidence. PASS.
- **Check 3 — does honesty kill the sell?** No — the FAQ and the assurance ladder
  are framed as the differentiator ("we tell you exactly how strong each guarantee
  is"). A diligence advisor reads this as credibility, not weakness. PASS.
- **Residual nit:** "shrink whole classes of defects" is a claim — acceptable
  because it's scoped to "of the defined kind" and the FAQ immediately qualifies
  it. Keep, do not strengthen.

## Verdict: PASS. No surviving overclaim. Ship the explainer.
