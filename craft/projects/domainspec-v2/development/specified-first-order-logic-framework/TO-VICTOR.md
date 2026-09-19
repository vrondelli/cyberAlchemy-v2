---
notification_id: victor-domainspec-node-procedural-architecture
recipient: Victor
status: pending
created_on: 2026-07-24
scheduled_for: null
completed_on: null
artifact: projects/domainspec-v2/development/specified-first-order-logic-framework/PROCEDURAL-ARCHITECTURE.html
branch: master
allowed_transitions:
  pending: [in_progress, declined]
  in_progress: [completed, declined]
  completed: []
  declined: []
---

# Victor: DomainSpec node procedural architecture

The beginner-facing DomainSpec node explanation is ready to review. It starts
with a Key-and-Door example, explains what a node is before introducing BTE or
DS-SFOL, and separates what the current tools can do from the future behavioral
verification design.

## Open in Claude Code

From the `domainspec-core` repository root, run:

```bash
claude "Read projects/domainspec-v2/development/specified-first-order-logic-framework/TO-VICTOR.md, then open projects/domainspec-v2/development/specified-first-order-logic-framework/PROCEDURAL-ARCHITECTURE.html. Start with the Nodes now section. Review whether an entry-level developer can distinguish a node, a connection, the generated graph, structural checks, and the future behavior-checking design. Do not mutate files unless Victor asks."
```

Repository link:

<https://github.com/cyberAlchemyAI/domainspec-core/blob/master/projects/domainspec-v2/development/specified-first-order-logic-framework/PROCEDURAL-ARCHITECTURE.html>

## Review boundary

- The exact `key-and-door.HasKeyRule` JSON comes from a fixture accepted by the
  current compiler.
- The current `minted-node/v1` package supports structural modeling and
  compilation; it does not generate application code or prove business
  behavior.
- The Financial Settlement and `body.logic` material explains a planned
  DS-SFOL extension, not current compiler capability or approved adopter
  authority.
- This page is explanatory material. Reviewing it does not approve
  implementation, release, promotion, or authority changes.

## Suggested review questions

1. Can a new developer explain a node after reading the first section?
2. Is the difference between a node file and the generated graph clear?
3. Is the difference between structural checks and behavior checks clear?
4. Does every future capability remain visibly labeled as future?

When review begins, change `status` to `in_progress`. When it is finished,
change it to `completed` and set `completed_on`.
