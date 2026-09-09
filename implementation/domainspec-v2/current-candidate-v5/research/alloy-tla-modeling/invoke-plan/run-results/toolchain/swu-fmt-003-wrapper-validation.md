# SWU-FMT-003 Wrapper Validation Receipt

Timestamp: 2026-06-16T21:30:00Z
Result: pass

## Syntax Validation

Command:

```bash
chmod +x cyberAlchemy-v2/research/domainspec-v2/current-candidate-v5/research/alloy-tla-modeling/tooling/*.sh \
  cyberAlchemy-v2/research/domainspec-v2/current-candidate-v5/research/alloy-tla-modeling/tooling/lib/*.sh
bash -n cyberAlchemy-v2/research/domainspec-v2/current-candidate-v5/research/alloy-tla-modeling/tooling/*.sh \
  cyberAlchemy-v2/research/domainspec-v2/current-candidate-v5/research/alloy-tla-modeling/tooling/lib/*.sh
```

Result:

```text
bash -n passed for tooling scripts
```

## Wrapper Smoke: Alloy

Command:

```bash
cyberAlchemy-v2/research/domainspec-v2/current-candidate-v5/research/alloy-tla-modeling/tooling/run-alloy-check.sh version
```

Result:

```text
+ /home/vrondelli/projects/domainspec-core/.formal-tools/jre/current/bin/java -jar /home/vrondelli/projects/domainspec-core/.formal-tools/alloy/org.alloytools.alloy.dist-6.2.0.jar version
6.2.0
```

## Wrapper Smoke: TLA+

Command:

```bash
cyberAlchemy-v2/research/domainspec-v2/current-candidate-v5/research/alloy-tla-modeling/tooling/run-tla-check.sh --sany \
  cyberAlchemy-v2/research/domainspec-v2/current-candidate-v5/research/alloy-tla-modeling/invoke-plan/run-results/toolchain/ToolchainSmoke.tla
```

Result:

```text
+ /home/vrondelli/projects/domainspec-core/.formal-tools/jre/current/bin/java -cp /home/vrondelli/projects/domainspec-core/.formal-tools/tla/tla2tools-1.7.4.jar tla2sany.SANY /home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/research/domainspec-v2/current-candidate-v5/research/alloy-tla-modeling/invoke-plan/run-results/toolchain/ToolchainSmoke.tla

****** SANY2 Version 2.1 created 24 February 2014
Parsing file .../ToolchainSmoke.tla
Parsing file /tmp/Naturals.tla
Semantic processing of module Naturals
Semantic processing of module ToolchainSmoke
```
