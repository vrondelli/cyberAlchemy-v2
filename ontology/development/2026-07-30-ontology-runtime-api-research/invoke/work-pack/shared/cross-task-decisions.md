# Cross-task Decisions

| Decision | Current value | Change authority |
| --- | --- | --- |
| Runtime location | candidate private root only | future implementation owner |
| Runtime contract location | unselected | runtime-contract owner |
| Package selection | explicit configured registration | runtime-contract owner |
| v0 adapter | local fixture only | implementation + package owners |
| v0 operations | native validate; same-adapter byte/local-ID diff; draft bytes | runtime-contract owner |
| Network | loopback only | security-risk owner; widening requires new Design |
| Persistence | immutable create-only runtime store | snapshot/store owner |
| Retention/GC | unavailable | retention owner |
| First SWU | none selected; 001 recommended | user/Task Session preflight after gates |
| Later adapters | deferred | exact project/profile owners |

