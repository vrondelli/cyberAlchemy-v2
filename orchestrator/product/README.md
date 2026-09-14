# CyberAlchemy Orchestrator Product

Status: candidate product explanation  
Authority effect: none

## Product promise

Give a person one understandable place to create a reusable agent strategy,
review the exact dispatch, run it through checked contracts, observe how work
progresses, recover interruptions, and inspect the result with its evidence and
unresolved questions intact.

## Intended consumers

- people designing and reusing multi-agent strategies;
- operators supervising concurrent runs and recovery;
- developers integrating agents, tools, and model providers;
- domain owners whose gates, evidence, and effects must remain separate;
- product teams embedding run and strategy views.

## First product boundary

The first edition is local-first and single-host. It supports finite bounded
Work graphs, reusable strategy and run templates, agent and tool adapters,
durable accepted history, recovery, API access, and a Control Center. Gateway
execution is an adapter inside the same checked command and receipt boundary.

The Control Center retains four product-wide comprehension surfaces:

- **Lab** for inspecting and reusing strategies, run templates, and observed executions;
- **Graph** for seeing each admitted run's actual DAG and node state;
- **Ontology** for browsing relationships among templates, strategies, runs, work, roles, and adapters;
- **Operations** for observing runtime capacity, gateway reachability, durability, commands, and recovery.

These are general orchestrator projections. Domain-specific packages may add
records and examples, but they do not redefine the four surfaces.

Shared definitions and ontologies live at `../authority/` and `../ontology/`
because they govern product, RWO, runtime, frontend, deployment, examples, and
tests. This folder owns product explanation rather than shared normative meaning.

## Exclusions

The first product definition does not claim distributed consensus, unbounded
dynamic graphs, exactly-once external effects, automatic truth judgment,
authority transfer to agents, product acceptance, release, or deployment.

## Open Questions

- Which smallest template-creation journey should become the first product test?
- Which adapters form the supported first-edition compatibility set?
- Which result explanation is sufficient for a new operator to understand a run?
- Which extension contract should add domain-specific Lab and ontology records without coupling the core product to one domain?
