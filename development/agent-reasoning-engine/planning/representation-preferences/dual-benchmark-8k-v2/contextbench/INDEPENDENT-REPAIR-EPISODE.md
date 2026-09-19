# Independent investigation with repair synthesis

Status: additive implementation; five offline tests pass. Independent review, prepared-runner integration and prospective experiment amendment pending. No live score or dispatch admission.

## Task fidelity and architecture

[independent-repair-episode.mjs](independent-repair-episode.mjs) preserves task-derived planning and three isolated, read-only investigations. A separate synthesis conversation receives bounded source evidence plus provisional findings, and the original issue-resolution duty. It has the exact native repository tool list, including editing and patch inspection. It finishes its attempt before a separate final context selection. Findings are not proof and patch correctness is not certified by a context score.

Investigators cannot call edit tools. Synthesis can read additional source and attempt edits; its observations are bound through its own captures and receipt indices. The additive [join](independent-repair-evidence-join.mjs) permits the three original branch identities plus synthesis; duplicate identities, reused receipt assignments and altered evidence still reject. The additive [terminal exporter](independent-repair-terminal-export.mjs) reconstructs this four-conversation evidence and applies the original source projection and native export. Frozen three-branch modules remain unchanged.

Synthesis keeps the two most recent complete exchanges using the existing minimal-history policy, preserving original reasoning fields. Initial branch evidence and findings are presented on every synthesis request and charged. This is an explicit architecture-specific history/tool-phase difference, not an isolated retention intervention.

## Budget

Existing planner 4K/2-call and three 24K/24-call investigation allocations remain unchanged. Synthesis and final reporting share the original join allocation of 20K/22 calls. Reserve 8K and one call for final reporting. Admit another synthesis request only while its known spend is at most 4K and fewer than 21 synthesis calls have run; a full 8K next request therefore cannot exceed the 12K synthesis allocation. Actual native phase admission still enforces the 8K request and 96K/96-call whole-arm limits.

This conservative cutoff may leave unused tokens; it never transfers earlier unused phase budgets. An attempt that stops before successful repair stays an attempt. Provider failure retains known costs and unknown reservations; no resume or automatic retry is added.

## Verification

Run: node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/independent-repair-episode.test.mjs

Five tests use real temporary Git repositories, native tools and evidence export with scripted model receipts. They cover actual editing and pinned-base selection; isolated read-only branch prompts; repeated branch-local tool IDs; synthesis reasoning replay; rejected stale edits; interruption after editing; rejection of read-only dependency sets; and a full-window synthesis call followed by final selection within the unchanged budget.

Normal fixture: fourteen scripted calls, 1,680 synthetic model tokens. Interruption fixture: 1,080 known synthetic tokens and one unknown call. Budget fixture: seven investigation/planning calls plus two 8K calls, 16,840 synthetic tokens total. These verify mechanics, not GLM quality or savings.

## Construction frontier and open questions

Coordinator owns additive runner/dispatcher integration. The existing runner still supplies read-only tools, requires three branches and imports the old terminal exporter; it must be updated through a successor, not silently rebound. Independent review must cover both repair candidates and the four-conversation evidence join. The prospective native experiment must declare synthesis history, per-phase tool differences and the internal final reservation before a new exact freeze.

Durable transport/index/capture reconciliation, process settlement, native scoring and current D:/WSL admission remain live prerequisites. C: is excluded; release/deployment remain deferred. How much useful repair work fits the conservative synthesis cutoff? Can the bounded initial evidence and findings fit every measured request without dropping required evidence? Broader untouched confirmation and full benchmark acceptance remain open.
