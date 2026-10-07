# G03 LongMemEval-V2 r61: exact-site UI-group retrieval

The [r61 source-only selector](../research/g03-beam-r1/screen-lme-v2-ui-groups-r61.py) applied the existing question-site → observed state-URL host rule to the r60 rare-term UI-group ranker. It read only the pinned 26 exposed question wires and verified R48 public trajectory pack; no gold, evaluator fields, confirmation question, or GLM call entered the selection. The private WSL output is `/home/vlad_/are-benchmark-archive/g03-lme-v2-agentic-source-r48/UI-GROUP-SCREEN-R61.json` (SHA-256 `deb99b5ac9bb6b900d66e3c9e35398a757e29781f3720ab977750abb92d65ccb`). All 26 top-five lists were nonempty.

Site scoping removed one conspicuous cross-site error: the biography-save question's top group is now on the Postmill biography editor, not a Magento product-detail page. It did **not** establish the required post-save witness: all five top groups are editor `main` regions, not the updated complementary profile panel. The Loaner Laptop Total question still ranks Catalog and pre-submit rows above the Order Status `Total` row. A Magento price-filter question still ranks a Shopping Cart table. Generic ServiceNow navigation remains a top result for the investment-return-field question. Thus exact site is necessary but insufficient; the r61 source-reach gate also **fails**. A nonempty group is not direct support.

No reader, judge, fresh reserve, or confirmation call was made. The r18–r21 failed transfer and the closed 140-question confirmation partition are unchanged. The next selector must bind entity **and** action→post-state **and** target role/region before answer generation. Source statuses must distinguish direct support, scoped contradiction, near match, and unknown; lexical rank cannot assign those statuses by itself.

## Open Questions

- How should an action-bound candidate capture the changed post-save sidebar without promoting every related editor page?
- What generic transition relation works for Order Status, Pending Reviews, and other target pages while excluding pre-action states?
- Can a closed-set contradiction be certified from a complete menu/table/form region without using the gold answer?
