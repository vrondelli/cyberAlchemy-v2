# Codex Request Governance

This private candidate package makes `CA2-CAP-GOVERN-CODEX-REQUESTS` a first-class child Product Capability of `CA2-CAP-REASON-AND-MANAGE-CONTEXT`.

Its business outcome is narrow: before Codex performs repository work, and after each bounded completion, Codex must receive a deterministic `direct`, `gate`, `block`, or `complete` directive from the Agent Reasoning Engine. Goal is a selectable route only when goal-specific evidence matches; it is not the default wrapper. A direct directive identifies the nearest declared capability boundary but grants no execution or effect authority.

The package contains candidate product meaning, four host-boundary contracts, a capability-local business ontology, five policies, twelve obligations, partial-realization posture, exact source provenance, explicit residue, a closed schema, and deterministic validation.

The Product Capability owner selected the **Codex app-server wrapper** as the host boundary. The selection is recorded in [`decisions/codex-app-server-boundary-selection.v1.json`](decisions/codex-app-server-boundary-selection.v1.json). Its immutable implementation-owned candidate interface is [`interfaces/codex-app-server-wrapper.contract.json`](interfaces/codex-app-server-wrapper.contract.json), derived from the version-bound protocol observation in [`evidence/codex-app-server-protocol-observation.v1.json`](evidence/codex-app-server-protocol-observation.v1.json). The later [`implementation-binding.json`](implementation-binding.json) preserves that interface digest while binding the current router, proxy, interactive client, tests, and evidence to exact bytes. The binding is a materialized candidate; it is not accepted or conformant.

The interface controls three moments:

1. evaluate request context before forwarding `turn/start`;
2. evaluate command, file-change, and permission effects before answering approval callbacks; and
3. evaluate continuation after `turn/completed` before starting another turn.

`ARE-CODEX-OPEN-002` is resolved by a dual-lane continuation model recorded in [`decisions/continuation-source-model-selection.v1.json`](decisions/continuation-source-model-selection.v1.json):

- the `plan_bound` lane projects digest-bound actions declared in the continuation plan and may qualify for `direct` when exactly one verified safe action remains;
- the `interaction_bound` lane preserves proposals created through agent, chat, or human interaction, but always emits `gate` until an attributable human decision binds the exact proposal digest.

The lanes are evaluated together. Any unbound interaction proposal, multiple surviving proposals, or unknown metadata prevents direct continuation.

The DomainSpec-authored system source is under [`domainspec/`](domainspec/). [`scripts/build.ts`](scripts/build.ts) compiles it twice and materializes a graph, source manifest, specification view, build receipt, system ontology, and projection receipt. [`bridge.json`](bridge.json) joins business meaning to the system nodes while preserving implementation and evidence gaps.

## Runtime

Run the transparent stdio proxy against the observed Codex binary:

```bash
node runtime/proxy.mjs \
  --upstream /absolute/path/to/codex \
  --receipt /tmp/are-codex-events.jsonl
```

The proxy verifies the upstream binary digest by default, invokes the existing verified request-decision router before `turn/start`, mediates approval callbacks through an explicit human decision, evaluates dual-lane continuation after `turn/completed`, and records ordered JSONL evidence. `_are.requestContext` and `_are.continuation` are client-to-wrapper extensions and are removed before forwarding upstream.

Run deterministic tests and the controlled live canary:

```bash
node --test test/*.test.mjs
node scripts/canary.mjs /tmp/are-codex-live-canary.json
```

The canary permits only one exact harmless `printf` command. Every other command is declined.

Run the human-facing terminal client through the same proxy:

```bash
npm run interactive -- \
  --upstream /absolute/path/to/codex \
  --cwd /absolute/path/to/workspace \
  --receipt /tmp/are-codex-interactive.jsonl
```

Ordinary input starts one serial turn. The client streams assistant text, shows the exact effect digest before command, file-change, or permission approval, answers non-secret `requestUserInput` questions, and presents continuation gates. `/json` accepts a structured object containing `text` or `input`, plus optional `requestContext` and dual-lane `continuation` data. When a human selects a gated proposal, the proxy verifies the gate digest, option ID, and proposal digest before starting its declared `next_turn`; the resulting human-binding digest is injected as non-authorizing routing evidence. Secret prompts fail closed because this initial terminal client does not yet implement echo suppression.

## Boundary

The request-decision router, proxy, and interactive client are an exact-byte partial candidate realization. The DomainSpec source and generated system ontology are deterministic candidates and are not admitted. Passing tests or a live canary demonstrates only the bound local behaviors and observed ordering; it does not establish adoption, accepted implementation binding, whole-capability conformance, publication, release, deployment, or general effect authority. Native plan extraction, secret terminal input, and default Codex installation remain explicit gaps.

## Validate

From the repository root:

```bash
python3 cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/scripts/validate.py --verify-build
python3 cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/scripts/validate.py --verify-build --self-test --write-receipt
```

The validator checks the local schemas, exact source digests, unique identities, closed references, typed relation and bridge endpoints, selected-boundary digests, required Product Capability links, DomainSpec replay, non-authority invariants, and a deterministic material digest. The receipt is validation evidence only.
