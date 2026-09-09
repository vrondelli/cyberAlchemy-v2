# KEP post-deployment audit obligations

These are explicitly authored audit predicates, not automatically derived DomainSpec semantics or a theorem.

identity: deployed application image must equal the recorded selected image, both containers must be healthy, and every selected HTTPS route must return 200.
headers: every selected HTML page must carry restrictive CSP including frame-ancestors none, positive HSTS max-age, X-Content-Type-Options nosniff, and Referrer-Policy no-referrer or strict-origin-when-cross-origin.
resources: both selected application and database containers must have positive memory, PID and CPU quotas. This establishes configured bounds, not correct sizing or effective aggregate host limits.
recovery: the read-only observed quiescent backup checksum must equal the execution receipt, and the receipt must record a restore-list check and quiescent backup. This is checksum/receipt consistency, not an independently rerun restore or off-host disaster recovery.
process: application must use read-only root, dropped ALL capabilities and no-new-privileges.

Positive expectation is obligation satisfaction, independently of observed result. Negative controls remove or falsify the respective necessary evidence and must return a normal failure. Evidence is a dated read-only observation collected outside the contained runner. EVF independently verifies binding/receipt consistency; it does not authenticate the collector or rerun live probes. No security certification, resource-exhaustion resistance, theorem, product approval or deployment authority follows.
