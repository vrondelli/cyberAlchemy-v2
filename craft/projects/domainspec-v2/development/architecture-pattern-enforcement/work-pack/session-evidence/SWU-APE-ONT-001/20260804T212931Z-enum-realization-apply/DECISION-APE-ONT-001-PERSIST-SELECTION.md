# Decision: persist SWU-APE-ONT-001 selection

- Decision ID: `DEC-APE-ONT-001-PERSIST-SELECTION`
- Status: pending operator decision
- Classification: blocker
- Target scope: `SWU-APE-ONT-001`
- Consequential work blocked: single-use Task Session execution and the exact two-file ontology mutation
- Source of decision: Task Session governance-runner precondition plus the canonical Work Pack selection rule

## Question

May Task Session update the one canonical Work Pack file so that
`SWU-APE-ONT-001` is the unique selected SWU for this admitted attempt?

## Options

### `authorize-work-pack-selection`

Update only
`projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md`
to persist `SWU-APE-ONT-001` as selected, then regenerate any exact references
invalidated by that one-file change, rerun admission, atomically consume the
admission in the governance runner, and execute the already-approved two-file
ontology delta.

- Benefit: satisfies the canonical selector and preserves the single-use execution chain.
- Cost/risk: expands the approved mutation scope from two product files to one lifecycle file plus the already-declared execution receipt.
- Reversibility: reversible through a later owner-governed selection transition.
- Recommendation: choose this option because it is the smallest truthful route to live execution.

### `defer-selection-update`

Keep all live files unchanged and retain the staged package and passing admission as local evidence.

- Benefit: preserves the exact original two-file approval boundary.
- Cost/risk: the SWU remains blocked and unexecuted.
- Reversibility: execution can resume after later explicit authorization.

### `stop-swu`

End this SWU attempt without consuming the admission or changing live ontology files.

- Benefit: clean stop with no product mutation.
- Cost/risk: Enum realization identity remains absent from the live ontology.
- Reversibility: a new attempt can be prepared later.

## Current evidence

- The Work Pack declares `selectedSWU` as `none` and names `SWU-APE-ONT-001` as the unique nearest candidate.
- The Plan-once selection receipt and Task Session mutation-admission receipt both pass for the exact SWU and two material targets.
- The governance runner rejects normal entry until the canonical Work Pack contains exactly one selected SWU.
- The pre-execution fast path is not usable because it requires a completed, joined owner hop with a passing helper closeout; that evidence does not exist for this attempt.
- No live ontology target has been modified and the single-use admission token remains unconsumed.

## Selection

- Selected option: pending
- Rationale: pending
- Decision source: pending user response
- Remaining blocker: exact one-file Work Pack scope authorization
- Deferred decisions: none
- Assumptions: none
