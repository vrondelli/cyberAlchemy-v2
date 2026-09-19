# DomainSpec + Lean Validator — In Depth

*A thorough, plain-language explainer for a business buyer and their technical
advisor. Longer than the one-pager on purpose: it explains not just **what** the
system does, but **how** it does it and **exactly how strong** each guarantee is.
Every guarantee below is labelled by tier so your advisor can verify it rather than
take our word.*

---

## The bottom line, first

You are evaluating a system that does something most software vendors cannot offer:
it lets you **write down what your software must be in a form a machine can check**,
and then uses a **mathematical proof-checker** to confirm two things — that the
written agreement holds together, and that the delivered code matches it. Crucially,
we will tell you **precisely where the machine's guarantee ends and human judgment
begins.** That honesty is not a weakness in the pitch; it is the product's
distinguishing feature, and it is what will survive your technical due diligence.

We will not tell you it makes software "bug-free." We will not tell you it removes
humans. We will not tell you the most advanced parts are running today. We will show
you what is real now, what is on the roadmap, and why the boundary is drawn where it
is.

---

## 1. The problem you actually have

Every software project rests on an agreement: *this is what we're building.* In
almost every company, that agreement lives in prose — documents, tickets, slides,
conversations. Prose has two failure modes that quietly cost a fortune:

- **Ambiguity.** The document means one thing to the person who wrote it and another
  to the person who builds it. The gap is invisible until something ships wrong, and
  by then it's expensive.
- **Drift.** Code starts close to the spec and slowly wanders. Six months later, no
  one can say with confidence whether the system still does what the document
  promised. Diligence becomes "trust us."

The root cause is the same in both cases: **a prose document cannot be checked by a
machine.** A human has to read it, interpret it, and hope everyone interpreted it the
same way. DomainSpec removes that hope and replaces it with a check.

---

## 2. The language — turning the agreement into something checkable

**Analogy: a blueprint, not a napkin sketch.** Two builders handed a napkin sketch
of a house will build two different houses. Two builders handed an architect's
blueprint build the same house — and, importantly, a third party can inspect the
blueprint for mistakes *before the concrete is poured.* The DomainSpec language is
that blueprint for software.

Concretely, the language lets you write three separable things (this separation is
deliberate and load-bearing):

- **The contract** — the *meaning* of the agreement: what must always be true, who
  owns what, what the system is obliged to do.
- **The schema** — the *structure*: the pieces, their types, how they reference each
  other, what shape is valid.
- **The iteration record** — the *change history*: what changed, why, and what it
  affected, so the agreement stays traceable as it evolves.

Why three and not one? Because collapsing "what it means" into "what shape it has"
is exactly how specifications become either too vague to check or too rigid to
design with. Keeping them separate is what lets a machine check the structure while
humans still reason about the meaning.

The single most important property: because the language is **precise**, a machine
can read it. That is the whole point — it is not documentation you hope people read
the same way; it is an agreement a proof-checker can examine.

---

## 3. The validator — a tireless, impartial, mathematical auditor

**Analogy: the auditor who never tires and never plays politics.** Imagine an
auditor who checks every line of the blueprint against the rules, gives the same
verdict every single time, never gets tired, and has no stake in the outcome. That
is what the Lean validator is — except it works by **mathematical calculation**, not
review.

A few things your technical advisor will want to know, stated honestly:

- **Lean is a real proof assistant**, the same family of tool used to formally
  verify microchip designs, aerospace control, and cryptography — fields where "we
  tested it a lot" is not good enough.
- **It checks by the Lean kernel, not by assertion.** When the system proves
  something, a small, trusted mathematical engine verifies the proof. It isn't us
  claiming it's true.
- **It deliberately uses no heavy external math library.** The validator is
  self-contained Lean. This is a defensible engineering choice: your advisor can read
  and audit the *entire* thing without pulling in a massive dependency. We mention
  this because a careful buyer should know exactly what they're auditing.

### What the validator actually checks today (in plain terms)

- **It refuses to even hold an ill-formed agreement.** The strongest guarantee is
  structural: the way concepts connect in the blueprint is checked *by construction* —
  an invalid connection literally cannot be written down. (Your advisor will know
  this as a proved theorem, not a test.)
- **It flags dangling references.** If the blueprint points at something that doesn't
  exist, that's caught. (Think: a contract that references "Schedule C" when there is
  no Schedule C.)
