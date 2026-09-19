# Usefulness Differential Coverage Table

The JSON preregistration is authoritative. This table is its human projection.

| Subject | Test categories |
| --- | --- |
| A-01 | integration:route-tree, browser:journey |
| A-02 | unit:guard-rule, browser:journey |
| A-03 | unit:navigation-sequencing, integration:route-tree, browser:journey |
| A-04 | unit:screen-contract, integration:route-tree |
| A-05 | browser:journey |
| A-06 | all five catalog entries |
| T-P-01 | unit:screen-contract, browser:journey |
| T-P-02 | unit:screen-contract, integration:route-tree, browser:journey |
| T-P-03 | unit:navigation-sequencing, integration:route-tree, browser:journey |
| T-P-04 | unit:guard-rule, browser:journey |
| T-B-01 | unit:guard-rule, unit:navigation-sequencing, browser:journey |
| T-B-02 | unit:guard-rule, integration:route-tree, browser:journey |
| hypothetical compound boundary | all five catalog entries; non-authority input |

The baseline union is already the full catalog. Therefore the accepted residual
claim adds no test-selection decision and `D` is expected to be empty. This is
not a semantic or promotion conclusion.
