# Writing style

ARE documentation uses controlled English to reduce ambiguity for people,
agents, and tools. The rules apply STE-flavored structure to explanatory prose.
They apply stricter sentence limits to instructions.

This policy takes inspiration from ASD-STE100 structure and vocabulary guidance.
It does not include the official ASD-STE100 dictionary. It does not claim
official or certified ASD-STE100 compliance.

## Required structure

- Use active voice unless the actor is unknown or does not affect the meaning.
- Put one instruction in each sentence.
- Limit instructions to 20 words and descriptions to 25 words.
- Do not use semicolons.
- Use one topic and at most six sentences in each paragraph.
- Use a list for three or more steps or conditions.
- Preserve every condition, qualifier, number, and statement of uncertainty.

## Vocabulary

- Use one term for one concept within a document.
- Prefer a direct verb to a noun phrase that hides the action.
- Replace a phrasal verb with one plain verb when the meaning stays the same.
- Remove unsupported quality words such as `robust` or replace them with evidence.
- Define a necessary domain term at its first useful entry point.

The repository does not contain the official ASD-STE100 dictionary. Therefore,
the vocabulary rules guide manual review but do not prove dictionary compliance.

## Automated check

Run this command from the ARE implementation directory:

```sh
node docs/lint-writing-style.mjs --check-review
```

The check selects the manual from `docs/manifest.json` and adds
`DOCUMENTATION.md`. It excludes the root `README.md` and `RELEASE.md` because
their bytes belong to immutable Candidate 018. It ignores code blocks, inline
code, tables, and link targets.
Hard findings fail the command. Passive voice and compound tense findings require
review because each form can preserve necessary meaning. The checked review
receipt binds their disposition to the current manual bytes.

## Review boundary

The check cannot decide whether two domain terms refer to the same concept. It
also cannot decide whether a hedge, passive form, or compound tense is necessary.
A reviewer must preserve technical meaning and authority boundaries when changing
these forms.

Generated references must change through their generators. Historical evidence,
receipts, quoted text, and immutable candidate records retain their original
wording unless their owning process creates a successor.

## Open Questions

- Should source-code error and status text use a separate strict-text manifest?
- Which domain-term pairs need explicit synonym checks in each manual section?
