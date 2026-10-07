# G01 Self-Sorting protocol-conformance repair r53

Status: fixed after r52 transport inspection and before r53 calls  
Scope: private exposed development evidence only

## Inherited experiment

R53 repeats all 71 r52 packets unchanged. It inherits `m=4`, `n=1`, `k=8`,
`lambda=0.5`, presentation rotation, Self-Sorting scoring, quantitative gates,
and claim ceiling from r52. It does not inspect labels or change a ranking.

## Fixed conformance repairs

R52 returned 64 strict responses. Four other calls ended at exactly 256
completion tokens with `finish_reason=length`. Three complete responses encoded
the four valid list IDs as `"List N"` or `"list_N"` rather than bare integers.

R53 therefore changes only:

- maximum completion tokens from 256 to 512;
- the parser prospectively accepts integer `N`, digit string `"N"`,
  `"List N"`, or `"list_N"`, for `N` in 1–4;
- all four IDs must still appear exactly once; no other strings are accepted.

There are no conditional retries: every one of the 71 packets is run once in a
new campaign. Automatic retries remain zero.

## Gate and claim boundary

The complete r52 gate applies unchanged, beginning with 71/71 tokenizer
admissions and valid generations. Passing is exposed development evidence only
and does not support a superiority claim without fresh confirmation.

## Open questions

- Does the repaired transport reach 71/71 validity?
- Does fixed-lambda Self-Sorting beat the already strong r51 RRF treatment?
