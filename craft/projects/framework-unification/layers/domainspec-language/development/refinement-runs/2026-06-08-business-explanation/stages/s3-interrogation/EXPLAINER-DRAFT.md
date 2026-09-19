# How DomainSpec Works — And How It Proves the Software Matches the Agreement

*A plain-language explainer for someone deciding whether to buy.*

---

## 1. The one-sentence pitch

DomainSpec is a precise, machine-checkable way to write down what your software is
supposed to do — paired with a mathematical proof-checker that confirms the agreement
holds together and that the delivered code actually matches it.

---

## 2. The problem: "we wrote a spec and they built it" usually goes wrong

Almost every software project starts the same way. The business writes down what it
wants. Developers go away and build it. Months later, something is delivered.

Then the trouble starts:

- **Ambiguity.** The document was in plain English. You read it one way; the
  developers read it another. Both of you were honestly convinced you agreed. The gap
  only shows up after the money is spent.
- **Drift.** Halfway through the build, a deadline slips, a shortcut gets taken, a
  detail gets "interpreted." The code quietly stops matching the document — and nobody
  can point to exactly where or when.
- **No way to check.** When the build is done, how do you actually *know* the code
  matches what you asked for? Usually you don't. You test a few obvious cases, you
  trust the team, and you hope. "It seemed to work in the demo" is not the same as "it
  does what we agreed."
- **Contradictions hide.** Long requirement documents quietly contradict themselves —
  rule on page 4 versus rule on page 40. Humans miss this. The contradiction surfaces
  later as a "bug" that was really a flaw in the agreement itself.

The business cost is predictable: rework, blown budgets, disputes over "that's not
what we asked for," and — worst of all — no defensible paper trail when something goes
wrong. You can't prove the vendor delivered, and they can't prove you signed off on
the ambiguity. Everyone loses, slowly and expensively.

---

## 3. The language: a blueprint instead of a napkin sketch

DomainSpec replaces the vague English document with something far more disciplined: a
**precise, structured description of what the software must be.**

Think of the difference between a **napkin sketch of a house** and an **architect's
blueprint**. Both describe a house. But you can't build from a napkin sketch — every
measurement is a guess, and two builders will produce two different houses. A blueprint
is precise, internally consistent, and a third party can check it before anyone pours
concrete.

DomainSpec is the blueprint. It captures three separate things, kept deliberately
distinct so they can each be checked:

- **The contract** — *the agreement.* What the software is for, who owns it, what it
  must always guarantee, what it's allowed to do. This is the business intent, written
  down precisely.
- **The schema** — *the structure.* The exact shape of the data and the rules it must
  obey. The hard, checkable skeleton.
- **The iteration record** — *the change log.* Every time the agreement changes, what
  changed, why, and from what to what. A permanent, auditable history of decisions.

The key word is **checkable**. Because it's written in a precise form rather than free
prose, a machine can read it and verify it — not just file it in a drawer and hope
everyone read it the same way. It's the difference between a **legal contract** and a
**handshake**: both are agreements, but only one can be examined, enforced, and held up
in front of a third party.

---

## 4. The Lean validator: a tireless auditor who checks by calculation, not opinion

The second piece is the **Lean validator**.

Lean is a *mathematical proof-checker*. This is not a marketing word — it's the same
family of tool used to verify **microchip designs, aerospace control systems, and
cryptography**, where a single undetected flaw can be catastrophic and "we tested it
and it seemed fine" is not good enough. These tools don't sample a few cases and form
an opinion. They check claims by **calculation**, the way a calculator checks
arithmetic: there's a right answer and a wrong answer, and no room for "it looked okay
to me."

The useful way to picture it: imagine a **tireless, incorruptible auditor.** This
auditor reads every line of the blueprint and every line of the delivered code against
the rules. He never gets tired, never gets political, never waves something through
because it's Friday afternoon or because a senior person vouched for it. He checks
*everything*, *every time*, and he reports exactly what passed and what didn't.

That's what Lean does for your software agreement. It turns "we think it's consistent"
into "we calculated that it's consistent, and here's the receipt."

---

