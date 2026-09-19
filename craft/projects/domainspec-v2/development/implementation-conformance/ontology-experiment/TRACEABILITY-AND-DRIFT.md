# Remaining Blind Spots

The corrected model now represents architecture properties, but these areas
remain deliberately incomplete.

1. **Eight active meta-types still lack realization types.** Calculation and
   Event already have source classes in the language profiles; Entity, Value
   Object, Enum, Policy, Workflow, and Mapping still need an explicit support
   design. The projection prevents silent omission but does not implement them.
2. **The canonical projection is checked, not generated.** The validator fails
   on registry or maturity drift, but a deterministic projection generator is
   still preferable to maintaining the JSON read model by hand.
3. **Property provenance needs first-class runtime fields.** Findings should
   retain which ontology definition, base profile, child profile, project
   override, adapter, and raw evidence produced each value.
4. **Profile conflict resolution is unspecified.** If two parent profiles set
   incompatible values, the resolver must block rather than let file order
   choose.
5. **Conditional properties are missing.** Real profiles need predicates such
   as “arrow-only when the Rule is a standalone function, but not when an owner
   admits a callable object.”
6. **Relation existence and cardinality are not implemented.** The prototype
   can constrain properties of observed relations, but cannot yet require that
   a relation exists, forbid one, or enforce exact incoming/outgoing counts.
7. **Graph algorithms are not implemented.** Acyclicity, layer direction,
   transitive reachability, strongly connected components, and public-index
   target proof need Architecture-Pattern Enforcement/provider evidence.
8. **Observed versus derived properties need distinct carriers.** Filename
   case is observed; layer direction is derived from a selected layer model;
   semantic binding is owner-resolved. Treating them uniformly would hide
   different proof obligations.
9. **Exceptions are absent.** A real profile needs scoped exemptions with
   owner, rationale, expiry, affected constraint IDs, and non-suppressible
   finding classes.
10. **Language projections are contracts, not adapters.** No TypeScript AST,
   Python AST/import, or Rust module/compiler extractor exists yet.
11. **Unsupported behavior needs an algebra.** Dynamic imports, decorators,
   namespace packages, macros, generated code, and conditional compilation
   must become typed `unsupported`, never missing properties or accidental
   passes.
12. **State Machine properties need multiple evidence planes.** Representation,
    static exhaustiveness, guard binding, transition behavior, effect intent,
    durable state, and effect delivery must remain separate.
13. **Schema evolution is undefined.** Property renames, enum extensions,
    operator changes, profile version compatibility, and observed-fact replay
    need migration rules.
14. **Project-level architecture is not modeled yet.** Packages, layers,
    services, deployment units, bounded contexts, generated projections, and
    cross-package dependency policy need additional concept types.
15. **Performance is unknown.** Incremental extraction, cache invalidation,
    monorepo scale, and changed-file evaluation require measurements.
16. **Explanatory copy has no single data owner.** Plain-language concept and
    property descriptions currently appear across the ontology data, canvas,
    and beginner guide. A future slice should choose a non-normative source for
    this copy and generate the downstream views so wording cannot silently
    drift. This must not move canonical authority into the presentation layer.

## Best Next Slice

Implement only the TypeScript observation adapter for the current example
shape:

```text
real source fixture
  -> TypeScript AST + module resolution
  -> ObservationProjection
  -> existing generic evaluator
  -> expected eight findings
```

That test will show whether the ontology properties are extractable and useful.
Python and Rust adapters should reuse the same observed-fact schema after the
TypeScript slice passes.
