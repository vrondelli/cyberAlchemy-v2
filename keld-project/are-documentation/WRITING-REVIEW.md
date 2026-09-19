# Documentation language review

## Scope and method

This review applies the user's supplied `asd-ste100` guidance and the [ARE writing policy](../../implementation/agent-reasoning-engine/docs/WRITING-STYLE.md).

The review covers the nine guides on this site, their summaries, and three descriptions of reading paths. The existing automated check covers all 42 manual files. This is an STE-inspired review. It does not establish compliance with the official ASD dictionary.

The review uses short sentences, active voice, explicit actors, and one instruction per sentence. It preserves conditions, uncertainty, technical identifiers, and support limits. It retains necessary technical terms and explains selected terms at their first use.

## Changes

The source guides contain 45 revised passages. Changes include:

- An explanation of a Context Envelope in terms of selected information and source records.
- An explanation of an append-only record.
- Separate instructions for request IDs, gateway initialization, lesson changes, and research tests.
- A numbered recovery procedure.
- Clear distinctions between lesson delivery, lesson use, and measured improvement.
- Simpler summaries for all nine guides.

The original and revised guides have identical headings, fenced examples, inline code, and link destinations. These checks preserve section links and executable examples. They do not replace the manual review of technical meaning.

The capability remains a prototype and off by default. Model qualification, privacy limits, host permissions, and historical results retain their original scope.

## Results

[The review record](evidence/writing-review/review.json) contains source hashes and counts.

- The full-manual check passes with zero hard findings across 42 files.
- Advisory findings decreased from 96 to 86. These findings require judgment rather than automatic deletion.
- The summaries pass the same structural check.
- Eight writing-check and API-generator tests pass.
- All 18 reader checks pass at desktop, tablet, and mobile widths.
- The site build and download budgets pass. Documentation requires approximately 100.4 KiB gzip against a 140 KiB target.

The [updated manual review receipt](../../implementation/agent-reasoning-engine/docs/writing-style-review.json) retains dispositions for unchanged documents. Remaining findings in the edited guides include lifecycle states, adjectival forms, and questions with unspecified actors.

## Separate release findings

The broader documentation check reports `generated.api-reference-drift`. The release tests also report source drift in `packages/codex-app-server-wrapper/src/interaction-host.mjs`. This language review did not change those files.

The existing documentation release manifest and receipt describe earlier bytes. This review does not regenerate them or claim release readiness. A release successor must include the revised text and resolve the source drift.

## Open Questions

- Which additional technical terms need plain definitions after a first-time reader review?
- Should the next editorial pass examine the 33 manual files outside the current site in the same detail?
- When should the release owner create the next documentation candidate after resolving the separate drift findings?
