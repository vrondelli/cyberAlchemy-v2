# CyberAlchemy v2 Agent Instructions

This project is staged inside the private `domainspec-core` umbrella. Parent
repository submodule discipline still applies.

## Local Authority Model

- Canonical local definitions source:
  [authority/definitions/DEFINITIONS.md](authority/definitions/DEFINITIONS.md)
- Definitions lookup:
  [authority/definitions/DEFINITIONS-INDEX.md](authority/definitions/DEFINITIONS-INDEX.md)
- Authority import ledgers:
  [authority/imports/README.md](authority/imports/README.md)
- Stable repository constitution:
  [authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md](authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md)
- Project discipline catalog:
  [disciplines/DISCIPLINES.md](disciplines/DISCIPLINES.md)
- Source map:
  [SOURCE-MAP.md](SOURCE-MAP.md)

Narrative, research, observability, inventory, ontology, and ops artifacts may
explain these surfaces, but they do not redefine them.

## Working Rules

- Keep source evidence linked by path. Do not copy large upstream documents into
  this project unless a later import plan requires it.
- Stage scattered definitions, glossaries, constitutions, axioms, quality rules,
  and anti-patterns under `authority/imports/` before promoting them.
- Treat [../.arcanum/inventory/](../.arcanum/inventory/) and
  [../.arcanum/ontology-vault/](../.arcanum/ontology-vault/) as read models and
  candidate maps, not promoted authority.
- Keep public Arcanum patterns separate from private DomainSpec evidence.
- Generated runtime mirrors are evidence of projection, not canonical source.
- Research may propose; authority decides; implementation waits for a gate.
- Every durable informational artifact should carry an Open Questions section or
  link to the artifact that owns its unresolved questions.

## Agent Routing

Every request begins at `CA2-ROUTE-ENTRY`. Load these three bootstrap files:

- [Routing profile](agent-routing/profile.json)
- [Route registry](agent-routing/routes.json)
- [Router contract](agent-routing/ROUTER.md)

The registry is the single repository objective router. Select exactly one
non-entry route and announce its `read_first` list before reading it. Follow
its lifecycle state, authorization requirements, write ceiling, and blockers.
If the objective cannot be resolved unambiguously, use `CA2-ROUTE-AMBIGUOUS`
and ask for the smallest missing decision. Do not introduce routing fallbacks.

After the bootstrap reads, call the local ARE CLI to evaluate the request:
`node implementation/agent-reasoning-engine/bin/are.mjs decide route`, with
one JSON request on stdin. Follow the exact
[CLI contract](agent-routing/capabilities/are-cli/README.md) and
[request schema](agent-routing/capabilities/are-cli/request.schema.json).
Preserve the user's raw text, mark inferred objective fields, and use distinct
caller session/request IDs. ARE evaluates the registry; it does not replace it.
Use the returned route contract for selection. Carry its receipt into `context`,
`effect` at consequential boundaries, and `continue` at completion boundaries.
These calls grant no effects and do not erase existing user authorization.
Engine/source failures are explicit diagnostics, never alternate routing.

When the user expresses an intention to start an unbounded new product,
project, system, capability, workflow, or initiative, label the objective
`define-intake` rather than inferring Plan or Implement. Route it through
`CA2-ROUTE-DEFINE` and use the Define process to elicit and confirm the user's
domain language, scope, desired outcome, consumers, distinctions, constraints,
owners, and open questions. Do not relabel an explicit implementation request
for an already-bounded target. A Definition Pack remains candidate evidence;
route any later Plan or Implement request separately.

Use `CA2-ROUTE-LOCATE` and the [project index](agent-routing/project-index.json)
to resolve user-cited names before asking for paths. For explicitly scoped `../domainspec-core` lookup, use
`CA2-ROUTE-DOMAINSPEC-CORE` and its
[sibling inventory](agent-routing/DOMAINSPEC-CORE-INDEX.md). When recent work is
relevant, use `CA2-ROUTE-RECENT` for bounded committed context, then return to
the original objective route. Keep uncommitted work distinct from that history.

Route availability, runtime availability, and governance admission are separate.
Carry forward the `CAV2-D65` construction chain for implementation-bearing work;
route selection does not grant authority or authorize effects.

### Ontology-runtime enforcement suspension

The candidate ontology runtime is not a mandatory repository prerequisite.
Direct diagnostic calls use `CA2-ROUTE-ONTOLOGY`; other work declares its exact
record and selector dependencies under the selected objective route. Mandatory
enforcement requires a separately selected and validated Rust governance binding.

## Native development toolchain

For Rust/C/C++ builds, use `tools/toolchain/run <command>` from this checkout,
or its absolute path from another working directory. The launcher supplies
Cargo, GCC and the linker without relying on login-shell configuration. See
[tools/toolchain/README.md](tools/toolchain/README.md) for the version lock,
installation and `doctor.py` verification. Preserve nested Rust toolchain pins;
do not invent per-test paths or install another temporary compiler.

## Open Questions

Routing questions are owned by the [router package](agent-routing/README.md),
[project lookup contract](agent-routing/PROJECT-LOOKUP.md), and
[recent-context capability](agent-routing/capabilities/recent-context/README.md).