- **It flags impossible build orders.** If the plan says A needs B, and B needs A,
  that circular dependency is caught. (Think: a construction plan where the roof must
  be built before the walls and the walls before the roof.)

Those are the checks that run today, deterministically and reproducibly. Your
advisor can run a single command and watch them work.

---

## 4. How the two work together — two locks and one human key

This is the heart of the system, and the honest framing matters.

- **Lock 1 — the blueprint is checked before anyone builds.** The proof-checker
  confirms the agreement holds together: no contradictions, nothing dangling, no
  impossible order. You catch the costly mistakes when they're cheap to fix — before
  a line of code exists.
- **Lock 2 — the delivered code is checked back against the blueprint.** The code is
  mechanically compared to the agreement, so **drift is caught** rather than
  discovered a year later in an incident review.
- **The human key — a person signs that the blueprint is the right one.** The math
  guarantees the structure and the match. It does **not**, and cannot, decide whether
  the blueprint captures what your business actually wanted. A human owner signs off
  on intent. This is permanent and deliberate. Any vendor who tells you the human
  disappears is overselling.

**How the two stay dependent without becoming a circular trap (for your advisor).**
The design connects the two as a *pair of one-way translations*: the agreement
compiles down into what the validator checks, and the validator's verdict compiles
back up into the agreement's lifecycle (a document isn't "validated" until the
checker passes it). Because each translation moves *different information* in *one
direction* — meaning down, verdict up — the system never ends up "validating its own
claims." It is mutually dependent at the system level but has no vicious circle at
the logical level. The first version comes up cleanly because the validator's basic
vocabulary is seeded independently, before any specific agreement is judged.

---

## 5. How it *proves* the system works — the assurance ladder

This is the section your technical advisor will scrutinize, and it is the one we are
proudest of, because **we tell you exactly how strong each claim is.** Three tiers:

### Tier 1 — Proven (mathematics)
A theorem, machine-verified, that no input can violate.
- The blueprint's structural well-formedness: the connections between concepts are
  valid *by construction* — an ill-typed structure cannot be expressed at all.
- **Scope, stated honestly:** this proves the blueprint is internally
  type-consistent. It does **not** prove the blueprint is complete, correct, or what
  you wanted. It is real, and it is narrow. One genuine theorem is more than most
  commercial software can claim.

### Tier 2 — Machine-checked (deterministic, reproducible)
Checks that run every time, identically, over the whole agreement — reliable, but
checks rather than grand proofs.
- **No dangling references** (schema closure).
- **No impossible build cycles** (acyclicity). Said precisely for your advisor: this
  is a thorough deterministic check over the build-dependency graph, not a universal
  mathematical proof about all possible graphs.
- A pass here is **necessary, not sufficient** — green means "consistent and
  structurally sound," not "correct."

### Tier 3 — Human-judged (by design, permanently)
Decisions a machine should never make.
- **Does the blueprint capture your intent?** This is the "intent wall." No theorem
  reaches above it.
- **Final sign-off to promote or ship** — a human owner's call. The machine can
  *block*; it cannot *authorize.*

The ladder is the honest answer to "how do I know it works": you know *which* things
are proven, *which* are reliably checked, and *which* remain your team's judgment —
and you can verify each tier independently.

---

## 6. What this removes for you — the business value

- **Ambiguity → precision.** The agreement is checkable, not interpretable.
- **Silent drift → caught drift.** Code is compared back to the agreement.
- **"Trust us" diligence → reproducible evidence.** Your advisor can run the checks
  and see the tiers, rather than relying on assurances.
- **A class of defects eliminated by calculation** — structural and consistency
  errors — leaving human review to focus on what actually needs judgment.

The moat, honestly stated: a disciplined competitor could approximate the
deterministic checks with enough tooling. What is harder to copy is the
**by-construction guarantee** (you cannot even express an invalid agreement) and the
**governed assurance ladder** that tells you exactly which tier each claim sits on.
That moat widens as the roadmap items below land.

---

## 7. Built today vs roadmap (so diligence finds no surprises)

We draw this line ourselves, on purpose.

**Working and demonstrable today:**
- The precise language for writing the agreement.
- The proven well-formedness theorem (Tier 1).
- The "no dangling references" and "no impossible cycles" checks (Tier 2),
  reproducible via a single standing command.
