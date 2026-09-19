# DomainSpec + Lean Validator — What You're Buying, in Plain Language

*A 5-minute read for a business buyer. Honest by design: every guarantee below is
labelled by how strong it is, so your technical advisor can verify it.*

---

## In one sentence
**DomainSpec is a precise, machine-checkable way to write down what your software is
supposed to do — paired with a mathematical proof-checker that confirms the
agreement holds together and that the delivered code actually matches it.**

## The problem we remove
Most software is built like this: someone writes a spec in prose, developers read
it, and everyone *hopes* they understood it the same way. Two things go wrong, and
they cost money:
- **Ambiguity** — the document means one thing to the author and another to the
  builder. Nobody notices until it ships wrong.
- **Drift** — the code slowly stops matching the spec, and there's no reliable way
  to tell. Diligence becomes "trust us."

You can't *check* a prose document with a machine. That's the gap.

## The language — the blueprint, not the napkin sketch
The **DomainSpec language** is a precise way to write down the agreement: what the
software is, what must always be true, how the pieces relate. Think of it as the
difference between a **napkin sketch** (two builders read it two ways) and an
**architect's blueprint** (precise, and a third party can check it *before* the
concrete is poured). Because it's precise, a machine can read it and check it — not
just a human hoping.

## The validator — the tireless, impartial auditor
The **Lean validator** is a **mathematical proof-checker**. Lean is the same family
of tool used to verify microchip designs and aerospace and cryptography — domains
where "we tested it a lot" isn't good enough. It checks **by calculation, not
opinion**: like an auditor who checks every line against the rules, never gets
tired, never gets political, and produces the same answer every time.

## How they work together — two locks and one human key
- **Lock 1 — the blueprint is checked before building.** The proof-checker confirms
  the agreement *holds together*: no contradictions, nothing referenced that
  doesn't exist, no circular dependencies. You catch the expensive mistakes before
  a line of code is written.
- **Lock 2 — the delivered code is checked back against the blueprint.** The code is
  mechanically compared to the agreement, so **drift is caught**, not discovered
  later.
- **The human key — a person signs that the blueprint is the *right* one.** The math
  guarantees the structure and the match; it does **not** decide whether the
  blueprint captures what you actually wanted. That stays a human decision — on
  purpose. Anyone who tells you a machine removes that judgment is overselling.

## How this proves the system works — the assurance ladder
This is the part your technical advisor will care about, and it's our
differentiator: **we tell you exactly how strong each guarantee is.**

| Tier | What it means | Examples |
|------|---------------|----------|
| **Proven (mathematics)** | A theorem the proof-checker enforces — it literally cannot be violated. | The blueprint's pieces are connected in only valid ways (ill-formed connections can't even be written down). |
| **Machine-checked (reproducible)** | A deterministic check that runs every time and catches a defined class of error. Not a grand proof, but reliable and repeatable. | No missing/dangling references; no circular dependencies in what gets built. |
| **Human-judged (by design)** | Decisions a machine should never make. | Does the blueprint reflect the real business intent? Final sign-off to promote/ship. |

**What this removes for you:** ambiguity, silent spec-to-code drift, and
"trust-me" diligence — replaced by **reproducible, inspectable evidence**.
**What it does not claim:** it does not prove the software is "bug-free," and it
does not prove the blueprint is what you wanted (that's the human key).

## Three analogies for your board
1. **Blueprint vs napkin sketch** — we replace a document people interpret with a
   blueprint a machine can check.
2. **The tireless auditor** — a proof-checker that verifies every rule by
   calculation, identically every time.
3. **Two locks and a key** — the blueprint is locked for consistency, the code is
   locked to the blueprint, and a human still turns the key on intent.

## Built today vs roadmap (so diligence finds no surprises)
- **Working today:** the precise language; the *proven* well-formedness theorem;
  the consistency + dependency checks (Lock 1's core); a deterministic test harness
  that demonstrates the checker rejects bad inputs; and the first end-to-end
  well-formedness loop.
- **Designed, on the roadmap (not yet shipped):** the deeper rule-by-rule
  obligation checks, the automatic code→blueprint translator (the full Lock 2), and
  the full two-way coupling where the two systems continuously reinforce each other.
We're explicit about this line; a buyer should never be sold roadmap as product.

## Skeptical-buyer FAQ
- **"So is it bug-free?"** No tool makes that honest claim. We prove structural
  consistency and check code against the blueprint; we shrink whole classes of
  defects and make the rest *visible*. Bugs of intent still need human review.
- **"Isn't this just testing with extra steps?"** Tests check examples you thought
  of. The proof-checker checks the *rules themselves* hold for all cases of the
  defined kind, and does it identically every time.
- **"What if the spec is wrong?"** Then the checker faithfully validates the wrong
  thing — which is why the human key exists: a person signs that the blueprint is
  right. We make *that* the explicit, auditable step rather than a hidden assumption.
- **"Why Lean — is this academic?"** Lean is a production proof assistant used in
  industry and mathematics. We use it for the parts where "we tested it" isn't
  enough.
- **"What can't it catch?"** Whether the blueprint matches your true intent;
  anything outside the written agreement. We name these limits rather than paper
  over them.
- **"What am I actually buying?"** A way to make software agreements precise and
  *checkable*, plus reproducible evidence of which guarantees hold — defensible
  diligence instead of "trust us."

---
*Every claim here is traceable to the system's recorded design decisions and the
validator's actual checks; the assurance tiers are exactly what the engineering
evidence supports.*
