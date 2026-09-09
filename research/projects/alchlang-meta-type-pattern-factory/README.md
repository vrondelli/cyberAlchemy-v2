# AlchLang meta-type and pattern factory research

This tower answers one design question:

> How should AlchLang define a coherent profile and extension process so that
> admitted DomainSpec meta-types, language syntax, target realizations,
> integration bindings, architecture patterns, runtimes, and evidence can grow
> without collapsing into one TypeScript generator?

## Result

The recommended unit is an **AlchLang Construction Profile**: an immutable,
digest-bound composition envelope. It selects existing semantic and technical
profiles; it is not itself a DomainSpec meta-type. A source frontend lowers
authoring syntax into a profile-bound semantic carrier, and a deterministic
projection then creates isolated DomainSpec instantiation and factory proof
inputs.

The design keeps four identities distinct:

1. a **meta-type** defines the criterion for a kind of domain meaning;
2. a **source factory** is authoring syntax that constructs that meaning;
3. a **realization provider** renders and proves one target-language form;
4. an **architecture pattern** composes admitted meta-types with integration
   bindings, generators, conformance, and possibly a separately observed
   runtime.

The machine-readable profile is a research candidate only. This tower does not
admit a meta-type, adopt an AlchLang profile, stabilize a pattern, modify the
compiler, or authorize an effect.

## Reading order

1. [Research tower](TOWER.md)
2. [Architecture distill](distills/ARCHITECTURE-DISTILL.md)
3. [Construction profile](profiles/ALCHLANG-CONSTRUCTION-PROFILE.md)
4. [Meta-type lifecycle](processes/META-TYPE-LIFECYCLE.md)
5. [Pattern lifecycle](processes/ALCHLANG-PATTERN-LIFECYCLE.md)
6. [Arrow source profile](examples/ARROW-SOURCE-PROFILE.md)
7. [Final learning pack](FINAL-LEARNING-PACK.md)

## Status

`research-complete / decision-and-implementation-open`

