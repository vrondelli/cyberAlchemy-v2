# BMC-REL-D06 Projection Decisions

Status: `p01-p02-selected-and-applied-d06-projection-closed`

Authority effect: `canonical-domain-vocabulary-only`

## P01 — Ownership-dimension vocabulary

Decision ID: `BMC-REL-D06-P01-OWNERSHIP-DIMENSION-VOCABULARY`

Question: Which canonical vocabulary model should make later D06 ownership dimensions finite, referenceable, and fail-closed without treating the illustrative `owns` prose as already-promoted machine authority?

Gate evidence:

- Candidate: `candidates/BMC-REL-D06-P01-DEFINITIONS-CANDIDATE.md`, SHA-256 `ba150cd06ce95ec374008acf48a353bafb951dad1530fa3ea09d8dd19053cd29`.
- Request: `decision-gate/BMC-REL-D06-P01-OPTION-ADMISSIBILITY-REQUEST.json`, raw SHA-256 `7bc14088699ff6a911faded4246b2805ce046292aef092680b1d789a135286fd`, canonical digest `91f803f7ebec8630fbf2fd39a23d8824cb1929fbbac4b0ef7cec60d1bd771e2e`.
- Receipt: `decision-gate/BMC-REL-D06-P01-OPTION-ADMISSIBILITY-RECEIPT.json`, raw SHA-256 `c7456a88c3c0cb5b4593475283e33cfd2a11d84c1db8472fe298ab7206dc0354`.
- Route outcome: `gate`; all three action options plus defer and stop are structurally admissible.

### `BMC-REL-D06-P01-A-CLOSED-CANONICAL-TRIAD`

Admit exactly `lifecycle`, `custody`, and `write-responsibility` using the three-voice candidate meanings.

Benefit: minimum finite vocabulary already named by canonical `owns` prose and simplest closed validation.

Risk: adding another dimension later requires a fresh vocabulary decision and schema extension.

### `BMC-REL-D06-P01-B-GOVERNED-EXTENSIBLE-REGISTRY`

Admit the same initial triad in a registry that only Definitions Governance may extend.

Benefit: finite initial values plus an explicit evolution route.

Risk: larger registry lifecycle and overlap/drift surface.

### `BMC-REL-D06-P01-C-CANONICAL-RESPONSIBILITY-REFERENCES`

Use references to independently admitted canonical responsibility definitions marked as usable by `owns`.

Benefit: avoids a second responsibility vocabulary and aligns closely with D27.

Risk: largest reference-resolution surface and may provide no immediately usable dimension until cards are separately admitted.

### `BMC-REL-D06-P01-D-DEFER`

Keep D06 projection blocked without semantic change.

### `BMC-REL-D06-P01-E-STOP`

Terminate this sidecar without semantic change.

Recommendation without selection: `BMC-REL-D06-P01-A-CLOSED-CANONICAL-TRIAD`. It is the smallest finite vocabulary directly grounded in the canonical `owns` wording. Future expansion remains an explicit owner decision rather than ambient registry growth.

Owner disposition: `selected-and-applied`

Selected option: `BMC-REL-D06-P01-B-GOVERNED-EXTENSIBLE-REGISTRY`

Decision owner: `user`

Decision timestamp: `2026-08-23T15:26:32+01:00`

Decision source: exact `B` response after the non-committal complexity-example explanation. The examples had
`decision_effect: none` and supplied no selection authority.

Exact binding:

- request raw SHA-256: `7bc14088699ff6a911faded4246b2805ce046292aef092680b1d789a135286fd`;
- request canonical digest: `91f803f7ebec8630fbf2fd39a23d8824cb1929fbbac4b0ef7cec60d1bd771e2e`;
- admissibility receipt raw SHA-256: `c7456a88c3c0cb5b4593475283e33cfd2a11d84c1db8472fe298ab7206dc0354`;
- candidate raw SHA-256: `ba150cd06ce95ec374008acf48a353bafb951dad1530fa3ea09d8dd19053cd29`.

Rationale: initialize a finite registry with the same three admitted IDs while requiring a fresh Definitions
Governance owner decision for every future add, revise, deprecate, or remove operation. This preserves exact
machine references and an explicit evolution route without allowing ambient vocabulary growth.

