# Arcanum Live Consumer Manifest

Status: read-only classification candidate  
Work item: `ARC-SWU-01`  
Machine source: `ARCANUM-LIVE-CONSUMERS.json`  
Authority effect: none

## Result

The broad 951-file discovery surface has been reduced to 97 exact, tracked,
clean paths outside candidate/snapshot and development trees. Every path is in
exactly one class. None overlaps an active dirty writer at the captured
revision.

Only 23 paths are current source or realization bindings. Two more are active
legacy lifecycle bindings. Most of the remainder are intentional boundaries,
history, compatibility material, generated projections, or evidence—not live
Arcanum execution dependencies.

| Classification | Count | Interpretation |
|---|---:|---|
| Normative boundary or reference | 15 | External owner citation or public/private guard; keep explicit. |
| Historical or provenance | 33 | Retain immutable; never bulk rewrite. |
| Active boundary validator | 2 | Prevents generated/public routing fallback; keep and test. |
| Compatibility or private boundary | 17 | DomainSpec lineage/import/containment surface; migrate separately. |
| Live source or realization binding | 23 | Requires exact owner disposition: keep, wrap, or migrate. |
| Active legacy lifecycle binding | 2 | Essays still consumes generated lifecycle contracts; replace behind a private binding. |
| Separate runtime candidate | 1 | Python ontology runtime belongs to the Rust-replacement route, not this debt migration. |
| Generated projection | 2 | Regenerate from source; never hand-edit. |
| Admission evidence | 2 | Preserve exact evidence; not a live runtime dependency. |

## Highest-priority live couplings

1. **Review capability realization.** `review/scripts/build.ts` resolves and
   reads the public Decision Gate and Complexity Ladder skill bytes. The private
   support and ConstructionBinding records bind their exact digests. This can be
   a legitimate external realization, but its update and drift policy must be
   private and explicit.
2. **Define to Invoke migration.** Current Define sources and realization records
   still depend on public Invoke identity and migration artifacts. That is a
   transition contract, not permanent private Product ownership.
3. **Capability source model.** CyberAlchemy Product Capabilities deliberately
   distinguish themselves from public Agent Capabilities, but validators and
   source registries still consume the public definition and implementations.
   Keep the semantic ownership split.
4. **Essays lifecycle.** Two current implementation-context files bind generated
   Whisper/Task Session skills directly. This is the clearest private-wrapper
   candidate within `cyberAlchemy-v2/**`.

## What is not debt by itself

- citing an Arcanum-owned definition instead of reauthoring it privately;
- preserving old research and review evidence;
- enforcing “never publish private content to `arcanum/`”;
- materializing generated projections from exact public implementation bindings;
- retaining an admission record whose subject was public Arcanum material.

The debt begins where a public generated operation becomes an implicit private
runtime owner, where version drift is not bounded, or where no current-pointer
distinguishes live source from historical candidates.

## Next bounded decisions

- Review owner: keep or wrap the exact Decision Gate and Complexity Ladder
  external realization bindings.
- Define Product/runtime owners: decide the terminal state of Invoke migration.
- Essays runtime owner: replace direct generated-skill consumption with a
  private capability binding.
- Craft Project owner: decide which of the six debt SWUs enters the active
  frontier after the independent Goal review.

## Scope exclusions

This manifest intentionally does not close:

- `.agents/skills` and the active subagent-strategy coordinator coupling;
- the legacy `projects/domainspec-v2` compiler/view path;
- versioned candidate and snapshot current-pointer debt;
- Python-to-Rust ontology enforcement replacement.

Those remain separate work items so an Arcanum cleanup cannot silently rewrite
private construction meaning or immutable history.

## Claim ceiling

This is classification evidence only. It does not approve any disposition,
alter a source registry, replace a runtime, migrate Define or Essays, rewrite
history, admit a binding, publish, release, deploy, or create an external
effect.
