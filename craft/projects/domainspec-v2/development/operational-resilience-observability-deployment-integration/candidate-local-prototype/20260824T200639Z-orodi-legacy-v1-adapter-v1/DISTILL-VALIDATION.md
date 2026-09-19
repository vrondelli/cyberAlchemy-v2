# Distill Validation

Intent: preserve exact legacy-v1 operational shapes while translating only what the generic ORODI observation contract can represent without semantic inflation.

Budget: Standard — one proposal track, two finite rounds, locally labeled Proposer and Balancer roles.

Round 1 proposal separated ten candidate families into direct normalization, workflow telemetry, policy/configuration, procedure/proposal, and absent-family categories. Balancer objection: treating declarations as runtime observations would overstate v1 evidence. Revision: supported declarations emit only `mode=simulation`, zero telemetry accounting, `deployment_effect=false`, and `independently_observed=false`; the result is not a complete bundle.

Round 2 proposal allowed SLO/Prometheus/infra/deploy shapes to normalize as metadata. Balancer objection: the existing generic observation contract has no policy or proposal kind, so such mapping would launder intent into observation. Revision: reject those families with typed discriminators; reject workflow telemetry at the plane boundary and load/canary as absent.

Result: the smallest coherent unit is one pinned inventory, two safe replay normalizers, one shared fail-closed classification boundary, and one replay suite. Further splitting would separate source truth from adapter decisions or leave rejection semantics untested.
