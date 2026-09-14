# Robot World Consumer

Status: example candidate  
Authority effect: none

Robot World is a domain consumer of the general Orchestrator. Its Run Template
creates a two-node strategy: run the bounded world contract, then independently
verify the exact predecessor bytes. The world state, semantic interaction
dynamics, policies, simulation, and visual replay remain under
`development/robot-world-kep/`.

Regenerate or check the templates against the current domain worker:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 orchestrator/examples/robot-world/build.py
PYTHONDONTWRITEBYTECODE=1 python3 orchestrator/examples/robot-world/build.py --check
```

The orchestration integration proves local contract execution and recovery
boundaries. It does not turn simulation output into truth or grant effect,
publication, or policy authority.

The product-native `world_contracts` driver is built and exercised by the
existing domain journey:

```sh
python3 development/robot-world-kep/orchestrator-integration/build.py
cd development/robot-world-kep/orchestrator-integration
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest -v test_contracts test_integration
```

## Open Questions

Should a future domain adapter expose the replay view through the Control Center
as an embedded artifact or an external linked view?
