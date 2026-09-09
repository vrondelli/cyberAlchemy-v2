# Validation Strategy

## Always-on checks

- `node --test cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/thin-prototype-build.test.mjs`
- exact JSON parse/schema checks for planning contracts;
- scoped `git diff --check -- <declared targets>`;
- no external network, no generalized build, no Chromium, no generated run.

## Fixture coverage

The implementation must realize V-OEWFR-01 through V-OEWFR-11 from
[Design validation contracts](../design/VALIDATION-CONTRACTS.md). Injected
commands replace live package execution. Secret fixtures use synthetic markers
only. Path fixtures cover relative, absolute, normalized, and symlink escape.
V-OEWFR-12 and 13 validate the separate non-selecting compatibility decision
packet and static cause boundary; they do not implement a repair.

## Claim ceilings

Passing tests prove the private failure-evidence path and successor contract
only. They do not prove actual Vitest success, browser focus behavior, a fresh
build, SWU006 completion, release, deployment, or production readiness.
