# Open Residue

Open count: **9**

| ID | Residue | Type | Next owner / route |
| --- | --- | --- | --- |
| R1 | G.11 proof is left to the reader and its printed `CoMon(C)` target is type-suspicious | source audit | category-theory reviewer; do not silently repair |
| R2 | G.12 general endofunctor/free-monad algebra bridge is conjectural | formal | paper authors / independent proof |
| R3 | G.10 coherence is not machine checked here | formal | Lean higher-algebra route |
| R4 | local `Para(C)` lacks horizontal composition and interchange | formalization | paired Lean tower |
| R5 | pinned Mathlib lacks the required bicategorical monad layer | implementation gap | upstream/local higher-category work |
| R6 | no concrete differentiable category/action is selected | modeling | ML/category owner |
| R7 | no tensor-program or numerical weight-tying validation exists | executable/empirical | research evidence harness |
| R8 | universal, verification, fairness, safety, and compliance claims lack evidence | empirical | source-specific evidence program |
| R9 | no owned CAV2 use case exists for the candidate typed coupling | decision | architecture owner; no route opened |

## Sharpest separation

R3–R7 concern the paper's mathematical or executable program. R9 concerns
whether CAV2 needs any local bridge. Solving the former does not decide the
latter.
