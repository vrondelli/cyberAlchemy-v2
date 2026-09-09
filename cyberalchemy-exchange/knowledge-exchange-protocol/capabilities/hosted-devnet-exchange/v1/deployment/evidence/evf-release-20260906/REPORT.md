# KEP EVF release — 2026-09-06

Result: PASS_BOUNDED. User authorized deployment, commit, and push.

Product construction: tested source committed as `710a31084` and pushed fast-forward to origin/master. All 61 image inputs matched the committed tree and its pinned Arcanum assets. Local and remote image archive checksums, layer identities, and normalized runtime configurations matched.

Operational support: the new image passed a restored production database rehearsal before cutover. A fresh quiescent PostgreSQL backup was taken and its archive listing verified. Database and application containers were recreated with explicit CPU, memory, swap, and PID limits, preserving the database image and persistent volume. Both became healthy. Normalized documents, legacy state, payload and journal counts remained unchanged; environment bytes remained unchanged.

Eight public HTTPS route checks passed, including an API 404. HSTS, nosniff, and no-referrer were verified across those responses. Served console JavaScript and CSS matched the image inputs exactly.

Live console: https://kep.cyberalchemylab.com/console-experience/

Historical residue: prior audit failures and frozen evidence remain intact. The original dirty checkout and unrelated ARE/alchLang work were not staged or reset. Deployment backups, the stopped rehearsal container, and rehearsal database remain retained on the VPS. This receipt is local post-deployment evidence, not part of the source commit.

Limits: these checks establish this deployment and bounded regression results, not universal security, worst-case workload capacity, or independent disaster recovery. No mainnet transaction was performed.