- The tool that turns a written spec into the checkable form.
- A reference example and an adversarial test harness that demonstrates the checker
  *rejects* bad inputs.
- The first end-to-end loop on structural well-formedness.

**Designed and decided, but not yet wired (sell as roadmap, not product):**
- The deeper, rule-by-rule **business-obligation checks** (these currently pass as
  placeholders — they do not yet enforce your specific business rules).
- The automatic **code → blueprint translator** that fully powers Lock 2 — this is
  net-new engineering; today only its design exists.
- The full **two-way coupling** where the language and the validator continuously
  reinforce each other at runtime. The architecture is decided and we have
  stress-tested it for safety, but it is **not running today.**
- The bridge that makes the business-rule checks real (giving each obligation a
  machine-addressable identity) — this is the single highest-leverage next step.

**Honest status of the work itself:** the convergence architecture passed its design
review; it is decided, not shipped. We will not let you mistake a decided
architecture for a deployed runtime.

---

## 8. Skeptical-buyer FAQ

**"So is it bug-free?"** No, and no honest tool claims that. It proves your blueprint
is internally consistent, and it checks that delivered code's structure matches the
blueprint with no dangling references or impossible build orders. Bugs inside a
correctly-shaped component, or a blueprint that faithfully encodes the *wrong*
requirement, are not caught here. You get a whole class of structural and consistency
defects eliminated by calculation — plus an honest, named boundary around everything
else.

**"Isn't this just testing with more steps?"** No. Tests check the examples you
thought to write. The core theorem holds for *every* possible input because invalid
structure cannot be constructed; the other checks run over the *whole* agreement, not
sampled cases, with zero flakiness and full reproducibility. Where something is "just
a check" rather than a proof, we say so — we don't dress a check up as a theorem.

**"What if the spec is wrong?"** Then the system faithfully checks your code against a
wrong blueprint, and it can all pass. This is the most important honesty point, and
it's exactly why there is a mandatory human sign-off: the machine never judges whether
the blueprint matches your intent. A green light means "consistent and structurally
faithful," not "this is what you wanted." The human key is a feature, not a gap.

**"What's actually built versus roadmap?"** See section 7 — we draw the line
explicitly. Built: the language, the proven theorem, the consistency and dependency
checks, the tooling, the test harness, the first structural loop. Roadmap: the
business-rule checks, the code→blueprint translator, and the full two-way coupling.

**"Why Lean — is this real or academic?"** Lean is a production proof assistant used
in industry and mathematics; the core theorem is verified by its kernel, not asserted.
The honestly *academic* risk lives only in the most advanced, unbuilt layer (a deeper
fidelity theorem that remains an open research question) — so we do not claim it.
What ships is engineering.

**"What can't it catch?"** Whether the blueprint matches your true intent; business
obligations (the rule-by-rule checks are placeholders today); semantic bugs inside a
structurally-correct component; and, until the code→blueprint translator is built,
whether delivered code is a faithful translation at all. We name these limits rather
than paper over them.

**"You said the two systems 'depend on each other' — is that running today?"** No. The
mutual dependency is designed and we have stress-tested that it is safe (no
chicken-and-egg deadlock). But there is no runtime co-dependency yet. The structural
loop can demonstrate the pattern now; the load-bearing business-rule loop waits on the
bridge in section 7.

**"What am I actually buying?"** A way to make software agreements precise and
*checkable*, a real mathematical guarantee at the structural core, reproducible
evidence of which guarantees hold — and a vendor who hands you the assurance ladder
and says "here is exactly what we prove, what we check, and what we leave to your
people." That is defensible diligence instead of "trust us."

---

## 9. Why honesty is the strategy

A vendor who claims "we mathematically prove your software is correct" will fail the
first serious technical due-diligence session, and the deal — or the post-acquisition
trust — fails with it. A vendor who hands you a labelled assurance ladder, runs the
real checks in the room, and tells you plainly what is human judgment is the one a
sophisticated buyer trusts. The system was built with that boundary drawn on purpose.
The honesty is the moat.

---

*Provenance: every claim here traces to the system's recorded design decisions
(the categorical-model, language-fit, and convergence decisions) and to the
validator's actual checks. The assurance tiers reflect exactly what the current
engineering evidence supports — no more.*
