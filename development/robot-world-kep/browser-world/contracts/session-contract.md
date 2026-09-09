# B1 input and presentation contract

Accept only the selected `robot-world.unity-session/v1-prototype` recorded fixture, with the prepared session-manifest schema and matching content SHA-256. The byte limit is 2 MiB, manifest limit 16 KiB, frame count 1–10,000, robot count 1–128, semantic vector dimension 1–64, and catalog count 0–1,000. These are explicit local observer limits, not future network limits.

Reject unsupported schema/mode, duplicate or unstable world/robot/owner identity, unsafe identifier strings, non-finite numbers, non-integer counters, out-of-range physical coordinates, energy outside 0–100, negative cargo/counters, mismatched vector dimensions, decreasing ticks, non-increasing revisions, duplicate catalog identities, wrong byte/frame count or hashes, and malformed/mismatched manifests. JSON shape must contain only the supported keys. The selected fixture digest remains pinned at build time.

Physical coordinates have exactly two components in −5…5. Memory/prior arrays have paired length and finite bounded components; current source priors are normalized 0…1. Revisions must increase even when tick is unchanged. Keep source order and all 82 frames. A catalog content hash is not an authentication statement; this prototype additionally pins the known session so an arbitrary new catalog cannot be substituted.

The page opens on the final recorded frame for inspection; Replay starts from frame zero. The cursor advances by elapsed presentation time at 0.65 seconds per frame by default. While playing, positions interpolate toward the next frame; all displayed counters come from the selected frame. Pausing snaps presentation to the selected source frame, scrubbing chooses an exact frame, and the final frame stops playback. Tab backgrounding pauses playback. View and selection controls do not modify any frame. Every selected robot's two coordinates use the same linear X/Z projection.

Meaningful checks: retained fixture, same-tick final revisions, manifest/bytes, wrong schema/types, identity drift, vector dimension mismatch, finite/bounded state, exact scrub/pause state, and elapsed-time partition invariance. Browser tests exercise imported assets, replay movement, picking, camera, viewport changes, context loss/recovery, and resource teardown.

Open questions: [browser plan](../PLAN.md#open-questions). Fresh-run export is B3 and is intentionally excluded from this pinned loader.
