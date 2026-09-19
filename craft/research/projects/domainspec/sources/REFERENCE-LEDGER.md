# DomainSpec Reference Ledger

Purpose: track where paper references and other authoritative resources are operationalized in research artifacts.

## Coverage Snapshot

| Scope | Total | Operationalized | Waived | Pending Normalization |
|---|---:|---:|---:|---:|
| Paper bibliography references (`papers/domainspec-paper.md`) | 32 | 26 | 6 | 0 |
| Paper bibliography unique citations (deduping [1]/[14]) | 31 | 25 | 6 | 0 |
| Method references used by execution profile (Wohlin/GQM/Runeson/Kitchenham) | 4 | 4 | 0 | 0 |
| E11 specialized sources (pin + inventory linkage) | 25 | 24 | 1 | 0 |

Source-catalog extension used by this ledger:

- `sources/AUTHORITY-SOURCES-2026-04-26.md`
- `sources/REFERENCE-WAIVERS.md`

## Paper Bibliography Backfill (Refs [1]-[32])

| Ref # | Reference ID | Citation (Short) | Claim Links | Authority Level | Source ID | Version Pin | Status | Experiment Usage |
|---:|---|---|---|---|---|---|---|---|
| [1] | REF-JIMENEZ-SWEBENCH-2023 | Jimenez et al., SWE-bench (2023) | C1,C2 | supporting | PAPER-SWEBENCH-2023 | arXiv:2310.06770 | operationalized | E1,E2,E10 |
| [2] | REF-COGNITION-DEVIN-2024 | Cognition, Devin announcement (2024) | C1 | fallback | ANNOUNCE-DEVIN-2024 | snapshot:2024-cognition-devin | waived | C1 context only |
| [3] | REF-GITHUB-COPILOT-WORKSPACE-2024 | GitHub Copilot Workspace preview (2024) | C1 | fallback | ANNOUNCE-COPILOT-WORKSPACE-2024 | snapshot:2024-github-copilot-workspace | waived | C1 context only |
| [4] | REF-HOFSTADTER-GEB-1979 | Hofstadter, Godel Escher Bach (1979) | C4 | supporting | BOOK-HOFSTADTER-GEB-1979 | book:basic-books-1979 | waived | E8 rationale |
| [5] | REF-SHANNON-1948 | Shannon communication theory (1948) | C3 | primary | PAPER-SHANNON-1948 | bell-system-27-3-379-423 | operationalized | E4,E7 |
| [6] | REF-ASHBY-1956 | Ashby cybernetics (1956) | C3 | primary | BOOK-ASHBY-CYBERNETICS-1956 | book:chapman-hall-1956 | operationalized | E4,E5 |
| [7] | REF-EVANS-DDD-2003 | Evans, Domain-Driven Design (2003) | C2 | primary | BOOK-Evans-BlueBook | book:addison-wesley-2003 | operationalized | E1,E2,E6,E9 |
| [8] | REF-UTTING-LEGEARD-MBT-2007 | Utting and Legeard MBT (2007) | C2 | supporting | BOOK-UTTING-LEGEARD-MBT-2007 | book:morgan-kaufmann-2007 | operationalized | E2,E3 |
| [9] | REF-NORTH-BDD-2006 | North, Introducing BDD (2006) | C2 | supporting | PAPER-NORTH-BDD-2006 | article:better-software-2006 | operationalized | E2 |
| [10] | REF-LAMPORT-TLAPLUS-2002 | Lamport, Specifying Systems (2002) | C2 | supporting | BOOK-LAMPORT-TLA-2002 | book:addison-wesley-2002 | operationalized | E2,E3 |
| [11] | REF-JACKSON-ALLOY-2012 | Jackson, Software Abstractions (2012) | C2 | supporting | BOOK-JACKSON-ALLOY-2012 | book:mit-press-2012 | operationalized | E2,E3 |
| [12] | REF-SPIVEY-Z-1992 | Spivey, The Z Notation (1992) | C2 | supporting | BOOK-SPIVEY-Z-1992 | book:prentice-hall-1992 | operationalized | E2 |
| [13] | REF-CUNHA-ALLOY-LLM-2025 | Cunha et al., Alloy plus LLMs (2025) | C2 | supporting | PAPER-CUNHA-ALLOY-LLM-2025 | arXiv:2501.xxxxx | operationalized | E2,E3 |
| [14] | REF-JIMENEZ-SWEBENCH-2023 | Jimenez et al., SWE-bench duplicate citation (2023) | C1,C2 | fallback | PAPER-SWEBENCH-2023 | arXiv:2310.06770 | waived | duplicate of [1] |
| [15] | REF-YANG-SWEAGENT-2024 | Yang et al., SWE-agent (2024) | C1 | supporting | PAPER-SWE-AGENT-2024 | arXiv:2405.15793 | operationalized | E10 |
| [16] | REF-MICULICICH-VERIGUARD-2025 | Miculicich et al., VeriGuard (2025) | C2 | supporting | PAPER-VERIGUARD-2025 | arXiv:2502.xxxxx | operationalized | E3 |
| [17] | REF-SHAZEER-MOE-2017 | Shazeer et al., Mixture-of-Experts (2017) | C3 | supporting | PAPER-SHAZEER-MOE-2017 | arXiv:1701.06538 | operationalized | E4 |
| [18] | REF-BAI-CONSTITUTIONAL-AI-2022 | Bai et al., Constitutional AI (2022) | C3 | supporting | PAPER-BAI-CONSTITUTIONAL-AI-2022 | arXiv:2212.08073 | operationalized | E5,E7 |
| [19] | REF-WEST-ADLC-MANIFESTO-2025 | West, Agentic Manifesto (2025) | C3,C4 | fallback | MANIFESTO-AGENTIC-2025 | edition:2025-agentic-manifesto | waived | conceptual framing |
| [20] | REF-OMG-MOF-2019 | OMG MOF core specification (2019) | C1 | supporting | SPEC-OMG-MOF-2.5.1-2019 | spec:MOF-2.5.1 | operationalized | C1 architecture comparison |
| [21] | REF-ISO-42010-2011 | ISO/IEC/IEEE 42010 (2011) | C1 | supporting | SPEC-ISO-42010-2011 | spec:ISO-IEC-IEEE-42010-2011 | operationalized | C1 architecture comparison |
| [22] | REF-ZACHMAN-1987 | Zachman framework (1987) | C1 | supporting | PAPER-ZACHMAN-1987 | ibm-systems-journal-26-3 | operationalized | C1 architecture comparison |
| [23] | REF-BOSCARO-DOMAIN-CODE-MAPPING-2026 | Boscaro Domain-Code-Mapping (2026) | C1,C4 | fallback | REPO-DOMAIN-CODE-MAPPING-2026 | repo:github-2026-snapshot | waived | predecessor context |
| [24] | REF-TALEB-ANTIFRAGILE-2012 | Taleb, Antifragile (2012) | C3,C4 | supporting | BOOK-TALEB-ANTIFRAGILE-2012 | book:random-house-2012 | operationalized | E5,E8 |
| [25] | REF-MURDOCK-SERIAL-POSITION-1962 | Murdock serial position effect (1962) | C3 | supporting | PAPER-MURDOCK-1962 | jep-64-5-482-488 | operationalized | E4,E5 |
| [26] | REF-CONANT-ASHBY-1970 | Conant and Ashby good regulator theorem (1970) | C3 | primary | PAPER-CONANT-ASHBY-1970 | ijss-1-2-89-97 | operationalized | E5 |
| [27] | REF-MILLER-1956 | Miller magical number seven (1956) | C3 | supporting | PAPER-MILLER-1956 | psych-review-63-2-81-97 | operationalized | E4 |
| [28] | REF-BEER-BRAIN-OF-THE-FIRM-1972 | Beer viable system model (1972) | C3,C4 | supporting | BOOK-BEER-BRAIN-1972 | book:allen-lane-1972 | operationalized | E7,E8 |
| [29] | REF-MEADOWS-LEVERAGE-POINTS-1999 | Meadows leverage points (1999) | C4 | supporting | PAPER-MEADOWS-1999 | sustainability-institute-1999 | operationalized | E8 |
| [30] | REF-KAHNEMAN-2011 | Kahneman, Thinking Fast and Slow (2011) | C3 | supporting | BOOK-KAHNEMAN-2011 | book:fsg-2011 | operationalized | E4 |
| [31] | REF-GUARINO-FOIS-1998 | Guarino formal ontology in information systems (1998) | C2 | supporting | PAPER-GUARINO-FOIS98 | fois98-ios-press-1998 | operationalized | E6,E9 |
| [32] | REF-KRUCHTEN-4PLUS1-1995 | Kruchten 4+1 view model (1995) | C1 | supporting | PAPER-KRUCHTEN-4PLUS1-1995 | ieee-software-12-6 | operationalized | C1 architecture comparison |

