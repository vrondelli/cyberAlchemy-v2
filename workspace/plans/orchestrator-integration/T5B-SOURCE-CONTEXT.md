# T5B — Selected source bound to task review

Candidate construction, 2026-09-08. Authority effect: none. Owner authorization:
user “next”; [construction boundary](../../../agent-routing/ROUTER.md#d65-construction).

## Contract and implementation

The [shared codec](../../runtime/src/features/runs/source-context.ts) serializes
one explicit selection into native task input, prefixed `Workspace selected source v1`.
The canonical JSON carries schema `workspace-selected-source/v1`, source kind
(chat, project, essay or knowledge), ID, revision, selector, exact selected text,
its SHA-256 and authority_effect none. The full input fits the existing 8192-byte
native limit. Empty coordinates, NULs, invalid Unicode, unknown fields, duplicate
keys, noncanonical serialization and checksum mismatches are rejected.

The [native task owner](../luna-vps/runtime/task-contract.mjs) already hashes the
entire input. Source identity, revision, selector and content therefore change
the task digest and require a fresh review. Native schema, owner history and
launch protocol are unchanged; there is no side-channel origin store.

The [Workspace gateway](native-controls.mjs) validates marked input before review.
Unmarked input remains ordinary text. The [run adapter](../../runtime/src/features/runs/run-adapters.ts)
projects valid source coordinates only after checking the task digest. Invalid
marked input from a direct native caller preserves the run with explicit
source-context-invalid attention and no origin attribution.

Overview technical details and Evidence display the declared source, revision,
selector, selected-text checksum and task digest through the existing sibling
frontend. Source ownership and currentness are not independently verified.
Task-byte binding does not authenticate the declared source or grant effects.

## Verification

[T5B evidence](T5B-EVIDENCE.json) records 31 Node contract/adapter/control tests,
nine Workspace projection/handoff tests and a passing bounded candidate build.
Isolated real native reviews demonstrate that a revision change alters the digest;
one mismatched-digest launch request is rejected before dispatch. Zero jobs or
accepted launches result. Gateway tests reject malformed and tampered envelopes.
The browser clears the old review and launch action when the revision changes;
its two reviews make zero launch requests. Existing-history browser regression
preserves both runs and the three remaining installed fixture launches.

Local candidate: http://127.0.0.1:4187/#/apps/orchestrator/runs . Frontend backup:
~/.local/share/are-workspace/dashboard-01/frontend-before-t5b . The local dashboard
service reloads repository backend modules; the asset backup alone does not roll
back backend code. No native service restart or VPS activation is included.

## Open Questions

T5C owns explicit Chat/project selections, revision semantics, entry points and
return navigation. T5D owns knowledge inspection. These source buttons are not
implemented by T5B. Selected content must never silently expand to whole context.
Source-owner attestation and current-revision verification remain distinct future
contracts. T5E owns integrated acceptance; broader build/manual gaps remain in
[T5 relationships](T5-RELATIONSHIPS.md#open-questions).
