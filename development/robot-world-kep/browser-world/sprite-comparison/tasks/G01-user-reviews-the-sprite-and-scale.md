# G01 — User reviews the sprite and scale

Lane: **product-construction**. Owner: user through the coordinator; do not delegate this decision.
Dependencies: T01. Status in this plan: **not started**.

Read [LUNA-START.md](../LUNA-START.md) first. All paths below are relative to the comparison root, not this tasks directory. Common forbidden scope: parent Babylon app/B1/Unity/user source, public Arcanum, runtime and cloud. Common evidence writes: one new receipt in `runs/<run-id>/receipts/G01-<attempt>.json`; coordinator alone updates the run-wide status.

## Exact inputs

- `checkpoints/G01/<revision>/REVIEW.md`
- `checkpoints/G01/<revision>/manifest.json`

Resolve placeholder receipt paths from actual dependency results. Never guess a selected revision or approved digest.

## Allowed writes

- `checkpoints/G01/<revision>/decision-<id>.json`


Generated package cache/build paths are allowed only when listed. No broad staging or commits.

## Procedure

1. Coordinator presents the running bench, screenshots/video, recommended scale and any failed checks or art limits.

2. Wait for the user's explicit response. Do not dispatch colony construction from silence or a tool's PASS.

3. Bind the actual response and selected scale/art direction to the current manifest digest in a separate decision receipt. If changes are requested, preserve this revision and return to the exact affected task for a new candidate.

4. Proceed to P04/P06 only when the response explicitly permits that continuation; no parent B2/B3 or renderer replacement is inferred.

## Decisive checks

- Decision text actually came from the user.
- Decision references the exact current candidate digest.
- Any revision preserves prior evidence and maintains the input/source boundary.

Use the relevant [validation procedure](../VALIDATION.md) and save actual outputs. Do not mark a check PASS merely because code appears plausible.

## Done and handoff

An explicit sprite/scale decision exists, or the task is waiting for the user.

Return changed-file hashes, checks and exit results, actual evidence paths, limitations and the next ready node: **P04 or P06**. If blocked, name the exact missing input/tool or failing behavior, preserve independent work, and return the bounded receipt. Never run a user checkpoint as an automated success.

Open questions: [register](../OPEN-QUESTIONS.md).
