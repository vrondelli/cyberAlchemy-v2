# BMC-REL-D06-P01 Ownership-Dimension Vocabulary Candidate

Status: `candidate-only-pending-owner-decision`

Authority effect: `none`

Parent decision: `BMC-REL-D06-C-ONE-OWNER-PER-OWNERSHIP-DIMENSION`

## Purpose and boundary

Provide exact candidate vocabulary models for the first D06 machine-projection blocker. This artifact is decision evidence, not the canonical definition store. It does not admit a term, edit DS-D8 or D27, change `owns` or `owned-by`, select packet representation, or authorize validation behavior.

The selected parent invariant is fixed across every option:

```text
For every later-admitted ownership dimension d, target Entity t,
and owner Entities o1 and o2:
  owns_d(o1, t) and owns_d(o2, t) implies o1 = o2.

No ownership existence condition is selected.
```

## Shared candidate meanings

These meanings apply only if an option that admits the named triad is selected and its definitions are subsequently written to the canonical definitions source.

### `lifecycle`

Formal candidate voice: responsibility for the target Entity's admission as an identity-bearing domain concept, continuity rules, lifecycle-transition policy, and retirement. It does not by itself grant custody or authority for every business-state write.

Plain-language candidate voice: the lifecycle owner decides when the Entity exists as a governed identity and how its lifecycle may begin, continue, and end.

Domain-context candidate voice: for `Entity --[owns]--> Entity`, this dimension would classify lifecycle responsibility while preserving one canonical `owns` fact and generated `owned-by` navigation.

### `custody`

Formal candidate voice: responsibility for stewardship, possession, placement, or operational keeping of the target Entity without necessarily controlling its lifecycle or all business-state mutation.

Plain-language candidate voice: the custodian looks after or holds the Entity, even when another owner governs its lifecycle or writes its state.

Domain-context candidate voice: this dimension would let a different Entity hold custody without competing with an owner in another admitted dimension.

### `write-responsibility`

Formal candidate voice: responsibility and authority for changing the target Entity's business state under its admitted invariants. It does not by itself determine lifecycle admission, retirement, or custody.

Plain-language candidate voice: the write-responsibility owner is accountable for authorized changes to the Entity's business state.

Domain-context candidate voice: this dimension would classify direct responsibility for Entity-state mutation; it does not turn runtime writers, Operations, permissions, or calls into canonical `owns` edges.

## `BMC-REL-D06-P01-A-CLOSED-CANONICAL-TRIAD`

Admit exactly the closed ordered-neutral set:

```text
ownership_dimension_id in {
  "lifecycle",
  "custody",
  "write-responsibility"
}
```

Benefit: smallest finite vocabulary already named by canonical `owns` prose; straightforward closed-schema validation.

Cost or risk: freezes the present prose triad and requires a new owner decision before any additional dimension can exist.

Downstream: after selection, Definitions Governance must mint the three colocated definition cards and synchronize the index before P02 can be admitted.

## `BMC-REL-D06-P01-B-GOVERNED-EXTENSIBLE-REGISTRY`

Admit a canonical ownership-dimension registry initialized with the same three stable IDs and candidate meanings. Only Definitions Governance may add, revise, deprecate, or remove an entry through a new owner decision. Every entry must carry formal, plain-language, and DomainSpec-context voices plus validation implications.

Benefit: starts from a finite known set while allowing evidence-backed extension without changing the vocabulary model.

Cost or risk: creates a larger registry and lifecycle surface; careless extension could weaken comparability or introduce overlapping dimensions.

Downstream: P02 must bind an exact registry digest, and validators must reject unknown, stale, deprecated, or overlapping entries according to later admitted rules.

## `BMC-REL-D06-P01-C-CANONICAL-RESPONSIBILITY-REFERENCES`

Define an ownership dimension as a reference to an independently admitted canonical semantic-responsibility definition marked as usable by `owns`. No relation-local enumeration is created.

```text
ownership_dimension_ref =
  reference to an active canonical responsibility definition
  where usable_as_owns_dimension = true
```

Benefit: reuses canonical responsibility definitions and avoids a second vocabulary that could drift from D27.

Cost or risk: largest resolution and validation surface; it requires stable cross-definition references and may leave `owns` with no usable dimensions until responsibility cards are separately admitted.

Downstream: P02 must carry a typed definition reference and validators must resolve its active status and `owns` eligibility.

## Deferred and stopped states

- `BMC-REL-D06-P01-D-DEFER`: keep the vocabulary unresolved and D06 machine projection blocked.
- `BMC-REL-D06-P01-E-STOP`: terminate the D06 projection sidecar without semantic change.

## Rejected constructions

- Treating the prose words as already canonical machine tokens.
- Accepting arbitrary free-text or unbound dimension names.
- Inferring a dimension from `one_to_many`, endpoint type, feature scope, inverse navigation, or runtime behavior.
- Requiring every Entity or every admitted dimension to have an owner.

## Claim ceiling

This candidate may support an owner decision about a vocabulary model. It does not itself define or admit an ownership-dimension vocabulary, change canonical definitions or their index, alter DS-D8 or D27, change `owns` or generated `owned-by`, project D06 into the packet, select numeric bounds, resolve other topology facets, authorize D07 semantics, implement validation, promote, publish, release, deploy, or prove production use.
