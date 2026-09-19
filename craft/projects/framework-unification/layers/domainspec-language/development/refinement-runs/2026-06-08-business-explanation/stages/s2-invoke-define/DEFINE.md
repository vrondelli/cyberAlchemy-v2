# Invoke Define — Buyer-Facing Explanation (s2)

## Audience
A non-technical business person evaluating **buying our system**. They care about:
risk, trust, defensibility, what they're actually getting, and what could go wrong.
Their technical advisor will do **due diligence** — so the story must be both
compelling and honest.

## What must land (in plain language)
1. **The language** = a precise way to write down *what the software is supposed to
   be* (the agreement/blueprint) so a machine can check it — not just a document
   humans hope they read the same way.
2. **The Lean validator** = a mathematical **proof-checker** (the kind used to
   verify aerospace/chip designs) that checks the blueprint and the delivered code
   against it — by calculation, not opinion.
3. **How they work together** = two locks: the blueprint is checked for internal
   consistency *before* code is written, and the delivered code is checked back
   against the blueprint. Plus an honest **third human key**: a person still signs
   off that the blueprint captures the real business intent.
4. **How they prove the system works** = the **assurance ladder** — what is
   mathematically *proven*, what is *machine-checked*, and what stays *human
   judgment*. Honesty here is the selling point: we tell the buyer exactly what the
   guarantee covers and what it doesn't.

## The tension to manage (dialectic)
Compelling vs honest. The prior technical runs were strict:
- the convergence is **designed, not wired** yet (DEC-CONV-01);
- a passing check is **necessary, not sufficient** for "correct" (P8 stays human);
- the math proves **structural fidelity**, not that the blueprint captures intent
  ("Lan-faithful, not full"; the "Intent Wall").
The explainer must turn these caveats into *trust features*, not hide them.

## What we must NOT say
- "Mathematically proves the software is correct/bug-free." (We prove structure +
  consistency, not intent capture.)
- "Fully automated / no humans needed." (Human sign-off is the honest third key.)
- "Done today." (Architecture is decided; build is staged — Loop 1 now, Loop 2 after
  the obligation bridge.)

## Inputs
DEC-CAT-01 (categorical model), DEC-FIT-01 (language-fit), DEC-CONV-01 (compiler-pair
convergence + bootstrap), the validator (P1/P2/P5 real; P3/P4 staged), CRAFT's
honest "no zero residue" stance.

## Format options (route menu, decided at s5)
executive-narrative · assurance-ladder-first · FAQ-led.
