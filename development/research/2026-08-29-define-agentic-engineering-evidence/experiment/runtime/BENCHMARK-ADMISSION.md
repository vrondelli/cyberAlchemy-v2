# Public Software-Agent Benchmark Admission

Status: `L3.5-owner-selected-pending-admission`

This is the L3.5 step. It begins only after one repository-local L3 synthetic
task block validates. It does not select or execute a public benchmark task by
itself.

## Purpose

Public coding benchmarks can test whether Define's experiment mechanics travel
beyond this repository. They also create contamination, licensing, dependency,
and hidden-truth risks. Admission makes those risks explicit before selection.

## Candidate Record

Each candidate must record:

- benchmark name, version, task ID, and source URL;
- repository and exact base commit;
- issue-text digest and permitted local copy;
- hidden patch and hidden-test handling;
- allowed and forbidden paths;
- offline runtime identity and test command;
- license and redistribution limits;
- estimated time and resource budget;
- contamination risk and reason;
- low- or high-ambiguity classification.

## Admission Rule

A candidate is eligible only when it runs offline, needs no credentials or
external service, has bounded writes, keeps the reference patch and hidden
tests absent from agent views, and can use the same source/runtime across all
four conditions.

L3.5 produces a current research inventory and recommends one low-ambiguity and
one high-ambiguity task. The experiment owner selects explicitly. After
selection, each task must independently pass L2 isolation and L3 packet
compilation before any native agent session is considered.

Benchmark scores are supporting comparison evidence. They do not by themselves
prove that Define improves product outcomes, and public-task memorization
remains a named confounder.

## Initial Vero Candidates

Source snapshot: [Vero leaderboard](https://vero.verina.io/leaderboard/) and
[Vero repository at `0a7325df9e9e6dbc275c0ad483b3d1cbe38d9b09`](https://github.com/sunblaze-ucb/vero/tree/0a7325df9e9e6dbc275c0ad483b3d1cbe38d9b09),
inspected on 2026-08-29. The exact Vero commit was fetched into temporary local
staging and verified clean. No Vero task has been built or run, and no model
session has been authorized.

### Low-ambiguity candidate: `pythonconstraint`

Selection status: `owner-selected-for-admission-preparation`

- Vero target: `benchmark=pythonconstraint`, supporting `proof` and
  `codeproof` modes.
- Shape: one Lean module, 4 APIs, and 20 scored specifications.
- Meaning: implement a finite-domain constraint solver whose returned solutions
  are sound, complete, duplicate-safe, and consistent across its four APIs.
- Source: `python-constraint/python-constraint` at
  `f1359ff0ff6d9a541923d071cf1c0b50f8e8925b`, BSD-2-Clause.
- Runtime: Lean 4.29.1; the manifest says the task is mathlib-free.
- Current leaderboard signal: code-and-proof results were 20/20, 20/20,
  18/20, and 20/20 across the four published runs.
- Why low ambiguity: the observable behavior is explicitly the solution set,
  not search order or search efficiency. The write surface is one module and
  the correctness conditions are concrete.
- Remaining admission work: freeze the Vero checkout, render the sandbox,
  cache the Lean toolchain, prove network-free rebuild and grading, enumerate
  editable marker slots, and record the rendered instruction digest.

Primary record: [pythonconstraint manifest](https://github.com/sunblaze-ucb/vero/blob/0a7325df9e9e6dbc275c0ad483b3d1cbe38d9b09/benchmarks/pythonconstraint/manifest.json).

### High-ambiguity candidate: `flocq`

Selection status: `deferred-not-selected`

- Vero target: `benchmark=flocq`, supporting `proof` and `codeproof` modes.
- Shape: 73 APIs and 203 scored specifications across a repository-scale
  floating-point formalization.
- Meaning: implement and prove translated floating-point operations and laws
  while respecting Vero's curated trusted-axiom boundary.
- Source: `flocq/flocq` at
  `7aab8f55bceec0cfafc3b3bc0e77e0dbb5a70c5f`; the benchmark remains
  LGPL-3.0-or-later and ships its own license boundary.
- Runtime: Lean 4.29.1 with mathlib pinned to `v4.29.1`.
- Current leaderboard signal: code-and-proof results were 155/203, 153/203,
  138/203, and 119/203. No published run fully solved it.
- Why high ambiguity: the task combines a large API graph, many mathematical
  concepts, cross-module proof obligations, trusted axioms, and a larger
  dependency and license surface.
- Remaining admission work: preserve LGPL notices, cache mathlib and Lean for
  a network-free build, inspect the trusted-axiom allowlist, enumerate editable
  marker slots, and establish a bounded time and storage budget.

Primary records: [Flocq manifest](https://github.com/sunblaze-ucb/vero/blob/0a7325df9e9e6dbc275c0ad483b3d1cbe38d9b09/benchmarks/Flocq/manifest.json)
and [Flocq Lake configuration](https://github.com/sunblaze-ucb/vero/blob/0a7325df9e9e6dbc275c0ad483b3d1cbe38d9b09/benchmarks/Flocq/lakefile.toml).

## Selection Ceiling

Owner decision on 2026-08-29: select `pythonconstraint` as the single Vero
admission target because it has 20 scored proofs, compared with Flocq's 203.
It also has the smaller module, dependency, and license surface.

This decision authorizes admission preparation only: pin the already verified
Vero source, render and inspect a candidate sandbox, identify allowed write
slots, and prove an offline runtime. It does not authorize a model call,
benchmark execution, publication, or a product claim.

`flocq` is deferred. It is not a successor that may run automatically.
