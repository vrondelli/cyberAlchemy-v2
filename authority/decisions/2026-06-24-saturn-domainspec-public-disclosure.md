# Decision: Saturn / DomainSpec Public Disclosure

Status: pass
Owner route: decision-gate + boundaries
Timestamp: 2026-06-24 (records operator decisions made 2026-06-21 → 2026-06-22)
Promoted from: Claude Code operator memory (`saturn-domainspec-public`) — a low-authority
capture surface; this record is the governed form. Routed via `authority-triage`.

## Consequential Work

Records the operator's public-disclosure boundary for **Saturn** and **DomainSpec**
as governed authority. Resolves the open disclosure question the saturn-layer map
left open (SATURN-LAYER-MAP OQ-1 / OQ-3) and the `boundaries.md` OQ-1 ("first
public-safe slice"). This is a **boundary decision**, not a definition.

## Decision 1: Naming Saturn and DomainSpec publicly is approved

Selected option: **Saturn and DomainSpec may be named and explained on the public
Arcanum GitHub Pages site.** Previously both had zero public presence and Saturn's
rich source was a private deck.

Constraint (claim ≤ proof): frame **Saturn** (the full convergence loop) and
**DomainSpec-as-a-published-layer** as the **intended target, not as shipped**,
until they actually ship publicly. (This constraint is about *build-status*, not
disclosure.) Live public explainer: `arcanum/docs/system.html` ("The System" tab).

## Decision 2: "Who we are" public framing approved (2026-06-22)

Approved conceptual positioning for public surfaces:

- **research-as-discovery**;
- **code-as-probe** ("code is an observational probe, not the end product");
- **Cybernetics²** (cybernetic loops around human work that feed back to the
  operator; AI augments, never replaces).

Conceptual positioning only.

## Boundary (what stays private)

- Private **content** from `cyberAlchemy-v2/`, `framework-unification/`, and
  `implementation/` internals must **not** be pasted into the public repo.
- Internal project / layer-map names — **MARS / MOGT / Necronomicon** and the
  8-layer internal stack — stay **private**.
- The engine **mechanism** stays withheld (see the companion
  [engine moat decision](2026-06-24-engine-moat-and-free-paid-boundary.md)).

## Result

Decision gate result: PASS (operator decision, recorded as governed authority).
Every outward artifact still passes a `boundaries.md` public scrub.

## See also

- [boundaries.md](../boundaries.md) — the public/private boundary it resolves (OQ-1).
- [2026-06-24 Engine moat + free/paid boundary](2026-06-24-engine-moat-and-free-paid-boundary.md) — companion.
