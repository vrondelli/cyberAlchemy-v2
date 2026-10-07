# Clarified Auth command-boundary meaning — owner decision

Decision time recorded: 2026-10-04T00:38:49Z. Result: PASS for this one semantic choice.

The CyberAlchemy product owner answered **“Accept this exact meaning”** in the
current task. The question identified
`BUSINESS-MEANING.v1-clarified-candidate.json` and stated that READY requires a
nonempty request ID, exactly one fully qualifying trusted authentication row
and one complete route row (counting duplicate entries separately), and a
candidate copied from those same rows. Every other normally evaluated case is
DENY with no downstream call. The alternatives were to revise or defer.

The selected draft was
`auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/BUSINESS-MEANING.v1-clarified-candidate.json`,
SHA-256 `81c7e1620bea64bf75f3da8bedc79ac795e896c7050c58ab098f54f737194019`,
5717 bytes. Its bytes remain unchanged. The accepted postimage is
`auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/BUSINESS-MEANING.v1-clarified-accepted.json`.
It keeps the domain rule, context, applicability, actors, inputs, outcomes,
examples, counterexamples, boundaries, owner, meaning identity, and predecessor
identity unchanged. Only lifecycle metadata changes: version label, accepted
status/envelope, and a claim ceiling that records the bounded acceptance. The
postimage's inherited “draft” wording describes its origin and does not
override its explicit accepted lifecycle status.

The machine decision is `business-meaning-v1-clarified-acceptance.json`, using
the DomainSpec `BusinessAcceptanceDecision/v1-candidate` shape. Its subject
digest `13611925031125d9373bd1fd6e8ab4134a04e72cfd0478796804533ed00c0d47`
is SHA-256 of key-sorted accepted-postimage JSON with the entire `acceptance`
property omitted. The postimage binds the decision's exact SHA-256
`57d8f4f4b9cebcaa34a28cf8373e8f497908cc4d65e1a6c40034a74174913a27`.
This avoids a circular digest while retaining an exact selected file reference.

The machine schema records a local owner field; it does not authenticate the
human or grant general authority. The explicit in-task owner answer is the
decision source. This record accepts only this Auth business meaning. It does
not admit a FormalClaim, validate the historical SFOL abstraction as its
successor, derive TDE obligations, authenticate provider execution, satisfy
F5 or EVF, establish `runtime_guarantees_observed`, or authorize release or
deployment.

## Open Questions

- Which exact current v4 FormalClaim and definition binding will express this
  accepted meaning without transferring historical SFOL/TDE receipts?
- Which TDE-derived case set and provider observation will subsequently support
  a post-TDE executable request?
