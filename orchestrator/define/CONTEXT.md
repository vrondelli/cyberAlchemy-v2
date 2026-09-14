# Orchestrator Define Context

Status: candidate  
Authority effect: none

## Goal

Start the CyberAlchemy Orchestrator project at `cyberAlchemy-v2/orchestrator`
and expose one complete candidate vocabulary for product, strategy, RWO,
runtime, agent, recovery, UI, and migration discussions.

## Explicit intent

The user selected one standalone product inside CyberAlchemy v2, rooted at
`orchestrator/`. Product explanation belongs under `orchestrator/product`.
Authority and ontology are shared sibling contexts. RWO remains an independently
tested internal package reused by the durable Orchestrator runtime. The two old
CyberAlchemy v2 orchestration directories and the standalone repository are
retirement targets after migration proof.

## Consumer

The requesting user and the future Orchestrator design and implementation work
consume this pack to review vocabulary before further construction.

## Context sufficiency

The current context is sufficient for a candidate Definition Pack. Unresolved
edition, identity, compatibility, and publishing choices remain explicit and do
not prevent vocabulary review.

## Boundaries

This Define run creates candidate meaning only. It does not promote definitions,
register an admitted Project, authorize implementation, migrate runtime bytes,
delete repositories, release, or deploy.

## Open Questions

See `../authority/definitions/DEFINITIONS.md#open-questions`.
