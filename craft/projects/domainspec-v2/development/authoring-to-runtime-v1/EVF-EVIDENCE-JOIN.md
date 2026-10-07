# Exact EVF evidence joining

Status: E03 bounded candidate. Authority effect: none.

## Boundary

E03 consumes an exact evaluation request and an exact provider-owned receipt or
availability observation. It does not select, launch, retry or repair a
provider. The join constructs the current DomainSpec provider/theorem evidence
binding, the current DomainSpec EVF join, an AlchLang causal wrapper and an
exact construction trace.

The input is closed. Every referenced artifact must be supplied by exact path,
SHA-256, byte size and explicit currentness, and the referenced bytes must be
present. The theorem route additionally requires its evaluation request to be
the exact theorem request used by the theorem evidence binding.

## Routes

`execution-evidence` keeps the v1 evidence route for non-pass outcomes. For
`pass`, the post-TDE route requires an
`alchlang.finalized-execution-request/v1-candidate` derived from the exact
base request, selected evaluation context, obligation, projection and
preservation bytes after TDE has selected its case domain and witnesses. It
recomputes the domain, witness and bound fingerprints from those inputs. A
legacy base request cannot be used to produce an execution `PASS_BOUNDED`.
The provider outcome must carry the matching finalized request and per-case
scope. The join emits a versioned v2 provider-evidence binding and v2 EVF
evidence join for this pass route. The non-pass v1 route remains explicit; it
must not silently promote an old receipt or absent scope to pass.

Both execution versions bind the exact FormalClaim, obligation, projection,
native source bundle, runtime, environment and provider receipt. The EVF join
also binds the exact capability assessment, obligation set, preservation
binding and profile.

`theorem-evidence` emits a
`domainspec-v2.theorem-evidence-binding/v1-candidate`. It binds the exact
theorem request, FormalClaim-to-Lean binding, runtime and theorem-provider
receipt. The resulting EVF join also binds the exact FormalClaim, capability
assessment, profile and environments.

In both routes, the generated evidence binding is itself referenced by exact
current bytes from the EVF join. The causal wrapper then binds the original
request, original receipt, generated evidence binding and generated EVF join.
No missing evidence is represented by omission: an unavailable provider is
represented by an exact current availability observation and a `MISSING` join.

## Causal outcome mapping

| AlchLang outcome | Execution normalization | Theorem normalization | EVF status | Revision route | Can satisfy |
| --- | --- | --- | --- | --- | --- |
| `pass` | `passed` | `passed` | `PASS_BOUNDED` | `none` | yes |
| `fail` | `failed` | `failed` | `NON_PASS` | `formal-claim` | no |
| `unknown` | `indeterminate` | `indeterminate` | `INDETERMINATE` | `provider` | no |
| `timeout` | `timeout` | `timeout` | `FAILED` | `runtime-binding` | no |
| `malformed` | `malformed` | `provider-error` | `FAILED` | `provider` | no |
| `stale` | `stale` | `stale` | `STALE` | `evf-join` | no |
| `unavailable` | `blocked` | `blocked` | `MISSING` | `provider` | no |
| `not-evaluable` | `unsupported` | `blocked` | `UNSUPPORTED` | `capability-assessment` | no |

The theorem schema has no native `malformed` or `unsupported` normalized
outcome. Its evidence binding therefore uses the schema's `provider-error` or
`blocked` vocabulary while the causal wrapper retains the original
`malformed` or `not-evaluable` cause exactly. That is an explicit vocabulary
projection, not a collapse of causal meaning.

## Pass and currentness guards

`pass` is the only outcome that can emit `PASS_BOUNDED` or
`can_satisfy_obligation: true`. It requires all four semantic comparability
assertions and every exact input reference to be current. A non-current input
is accepted only for the `stale` outcome; conversely, `stale` rejects unless at
least one input reference is explicitly non-current.

For execution pass, currentness additionally requires an exact post-TDE
finalized request, matching case-domain and witness-set fingerprints, matching
bound and interpretation context, and a v2 provider outcome whose declared
case results match that request. These are local construction and
caller-supplied receipt-projection checks. They do not authenticate a provider
or independently observe its execution.

Every non-pass result carries three residues: its original causal outcome, its
cause and its revision route. The currentness assertion reconstructs the
entire result and rejects changes to provider normalization, EVF status,
causality, pass eligibility, evidence presence or exact bindings.

## Claim ceiling

This construction shows only that exact input evidence was normalized and
joined under the declared bounded semantics. The post-TDE pass route checks
the declared receipt projection against its finalized request, not the
provider-native event stream. It is not a universal proof, a provider
admission or authentication, independent provider-execution observation,
product approval, release admission, publication, deployment,
production-readiness evidence or operational authority.

## Open Questions

E04 owns stage-separated runtime observations. E05 owns cross-layer semantic,
non-collapse, orthogonality, oracle, mutation, determinism and currentness
checks across E01-E04.
