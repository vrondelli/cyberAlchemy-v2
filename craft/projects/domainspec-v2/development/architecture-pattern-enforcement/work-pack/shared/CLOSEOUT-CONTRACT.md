# Shared Task Session Closeout Contract

Every mutation-capable APE SWU must declare and return:

- SWU, task, wave, layer, owner, executor, attempt, and timestamps;
- immutable input paths/selectors/digests and exact baseline state for every
  write target (`present` with digest or `absent`);
- exact repository-relative synchronization target inventory;
- admitted delta classes and observed changed paths;
- dirty-worktree overlap and explicit adoption/exclusion decisions;
- commands, tool versions, exit codes, and discriminating output refs;
- positive, negative, unsupported, and N/A accounting;
- raw native evidence refs and redaction posture;
- lifecycle-owner validation and expected owner receipt;
- claim ceiling, blockers, residue, and deterministic successor policy;
- Invoke Refresh result after mutation;
- Task Session closeout, continuation route, and synchronization receipt.

The exact target inventory, baselines, validation contract digest, and selected
SWU receipt are frozen before mutation. Task Session rehashes live targets and
is the only mutation-admission owner.

Successor policy is deterministic:

```text
predecessor pass + current digests + every gate pass -> successor becomes candidate
anything else -> no successor selected; route blocker/residue to narrowest owner
```

A receipt is invalid if it hides failed commands, treats unsupported as pass,
changes undeclared files, leaves a delegated lane unjoined/unclosed, or claims
admission, promotion, release, deployment, or production authority.