Canonical application:

- `domainspec-v2-D29` supplies the registry and entry-level formal, plain-language, and DomainSpec-context voices;
- registry active IDs are exactly `lifecycle`, `custody`, and `write-responsibility`;
- `DEFINITIONS.md` SHA-256: `cdbe251015bb6387fe0283b4d058b4fa85b048b253c7e65845e43fd2170b6006`;
- `DEFINITIONS-INDEX.md` SHA-256: `ad41200bacb825bf11c009bfaef37f350beb3a307a55994ced42e194bc3fa744`;
- registry SHA-256: `91898f538b49f29a1be659560f6b442644a34b3ecb3f0a8916b7a0e53680bad4`.

Selection effect: P01 is closed and its dependency predicate is satisfied. The admitted vocabulary does not
choose where a dimension is represented, change `owns` or `owned-by`, require ownership, select numeric bounds,
or authorize another topology decision.

## P02 — Typed packet representation

Decision ID: `BMC-REL-D06-P02-TYPED-PACKET-REPRESENTATION`

Status: `selected-and-applied`

The P01 dependency predicate is satisfied. The fresh P02 candidate, request, and receipt bind the selected P01
evidence and exact post-P01 registry digest. Materialization and structural admissibility do not select or apply
a representation until an exact owner choice is recorded.

Gate evidence:

- candidate SHA-256: `33119d1b53b1c7eaf5f2a354bb8daece9c06f689e61a823bb0c31ad7cdc0eb2f`;
- request raw SHA-256: `e1e07f41a52653ca8784807515d1f883c8188b17d791bb04f5f42ac2321fcd3a`;
- request canonical digest: `c4927ba3cdd0d2f0e8ffbce620efb210f6a723d361195fa300d2c5ad42214296`;
- receipt raw SHA-256: `f53baa362ff33a0c3e147627afd6c4d122f170ecf5d318aea6d2f2e7b9b4f8ec`;
- route outcome: `gate`; three action alternatives plus defer and stop are structurally admissible;
- owner disposition: `selected-and-applied`.

Selected option: `BMC-REL-D06-P02-B-OWNS-SCOPED-TYPED-EXTENSION`

Decision owner: `user`

Decision timestamp: `2026-08-23T15:44:08+01:00`

Decision source: exact `B` response to the presented P02 gate.

Rationale: preserve the independent `owns`-only semantic axis without rewriting 30 unrelated rows. The selected
object carries only the fixed D06 policy, exact canonical registry path and digest, rationale, and evidence.

Applied projection:

- candidate packet SHA-256: `3d2f7695197b1e8eaa1b2cfd0c2662ad0355888604ee7ad0e6e9dd34ce0107b3`;
- packet schema SHA-256: `eabaeb7c9f37dc3d016873fa30e2dd86c6e09903f5f7bcbf3b072b2adb8ddbde`;
- packet validator SHA-256: `03ed61edc240478430a9c5a1eaf2297682beea63d76ac6c44a792172c738def9`.

Selection effect: the schema requires `ownership_topology` exactly on `signature_id: owns` and forbids it on
every other row. The main packet remains candidate-only; the `owns` row and ordinary facets remain unresolved,
packet-wide owner disposition remains pending, and `authority_effect` remains `none`. No dimension instance,
per-fact storage, mandatory ownership, numeric bounds, other topology, authored `owned-by`, or enforcement is
selected.

## Rejected constructions

- implicit promotion of illustrative prose;
- arbitrary free-text or unbound dimension names;
- dimension inference from multiplicity, endpoint type, feature scope, inverse navigation, or runtime behavior;
- any positive ownership minimum;
- reuse of any pre-P01 provisional P02 status or evidence.

## Claim ceiling

This record proves the exact P01 and P02 owner selections, their bounded vocabulary application, and the closed
candidate-packet projection. It does not declare dimension instances or storage, require ownership, select
numeric bounds or other topology, change DS-D8 or `relationships.yml`, accept the packet as a whole, authorize
D07 semantics, establish implementation behavior, promote, publish, release, deploy, or prove production use.
