# Shared Task Session Closeout Contract

For every mutation-capable SWU:

- lifecycle owner route: `invoke:refresh:apply-approved`;
- baseline: Task Session preflight records exact digests for declared write scope;
  absence of a planned new file is bound as `absent`;
- terminal result fields: `task_session_id`, `swu_id`, source/baseline digests,
  changed artifacts, validation commands/results, blockers, residue, and
  recommended successor;
- allowed planning deltas: `evidence_added`, `blocker_opened`,
  `blocker_resolved`, `status_changed`, `route_changed`;
- forbidden deltas: new SWU selection, automatic successor execution, ontology
  meaning/admission, promotion, publication, deployment, release, destructive
  cleanup, unrelated files, policy/cost/risk acceptance;
- owner validation: exact result shape, baseline/delta comparison, declared
  target inventory only, scoped whitespace/link checks, and Work Pack state
  consistency;
- expected owner receipt: exact `closeout/SWU-...-REFRESH-RECEIPT.json` path from
  `WORK-PACK.md`;
- successor: the exact next dependency becomes eligible only; never selected or
  executed automatically.

Missing any field blocks Refresh and leaves the Work Pack unchanged.
