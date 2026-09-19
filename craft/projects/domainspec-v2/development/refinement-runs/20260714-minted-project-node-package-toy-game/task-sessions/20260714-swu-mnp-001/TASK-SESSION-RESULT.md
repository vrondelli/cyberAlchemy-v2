# Task Session Result — SWU-MNP-001

## Result

- Status: `pass`.
- Executed unit: exactly `SWU-MNP-001`.
- Owner: local fallback; no subagents or delegated writes.
- Decision Gate: not invoked because no unresolved blocker-level choice arose.
- Receipt: [`receipt.json`](receipt.json).
- Fixture matrix: [`fixture-matrix.json`](fixture-matrix.json).

The machine-source contract is implemented without implementing the resolver,
compiler, Markdown generator, minter, conformance expansion, or release
admission owned by later SWUs.

## Delivered Contract

The experimental profile `feature-with-independent-node-files` version `1` is
bound by digest
`ad078c8cdd9ce3cf6ba08f223317a67aa885086793748b1b1405938f212a872b`.
It admits only the evidence-backed v1 kinds `Entity`, `Event`, `Operation`, and
`Rule`, and the active relationship signatures `Rule -enforces-> Operation`,
`Entity -performs-> Operation`, and `Operation -produces-> Event`.

Eight Draft 2020-12 schemas now define project, feature, source-owned
connection, node, generated graph, generated provenance manifest, generated
Markdown receipt, and generated build receipt records. Exact paths and digests
are machine-readable in [`receipt.json`](receipt.json).

The minimal Key and Door witness contains one canonical file per node, embedded
outgoing connections with stable edge IDs, a normalized graph, total source
provenance, a generated Markdown view, and a digest-closing build receipt. Five
negative controls fail distinctly for missing field, duplicate ID, path escape,
profile/language mismatch, and illegal generated authority.

## Validation

- Strict context: `8/8` obligations covered.
- Targeted contract test: `5` passed, `0` failed.
- Full tools suite: `76` passed, `0` failed.
- TypeScript: pass.
- `git diff --check`: pass.
- Dispatch Spec validation: pass.
- Signal Observer JSON/JSONL validation and dedupe: pass.

The test also renders `INDEX.md` from the contract manifest/profile and requires
exact byte parity, so the human view cannot silently drift from the machine
view.

## Signal Observer Result

- Observed sigil: `task-session`.
- Result: recorded once in `.arcanum/observability/signals/sigil-invocations.jsonl`.
- Signals: `quality-pass`, `rework`, `workflow-gap`, `useful-pattern`.
- Quality Bar: pass; anti-pattern hits: `0`.
- Reflection trigger: `gap-threshold`; recommendation: `targeted-update`.
- Gap: the installed Dispatch Spec skill's validator path needs the repository's
  `arcanum/` prefix in this checkout. This did not change the primary result.

## Authority and Trade-offs

- The profile remains `experimental`; this result grants no release admission.
- The Key and Door meaning belongs only to the fixture witness; generic schemas
  contain no consumer-domain semantics.
- Generated graph, provenance, Markdown, and receipt records are read models,
  never authored authority.
- Validation is deliberately test-local in this SWU. Production resolver and
  compiler behavior belongs to SWU-MNP-002 and SWU-MNP-003.
- Only the profile subset supported by current evidence is admitted; registry
  existence alone does not imply support.

## Residue and Handoff

`SWU-MNP-002` is now dependency-ready but is not selected. Invoke Refresh must
synchronize its owned `PLAN.md` and `transport-report.json` from this receipt
before any next selection. Release admission, cross-feature completeness, and
an independent edge lifecycle remain separately gated.
