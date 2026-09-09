# Essays Product Thesis

Status: candidate
Product ID: `CA2-PRODUCT-ESSAYS`
Project ID: `CA2-PROJECT-ESSAYS`
Goal ID: `CA2-GOAL-ESSAYS-FIRST-RUNTIME`
Visibility: private
Meaning owner: Essays Project owner plus CyberAlchemy v2 product owner
Authority effect: none

## Product identity

Essays is a proposed CyberAlchemy v2 subproduct for developing long-form text.
It applies CyberAlchemy's human-agency, evidence-continuity, honest-
incompleteness, bounded-authority, and project-owned-meaning commitments to the
writing process.

## Thesis

Writers should be able to move from intent to a reviewable and exportable essay
inside one focused environment that preserves why the text exists, how its
structure developed, which feedback changed it, what evidence supports it, and
what remains unresolved—without exposing authoring machinery in the audience
text or surrendering editorial judgment to the tool.

In simpler language:

> Essays helps a writer develop and improve a substantial piece of writing
> without losing the intent, decisions, feedback, and open questions behind it.

This is a candidate proposition. It is not evidence that the product works, a
selected upstream editor, an implemented runtime, or a release claim.

## Problem

Writing work is commonly fragmented across notes, chat, prompts, drafts,
comments, source links, revision instructions, and publication tools. Most
editors preserve the current text while losing the reasoning and evidence that
produced it. Agent-assisted writing adds another risk: plausible generated text
can silently replace author intent, editorial judgment, or unresolved doubt.

The resulting burden is not only file management. A writer cannot reliably
recover which intent shaped a passage, which feedback remains open, which
claims need evidence, which revision was accepted, or whether a polished draft
has outrun its proof.

## First user journey

```text
create Essay Workspace
  -> state intent, audience, and intended transport
  -> develop a text-intent substrate
  -> construct and inspect a composition plan
  -> draft in a focused editor
  -> attach addressable review feedback
  -> revise with explicit acceptance or rejection
  -> validate the draft and preserve residue
  -> export audience-facing text without authoring-only state
```

The first vertical is local and single-writer. Collaboration, publication,
accounts, billing, hosted synchronization, and production deployment are not
part of its product proof.

## Product principles

1. **Author intent remains attributable.** Generated or transformed text never
   becomes evidence of the author's intent merely because it appears in a draft.
2. **One focused writing surface.** The interface serves the active writing
   moment and reveals lifecycle detail only when it helps the writer decide.
3. **Addressable review.** Feedback binds to stable text or artifact locations
   and records whether it is open, accepted, rejected, or superseded.
4. **Visible residue.** Missing evidence, unresolved objections, deferred
   revisions, and transport gaps remain named rather than being polished away.
5. **Audience and authoring surfaces remain separate.** Internal instructions,
   validation metadata, and workflow state never leak into exported prose.
6. **Replaceable realization.** Whisper, editor frameworks, storage adapters,
   and model providers serve the Essays contracts; none owns the product meaning.

## Value mechanism

```text
author intent and sources
  -> explicit writing artifacts and lifecycle state
  -> focused drafting and addressable review
  -> attributable revision decisions
  -> bounded validation and visible residue
  -> clean audience-facing export
```

The product creates value when this continuity reduces reconstruction and
coordination burden while improving the writer's control over the finished
text. A large feature set, large graph, or large volume of generated prose is
not product evidence.

## Boundaries

Essays does not:

- decide what the writer means;
- treat model output, lint, or validation as editorial authority;
- promote definitions or ontology claims;
- require one permanent editor framework, storage engine, or model provider;
- infer publication or product value from a completed draft;
- copy upstream software without source, license, notice, and modification evidence; or
- authorize publication, release, deployment, or external effects.

## Hypotheses and evidence

The thesis assumes that writers benefit from keeping intent, artifact state,
review, revision decisions, evidence, and residue connected to the text. It also
assumes that a clean interface can expose this structure without turning the
writing experience into a governance dashboard.

These hypotheses require direct product evidence. Structural ontology and
runtime tests can support continuity and correctness claims; they cannot prove
that writers produce better work or prefer the experience.

## Claim ceiling

This document establishes one candidate product proposition and first-user
journey. It does not establish product value, upstream selection, DomainSpec
construction, runtime completion, frontend quality, publication, release,
deployment, or production readiness.
