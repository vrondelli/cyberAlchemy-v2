# Independent evidence join candidate

Additive offline component. No live admission or benchmark-quality claim. Parent: [execution contract](INDEPENDENT-INVESTIGATION-CONTRACT.md). Open questions below own integration residue.

The native delivery binder scopes observations by tool-call ID. Combining independent conversation captures directly is invalid when those conversations reuse IDs. `bindInvestigationEvidence` instead applies the unchanged native binder separately to each declared branch's actual captures and receipt subset. Captured bytes and native observation IDs remain untouched. Local receipt positions are mapped back to the original global receipt array.

Different observations sharing a tool-call ID keep their distinct native content-derived read IDs and are listed as collisions. Identical native observations merge their confirmed global receipt positions while preserving explicit branch memberships. This makes the read view compatible with the unchanged source projector without asserting that all captures form one conversation. The old combined-history terminal selector/exporter is not yet compatible; it must use a separately verified branch-aware delivery view before live execution.

Inputs declare branch IDs q1 through q3 and strictly increasing, non-overlapping receipt indices. Successful known-cost model delivery is required for each branch; malformed source envelopes, unconfirmed delivery and unknown model usage fail closed. Unassigned global receipts stay explicit: they can include planner/join/index operations, so this component deliberately does not claim whole-arm accounting or provider health. The phase/transport layer owns those checks. The caller must bind branch assignment to runtime phase metadata; this pure function verifies declared receipt/capture bindings, not their scheduling history.

`verifyInvestigationJoin` reconstructs the whole view from inputs. `validateInvestigationFinding` requires that reconstruction before accepting a bounded provisional-claim object. Every claim must cite one or more read IDs actually delivered in its own branch. This verifies references, not semantic truth or relevance. Empty claims are allowed for an investigation that found nothing; they cannot count as task success. Structured limits are at most8claims,1000characters per claim,16references per claim and8192serialized bytes; real-tokenizer fit remains required.

Four offline tests exercise actual native delivery envelopes with colliding tool IDs, source projection of both files, merging identical observations, retained memberships/global indices, rejected cross-branch references and duplicate assignments, capture drift, failed dispatch and unknown usage. Fixture data and temporary source files only; no provider or evaluator reference access.

## Open questions

Implement branch-aware terminal selection and export that reverify this join and the exact final packet/response. Do not bypass native delivery validation or rename captured IDs. Bind branch receipt assignments to the phase ledger and preserve one cumulative arm budget. Independent histories, planner generation, final findings delivery, minimal-history baseline and real tokenizer qualification remain pending. Full runtime tests and independent exact freeze are required before generation.
