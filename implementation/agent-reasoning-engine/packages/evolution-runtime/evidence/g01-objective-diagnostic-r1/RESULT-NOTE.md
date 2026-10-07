# G01 objective-anchor exposed Go diagnostic

Status: completed, **diagnostic only**. The new opt-in
`intent-anchor-terminal-shortlist-objective-r1` arm was frozen and run on the
already-exposed GitHub CLI `03b66e26` task, where the previous adaptive arm
had finished after five calls with one unrelated `gpg-key add` range and no
final context. The [definition](DEFINITION.json) fixed this diagnostic scope;
the [freeze](CAMPAIGN-FREEZE.json) and [candidate result](go-cli-exposed-03b66e26/candidate/runs/00/result.json)
preserve the exact source and run receipts.

The new arm excluded issue-template comments and `Fixes #6380` from its
anchors, required a confirmed base read supported by substantive issue text
before allowing early finish, and prioritized that support for automatic
reads. Its live queries included `codespace`; it selected five final files
under `pkg/cmd/codespace/` and `pkg/liveshare/` after 15 model calls. Known
model tokens were 48,366, versus 84,161 for the prior control.

Pinned native scoring of separate copied predictions yielded:

| Exposed task | Span-F1 | File-F1 | Known model tokens | Duration seconds |
| --- | ---: | ---: | ---: | ---: |
| Prior native-convergence control | 0.059276 | 0.400000 | 84,161 | 179.270 |
| New objective-anchor diagnostic | 0.187033 | 0.444444 | 48,366 | 145.866 |

The candidate prediction hash is
`fad7cb7a8984e39822688d2758d8f8f8da3bc14a22da5a32cad7973a7242b49c`;
the control prediction hash is
`ee4ba8c258e25169bd8283559524f3e000ef3c85d716aa88aeb20046858fdb01`.
Both copied predictions and [native scores](native-scoring/) are retained
locally. This post-hoc exposed-task comparison is not a prospective gain,
does not retroactively repair the previous four-task campaign, and cannot
prove an ARE advantage. The next prospective four-language cohort was frozen
separately before its model dispatch.

## Open Questions

- Does the objective-anchor arm preserve this accuracy/cost direction on
  untouched tasks, especially those without issue-template boilerplate?
- Does requiring a substantive read add too many tool or model calls on
  unrelated task shapes?