## 5. How they work together: two locks and one human key

The blueprint and the auditor combine into a simple, memorable safety design: **two
locks, plus one human key.**

**Lock 1 — the blueprint is checked before any code is written.**
Before a single line of software is built, the auditor checks the blueprint against
itself. Does it hold together? Are there internal contradictions? Are required pieces
missing? This catches the expensive mistakes *while they're still cheap to fix* —
before the build, not after.

**Lock 2 — the delivered code is checked back against the blueprint.**
When the software is delivered, the auditor checks the code against the blueprint
mechanically. Did what got built actually match what was agreed? Where the code drifted
from the blueprint, that drift is surfaced and named — not buried.

**The human key — a person signs that the blueprint captures the real intent.**
This is the honest and important part. The math can prove the blueprint is *internally
consistent* and that the *code matches the blueprint*. What it **cannot** do is decide
whether the blueprint captured what you actually meant. That judgment stays with a
human, who reviews and signs off that "yes, this blueprint really is the business we
intended." The machine guarantees fidelity to the agreement; the human guarantees the
agreement is the right one.

This is a feature, not a gap. Anyone who tells you a machine can prove your software is
"correct" with no human in the loop is selling you something that can't exist. The
honest design — machine where machines are reliable, human where judgment is required —
is exactly what survives serious due diligence.

---

## 6. How this proves the system works — and what that actually means

Be precise about what you're buying, because the precision *is* the value.

**What the math gives you (proven or mechanically checked):**

- **Contradictions caught early.** The blueprint can't quietly disagree with itself.
  Conflicting rules are surfaced as a flagged issue, before they become a bug.
- **Missing pieces surfaced.** If the agreement refers to something that was never
  defined, the check fails and says so. No silent holes.
- **No circular or broken structure.** The validator confirms the blueprint's
  dependencies actually resolve — nothing points in a loop or off into nowhere.
- **Drift detection.** When delivered code no longer matches the blueprint, the
  mismatch is identified rather than hoped-away.

**What stays human judgment (honestly):**

- **Whether the blueprint captures your true intent.** A person signs that.
- **Final promotion to "official."** A passing check is *necessary* but not by itself
  *sufficient* — an owner still approves before anything becomes canonical.

So the honest claim is **not** "this proves your software is bug-free." It is: *this
proves your software is structurally consistent and faithful to the agreed blueprint,
and it gives you a documented, mechanical record of exactly that.* The remaining risk —
"did we agree to the right thing?" — is isolated to one clearly-marked human decision,
instead of being smeared invisibly across the whole project.

**What the buyer actually walks away with:**

- **Fewer surprises.** The expensive errors are caught at blueprint time, not at
  delivery time.
- **Traceable evidence.** Every check produces a receipt. You can show *what* was
  verified, *when*, and *with what result.*
- **Defensible diligence.** When your technical advisor, auditor, or board asks "how do
  you know it does what you paid for?", you have a mechanical answer, not a hopeful one.

*(One honesty note for diligence: the full two-lock pipeline is a decided, staged
architecture. The first lock — consistency of the blueprint — is demonstrable now; the
second lock becomes load-bearing as the build completes the planned bridge between the
language and the validator. We tell you exactly where on that path the system is, which
is itself the kind of straight talk you want from a vendor.)*

---

## 7. Three analogies for your board

1. **Blueprint vs. napkin sketch.** A plain English spec is a napkin sketch — two
   builders read it two ways. DomainSpec is the architect's blueprint: precise,
   internally consistent, and checkable by a third party *before* concrete is poured.

2. **The tireless auditor.** Lean is an incorruptible auditor who checks every line
   against the rules, never tires, never plays politics, and hands you a receipt. He's
   the same breed of tool that signs off on aerospace and chip designs.

3. **Two locks and a human key.** Lock one: the agreement is proven to hold together
   before building. Lock two: the delivered code is mechanically matched back to the
   agreement. The human key: a person still signs that the agreement is the *right*
   one. Machines guarantee the structure and the fidelity; a human guarantees the
   intent. That honest division is exactly what holds up under scrutiny.
