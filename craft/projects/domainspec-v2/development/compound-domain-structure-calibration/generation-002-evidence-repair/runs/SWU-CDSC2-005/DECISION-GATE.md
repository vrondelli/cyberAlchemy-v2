---
decision_id: DEC-CDSC2-F3-ADJUDICATION
scope: SWU-CDSC2-005
status: passed
decided_at: 2026-07-12T11:59:29Z
selected_option: option-2-explicit-pre-post-adjudication-layers
source: user
---

# Decision Gate: F3 Substitution Adjudication

## Blocker Question

How may generation 2 incorporate the accepted M1/M2 observations when the
parent F3 substitution observable and its matrix explicitly encode that those
observations do not exist?

## Option 1 - Constrained Coordinate Replacement (Recommended)

Preserve `G`, `A`, `Q01-Q05`, and their matrix cells exactly. Replace only the
`Q6` substitution statement, its six matrix cells, and the corresponding
`S`/`U`/`D` fields from the frozen M1/M2 handles. Add no explanation and make no
identity, portability, or pattern claim.

Benefit: repairs the known evidence gap inside the existing schema and keeps the
change limited to the coordinate whose evidence changed.

Cost/risk: treats "copy Q and matrix" as freezing the unaffected interpretation,
not every byte. This policy must be made explicit in the task result so it
cannot become permission for general post-outcome editing.

Downstream impact: SWU005 can resume immediately; SWU006 may evaluate only the
frozen repaired receipt.

## Option 2 - Add Explicit Pre/Post Adjudication Layers

Stop SWU005 and refresh the receipt contract so the pre-registered parent
observable/matrix and the post-observation adjudication are separate fields or
linked artifacts.

Benefit: preserves the original interpretive baseline literally and makes the
temporal evidence boundary unambiguous.

Cost/risk: expands the schema, parity validator, evaluator, tests, and work-pack;
generation 2 cannot continue under the current plan.

Downstream impact: route back through Invoke refresh, then rerun parity before
resuming SWU005.

## Option 3 - Preserve Parent Receipt And End The Repair

Keep the parent `Q` and matrix byte-for-byte and do not freeze an F3 v2 receipt.

Benefit: strongest possible immutability with no contract reinterpretation.

Cost/risk: the accepted M1/M2 evidence cannot enter F3 under the current model,
so the generation-2 objective remains unmet.

Downstream impact: close this package as blocked/abandoned; SWU006 and SWU007 do
not run.

## Explain / More Context

This is non-committal. It expands why changing only Q6 is or is not a forbidden
post-outcome interpretation edit and then re-presents the same three options.

## Recommendation At Gate Open

Select Option 1. The experiments did not create a new explanatory hypothesis;
they filled the exact substitution-evidence hole already named by Q6. Freezing
all unaffected explanations, observables, and matrix cells keeps the repair
bounded, while retaining the false absence statement would not.

After the user requested deeper explanation, inspection of the complete parent
semantic payload exposed a stronger concern: `Q-06` combines two distinct
preregistered substitutions, while each matrix cell has only one total state.
A post-observation replacement would therefore require new judgment about
partial explanatory coverage. Option 2 became the methodologically stronger
reusable protocol.

## Resolution

The user selected Option 2 on 2026-07-12.

Generation 2 must preserve the parent pre-observation `Q-06` and matrix as an
immutable linked baseline, preserve M1/M2 as separate immutable observation
receipts, and introduce a separately versioned adjudication layer. The refreshed
contract must represent permitted and breaking substitutions independently so
one explanation cannot receive an ambiguous combined matrix state.

This decision authorizes an Invoke refresh only. It does not authorize schema,
evaluator, F3, result, index, identity, pattern, or canonical mutation.

## Remaining Blockers

Decision blockers: none.

Execution blocker: the current receipt schema, parity preflight, evaluator, and
SWU005/SWU006 contracts do not implement the selected three-layer protocol.
