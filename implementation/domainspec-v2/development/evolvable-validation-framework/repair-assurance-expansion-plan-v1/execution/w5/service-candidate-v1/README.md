# Bounded Software Correctness and Repair Assurance

Status: private service candidate. Version: 1. Authority effect: none.

## Service promise

For one explicitly selected software property and one frozen implementation,
CyberAlchemy will:

1. define an executable property and its evidence boundary;
2. search for a counterexample within declared cases, states, tools and bounds;
3. report counterexample, bounded no-counterexample, inconclusive, or conflicting
   evidence without converting one result into a general proof;
4. explain the defect when a counterexample is confirmed;
5. construct an optional, separately identified repair;
6. rerun the frozen checks and selected negative controls; and
7. provide an evidence manifest plus a technically separate replay report.

The deliverable is a **bounded assurance report**. It is not a certificate,
accreditation, legal opinion, regulatory approval, or guarantee of correctness.

## Package

- [Offering and qualification](OFFERING.md)
- [Intake template](INTAKE.md)
- [Execution and independence protocol](EXECUTION-PROTOCOL.md)
- [Report template](REPORT-TEMPLATE.md)
- [Evidence manifest template](EVIDENCE-MANIFEST-TEMPLATE.json)
- [Data and access boundary](DATA-BOUNDARY.md)
- [Pilot acceptance criteria](PILOT-ACCEPTANCE.md)
- [Measured delivery model](UNIT-ECONOMICS.md)
- [Evidence traceability](TRACEABILITY.md)
- [Claim audit](CLAIM-AUDIT.json)
- [Qualification and accreditation roadmap](QUALIFICATION-ROADMAP.md)
- [Product decision brief](DECISION-BRIEF.md)

## Earned basis

The candidate is based on two same-host technical packages: the independently
replayed CRABS L2 campaign and the independently replayed Auth Foundation L3
transfer. The Auth transfer found and repaired a real evidence-pipeline copy
defect. Its six Auth implementation mutants were deliberately seeded controls.

## Open Questions

See [DECISION-BRIEF.md](DECISION-BRIEF.md#open-questions).

