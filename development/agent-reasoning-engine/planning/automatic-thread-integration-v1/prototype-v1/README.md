# Automatic ARE integration: first milestone

P1 is complete as a prototype contract. O1 has a concrete partial result: this
conversation is readable through the installed host, and native hook discovery
works. Automatic ARE activation is not yet verified or performed.

## What the host inspection established

The desktop runs Codex 0.153.1 in WSL using the Windows Codex home. Read-only
thread lookup found the exact target conversation and workspace. Its history
mode is paginated. The returned notLoaded status belongs to the diagnostic
app-server instance, not a claim that the desktop conversation is inactive.

The native hooks/list method discovered enabled project UserPromptSubmit, Stop,
and PostToolUse hooks. Inspection of .codex/hooks.json identifies them as Arcanum
observer hooks. No existing hook or desktop setting was changed. Native discovery
alone does not prove execution, trust acceptance or reload in the current client.

Official [hook documentation](https://learn.chatgpt.com/docs/hooks) describes
prompt context injection, completion observations and interruption events. Hooks
are therefore a candidate for automatic adaptation within the current interface.
They do not establish the full proxy's checkpoint, dispatch and permission
boundaries. The [app-server documentation](https://learn.chatgpt.com/docs/app-server)
identifies paginated-history resume limitations; no resume was attempted.

## Delivered prototype

- PROTOTYPE.json: definitions, agent-facing ontology scaffold, product/business,
  DomainSpec and component prototypes; all non-authoritative.
- CONTRACT.json: thread/participant/product scope, observation/apply/off modes,
  learning and capability-proposal separation, budgets and required invariants.
- contract-verifier.mjs and its test: executable checks over proposed integration
  traces. All 17 tests passed. They are not an implementation of the host adapter,
  a language interpreter or a production learner; supplied trace declarations do
  not prove their own real-world provenance or fsync behavior.
- HOST-FEASIBILITY.json, THREAD-LOOKUP.json and HOOK-DISCOVERY.json: bounded host
  evidence. No transcript content or credentials were copied.
- Generated 0.153.1 protocol schemas: exact native read/resume/hook interfaces for
  later compatibility work; schema generation does not prove successful resume.

## Next construction work

Prototype a thread-scoped native hook adapter using the existing ARE lifecycle,
without registering it into this live project yet. First prove callback execution
in a disposable host and capture event identity, checkpoint and context receipts.
Test repeated identical prompts, steering within one turn, interruptions and
subagents: a session ID or prompt hash alone may not uniquely identify a root-user
message. Keep control-plane commands separate from inferred preferences.

Use a strict bounded data projection for learned guidance. Hook output is injected
at developer-context level, so it must not turn arbitrary user/tool strings into
new authority. Show learned preference data with its original provenance and
explicit precedence; retain the original user request.

Completion hooks observe and record; do not use Stop decision:block to manufacture
extra work. Preserve native permission and approval behavior. A full-wrapper claim
requires additional gateway coverage and compatible host routing, not a relabelled
hook adapter. If complete coverage cannot be achieved in this interface, report
that gap before proposing a user-facing client change.

The next phase remains construction. Product approval and a separate scoped
activation decision follow a tested complete candidate. This milestone made zero
experimental model calls and sent no new turns to the target conversation.
Coordinating conversation usage is separate and is not claimed to be free.
