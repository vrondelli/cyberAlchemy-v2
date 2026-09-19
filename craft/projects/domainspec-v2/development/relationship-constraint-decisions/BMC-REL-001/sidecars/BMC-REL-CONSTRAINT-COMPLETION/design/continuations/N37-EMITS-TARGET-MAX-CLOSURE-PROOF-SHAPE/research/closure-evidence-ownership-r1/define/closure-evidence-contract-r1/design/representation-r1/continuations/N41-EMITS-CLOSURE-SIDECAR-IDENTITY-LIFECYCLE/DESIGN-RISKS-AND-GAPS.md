# N41 risks and gaps

| Risk or gap | Boundary |
| --- | --- |
| Newest file is treated as authoritative | Require explicit exact digest selection; reject timestamp, filename, and directory-order inference. |
| Supersession is mistaken for currentness | Under B the link records only a consumer-owned lifecycle assertion; N40 currentness remains external. |
| Prior evidence is invalidated or rewritten | Preserve all sidecar and receipt bytes; later assertions are additive. |
| Different owners or different scopes are conflated | N41 applies only to the same declaring owner, boundary, predicate, and exact snapshot tuple. |
| Producer authorization is undefined | Remains a separate consumer-owner contract; N41 does not admit producers. |
| Canonical schema and implementation are absent | Later Design/Plan after N41 selection and separate acceptance. |
