# Task Session Report — SWU-SFOL-003

`SWU-SFOL-003` passes. The decoder accepts only structured v1 node logic and
returns either one deeply frozen normalized module or typed residue with a
stable node-local path.

Evidence:

- all 16 term tags and five declaration tags decode;
- declaration/clause/key order normalizes deterministically;
- prose, unknown schema/language/tags/fields, duplicate IDs, source/path drift,
  malformed exact values, and missing fields fail closed;
- no failure returns a partial module;
- focused 6/6, combined language 11/11, full engine 169/169, strict compile,
  no-`any`, and plan validation pass.

No type inference, evaluation, execution, adoption, authority, or release
claim is part of this receipt. Invoke Refresh may select `SWU-SFOL-004`.
