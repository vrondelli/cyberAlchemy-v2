# Recovery campaign supervisor candidate

The additive recovery-launcher.mjs joins the reviewed generation campaign and native scorer. It does not dispatch from a command line yet. Existing owner authorization covers continued benchmark construction; no release, publication or new benchmark claim follows.

The supervisor copies and freezes configuration, requires four fresh disjoint canonical directories, saves the returned generation terminal before evaluation, and scores that saved terminal. It checks the saved terminal hash after scoring. A generation exception preserves its attached terminal and known costs. Missing terminals leave unknown accounting explicit. Cancellation stops scoring and awaits generation's return rather than racing an abort against unobserved workers.

Generation has a maximum 150-minute cancellation deadline, allowing four sequential 30-minute arms per worker plus preparation. This is not a hard kill, an overall qualification/scoring deadline, or proof that a remote provider stopped work. Required qualification and local-settlement callbacks have no permissive defaults; their production implementations and bindings remain prerequisites.

Supervision has its own guarded 32 MiB directory, with an 8 MiB final reserve. This is additional to the protocol's generation, source and scoring envelopes and must be included in the amended combined launch capacity check. No production launch is admitted by this candidate. Its local guard does not reserve space against concurrent writers.

Eight supervisor tests and four actual child-process tests cover durable handoff, caller configuration isolation, delayed cancellation settlement, attached failure costs, qualification/transport rejection, terminal mutation and path overlap. Synthetic results make no benchmark-quality claim.

## Open questions

Bind the complete executable source closure and fixed cohort to the production qualifier. The dedicated generation-process adapter now waits for the child close event; the child flushes its terminal then exits, closing its own HTTP sockets. Abort sends SIGTERM, waits up to150seconds, then sends SIGKILL and still awaits close. Missing terminal costs remain unknown with a full configured campaign reservation; this does not reconstruct partially written receipts. The child runs in a dedicated Linux process group. Cancellation signals the group; child exit kills any surviving group members before waiting for stream closure. Settlement also verifies group absence, otherwise failing closed. Complete receipt reconciliation remains a launch check. R2 approved the original process wrapper; this subsequent process-group cleanup requires R3 review. Independently review the combined storage allowance and qualification/scoring deadlines before live dispatch. Then execute all eight fixed arms and score the original denominator.
