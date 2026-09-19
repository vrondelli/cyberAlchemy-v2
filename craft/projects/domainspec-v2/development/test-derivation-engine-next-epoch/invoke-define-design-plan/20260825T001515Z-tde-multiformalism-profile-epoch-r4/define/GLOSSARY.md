# Glossary

| Term | Meaning in this candidate | Owner |
| --- | --- | --- |
| FormalClaim | The canonical exact formal statement plus its logic-semantics profile. | formal-claims semantics |
| source authority count | The number of canonical propositions represented by one intake; required to equal one. | formal-claims semantics |
| capability assessment | Immutable downstream classification of what can evaluate a claim and why. | validation governance |
| executable profile | A downstream capability target; never part of authored FormalClaim meaning. | validation governance |
| executable projection | A preservation-evidenced, bounded or exact form that an admitted evaluator may consume. | validation governance |
| neutral TDE IR | Language-independent obligation, case, provenance, and ceiling representation. | TDE |
| implementation profile | Versioned descriptor connecting neutral cases to one language renderer and runtime/provider boundary. | profile owner |
| renderer adapter | Pure translation from neutral TDE IR to language-native test source. | language profile owner |
| runtime binding | Exact toolchain, runner, target, and provider identity required to execute rendered tests. | provider owner |
| profile registry | Explicit, versioned, digest-bound, non-ambient map of admitted TDE profiles. | validation governance |
| semantic parity | Equality of obligation, case, outcome class, evidence class, and ceiling under exact profiles; not identical source text. | parity validator owner |
| typed residue | A non-pass reason that preserves why derivation or execution could not proceed. | producing boundary owner |
| theorem-provider lane | EVF-routed Lean/DTT proof execution path, separate from code-emission profiles. | EVF plus theorem-provider owner |
| currentness | Evidence that every exact source, profile, provider, and runtime identity still matches its admitted digest. | validation governance |
| needs_formal | A preserved surface whose typed reason distinguishes missing formal text, unsupported execution, oracle dependence, unsupported theory/language, and indeterminate classification. | TDE presentation; reason ownership upstream |
