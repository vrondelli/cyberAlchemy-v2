# Reasoning Policy Runtime

This package selects how one verified Reasoning State epoch evolves before a
model request. It is deliberately separate from `reasoning-state-runtime`,
which owns append-only storage primitives.

The default policy can reuse a compatible plan-bound epoch, create a successor,
branch explicit exploration, or create a non-destructive reduction successor.
Every decision is deterministic and non-authorizing. Selected-source drift,
missing mandatory events, malformed epochs, and mandatory-context overflow fail
closed.

The package never summarizes with a model and never rewrites or deletes an
existing event or epoch.