## Methodology Authorities (Non-Bibliography)

| Reference ID | Citation (Short) | Authority Level | Usage Scope | Source ID | Pin | Status |
|---|---|---|---|---|---|---|
| REF-WOHLIN-2012 | Wohlin et al. Experimentation in Software Engineering | primary | methodology | PAPER-WOHLIN-2012 | book:springer-2012 | operationalized |
| REF-BASILI-1996 | Basili GQM | primary | methodology | PAPER-BASILI-GQM-1996 | paper:gqm-1996-basili | operationalized |
| REF-RUNESON-2009 | Runeson and Host case-study triangulation | supporting | analysis | PAPER-RUNESON-HOST-2009 | book:guidelines-case-study-2009 | operationalized |
| REF-KITCHENHAM-2002 | Kitchenham empirical SE guidelines | supporting | analysis | PAPER-KITCHENHAM-2002 | paper:kitchenham-2002-guidelines | operationalized |

## Practical Mapping Examples

| Reference | Role In Paper/Research | Where It Exists Today | Resource Status | Next Action |
|---|---|---|---|---|
| Paper [7] Evans DDD | Background for domain-driven modeling foundations. | `sources/SOURCE-CATALOG.md` (`BOOK-Evans-BlueBook`), `inventory/cargo-shipping.md`, E6/E9 protocols | operationalized | Keep book metadata fresh in catalog/inventory. |
| Paper [5] Shannon | Core theoretical basis for attenuation model (C3). | `sources/AUTHORITY-SOURCES-2026-04-26.md` (`PAPER-SHANNON-1948`), E4/E7 protocols | operationalized | Use as primary authority for attenuation-model adjudication. |
| Paper [26] Conant-Ashby theorem | Justifies observer-executor separation intervention. | `sources/AUTHORITY-SOURCES-2026-04-26.md` (`PAPER-CONANT-ASHBY-1970`), E5 protocol rationale | operationalized | Keep as required authority in E5 context bundle. |
| Method refs (Wohlin/Basili/Runeson/Kitchenham) | Execution methodology for analysis pipeline and validity assessment. | `definitions/METHODOLOGY-PROFILE.md`, `sources/AUTHORITY-SOURCES-2026-04-26.md` | operationalized | Ensure all active protocols cite required method source IDs. |
| E11 source set (25 sources) | Operational resource base for specialization experiment. | `experiments/E11-technique-specialization/sources.md`, `inventory/e11-technique-specialization-sources.md`, `sources/AUTHORITY-SOURCES-2026-04-26.md` | operationalized (1 waiver) | Resolve remaining unresolved archive pin waiver. |

## Ledger Fields For Future Entries

When a reference becomes operational, record:

- `reference_id`: stable ID (for example `REF-SHANNON-1948`)
- `citation_scope`: paper-only | protocol-critical | analysis-critical
- `claim_links`: affected claims (`C1`..`C4`)
- `source_id`: source catalog ID when cataloged
- `version_pin`: DOI/ISBN/commit/hash/archive pin
- `inventory_entry`: inventory file and entry ID
- `experiment_usage`: experiment IDs that consume this reference

## Promotion Rule

Promote a reference from paper-only to operationalized when either condition is true:

1. The reference is used as decision authority for protocol design, success criteria, or claim adjudication.
2. The reference is required to resolve experiment conflicts or threat-of-validity decisions.

Waiver rule:

- Use `waived` only when the source is materially useful but immutable pin quality is temporarily insufficient; every waiver must appear in `sources/REFERENCE-WAIVERS.md`.
