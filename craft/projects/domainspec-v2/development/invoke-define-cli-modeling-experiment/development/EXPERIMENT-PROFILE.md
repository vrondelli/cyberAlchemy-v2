# Experiment Profile

- PROFILE_ID: invoke-define-cli-domainspec-v2-v1
- LIFECYCLE_OWNER: DomainSpec-v2 private development experiment
- ARTIFACT_TYPE: domain-model-experiment
- CONTRACT_PATH: ../README.md
- PROMPT_SET: example-prompts/E001-model-invoke-define-cli.md
- REGIME_SET: regimes/cli-model-v1.json
- PROFILE_VALIDATION: candidate

## Objective

Test the current experimental minted-project profile against the live
tools/arcanum invoke define stage catalog.

## Input Boundary

- tools/arcanum invoke define describe
- arcanum/spells/invoke/define.md
- projects/domainspec-v2/COMPLETE-GUIDE.md
- projects/domainspec-v2/definitions/minted-project/supported-profiles.yml
- projects/domainspec-v2/definitions/meta-types/meta-types.yml
- projects/domainspec-v2/definitions/relationships/relationships.yml
- arcanum/spells/invoke/development/whole-invoke-repair-plan/WORK-PACK.md
- arcanum/spells/invoke/development/whole-invoke-repair-plan/tasks/TASK-WIR-MODES.md
- arcanum/spells/invoke/development/whole-invoke-repair-plan/collaboration/evidence/PROTOTYPE-VALIDATION-REPORT.md

## Quality Bar

- the live CLI returns exactly six active Define stages;
- the positive project compiles twice to byte-identical artifacts;
- the positive build verifies against its exact source;
- the unsupported Workflow fixture fails with KIND_UNSUPPORTED;
- the structurally valid source shortcut is reported as an expressivity gap,
  never as safe lifecycle behavior;
- authority_effect remains none.

## Anti-Patterns

- treating stage output as admission or a stale closure as source eligibility;
- treating structural compilation as semantic or authority proof;
- using unsupported Workflow or State Machine bodies in the experimental
  profile;
- editing generated views or canonical registries;
- reporting this isolated run as aggregate Invoke acceptance.
- reporting this projection as execution of SWU-WIR-006.
