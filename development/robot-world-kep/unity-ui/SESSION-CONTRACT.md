# Unity session adapter prototype

The adapter projects the exact retained demo replay and its selected catalog into an array-based JSON document for Unity's serializer. The source identities come from the immutable checkpoint 01 source register. A changed source fails export; no digest is refreshed automatically.

`tools/export_session.py` writes a fresh destination containing `session.json` and `session-manifest.json`. The manifest identifies the projected content, byte count, frame count and both source hashes. It is local integrity metadata, not a KEP signature or proof that an arbitrary catalog belongs to an arbitrary replay. This exporter intentionally supports only the selected fixture. The fresh-run importer remains checkpoint 04 work.

| Source | Projected field | Constraint |
|---|---|---|
| Frame array order | `frames[]` order | Preserve all 82 frames, including both revisions of tick 80 |
| `tick`, `revision` | Same names | Tick is non-decreasing; revision strictly increases |
| `world_id` | `worldId` | One world per session |
| Robot dictionary key | `robots[].id` | Stable identity and owner through the recorded session |
| `position`, `memory`, `prior` | Same arrays | Finite values; 2 spatial components; paired memory/prior dimensions |
| `energy`, `cargo`, world counters | Same names | Preserve source values, reject invalid numeric types and bounds |
| `knowledge` | Same array | Preserve identifiers without inventing catalog links |
| `capability_id`, `artifact_type`, `byte_count` | `capabilityId`, `artifactType`, `byteCount` | Preserve typed metadata and exact version |
| Contributors and consumers | Same arrays | Local fixture identities, not authenticated network principals |

The current C# `SessionModels` and `SessionLoader` are source prototypes. The loader reads bounded local files, verifies the projected content hash and validates frame/identity/vector boundaries. No Unity editor has compiled these files or exercised `JsonUtility` in this task. The six passing Python tests do not establish C# or Unity behavior.

Rendering will project the recorded two-component position onto Unity's horizontal plane. The memory and archetypal vectors remain semantic state; they are not extra physical coordinates. Animation interpolation must not alter the source snapshot, revision, energy or interaction memory. The later UI must display the recorded-session mode.

Open questions: Q-UI2 in [PLAN.md](PLAN.md). The next validation is a round trip through Unity's actual serializer on the pinned editor, followed by frame/camera rendering.
