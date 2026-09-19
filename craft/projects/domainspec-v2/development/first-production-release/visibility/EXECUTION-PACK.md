# Execution pack

Status: completed; receipts available under `runs/`

## Bounded execution command

Each task is one SWU and must be executed and receipted independently. This package
does not authorize work on FPR-01 or any production node.

## SWU contract

For each task:

1. read `work-pack/shared/context.md`, the task file, and its declared inputs;
2. verify predecessor receipts named by the task;
3. mutate only the declared write surface;
4. run the task's positive and negative controls;
5. write `runs/<SWU-ID>/RESULT.md` with artifacts, commands, result, residue, and handoff;
6. stop at the next owner boundary.

## Ordered run

```text
SWU-VIS-001 -> SWU-VIS-002 -> SWU-VIS-003 -> SWU-VIS-004 -> SWU-VIS-005
```

## Final verification commands

```bash
python3 arcanum/formulae/dispatch-spec/scripts/validate-dispatch.py \
  projects/domainspec-v2/development/first-production-release/visibility/DISPATCH.json
python3 -m unittest discover \
  projects/domainspec-v2/development/first-production-release/visibility/tests
python3 projects/domainspec-v2/development/first-production-release/visibility/tools/build-roadmap.py --check
```

Browser validation is performed against the generated `roadmap.html`; its result belongs
in the SWU-VIS-005 receipt. Browser success validates interaction and rendering only.

## Final handoff condition

The feature may be marked verified when every receipt passes and the Craft child context
is synchronized. The parent FPR context must remain blocked at FPR-01. Any attempt to
use this feature as release authorization is a contract violation.
