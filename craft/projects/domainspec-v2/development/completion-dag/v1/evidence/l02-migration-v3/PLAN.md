# Migration path repair DAG

Product construction, authorized by “plan this and continue”.

| Node | Dependency | Stage | Completion evidence |
| --- | --- | --- | --- |
| S1 | L04-F01 | definition / design | Explicit unsupported-symlink boundary, inherited L01 concepts and exact source hashes |
| S2 | S1 | implementation | Additive wrapper rejects aliases at repository/project/feature/selected-file levels |
| S3 | S2 | product tests | Original reproducer rejects; ordinary diagnostics, renames, deletion and no-work preserve behavior; CLI failure is nonzero; inherited suites pass |
| S4 | S3 | closure | Carry 33 rows, two notes and six consumers forward with exact successor binding and preserved exclusions |
| S5 | S4 | independent review | One native reviewer assesses exact candidate and regression coverage |
| S6 | S5 PASS | human product decision | Present exact tested candidate; record only the user's actual decision |

Current frontier: S1, then runnable S2–S5. L04-F01 is the exact construction
blocker; no operational task blocks this additive repair. A failing review loops
back to a successor repair/test epoch without changing frozen candidates.

Operational residue: migration owner retains caller cutover, operational rollback,
retirement and external caller inventory (no stage affected now); publication
owner retains commit/push/release/deployment (no stage affected now). UI U00–U05
remains deferred. Known BTE mapping red and behavioral gaps remain visible.
