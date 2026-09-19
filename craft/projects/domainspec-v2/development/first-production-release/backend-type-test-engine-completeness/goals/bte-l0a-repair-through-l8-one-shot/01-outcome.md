# Outcome

Execute the complete current BTE implementation route from the L0A exact-byte
repair through the L8 terminal verifier as one autonomous, fail-closed campaign.

The campaign completes only when:

- every instantiated SWU has a terminal receipt and independent audit;
- every layer consumes exact current predecessor handles;
- L7A and L7B independently replay the same exact green L6 core;
- `verify:bte:consumers` and `verify:bte` pass;
- terminal evidence states that admission and production authorization are not
  granted.

Stopping at a genuine owner or proof blocker is an honest Goal terminal state,
not permission to claim BTE completion.
