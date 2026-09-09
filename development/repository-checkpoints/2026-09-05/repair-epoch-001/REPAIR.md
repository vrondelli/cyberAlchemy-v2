# Checkpoint repair epoch 001

Operational support. Base commit: 9afdfad3b4906c989dc3cd46cecda798a47bb4fa.
No product approval, admission, publication, release, deployment, or external effect is granted by this repair.

## Completed

- Corrected supported-profiles.yml to bind the actual meta-types bytes, bc800afdca36fa701a13ec611e7ee0ef928a4c8d259d48dfac2880a3cc8cbbc4. New registry digest: 489fb4faa8cd00554c03d7673c9c4a9035abcecb6e6b165dc5e87239cede2305.
- Updated all 18 inventoried supported-registry development profiles, plus the current UI and SFOL development profiles, and their selected project manifests. Current fixture manifests and expected generated views are synchronized. This is one coordinated evidence epoch, not a standalone registry edit.
- Verified 21 direct project builds twice for determinism and refreshed existing generated views. Rebuilt the 15 applicable package builders after repairing four pre-existing source-binding/path failures. SFOL capability views and current candidate construction references were refreshed without changing its owner selections. Financial-settlement projections were rebuilt without deleting other output files.
- Refreshed candidate Review and Workspace source/view references; kept Review conformance NOT_EVALUABLE and authority_effect none. The Review validator now passes.
- Fixed standalone pnpm installation to use --ignore-workspace, preventing dependency installation into an unrelated ancestor workspace. Existing workspace installations keep their previous behavior. Both UI installations used frozen lockfiles; no lockfiles changed.
- Re-ran IDE tests on host Node 26.8.1, where the sibling Foundation runtime and host isolation tools are available. No IDE source changes were needed.

## Current checks

| Check | Result |
| --- | --- |
| Minted-project suites | 34/34 PASS, including original compiler tests |
| UI/SFOL/financial-settlement build suites | 37/37 PASS |
| Essays | 12/12 PASS |
| Workspace | 78/78 PASS |
| IDE/Foundation | 10/10 PASS on host |
| Review negative-mutation tests | 4/4 PASS |
| ARE, routing, Review validators | PASS within each validator's claim ceiling |
| KEP new candidate tests | 2/2 PASS, including deterministic non-authoritative evaluation and source-tamper rejection |
| KEP candidate preacceptance | PASS; material digest feac2268f5ca4589d769c2193e6fa614fa48605f2455cb74b364e06368979ec5 |
| Whitespace and shell syntax | PASS |

## Remaining owner decision

KEP's historical source registry and admission decision still bind older parent-thesis bytes. They remain unchanged. Consequently, the historical KEP root validation and its two old baseline expectations still fail currentness; they have not been relabeled PASS.

The separate candidate lives at cyberAlchemy-v2/product/knowledge-exchange-protocol/candidates/parent-source-refresh-20260905. Its evaluator copies the original material into scratch space, substitutes only the candidate source registry, and runs the existing validator in non-authoritative preacceptance mode. The two updated source bindings select the current parent product thesis and its machine record. The candidate cannot grant or rewrite admission.

A new owner review and exact decision is required before replacing the historical admitted binding. This is the remaining blocker to claiming current KEP admission; it does not block the completed technical repairs.

## Preserved residue

All 81 prior-reference records classified as historical or owner-bound remain byte-for-byte unchanged. This group also includes nonselected prototype baselines: preservation is not a claim that their references are current. Frozen DomainSpec implementation copies, migration/candidate manifests, historical receipts, and owner decisions were not rewritten. Current alchLang language implementation, public Arcanum, submodule pins, and dependency lockfiles have no diff.

The previous checkpoint report remains historical. This report records the new epoch rather than changing its old results. The accompanying changed-files manifest gives exact before/after hashes for the repairs; evidence-report files themselves are outside that manifest to avoid self-reference.

Changes are local and uncommitted. No repair publication was performed.
