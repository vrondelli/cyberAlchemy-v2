# Invoke Template Selection

## Decision

Select the Invoke DomainSpec template family for Define and its architecture
bundle for Design.

| Candidate | Eligibility | Decision |
| --- | --- | --- |
| `domainspec-spec/SPEC.md` | Ordinary feature/package with operations, rules, interfaces, mappings, and state obligations | selected |
| `domainspec-spec/architecture-bundle.md` | Approved Define output requires six design views and planned witnesses | selected |
| generic template | Would lose typed concept and edge discipline | rejected |
| architecture candidate family | Useful as a companion, but the DomainSpec architecture bundle already owns the required six views | not selected |
| sigil/spell templates | Target is neither a sigil nor a spell | ineligible |

No tie exists and no candidate-template creation is required. The accepted
research is the discovery artifact, so no discovery waiver is used.

