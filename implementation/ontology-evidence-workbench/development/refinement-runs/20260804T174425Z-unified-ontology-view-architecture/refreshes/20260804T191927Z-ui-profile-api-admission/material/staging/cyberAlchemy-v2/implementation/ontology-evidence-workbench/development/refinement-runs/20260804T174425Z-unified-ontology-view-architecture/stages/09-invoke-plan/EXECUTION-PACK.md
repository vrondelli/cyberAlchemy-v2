# Execution Pack

Execute one SWU per Task Session. No parallel source mutation is planned because later renderer/build units depend on stable semantic contracts.

| Wave | Layer | Units | Entry gate | Exit gate |
|---|---|---|---|---|
| [W1 Semantic trust](waves/W1-SEMANTIC-TRUST.md) | L0 | 001–006 sequential | current design fixed point | G1 pure semantic receipts pass |
| [W2 Visible prototype](waves/W2-VISIBLE-PROTOTYPE.md) | L1 | 007–014 sequential; UI API admission 007 first | G1 | G1U plus G2 adapter and navigation receipts pass |
| [W3 Full Body War](waves/W3-FULL-BODY-WAR.md) | L2 | 015–021 sequential, with 018 before 019/020 | G1U + G2 | G3 exact build/browser receipt passes |
| [W4 Reuse](waves/W4-REUSE.md) | L3 | 022 then 023 | G3 | G4 static/cross-project parity passes |

Failure policy: stop at first acceptance-critical failure, preserve producer-owned diagnostics, and do not infer retry authority. The Task Session closeout contract in `WORK-PACK.md` applies to every unit.
