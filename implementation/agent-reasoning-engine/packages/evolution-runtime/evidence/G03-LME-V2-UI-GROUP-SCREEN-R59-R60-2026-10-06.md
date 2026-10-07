# G03 LongMemEval-V2 r59–r60: whole-UI-group source screen

## Result

The [r59 source-only builder](../research/g03-beam-r1/screen-lme-v2-ui-groups-r59.py) parsed the pinned R48 public-source pack into 125,698 bounded AXTree groups (menu, row, table, tablist, complementary region, etc.) and ranked them using only the 26 exposed R35 question texts. Its private WSL output is `/home/vlad_/are-benchmark-archive/g03-lme-v2-agentic-source-r48/UI-GROUP-SCREEN-R59.json` (SHA-256 `dcd5c937a31226e891921030a840bd780da17aef6090524bc860578ebd2aefed`). The top-five list was nonempty for **21/26** questions, but that is not answer reach: the top group for the Loaner Laptop Total question was a different row, and several questions returned generic navigation or unrelated pages. The expanded Incidents **Filters** menu was correctly retrieved first, with all three Incident labels in one source group.

The [r60 rare-term version](../research/g03-beam-r1/screen-lme-v2-ui-groups-r60.py) used question-term document frequency over 27,966 unique group texts, preserving the original r59 receipt. Its private WSL output is `/home/vlad_/are-benchmark-archive/g03-lme-v2-agentic-source-r48/UI-GROUP-SCREEN-R60.json` (SHA-256 `fd8ca8b4043ffc3aa4b3f753917a30b04316a0ee5bb2cded92111fd086976d6d`). It made all **26/26** top-five lists nonempty but did **not** solve source reach. Concrete false top matches include a Shopping Cart table for the Magento price-range-filter question, product Details tabs for the Postmill biography-save question, and a generic navigation region for the ServiceNow investment-return-field question. The Loaner Laptop Total question still ranked unrelated rows ahead of the observed `Total` → `-` row. Repeated page chrome and incidental rare terms were promoted above the required entity, action, role, and page-state relation.

The source-only gate therefore **failed** for both candidates. Candidate counts and nonempty lists are not evidence that the requested answer is present. No GLM reader/judge call or confirmation question was made, and no score or superiority claim follows. The earlier r18–r21 independent reserve-development failure and closed 140-question confirmation partition remain unchanged.

The current [official LongMemEval-V2 repository](https://github.com/xiaowu0162/LongMemEval-V2) specifies question-only memory querying, bounded evidence returned to a fixed reader, and native accuracy–latency evaluation. Its [AgentRunbook-C V2 implementation](https://github.com/xiaowu0162/LongMemEval-V2/blob/main/memory_modules/agentrunbook_c_v2.py) distinguishes direct support, premise contradiction, near match, and insufficiency. That is a useful design lead for the next ARE source witness contract, not a result for ARE and not permission to relabel these custom GLM diagnostics as native benchmark scores.

## Next boundary

Do not tune another lexical/rareness weight or spend GLM calls on r59/r60. Build a source-witness selector that first establishes **which trajectory and state satisfy the exact entity, action, target page and actor view**, then emits complete role-scoped groups and an explicit support status. Use source-only tests across all 26 exposed questions, including the known negative and exact-set cases. A prospective fresh reserve-development transfer requires a frozen selector/reader/scorer and an absolute plus paired gate; official superiority further requires the native fixed reader/judge/latency protocol and its reference frontier.

## Open Questions

- Can a bounded trajectory/state selector distinguish a related page from the actual post-action target without reading reference answers?
- How should support status represent a closed-set absence separately from missing evidence?
- What minimum source-witness coverage across the 26 exposed questions warrants provider spend or a fresh reserve cohort?
