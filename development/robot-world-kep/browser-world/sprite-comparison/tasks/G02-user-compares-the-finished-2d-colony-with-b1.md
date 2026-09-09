# G02 — User compares the finished 2D colony with B1

Lane: **product-construction**. Owner: user through the coordinator; do not delegate this decision.
Dependencies: T02. Status in this plan: **not started**.

Read [LUNA-START.md](../LUNA-START.md) first. All paths below are relative to the comparison root, not this tasks directory. Common forbidden scope: parent Babylon app/B1/Unity/user source, public Arcanum, runtime and cloud. Common evidence writes: one new receipt in `runs/<run-id>/receipts/G02-<attempt>.json`; coordinator alone updates the run-wide status.

## Exact inputs

- `checkpoints/G02/<revision>/REVIEW.md`
- `checkpoints/G02/<revision>/manifest.json`
- `../checkpoints/B1/v1/REVIEW.md`

Resolve placeholder receipt paths from actual dependency results. Never guess a selected revision or approved digest.

## Allowed writes

- `checkpoints/G02/<revision>/decision-<id>.json`


Generated package cache/build paths are allowed only when listed. No broad staging or commits.

## Procedure

1. Present the running 2D colony, full screenshot/video, old B1 comparison and actual limitations. Explain whether the scene is within the chosen scale and performance targets.

2. Wait for the user's explicit preference or revision request and bind that response to the current manifest digest.

3. If revisions are requested, identify affected P02/P04/P05/P06 ownership and prepare a new G02 revision with current checks. Do not edit prior frozen candidate bytes.

4. If the direction is selected, report this comparison complete and identify the parent B2 UI work as a separately selected continuation. Do not replace/delete the Babylon renderer or start live integrations implicitly.

## Decisive checks

- Actual user response and candidate identity are recorded separately.
- Decision scope is visual comparison only.
- No successor, public hosting, cloud or publication effect is inferred.

Use the relevant [validation procedure](../VALIDATION.md) and save actual outputs. Do not mark a check PASS merely because code appears plausible.

## Done and handoff

User has reviewed the exact 2D visual candidate, or the task remains at the requested checkpoint.

Return changed-file hashes, checks and exit results, actual evidence paths, limitations and the next ready node; this checkpoint has no automatic successor. If blocked, name the exact missing input/tool or failing behavior, preserve independent work, and return the bounded receipt. Never run a user checkpoint as an automated success.

Open questions: [register](../OPEN-QUESTIONS.md).
