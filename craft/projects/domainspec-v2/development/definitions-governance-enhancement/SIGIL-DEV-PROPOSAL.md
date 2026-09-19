<!-- PRIVATE staging. Proposed deltas to the PUBLIC definitions-governance sigil.
     SANITIZED: no private authority IDs, no private authority term names.
     PROPOSAL ONLY — owner ratifies; nothing here is applied to arcanum. -->

# SIGIL-DEV-PROPOSAL — `definitions-governance` enhancement

**Target:** `arcanum/arcana/definitions-governance/SKILL.md` (PUBLIC, read-only from here).
**Baseline version:** `0.1.0`.
**Nature:** three independent, generic enhancement deltas. Each names the exact
`SKILL.md` section it touches, gives before→after *intent* (not final wording), and is
a **PROPOSAL** the sigil owner ratifies (all, or any subset) via `sigil-development`.

All proposed sigil text is **generic**. No consuming-repo authority IDs or private
term names appear below. See **Provenance** for how a private repo wires its own
governance primitives into the generic hooks.

---

## Delta A — Machine-view pairing (human card + machine registry)

**Generalizes:** each canonical definition = a human `.md` card **plus** a machine
registry entry (`.yml`) that is a *read-model index of definitions*, not a validation
schema. The registry sits alongside the human lookup index.

