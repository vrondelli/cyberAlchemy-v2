# Interrogation refine-design-review — Skeptic Re-attack (s7)

The skeptic re-attacks DEC-FIT-01 and the bridge spec.

- **Attack 1:** "PARTIAL-BRIDGE is just a polite way to say incidental." —
  *Rejected.* The split is testable: P3/P4 have a *named hole* whose intended
  filler is contract-shaped (TRANSLATOR-DESIGN defers them "gated on B-1"). That
  is a concrete dependency, not a courtesy. Verdict holds.
- **Attack 2:** "Derive-the-table-from-the-language could be circular — the
  validator validates specs the language produces." — *Valid caution, recorded.*
  Mitigation: Stage A still proves *internal* correctness (P1/P5/σ-typing) of the
  derived table independent of the language's authority claims; the language
  supplies *content*, the σ-model supplies *well-formedness*. Not circular if the
  two authorities stay separated (mirrors the language's own anti-collapse rule).
- **Attack 3:** "B-1 might be unsolvable cleanly — prose obligations may not
  reduce to per-Meta predicates." — *Real risk.* Downgrades the bridge from
  'will hold' to 'conditional'; recorded as residue R-bridge-feasibility.

## Verdict: PASS (provisional). DEC-FIT-01 survives re-attack as PARTIAL-BRIDGE.
Two residues added: R-circularity (keep content vs well-formedness authorities
separate) and R-bridge-feasibility (B-1 may not fully mechanize).
