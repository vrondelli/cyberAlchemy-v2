# ARE Continuous-Construction Task Loop

This package is the candidate `CA2-CAP-CONTROL-CONTINUOUS-CONSTRUCTION-TASK-LOOP`
composition owned by `CA2-PROJECT-AGENT-REASONING-ENGINE`.

It combines two immutable inputs without absorbing either one:

- the ARE Codex continuation assessment decides whether a successor is direct,
  gated, blocked, or complete;
- the C19 evaluator decides whether the exact D65 construction attempt may
  continue, must stop, is ready for human testing, or may request terminal
  confirmation.

An automatic successor is proposed only when both inputs permit it and both
name the exact first pending D65 stage. The result remains no-effect candidate
evidence. This L0 package does not install itself into the live Codex proxy and
does not adopt, admit, accept, publish, release, deploy, or execute anything.

Build and validate with:

```bash
node --import tsx scripts/build.ts
node --test test/*.test.mjs
python3 scripts/validate.py
```

