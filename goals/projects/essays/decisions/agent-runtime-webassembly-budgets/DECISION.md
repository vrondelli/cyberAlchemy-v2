# Essays Agent Runtime WebAssembly Budgets

Result: selected

Selected option: `OPT-WASM-BUDGET-BALANCED`

Authority effect: none

Each first-vertical component invocation is limited to 64 MiB of linear
memory, 8,192 table elements, one instance, 4 MiB each of decoded input and
output, 256 KiB of structured logs, 50 million fuel units, and a five-second
wall watchdog. At most two component invocations may execute concurrently per
daemon.

Exceeding any ceiling fails closed without a partial proposal or accepted-state
mutation. These are initial safety ceilings, not performance promises.
Benchmarks may lower them; an increase requires a new reviewed decision.

The machine-readable decision is `selection.json`, bound to request digest
`fc36898331a047c4bee197144392afe21cc145e34f5eb21b3f5d0f69f28d5488`.
