# Proposed definitions

These are research definitions and do not modify canonical registries.

## AlchLang Construction Profile

An immutable, content-addressed composition manifest that selects the exact
language epoch, source frontend, carrier, DomainSpec meta-type baseline,
relationship vocabulary, realization targets, integration bindings, pattern
catalog, runtime policy, and evidence policy under which an AlchLang source may
be decoded and compiled.

The profile answers **which compatible world is being constructed**. It does
not define a new kind of domain concept and therefore is not a meta-type.

## AlchLang Meta-type Projection

A declared mapping from one AlchLang semantic constructor to one admitted
DomainSpec meta-type identifier, its body schema, allowed relationship
signatures, and applicable target realizations. The projection must preserve
the exact meta-type ID in the carrier and all downstream receipts.

## AlchLang Pattern Definition

A candidate architecture-pattern intent that names:

- host meta-types and required typed edges;
- integration binding contracts;
- generation providers and output roles;
- conformance and hostile evidence;
- runtime requirements and observations, if the pattern claims runtime use;
- lifecycle status and owner decision reference.

## Stable pattern

A pattern whose immutable definition digest has an explicit owner stability
decision and whose selected construction profile resolves every required
dependency. Stability does not authorize external execution.

