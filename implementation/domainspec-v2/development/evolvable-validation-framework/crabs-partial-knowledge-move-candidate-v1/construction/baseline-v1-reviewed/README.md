# CRABS partial-knowledge move evidence candidate

Status: construction units C0-C2 implemented; C3 runtime admission not evaluable

This package implements the bounded EVF run described by
`../crabs-convergence-repair-candidate-v1/partial-knowledge-move-run-plan.md`.
It tests a three-replica ordered-set scenario in which two replicas move
different elements using incomplete knowledge.

The package has two separate modes:

- `validate-construction` checks the package, generator, receipt adversaries,
  source/tool bindings, and CBMC discovery bindings. It does not execute the
  48-case live run. Its package-contract checks pass, but its aggregate result
  remains blocked because the required Task Session request contract is not
  installed or bound.
- `execute` creates a new immutable attempt and runs the bounded native,
  sanitizer, and CBMC evidence sequence. That mode requires a separate explicit
  authorization and has not been run as part of package construction.

The matrix contains 48 cases: two full-replica delivery histories, two move
version orders, six permutations of the fixed roles, and two merge
parenthesizations. The generator is the sole owner of this enumeration. The C
harness rebuilds every state from insert/move operations and never uses merge
as a clone operation.

The missing Task Session contract is not recreated here. `execute` fails closed
until a separately governed runtime-admission surface exists and is explicitly
selected.

Construction validation:

```bash
PYTHONDONTWRITEBYTECODE=1 /usr/bin/python3 run.py validate-construction
```

Potential live entry point, not authorized by this package:

```bash
PYTHONDONTWRITEBYTECODE=1 /usr/bin/python3 run.py execute \
  --profile profile.json --commands commands.json
```

A PASS from this package means only that no counterexample was found in the
declared matrix and recorded CBMC bounds, with no detected sanitizer or
implementation-invariant violation. It is not a general proof, product
approval, implementation acceptance, publication, release, or deployment
authority.
