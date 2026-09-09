# State Machines: OEW Thin Prototype

## ThinPrototypeRun

```mermaid
stateDiagram-v2
    [*] --> InputsPending
    InputsPending --> InputsAdmitted : exact verification passes
    InputsPending --> Blocked : drift or missing input
    InputsAdmitted --> Built : typed tests and Vite build pass
    InputsAdmitted --> Blocked : compile, test, or build failure
    Built --> Serving : loopback gateway ready
    Built --> Blocked : gateway preflight failure
    Serving --> Witnessed : Chromium assertions and receipt emission pass
    Serving --> Blocked : browser, console, or network failure
    Witnessed --> Closed : Task Session closure audit and teardown pass
    Witnessed --> Blocked : closure audit or teardown fails
    Blocked --> Closed : teardown proof passes
    Closed --> [*]
```

### Invariants

| ID | Invariant |
| --- | --- |
| I1 | Every failure is terminal for the current run |
| I2 | Serving never precedes a successful build |
| I3 | Browser acceptance never precedes exact gateway readiness |
| I4 | Closure requires browser/process termination, port release, and temporary-root absence |
| I5 | Every state has `authority_effect: none` |
| I6 | Witnessed proves one local automated journey only; it is not independent immutable verification |
