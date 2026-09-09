# Task Session context — SWU-UOVA-001 retry

This retry writes only its terminal receipt. The source-graph implementation and focused test remain byte-identical to the admitted attempt-001 outputs.

The passing loader-repair receipt is a bound dependency. The retry runs the original three-command SWU validation surface. A passing result must then route through `invoke:refresh:apply-approved` to synchronize the SWU manifest, parent task, W1 gate, and Work Pack before selecting SWU-UOVA-002.
