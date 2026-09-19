# Task Session Report — SWU-SFOL-BC-001

Result: `PASS`.

The explicit `sfol-development@0.1` profile now admits structured
`body.logic` only for Calculation and Operation nodes, binds its envelope
schema by SHA-256, and rejects absent profile admission, unsupported node kind,
unsupported schema version, malformed envelopes, and schema-binding drift with
stable compiler codes.

The compiler preserves the accepted structured value in the canonical graph.
The source manifest separately retains the digest of the complete source node
bytes. The existing DS-SFOL projection then decodes both admitted modules from
the graph/manifest/build proof context without a second source route.

Validation passed:

- focused SFOL profile tests: 2/2;
- complete tools tests: 76/76;
- existing node projection tests: 10/10;
- package typecheck;
- blocker-clearance and parent plan validators;
- staged/live postimage equality and diff check.

The released profile registry remains byte-identical at
`0868785499944ce2b21b915962cba48f8b21d627b840c24d81c77194e8864478`.
This receipt supplies technical closure evidence for G-SFOL-06 but grants no
release, promotion, adopter approval, or production authority.

Required closeout owner: `invoke:refresh:apply-approved`.
Unique successor after synchronized closeout: `SWU-SFOL-BC-002`.
