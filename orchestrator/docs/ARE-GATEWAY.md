# ARE Gateway Adapter Boundary

Status: implementation and deployment candidate  
Authority effect: none

ARE is an agent execution adapter. The runtime scheduler emits a Command Intent
after RWO releases a node. The adapter translates that command into an ARE
request with `authority_effect: none`, receives a structured response, and
returns an Agent Turn draft. The common agent boundary checks identity,
capability, lease, and fence, records a receipt, and proposes a structural event
to the controller.

ARE does not compile or mutate the graph, schedule commands, accept events,
resolve unknown effects, or decide domain truth. The local API currently reports
the configured Unix socket and profile reference. A live socket transport must
be implemented and admitted as a separately tested adapter before it can execute
provider-backed turns.

## Open Questions

- Which Gateway request/response protocol version becomes the first supported
  live transport?
- Which owner admits provider, tool, budget, and egress policies for a run?
- Which retry rules apply to transport failure before and after provider work?
