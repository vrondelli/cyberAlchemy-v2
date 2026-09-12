# Reviewer commands

Authority effect: none.

The primary replay used the package's native v2 entry point. A writable
reviewer-owned file was bind-mounted over the shared historical run ledger so
the native command could append its terminal row without changing prior
evidence:

```bash
/usr/bin/time -v bwrap --bind / / --dev-bind /dev /dev --proc /proc \
  --bind /home/vrondelli/projects/cyberAlchemy-v2/implementation/domainspec-v2/development/evolvable-validation-framework/repair-assurance-expansion-plan-v1/execution/w3/reviewer-attempt-001/reviewer-runs-v2.jsonl \
  /home/vrondelli/projects/cyberAlchemy-v2/implementation/domainspec-v2/development/evolvable-validation-framework/crabs-partial-knowledge-move-candidate-v1/evidence/runs-v2.jsonl \
  --chdir /home/vrondelli/projects/cyberAlchemy-v2/implementation/domainspec-v2/development/evolvable-validation-framework/crabs-partial-knowledge-move-candidate-v1 \
  /home/vrondelli/projects/cyberAlchemy-v2/tools/toolchain/run python3 run.py v2-execute \
  --candidate-digest bf54e23b5fd5d38058ce34fdd5845b2e2f2e7eb7951663ff3ac1fac4632765a7
```

Hash verification and representative denominator, oracle-binding, raw-byte,
timeout, output-limit, and launch-failure controls:

```bash
tools/toolchain/run python3 implementation/domainspec-v2/development/evolvable-validation-framework/repair-assurance-expansion-plan-v1/execution/w3/reviewer-attempt-001/probe_controls.py
```

The valid wrong-CBMC-assertion probe used the native v2 runner's reconstructed
local argv and replaced only `main.assertion.1` with `main.assertion.999`:

```bash
tools/toolchain/run python3 implementation/domainspec-v2/development/evolvable-validation-framework/repair-assurance-expansion-plan-v1/execution/w3/reviewer-attempt-001/probe_wrong_cbmc.py
```

Recovery used a mount containing exactly one reviewer-created interrupted
attempt and a reviewer-owned ledger:

```bash
/usr/bin/time -v bwrap --bind / / --dev-bind /dev /dev --proc /proc \
  --bind /home/vrondelli/projects/cyberAlchemy-v2/implementation/domainspec-v2/development/evolvable-validation-framework/repair-assurance-expansion-plan-v1/execution/w3/reviewer-attempt-001/recovery-sandbox/attempts-v2 \
  /home/vrondelli/projects/cyberAlchemy-v2/implementation/domainspec-v2/development/evolvable-validation-framework/crabs-partial-knowledge-move-candidate-v1/evidence/attempts-v2 \
  --bind /home/vrondelli/projects/cyberAlchemy-v2/implementation/domainspec-v2/development/evolvable-validation-framework/repair-assurance-expansion-plan-v1/execution/w3/reviewer-attempt-001/recovery-sandbox/runs-v2.jsonl \
  /home/vrondelli/projects/cyberAlchemy-v2/implementation/domainspec-v2/development/evolvable-validation-framework/crabs-partial-knowledge-move-candidate-v1/evidence/runs-v2.jsonl \
  --chdir /home/vrondelli/projects/cyberAlchemy-v2/implementation/domainspec-v2/development/evolvable-validation-framework/crabs-partial-knowledge-move-candidate-v1 \
  /home/vrondelli/projects/cyberAlchemy-v2/tools/toolchain/run python3 run.py v2-recover
```

## Open Questions

Open review questions and blockers remain owned by
`repair-assurance-expansion-plan-v1/work-pack/WORK-PACK.md`.
