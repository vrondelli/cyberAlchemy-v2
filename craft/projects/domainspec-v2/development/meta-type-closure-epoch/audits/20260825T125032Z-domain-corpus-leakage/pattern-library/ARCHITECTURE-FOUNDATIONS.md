# Architecture Foundations

## Target

A target is a language-native observation/projection of one generic meta-type contract. It may carry language mechanisms and type-only contract shapes. It does not own a business system's named cases, expected outcomes, hostiles, or fixture construction.

## System-owned corpus

A system-owned corpus supplies descriptors, observations, domain vocabulary, expected outcomes, and hostile cases for a concrete system such as Financial Settlement or Shipment Priority. Its proof may be reused as test input, but that does not make it generic DomainSpec implementation.

## Realization composition adapter

The adapter is the explicit join. It receives a system corpus case and combines exactly one generic family evaluator with one language-native target. Moving the join here preserves separate meta-type semantics and keeps system meaning outside generic targets.

## Provider

The provider executes the selected adapter/target path and records evidence. It does not become the author of family semantics or the owner of system corpus meaning.

## Evidence hierarchy

An exact resolved runtime import is stronger boundary evidence than a token. A contextual business identifier or complete behavior is stronger than a generic word. A path name alone is insufficient without owner/content evidence.
