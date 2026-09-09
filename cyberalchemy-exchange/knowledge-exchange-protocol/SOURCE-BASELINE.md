# Current KEP parent source baseline

The owner selected the tested parent-source-refresh-20260905 baseline with the exact instruction “do it” on 2026-09-05. CURRENT-SOURCE-BASELINE.json identifies the exact decision and source registry. Consumers evaluating the current parent source baseline should resolve that pointer.

The selected material digest is feac2268f5ca4589d769c2193e6fa614fa48605f2455cb74b364e06368979ec5. This is a product-meaning source selection, not a new ontology admission or operational permission.

Run `python3 cyberAlchemy-v2/product/knowledge-exchange-protocol/scripts/validate-source-baseline.py` from the repository root to check the owner selection, candidate currentness, and preserved historical bytes.

The existing product-thesis.sources.json and decisions/ontology-admission.json are retained unchanged as the old epoch. The existing root validate.py still evaluates that historical epoch; its parent-source currentness failures are not evidence that the new selection failed. The candidate's earlier receipt remains historical preacceptance evidence and is not rewritten to claim approval.

This decision does not publish, release, deploy, activate a runtime, or authorize external effects.