### A.1 — Section: `<project-authority-boundary>` (default `definitions/` surface)
**Before (intent):** default surface is card + human index + drift audit only:
```text
definitions/
  DEFINITIONS.md
  DEFINITIONS-INDEX.md
  DEFINITION-DRIFT-AUDIT.md
```
**After (intent):** add a machine registry surface as a first-class default sibling of
the human index. The registry is a machine read-model (id, term, status, and a pointer
to each definition's criterion/source-of-truth); it is **not** the canonical semantic
store and **not** a validation schema:
```text
definitions/
  DEFINITIONS.md            # human cards (canonical semantics)
  DEFINITIONS-INDEX.md      # human lookup layer
  DEFINITIONS-REGISTRY.yml  # machine read-model index (NEW): id/term/status + criterion pointer
  DEFINITION-DRIFT-AUDIT.md
```
Note in the section: consuming repos MAY colocate per-group registry files next to
grouped cards instead of one root registry, but every human card MUST have exactly one
machine registry entry, and the registry never redefines semantics.

### A.2 — Section: `<process>`
**Before:** step 2 initializes the default `definitions/` surface (card + index +
audit); step 8 syncs "lookup or index artifacts."
**After (intent):**
- Step 2: initialization also creates the machine registry surface when absent.
- Step 8: broaden "sync lookup/index" to "sync **both** the human lookup index **and**
  the machine registry" so every card has a resolving human row **and** a machine entry.
- Add an explicit sub-check: registry entry ↔ card is 1:1 (no card without an entry;
  no entry without a card).

### A.3 — Section: `<output-contract>`
**Before:** reports `Index synced: yes | no | not applicable`.
**After (intent):** add a sibling line:
```markdown
- Machine registry synced: yes | no | not applicable
```

**Proposal note:** owner ratifies naming (`DEFINITIONS-REGISTRY.yml` vs. colocated
`.yml`) and whether the 1:1 check is a hard fail or a drift flag.

---

## Delta B — Voice-quality discipline (quality bar + lessons ledger)

**Generalizes:** the existing 3-voice model mandates that three voices are *present*.
This adds a *quality bar per voice* and an appendable *lessons ledger*, plus an
optional new drift-audit dimension "voice below quality bar." It does not add a fourth
voice; it raises the bar on the three that already exist.

### B.1 — Section: `<definition-voice-model>`
**Before:** requires three colocated voices (scientific/formal, plain-language,
domain-context); silent on how *good* each must be.
**After (intent):** append a **voice-quality guide** reference: a per-voice quality bar
plus an appendable lessons ledger, layered on the three existing voices. Generic bar,
e.g.:
- scientific/formal: states the normative meaning **and** its testable boundary /
  falsifier (what would make an instance *not* the term);
- plain-language: a lay reader can restate it without reading the formal voice, and it
  adds no meaning absent from the formal voice;
- domain-context: names the concrete local surface where the term appears, anchored to
  the current workspace (not an imported example).
The guide also carries a **lessons ledger**: a running, appendable list of observed
voice failures and the rule each produced (so the bar improves from real drift, not
guesswork). Default surface: `definitions/VOICE-GUIDE.md`.

### B.2 — Section: `<process>` (audit step)
**Before:** audit step 9 flags "definitions missing one or more required voices" and
"domain-context voices that point at the wrong project or workspace" — presence checks
only.
**After (intent):** add an audit dimension **"voice below quality bar"** — a voice that
is present but fails its bar (e.g., formal voice with no falsifier; plain-language that
merely restates the formula; domain-context with no concrete local anchor). Emit as a
remediation item, distinct from "missing voice."

### B.3 — Section: `<quality-bar>`
**Before:** requires the three voices be present and non-contradictory.
**After (intent):** strengthen from *presence* to *presence + bar*: "each of the three
voices meets its quality bar (per the voice-quality guide), and the run consulted the
lessons ledger for known voice-failure patterns." Presence-without-quality is no longer
a pass.

**Proposal note:** owner ratifies whether "voice below quality bar" is a hard fail or a
soft flag, and the exact bar wording per voice.

---

## Delta C — Generic contestability hook on candidate definitions

**Generalizes:** a candidate definition should carry an explicit **contestability
contract** — two generic sub-parts: a **challenge** protocol (how the candidate may be
contested) and a **confirm** protocol (what promotes candidate → active). Field names
are fully generic. Consuming repos wire their own governance primitives into this hook;
the sigil only requires the slot exists and is filled for candidates.

### C.1 — Section: `<process>`
**Before:** step 4 adds/updates terms "with stable IDs when the repository uses IDs";
no notion of candidate contestability or promotion.
**After (intent):** add a step: when a definition is in a non-final (candidate) state,
it MUST carry a **contestability contract** with both sub-parts filled:
```yaml
contestability:
  status: candidate            # candidate | active | deprecated
  challenge:                   # how this candidate may be contested
    who_may_challenge: <role/party, repo-defined>
    grounds: <what constitutes a valid objection>
    where_recorded: <path/surface where challenges are logged>
  confirm:                     # what promotes candidate -> active
    promotion_criteria: <the bar a candidate must clear>
    who_confirms: <owner/authority that ratifies, repo-defined>
    records_to: <where the promotion is recorded>
```
All field values are supplied by the consuming repo. The sigil requires the *shape*
(both `challenge` and `confirm` present and non-empty for any candidate), not any
specific governance mechanism.

### C.2 — Section: `<output-contract>`
**Before:** reports updated ids, voice completeness, index/drift, etc.; nothing about
candidate contestability.
**After (intent):** add lines:
```markdown
- Contestability contracts present (candidates): yes | no | n/a
- Candidates promoted to active this run: <ids or none>
```

### C.3 — Section: `<quality-bar>`
**Before:** no candidate-contestability requirement.
**After (intent):** add: "every candidate definition carries a contestability contract
with both a filled `challenge` protocol and a filled `confirm` protocol; a candidate
was promoted to active only when its `confirm.promotion_criteria` was met and recorded."

**Proposal note:** owner ratifies the field names (`challenge`/`confirm` and their
sub-fields) and whether an empty contract on a candidate is a hard fail or a drift flag.

---

## Cross-cutting: `<anti-patterns>` (small additions, owner-optional)
Consistent with the three deltas, consider adding:
- treating the machine registry as a canonical semantic store or a validation schema
  (it is a read-model index only);
- passing a definition on voice *presence* while a voice is below its quality bar;
- exercising a candidate definition as settled authority before its `confirm` protocol
  is met and recorded.

---

## Provenance (why these are generic, and what a private repo adds)
These deltas were distilled from a private, cav2-based DomainSpec repository whose
local definitions surface already runs all three patterns with **private**
instantiations — private authority IDs, a private confirm/promotion primitive, and a
per-scheme registry keyed to private criterion schemas. **None of that is proposed for
the sigil.** The sigil deltas above are the *generic shape* only: a machine read-model
sibling to the human index, a per-voice quality bar plus lessons ledger, and a
generic `challenge`/`confirm` contestability slot. The private repo wires its own
governance primitives into the generic `confirm.who_confirms` / `confirm.records_to`
fields at install time; the public sigil stays free of any private vocabulary.

## Status
PROPOSAL. Owner ratifies (all deltas, or any subset) and applies via `sigil-development`
against `arcanum/arcana/definitions-governance/`, then regenerates the local skill copy
and commits submodule-first / parent-last per `SUBMODULE-DISCIPLINE.md`. Nothing in this
folder mutates Arcanum.
