---
node_type: template
is_session: false
status: candidate
boundary: INTERNAL — Mint emit-template; intended-not-shipped, non-executed
created: 2026-06-29
authored_by: task-session (SWU-2)
swu: SWU-2 (emit-template set)
source_artifact: resonantos-economy-research/definitions/DEFINITIONS.md
emits_to: <TARGET_REPO>/definitions/DEFINITIONS.md
leak_strip: |
  Definition cards may CITE cav2 snapshots in their Evidence field (the precedent's ER-D2
  does) — that is citation/provenance, Obs-B-safe (an Evidence link is not a resolution
  path). The skeleton keeps the three-voice card FORMAT and adds an explicit note: a cav2
  Evidence citation is harvested precedent, never an authority the definition resolves to.
  Source-kind "method-authority" in the precedent points at the LOCAL constitution, not cav2.
---

<!--
  MINT EMIT-TEMPLATE (intended-not-shipped). INHERITS: the three-voice card FORMAT (Formal/
  Plain-language/Domain-context voice + Source kind + Evidence + Use carefully + Misuse
  warning + Promotion boundary), the local-research-only promotion scope, the canonical-
  source header. LOCALIZES: the cards themselves (this is a SKELETON — emit seeds 1-2 cards;
  the domain owner authors the rest). Replace <DOMAIN>/<...> placeholders at emit.
-->

# <DOMAIN> Local Definition Cards

Status: active
Promotion scope: local-<DOMAIN>-only
Canonical source: yes

These definitions are local <DOMAIN> definitions for this repository. They do not define
<DOMAIN_EXTERNAL_POLICY_SURFACE>, governance weight, launch readiness, or implementation
contracts.

Each card keeps three voices together:

- **Formal voice**: the normative local meaning and boundary.
- **Plain-language voice**: non-normative intuition.
- **Domain-context voice**: how the term is used in this repository now.

> **Citation vs authority (Obs-B).** A card's `Evidence:` field MAY cite a harvested
> framework snapshot (e.g. `sources/local-snapshots/cav2/...`). That is **provenance /
> citation** — it records where the idea was harvested. It is NOT a resolution path: the
> card's normative meaning is owned **here**, and removing the framework attachment does
> not change the definition. A `Source kind:` of method-authority points at **this repo's
> own constitution**, never at cav2.

## <DOMAIN>-D1. <DOMAIN_TOP_LEVEL_TERM>

Source kind: operator-reading; local-inference

Evidence: [README.md](../README.md), [<DOMAIN local evidence>](...)

Formal voice:

```text
<DOMAIN_TOP_LEVEL_TERM> =
  <conjunct_1>
  AND <conjunct_2>
  AND <conjunct_3>
```

Plain-language voice: <non-normative intuition>.

Domain-context voice: <how this repo uses the term — a candidate to study, not a proven
invariant>.

Use carefully: <the boundary condition / what future versions still need>.

Misuse warning: <the conflation to refuse>.

Promotion boundary: <promotion-candidate | local-only | blocked-until-witness>

## <DOMAIN>-D2. <DOMAIN_ORIGINATED_TERM> ⟵ *domain-originated*

Source kind: local-inference  *(may cite a harvested precedent in Evidence — citation only)*

Evidence: [authority/source-spine.md](../authority/source-spine.md), [<harvested snapshot,
if any — provenance>](...)

Formal voice:

```text
<the domain-specific normative meaning — owned HERE, not resolved to a framework>
```

Plain-language voice: <intuition>.

Domain-context voice: <this repo's preferred development lane for the term>.

Use carefully: <boundary>.

Misuse warning: <conflation to refuse>.

Promotion boundary: <...>

<!--
  SKELETON ENDS HERE. The domain owner authors additional cards through the definitions
  lifecycle. Every load-bearing term (per the constitution's load-bearing-term rule) must
  get a tracked card; a definitions-index + drift-audit are seeded alongside (not in this
  template — they are generated as the card set grows).
-->
