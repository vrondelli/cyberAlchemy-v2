# F1 hosted last-answer attribution boundary

Status: bounded candidate implementation evidence, 2026-09-28. This does not activate learning or the current desktop task.

## Defect and change

The literal hosted cue “Your last answer was …” previously required a completed same-thread turn, but not an actual agent answer. A host completion with no agent message could therefore become the episode source for a persistent conversation preference.

New outcome events checkpoint `response_present` as a boolean derived from a nonblank, bounded agent message observed on a completed turn. The interaction-state reducer validates and replays that field without retaining answer text. The hosted cue provider now requires `response_present === true` in addition to the existing completed posture and same-thread binding. Historical outcomes lacking this field remain replayable but cannot qualify for this literal cue. General explicitly attributed feedback is unchanged; this guard is specific to a cue that claims to correct the last answer.

## Verification

- Focused hosted-cue and interaction-learning suites: 24/24 passed, including a wrapper-level no-answer feedback submission that remains pending with no lesson.
- Full Codex wrapper package suite: 481 passed, 12 skipped, 0 failed.
- Request Intent runtime suite: 65/65 passed.

## Claim ceiling and open questions

This proves only the opt-in candidate's local attribution guard. It does not authenticate human origin, classify general task versus one-time versus reusable feedback, resolve pending review, or transfer this exact desktop task under ARE control. A completed turn with an oversized or unavailable answer remains ineligible for this literal cue because answer presence cannot be proven within the bounded observation.
