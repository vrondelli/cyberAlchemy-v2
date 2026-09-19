---
fixture_id: F3
generation: 002-adjudication
review_state: approved
evaluation_state: not-run
append_state: not-run
---

# F3 Savvy Page Three-Layer Adjudication Review

## Frozen Evidence Chain

| Layer | Record handle | Generation handle |
| --- | --- | --- |
| Parent F3 interpretation | `record:sha256:6d2066bded781e8dc739eb65f09f5237b131a4c55e7a858a03de8d1f5118681a` | `generation:sha256:fc7bd5c62adb63e20be566ac2e1ba7a47fe120b6e547520cee04edd9630509b2` |
| M1 permitted observation | `record:sha256:26cbc95a46c790b819ac0c9ebbef94771eed89a5457927fa0fd0967d32ec0140` | `generation:sha256:40d2c51f7f8439f70c42b3329d102393f86eb64019e9cc8cb9b46b3aeea9b8fd` |
| M2 breaking observation | `record:sha256:55f0f6a99f8df7f5d9c4bf6da8c218f9366733a300e689c24ff8a2672e4309bd` | `generation:sha256:52ee39e1072107f21499f868b4604e3cd5c60a11b33f5bbc78438b2910d5a0a4` |
| Adjudication overlay | `record:sha256:668ea537da92ee33b4640fe34175aaffa1b387b0809352984b552a7530dae8b5` | `generation:sha256:a6341f70bf33bd368e728bbb9bd45b3ed217feebf4312473a2cd4c2dc9ff28ee` |
| V1 compatibility projection | `record:sha256:8fa5b9015945b56aa2a9cdbf47d0743281a1a299fe1f0e8751b33518cbb03ccd` | `generation:sha256:96d379fcc9a907739693f2e0025fa5cea8b78d7f113424e4c47a6d8abf499dac` |

The overlay binds the three immutable input receipts by handle. It does not
copy or revise the parent explanation set. The compatibility receipt is a
deterministic projection for the existing v1 validator; it is not a new
interpretation authority.

## Separate Adjudication Coordinates

Each state judges one unchanged parent explanation against one complete parent
substitution prediction and its matching observation. Partial coverage remains
`indeterminate`.

| Explanation | Permitted substitution | Breaking substitution |
| --- | --- | --- |
| A-01 contextual role | partial / `indeterminate` | none / `not-explained` |
| A-02 guard Rule | partial / `indeterminate` | full / `explained` |
| A-03 sequencing | partial / `indeterminate` | full / `explained` |
| A-04 aggregation | partial / `indeterminate` | none / `not-explained` |
| A-05 pattern pressure | none / `not-explained` | none / `not-explained` |
| A-06 named instance | partial / `indeterminate` | partial / `indeterminate` |

The twelve cells contain two `explained`, four `not-explained`, and six
`indeterminate` states. Only A-02 and A-03 fully account for the breaking
consequence. No unchanged explanation fully accounts for the complete
permitted consequence.

## Field Provenance

| Compatibility field | Treatment | Authority |
| --- | --- | --- |
| `fixture_id`, `G`, `A`, `Q-01` through `Q-05`, and their matrix cells | retained byte-for-byte in semantic value | parent F3 receipt |
| `Q-06` | derived only from the permitted description and prediction | parent `semantic.S.permitted` |
| `Q-07` | derived only from the breaking description and prediction | parent `semantic.S.breaking` |
| Twelve `Q-06` / `Q-07` matrix cells | projected from separate approved overlay coordinates | adjudication overlay |
| `S.permitted.observation_state` | changed from `indeterminate` to `supported`; description, prediction, and selectors retained | M1 receipt bound to `F3-S-PERMITTED` |
| `S.breaking.observation_state` | changed from `indeterminate` to `supported`; description, prediction, and selectors retained | M2 receipt bound to `F3-S-BREAKING` |
| `D` | retained exactly, including `deterministic: false` and `nonzero: false` | parent F3 receipt |
| `F3-U-01` | resolved and omitted from projection | approved M1 resolution row |
| `F3-U-02` | resolved and omitted from projection | approved M2 resolution row |
| `F3-U-03` | carried unchanged as `non-portable` | parent F3 receipt |
| `F3-U-M1-1` and `F3-U-M1-2` | carried as `non-portable` | M1 receipt limitations |
| `F3-U-M2-1` and `F3-U-M2-2` | carried as `non-portable` | M2 receipt limitations |
| reviewer | records local adjudication approval only | overlay review row |

## Preserved Limits

The observations close the two missing mutation-execution gaps, but they do not
establish visual equivalence, React implementation identity, browser behavior,
source-repository mutation, portable `Page` identity, irreducibility, pattern
admission, or any DS-D1/DS-D8 authority. Incomplete direct route and content
attestation remains load-bearing, so the parent usefulness decision stays
unchanged.

No evaluator was invoked, no result was authored, and generation 2 was not
appended. Fixture and suite adjudication belong only to SWU-CDSC2-006R.
