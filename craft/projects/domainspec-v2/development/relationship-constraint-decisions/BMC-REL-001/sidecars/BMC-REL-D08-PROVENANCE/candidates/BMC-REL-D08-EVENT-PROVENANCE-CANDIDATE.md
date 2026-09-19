# BMC-REL-D08 Event Provenance Candidate

Status: `candidate-only-pending-owner-decision`

Authority effect: `none`

Decision effect: `none`

Decision ID: `BMC-REL-D08-EVENT-PROVENANCE`

## Consequential question and strict boundary

Should D08 add an explicit verb-local non-collapse constraint across canonical `produces` and `emits`, retain
only their existing endpoint-specific provenance meanings without an additional constraint, defer, or stop?

Current evidence distinguishes two authored facts:

- `Operation --[produces]--> Event`: an Operation causes an Event on successful completion;
- `Entity --[emits]--> Event`: an Entity is the Event subject/source.

The shared Event target does not establish equality, pairing, implication, uniqueness, or numeric authority across
the two verbs. Both compatibility tokens are `one_to_many`, but those tokens do not supply numeric minima or
maxima. D08 does not require either fact to exist, collapse Operation into Entity, permit
`Operation --[emits]--> Event`, infer a causal chain or runtime occurrence, select closure, duplicates, inverse,
representation, serialization, storage, or any packet mutation. This gate prepares a semantic decision only.

<a id="bmc-rel-d08-a-verb-local-typed-provenance-non-collapse"></a>
## `BMC-REL-D08-A-VERB-LOCAL-TYPED-PROVENANCE-NON-COLLAPSE`

- Option kind: `action`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `authority`
- Owner gate: `decision-gate:owner-decision`
- Rejection reasons: none at structural prefilter.
- Shape: make the canonical endpoint/verb distinction an explicit D08 constraint. Each authored `produces` fact
  carries only Operation-cause provenance; each authored `emits` fact carries only Entity-subject/source
  provenance. Neither verb implies, requires, equals, or supplies the other.
- Benefit: preserves the evidenced provenance axes and fails closed against endpoint or verb collapse.
- Risk: adds an explicit cross-row invariant and later requires a typed packet projection plus hostile fixtures.
- Downstream effect: a separately accepted representation would have to bind both exact signature IDs and reject
  cross-verb derivation while leaving every ordinary facet unresolved.

<a id="bmc-rel-d08-b-retain-canonical-endpoint-provenance-only"></a>
## `BMC-REL-D08-B-RETAIN-CANONICAL-ENDPOINT-PROVENANCE-ONLY`

- Option kind: `action`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `authority`
- Owner gate: `decision-gate:owner-decision`
- Rejection reasons: none at structural prefilter.
- Shape: decide that the existing canonical cards and endpoint policy are sufficient. Preserve their meanings and
  invalid-endpoint rule, but add no D08 cross-row provenance constraint.
- Benefit: smallest authority surface; it avoids inventing a relation between two independently typed facts.
- Risk: no machine-readable D08 invariant exists beyond the current per-signature endpoint authority.
- Downstream effect: D08 closes without a new packet projection; any later cross-verb constraint requires fresh
  evidence and a new owner gate.

<a id="bmc-rel-d08-c-defer"></a>
## `BMC-REL-D08-C-DEFER`

- Option kind: `defer`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `reversible`
- Owner gate: none
- Rejection reasons: none at structural prefilter.
- Trade-off: keep the canonical cards unchanged and D08 unresolved while awaiting application-specific provenance
  validity evidence. Downstream constraint completion remains blocked.

<a id="bmc-rel-d08-d-stop"></a>
## `BMC-REL-D08-D-STOP`

- Option kind: `stop`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `reversible`
- Owner gate: none
- Rejection reasons: none at structural prefilter.
- Trade-off: terminate this relationship-constraint decision route without adding D08 authority.

## Rejected constructions

- `BMC-REL-D08-X-COLLAPSE-PRODUCES-AND-EMITS`: one generic Event-origin edge would erase the evidenced
  Operation-cause versus Entity-subject/source endpoint distinction.
- `BMC-REL-D08-Y-MANDATORY-CROSS-VERB-PAIR`: requiring every `produces` fact to have a matching `emits` fact, or
  vice versa, lacks existence, correlation, and equality evidence.
- `BMC-REL-D08-Z-TOKEN-DERIVED-PROVENANCE-COUNTS`: `one_to_many` is compatibility vocabulary, not numeric or
  uniqueness authority.
- `BMC-REL-D08-W-RUNTIME-CAUSAL-EQUALITY`: equating design-time edges with runtime occurrences, publishers,
  payloads, or causal-chain identity exceeds the canonical cards and the candidate packet.

## Recommendation without selection

Recommend `BMC-REL-D08-A-VERB-LOCAL-TYPED-PROVENANCE-NON-COLLAPSE`. The canonical Event endpoint policy and the
relationship non-collapse test directly support preserving the two typed provenance meanings while rejecting
cross-verb inference. The recommendation does not choose an option and has `decision_effect: none`.

## Explain-path complexity ladder

Shared invariant: every option preserves the exact canonical endpoint meanings, does not derive numbers from
`one_to_many`, does not require either edge, and does not invent cross-verb equality, runtime, or representation
semantics. The scenarios are hypothetical, option-aligned, and have `decision_effect: none`.

### Low — one Operation-caused Event

A hypothetical `ApproveOrder --[produces]--> OrderApproved` fact is present and no `emits` fact is shown. A treats
the fact only as Operation-cause provenance and does not require an Entity subject/source. B retains the existing
`produces` card with no new D08 invariant. C defers the additional decision; D stops the route. The scenario does
not prove runtime publication or an existence minimum.

### Medium — one Event with both provenance facts

A hypothetical `ApproveOrder --[produces]--> OrderApproved` fact and
`Order --[emits]--> OrderApproved` fact target the same Event concept. A preserves two independent typed meanings
and does not infer that the Operation and Entity are equal or mutually derivable. B retains the two canonical cards
without adding a cross-row constraint. C defers; D stops. The scenario does not prove mandatory pairing or a
publisher/payload model.

### Complex — incomplete and conflicting provenance pressure

A hypothetical graph contains several Operations and Entities, some Events with only one provenance fact, and an
invalid attempted `Operation --[emits]--> Event` fact. A rejects the invalid endpoint/collapse and evaluates each
valid authored fact only under its verb-local meaning; it does not count, pair, or correlate the facts. B relies on
the existing endpoint policy and adds no D08 invariant. C leaves additional constraints unresolved; D terminates.
The scenario does not establish closure, uniqueness, runtime occurrence, serialization, or application validity.

## Claim ceiling

This candidate presents D08 semantic alternatives only. It does not select or apply one, mutate the packet,
schema, validator, relationships, definitions, or implementation, infer numeric or other topology semantics,
establish application-specific provenance validity, implement enforcement, publish, release, deploy, or prove
production use.
