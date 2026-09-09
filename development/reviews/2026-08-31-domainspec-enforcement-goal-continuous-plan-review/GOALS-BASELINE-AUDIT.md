# Goals Baseline Audit

Status: read-only planning evidence  
Audited revision: `a286f8909c65477e864fe6169b257500034d5669`  
Selected gap: `CGC-G03`  
Authority effect: none

## Result

`BLOCK`, with an actionable cause. The Goals package cannot safely accept the
new Craft Goal yet, and the repair is not a digest-only refresh.

The current validator reports:

- nine source-digest drifts;
- inherited contract model identity mismatch;
- inherited contract model state schema mismatch.

All nine drifted source files are tracked and clean at the audited revision.
Their differences therefore come from committed source evolution, not from the
unrelated active `cyberAlchemy-v2/language/**` writer.

## Exact source drift

| Source | Pinned SHA-256 | Current SHA-256 | Owner |
|---|---|---|---|
| `SRC-CAV2-DEFINITIONS` | `f97d8a3c...e13c` | `68d40e44...5a2b` | definitions-governance |
| `SRC-CAV2-GOVERNANCE-INVARIANTS` | `a5936e18...79d9` | `bb9ead60...2985` | governance-model owner |
| `SRC-CAV2-GOVERNANCE-RULES` | `b825ae21...4216` | `22f525a7...160` | governance-model owner |
| `SRC-CAV2-PRODUCT-THESIS` | `ef9d9c04...54b3` | `f9d91241...5593` | Product owner |
| `SRC-CAV2-PRODUCT-ONTOLOGY` | `62f2a7b2...e6af` | `01bdfd74...9039` | ontology route |
| `SRC-CAV2-DEFINE-PROFILE` | `d6f28045...1fea` | `a5422a21...b517` | Product owner |
| `SRC-CAV2-DEFINE-AUTHORITY` | `62bc86cb...5ea0` | `95febbec...45f8` | Product owner |
| `SRC-CAV2-DEFINE-CAPABILITY` | `bde8a4dd...5743` | `ceb85097...470b` | Product owner |
| `SRC-CAV2-DEFINE-SYSTEM-PROFILE` | `895dc94b...e27d` | `a1ffbee9...528f` | Define runtime owner |

The table abbreviates hashes for readability. The authoritative full values
remain the files and validator output at the audited revision.

## Contract epoch mismatch

The frozen inherited contract currently binds:

- Define model schema `cav2-define-profile/v1`;
- model version `cav2.define@0.4.0-candidate` plus its exact old profile digest;
- the old system-profile digest;
- a chain of relation, admission, adoption, and conformance evidence derived
  from those immutable inputs.

The live Define source now declares:

- schema `cav2-define-profile/v3`;
- package version `0.6.0-candidate`;
- a materially larger business-system-bridge profile;
- a new exact system-profile state.

This is semantic and structural evolution. Mutating the old contract or merely
replacing its hashes would make earlier relation/adoption evidence appear to
cover bytes it never reviewed.

## Required repair shape

The safe repair is a successor epoch:

1. freeze the nine exact current source bytes after their owners confirm the
   source epoch;
2. classify the semantic changes and confirm that the new Product Thesis,
   definitions, governance records, Product ontology, and Define identities are
   intended inputs;
3. preserve the current inherited contract and all digest-bound decisions as
   immutable history;
4. create a new inherited-contract record for Define profile v3 / package
   `0.6.0-candidate` and the current system-profile state;
5. create or select a new typed model-instance relation candidate, admission,
   local adoption decision, and conformance assessment for that epoch;
6. update the Goals source registry only to the owner-confirmed frozen inputs;
7. rerun Goals validation and independently verify closure before registering
   the Craft governed-construction Goal.

## Proposed mutation envelope

No mutation is authorized here. A later exact `CA2-ROUTE-IMPLEMENT` task would
need to name its actual postimage set after inspecting schema capacity. The
expected owner-controlled surfaces are:

- `cyberAlchemy-v2/goals/sources.json`;
- `cyberAlchemy-v2/goals/bindings/inherited-contracts.json`;
- the successor relation-candidate and admission records;
- the successor adoption candidate, owner decision/projection, and conformance
  assessment;
- affected Project references, residue, ontology view, schema amendments, and
  regression tests only where the new epoch requires them.

The old records must not be overwritten, deleted, or silently rebound.

## Current frontier consequence

`CGC-G03` moves from unknown drift to `audited-blocked`. Its next task is an
owner-authorized successor-epoch design/implementation package, not a hash
refresh. `CGC-G02` remains blocked, and no Goal registration or adoption claim
is available.

## Claim ceiling

This audit identifies drift and the required repair shape. It does not freeze
the owners' sources, select the new contract semantics, mutate a binding,
revalidate the package, register the Goal, adopt a Product method, authorize
implementation, publish, release, deploy, or create an external effect.
