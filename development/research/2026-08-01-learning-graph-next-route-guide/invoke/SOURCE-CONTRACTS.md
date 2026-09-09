# Source Contracts

Every implementation and validation step must bind the current bytes before
using these sources. Digests below were rechecked on 2026-08-01 and match the
accepted research.

| Source | SHA-256 | Required selector | Ceiling |
| --- | --- | --- | --- |
| `../findings.md` | `820c8c0fea02461bd02640f2d7371914af431cd500e8a438af00e83f716323b8` | whole accepted guide | Research blueprint only. |
| `../receipts/learning-graph-synthesis-revised.json` | `97523013f4832ac836ce14ffc124d9a33176e97c8bf1f0043546a7cf3957d200` | candidate nodes 7–10; relation 7; witnesses | Synthesis-local candidate fixtures. |
| `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json` | `4b67ba1d631b11a09ab073a1e8003ccc0367a3c49e625693c54b2a7ddf3bbcd3` | `/concept_types/2`; `/language_projections/0/drift_owner` | Candidate concept and owner-route string. |
| `.../profiles/base-domain.profile.json` | `2e877fa59399f82fd192310689634a07659e65531941efe1db4abb5f6e903873` | `/constraints/0-5` | Candidate expectation. |
| `.../profiles/typescript-strict.profile.json` | `79496329856b53da6f3d5c66521c194ad7fc4251c879b0d91a9aed2d0d94666b` | `/constraints/0-5` | Candidate TypeScript expectation. |
| `.../examples/typescript-observed-facts.json` | `74d637de8b6a8c96246df037b85088cad4b80f22207db74ed9218eea874fcf67` | `/elements/0`, `/elements/2`, `/relations/1`, `/source_digest` | Supplied fixture only. |
| `.../examples/typescript-evaluation.expected.json` | `dd82fc27f21a87f9ef965f245c3149224d3d91823da902047a3d7fa5c74adee3` | `/findings/0-7` and summary fields | Expected fixture evaluation only. |
| `.../validate-ontology.mjs` | `cd88bd45baced31080f22c0498bd5a63688d6e35504e593a70b9db7e6d7588fb` | evaluator schema `domainspec-architecture-evaluation/v1` | Fixture validator; no distinct evaluator version. |
| `.../architecture-ontology-view.html` | `601ab580789b3aa82e97a7b5d2d1b93749fce21b4a5585486f3863bb5ddbead9` | five view buttons, `#ontology-canvas`, `#inspector`, help and guide link | Source/UI structure only; no new browser acceptance. |

The abbreviated `.../` entries expand beneath
`projects/domainspec-v2/development/implementation-conformance/ontology-experiment/`.
No implementation may treat this table as permission to mutate a source owner.
