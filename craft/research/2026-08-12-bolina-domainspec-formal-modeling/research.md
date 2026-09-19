## Agent 1 — Bolina repository archaeology

{
  "receipt_schema": "domainspec.dispatch.explorer-receipt.v1",
  "action_id": "spawn-0001",
  "role": "bolina-architecture-explorer",
  "status": "completed_read_only",
  "source_identity": {
    "repository": "projects/bolina",
    "commit": "d9cff4ef37603e2725f737af48d92fbaefb46ecf",
    "branch": "main",
    "worktree_before_and_after": "clean",
    "prune_fix": "becc23dd64eee3fb1ff759c98332b1742114a8f7 is an ancestor"
  },
  "claim_ceiling": "Static source archaeology only. Tests and gates were inspected but not executed because the action had no write scope. This receipt proves neither runtime behavior, model-check results, conformance, nor security.",
  "architecture": {
    "bands": [
      "Identity, encrypted transport, and mesh",
      "Pairwise-fan-out channels",
      "Attestation and capability: signed evidence plus human-signed, single-use grants"
    ],
    "grant_flow": [
      "An agent sends an Intent binding intent_id, action, and resource_id.",
      "Dispatch structurally verifies and routes the envelope; resolver admission records a memory-only PENDING entry and rejects duplicate intent IDs or a resource already held by PENDING/EXECUTING.",
      "A human approver signs a Grant bound to one subject, executor, intent, canonical resource, exact action digest, nonce, and expiry.",
      "dispatchGrant finds the pending entry and constructs GrantContext.",
      "verifyGrantThen performs checks 0 through 11 in order. Check 10 handles expiry; check 11 prunes and durably appends the consumed grant before invoking the effect callback.",
      "Observed implementation order is effect callback return, published tombstone, then beginExecuting. This does not directly refine the SPEC transition order.",
      "Restart recreates the volatile intent table and reconstructs consumed IDs, published witnesses, revocations, and orphan IDs from the durable log."
    ]
  },
  "state_action_findings": [
    {
      "surface": "Normative intent lifecycle",
      "states": "DRAFTED, PENDING, APPROVED, EXECUTING, EXECUTED, EXECUTION_FAILED, REJECTED, EXPIRED",
      "evidence": "SPEC.md:1337-1349",
      "finding": "The supplied brief's DONE state is non-normative and it omits APPROVED plus both terminal execution states."
    },
    {
      "surface": "Implemented intent lifecycle",
      "states": "pending, executing, expired, rejected",
      "evidence": "src/intent.zig:71-76",
      "finding": "APPROVED, EXECUTED, and EXECUTION_FAILED have no representation. No completion transition exists."
    },
    {
      "surface": "Resource lock",
      "evidence": "src/intent.zig:106-139,182-188",
      "finding": "The lock is derived from an entry remaining PENDING or EXECUTING. Admission rejects a second holder. Because successful dispatch leaves the entry EXECUTING indefinitely, the current slice preserves exclusivity by retaining the lock after effect completion."
    },
    {
      "surface": "Timeout",
      "evidence": "src/intent.zig:153-165",
      "finding": "expireTimeouts implements PENDING to EXPIRED, but no non-test call site exists in src."
    },
    {
      "surface": "Restart",
      "evidence": "src/intent.zig:3-24,99-105; src/dispatch_test.zig:531-564",
      "finding": "Restart is modeled as constructing an empty table, so previous PENDING and EXECUTING entries become absent rather than explicit EXPIRED records."
    },
    {
      "surface": "Durable grant ledger",
      "evidence": "src/grant_ledger.zig:20-55,126-225",
      "finding": "Commit, published, and revoke rows are recovered into bounded caches. An orphan is derived as committed without a published witness."
    },
    {
      "surface": "Revocation",
      "evidence": "src/grant_ledger.zig:236-253; src/verify.zig:212-230",
      "finding": "Revocations are durable, never pruned, and consulted for approver and subject at the capability-to-effect checkpoint."
    }
  ],
  "invariant_mapping": [
    {
      "marker": "BE-GRANT-01",
      "specified": "Consumed ID durably committed before effect and preserved across restart/crash/redeployment.",
      "implementation": "verify check 11 calls consumedHook; commitConsumed prunes, appends, and syncs before execute.",
      "selectors": [
        "SPEC.md:1351-1360,1398-1409",
        "src/verify.zig:249-262",
        "src/dispatch.zig:107-120",
        "src/grant_ledger.zig:194-225,256-359"
      ],
      "qualification": "The brief's invariant committed(g) => always consumed(g) is wrong because expired grants are intentionally pruned. The safety property must couple consumption with expiry: before expiry the durable ID remains consumed; after pruning, check 10 must make re-execution impossible."
    },
    {
      "marker": "BE-GRANT-01a",
      "specified": "Never retry an orphan automatically; publish interrupted Effect and release its resource.",
      "implementation": "recover returns orphan IDs and keeps them consumed; caller must publish and tombstone.",
      "selectors": [
        "SPEC.md:1362-1366",
        "src/grant_ledger.zig:126-191,213-225",
        "src/dispatch.zig:77-105",
        "src/grant_ledger_test.zig:113-168"
      ],
      "qualification": "The inspected production slice contains no interrupted-Effect publisher. It provides only the orphan list and tombstone API. Until tombstoning succeeds, recovery intentionally re-emits the orphan at least once, contradicting the brief's unconditional exactly-once claim."
    },
    {
      "marker": "BE-GRANT-03",
      "specified": "No path reaches EXECUTING except through the ordered twelve-check routine.",
      "implementation": "verifyGrantThen contains checks 0-11. M10 is a lexical grep for one literal execute( call in src/verify.zig.",
      "selectors": [
        "SPEC.md:1373-1419",
        "src/verify.zig:182-263",
        "tools/prumo-verify:511-538"
      ],
      "qualification": "Split this into a model-level transition invariant, such as entering EXECUTING requires a successful Verify event, and a separate Zig CFG/call-graph conformance obligation. The brief is wrong to exclude BE-GRANT-03 entirely from the abstract model."
    },
    {
      "marker": "BE-GRANT-03a",
      "specified": "Verification through entry into EXECUTING occurs while lifecycle and resource ownership remain frozen.",
      "implementation": "The callback executes at src/verify.zig:262; dispatch then writes the published tombstone at src/dispatch.zig:232-244 and only then calls beginExecuting at 245-249.",
      "qualification": "Observed conformance gap. The effect has completed and is tombstoned while the intent still reads PENDING. Existing tests only inspect EXECUTING after dispatch returns and do not discriminate this ordering."
    },
    {
      "marker": "BE-GRANT-03b",
      "specified": "Verification is a call, not a storable verified value.",
      "implementation": "verifyGrantThen invokes the supplied effect callback inside its frame.",
      "selectors": [
        "SPEC.md:1421-1464",
        "src/verify.zig:182-200,252-263"
      ],
      "qualification": "The local shape exists, but M10 is lexical evidence rather than general CFG proof and the SPEC records a provisional caller-bypass debt."
    },
    {
      "marker": "BE-GRANT-04",
      "specified": "Restart collapses every PENDING approval to EXPIRED.",
      "implementation": "No pending state is persisted; a fresh Dispatch has an empty table.",
      "selectors": [
        "SPEC.md:1491-1494",
        "src/intent.zig:3-24,99-105",
        "src/dispatch_test.zig:531-564"
      ],
      "qualification": "Observed as absence after restart, not as a persisted EXPIRED state."
    },
    {
      "marker": "BE-GRANT-06/-06a/-06b",
      "specified": "Reject, do not queue, a second active intent on one canonical resource; expire pending locks; reject duplicate active intent IDs.",
      "implementation": "Admission enforces duplicate-ID and resource checks; timeout exists as an uncalled helper.",
      "selectors": [
        "SPEC.md:1513-1532",
        "src/intent.zig:106-165,174-188",
        "src/intent_test.zig:51-89"
      ],
      "qualification": "The safety check is present. Liveness/completion is incomplete because successful entries never leave EXECUTING in the inspected slice."
    }
  ],
  "brief_concordance": {
    "supported": [
      "Section 11.4 is distinct from the differential soak: brief:11-17; SPEC.md:1839-1862.",
      "Expiry precedes durable consumption: brief:72-76; SPEC.md:1398-1407; src/verify.zig:249-255.",
      "Pending state is volatile while consumed IDs and revocations are durable.",
      "The pre-fix prune crash was real and becc23d is present.",
      "The fixed implementation uses temp write, temp sync, same-directory rename, reopen, and file sync: src/grant_ledger.zig:316-355."
    ],
    "corrections_required": [
      "Brief:23-28 omits APPROVED, EXECUTED, and EXECUTION_FAILED and misplaces REJECTED.",
      "Brief:51-53 and 63 claim exactly-once orphan emission; current recovery is at-least-once until the tombstone lands.",
      "Brief:66 says BE-GRANT-03 is the wrong tool. Abstract no-bypass transitions are modelable; only implementation CFG conformance lies outside the state model.",
      "Brief:62 asserts permanent consumed-set membership, conflicting with specified pruning.",
      "Brief:87-88 says crash and restart are the only nondeterminism. Arrival order, grant versus refusal, timeout, revocation, effect outcome, recovery publication, and crash position remain logical nondeterminism in a single process.",
      "Brief:93-95 treats a crash as allowing any durable storage to become nothing. The model must distinguish acknowledged fsync state from in-flight writes.",
      "Brief:168-172 says modeling converts tested into proved and calls prune crash-safe by construction. Any result remains bounded by finite scope, abstraction adequacy, tool/config identity, and filesystem assumptions.",
      "Brief:129-130 prescribes model placement without Bolina or DomainSpec owner authorization."
    ]
  },
  "status_matrix": {
    "observed": [
      "Ordered verification code, durable commit-before-effect, restart reconstruction, at-least-once orphan surfacing, resource admission checks, revocation checkpoint, and atomic-rewrite implementation."
    ],
    "specified": [
      "Full lifecycle including APPROVED and execution terminals, interrupted Effect publication, lock release, timeout operation, and section 11.4 model checking."
    ],
    "absent": [
      "Alloy/TLA model files or solver receipts",
      "Interrupted-Effect publication wiring in the inspected src",
      "Non-test expireTimeouts call site",
      "EXECUTED/EXECUTION_FAILED transitions",
      "A conformance bridge proving Zig refines the formal model"
    ],
    "contradictory_or_stale": [
      "SPEC.md:3-13 says nothing is implemented and conformance is not started, while SPEC.md:44-46 and README.md:10-45 report implemented phase-D mechanics and tests.",
      "SPEC/early decisions use exactly-one orphan language while D-062, source, and tests preserve at-least-once delivery until tombstoning."
    ],
    "blocked": [
      "Owner resolution of effect-before-EXECUTING ordering",
      "Owner resolution of exactly-once versus at-least-once interrupted publication",
      "Explicit filesystem and directory-durability contract",
      "Authority for model and receipt placement"
    ]
  },
  "smallest_model_boundary": {
    "variables": [
      "finite intents and grants with exact bindings",
      "specified intent state plus a separate observed-implementation state",
      "resource holder",
      "verification stage/check outcome",
      "logical and expiry time",
      "durable row sequence and volatile recovered caches",
      "revoked keys",
      "effect attempted/result/published counters",
      "process epoch, crash stage, and recovery queue"
    ],
    "actions": [
      "submit/admit intent",
      "grant or refusal arrival",
      "ordered verification checks",
      "expiry and timeout",
      "commit and fsync",
      "enter executing",
      "invoke/return effect",
      "publish/tombstone",
      "revoke",
      "crash/restart/recover",
      "each prune stage"
    ],
    "exclude": [
      "wire parser",
      "cryptographic primitive correctness",
      "resource canonicalization algorithm",
      "network transport"
    ],
    "required_bad_fixtures": [
      "old truncate-before-rewrite crash",
      "bypass edge to EXECUTING",
      "PENDING surviving restart",
      "two active intents sharing a resource",
      "effect before durable commit",
      "effect and tombstone before EXECUTING",
      "crash after interrupted publication but before tombstone",
      "always-refuse implementation"
    ]
  },
  "environment_assumptions_to_bind": [
    "Successful append plus file sync preserves the acknowledged prefix.",
    "A pre-sync crash may leave the old prefix or one incomplete trailing record, not arbitrary loss of older synced records.",
    "Temp-file sync makes the complete replacement contents durable.",
    "Rename is atomic only within the declared filesystem/directory boundary.",
    "Directory-entry durability must be modeled explicitly; file sync after reopen must not silently substitute for directory fsync.",
    "Only one process/writer owns the ledger.",
    "Monotonic pending time and wall-clock grant expiry are distinct trusted inputs.",
    "Effect completion and storage errors remain nondeterministic.",
    "Fairness is required only for any liveness claim, not for the core safety invariants."
  ],
  "key_test_anchors_not_executed": [
    "src/intent_test.zig:36-45,51-89,133-151",
    "src/verify_test.zig:365-461,730-746",
    "src/dispatch_test.zig:395-430,462-590",
    "src/grant_ledger_test.zig:59-168,197-235,287-353"
  ],
  "mutation_receipt": {
    "files_written": [],
    "output_ref_written": false,
    "reason": "Mutation policy was read-only with an empty write scope; the parent must persist this receipt if required."
  }
}

## Agent 2 — Formal-method semantics and tool split

{
  "receipt_schema": "domainspec.dispatch-action-receipt.v1",
  "dispatch_id": "2026-08-12-bolina-domainspec-formal-modeling",
  "action_id": "spawn-0002",
  "role": "formal-methods-explorer",
  "capability": "research",
  "mode": "explore",
  "status": "complete",
  "output_ref": "research/2026-08-12-bolina-domainspec-formal-modeling/receipts/explorer-formal-methods.json",
  "persistence": {
    "status": "returned_to_parent_for_persistence",
    "reason": "The action was read-only with an empty write scope."
  },
  "mutation_receipt": {
    "repository_writes": [],
    "tools_installed": [],
    "solvers_executed": [],
    "external_effects": []
  },
  "source_bindings": {
    "target_commit": "d9cff4ef37603e2725f737af48d92fbaefb46ecf",
    "brief_sha256": "3c4c5d7018d98c546649ee1b6bf82dc8aa0bf57c0c45687e9b36b89d4ded931f",
    "local_selectors": [
      "projects/bolina/SPEC.md:1337 state machine",
      "projects/bolina/SPEC.md:1351 BE-GRANT-01",
      "projects/bolina/SPEC.md:1362 BE-GRANT-01a",
      "projects/bolina/SPEC.md:1373 BE-GRANT-03",
      "projects/bolina/SPEC.md:1421 BE-GRANT-03b",
      "projects/bolina/SPEC.md:1481 BE-GRANT-03a",
      "projects/bolina/SPEC.md:1491 BE-GRANT-04",
      "projects/bolina/SPEC.md:1513 BE-GRANT-06",
      "projects/bolina/SPEC.md:1520 BE-GRANT-06a",
      "projects/bolina/SPEC.md:1527 BE-GRANT-06b",
      "projects/bolina/SPEC.md:1839-1842 section 11.4",
      "brief lines 24-29 simplified lifecycle",
      "brief lines 51-53 exactly-once orphan claim",
      "brief line 66 BE-GRANT-03 exclusion",
      "brief lines 87-89 single-process claim",
      "brief lines 162-171 rename and proved claims"
    ],
    "primary_sources": [
      {
        "title": "Alloy 6.2.0 official release",
        "url": "https://github.com/AlloyTools/org.alloytools.alloy/releases/tag/v6.2.0",
        "use": "Version candidate and temporal-tool identity."
      },
      {
        "title": "Alloy 6 language semantic reference",
        "url": "https://alloytools.org/spec.html",
        "use": "Temporal relational semantics, lasso traces, assertions, and finite-scope claim ceiling."
      },
      {
        "title": "Alloy 6 temporal analysis",
        "url": "https://alloytools.org/alloy6.html",
        "use": "Bounded versus complete trace exploration over a finite atom universe."
      },
      {
        "title": "Alloy commands and scopes",
        "url": "https://alloy.readthedocs.io/en/latest/language/commands.html",
        "use": "Run witnesses, assertion counterexamples, exact scopes, and step bounds."
      },
      {
        "title": "TLA+ Tools v1.7.3 official release",
        "url": "https://github.com/tlaplus/tlaplus/releases/tag/v1.7.3",
        "use": "Candidate TLC pin; this release fixes a LazyValue defect that could generate too many or too few states."
      },
      {
        "title": "TLC model overview",
        "url": "https://tla.msr-inria.fr/tlatoolbox/doc/model/overview-page.html",
        "use": "Init/Next, invariants, temporal properties, and fairness configuration."
      },
      {
        "title": "TLC checking modes",
        "url": "https://tla.msr-inria.fr/tlatoolbox/doc/model/tlc-options-page.html",
        "use": "Complete reachable-state BFS versus simulation and fingerprint limitations."
      },
      {
        "title": "TLC result and action coverage",
        "url": "https://tla.msr-inria.fr/tlatoolbox/doc/model/results-page.html",
        "use": "Queue exhaustion, state counts, and detection of disabled actions."
      },
      {
        "title": "Specifying Systems",
        "url": "https://lamport.azurewebsites.net/tla/book-02-08-08.pdf",
        "use": "Safety, liveness, fairness, and TLC semantics."
      },
      {
        "title": "PlusCal translation tutorial",
        "url": "https://lamport.azurewebsites.net/tla/tutorial/session6.html",
        "use": "PlusCal-to-TLA+ translation and generated Init/Next structure."
      },
      {
        "title": "Linux write(2)",
        "url": "https://man7.org/linux/man-pages/man2/write.2.html",
        "use": "Short writes and O_APPEND's limited atomicity."
      },
      {
        "title": "Linux fsync(2)",
        "url": "https://man7.org/linux/man-pages/man2/fsync.2.html",
        "use": "File persistence and the separate directory-entry fsync requirement."
      },
      {
        "title": "Linux rename(2)",
        "url": "https://man7.org/linux/man-pages/man2/renameat.2.html",
        "use": "Atomic namespace replacement, same-filesystem constraint, and unchanged open descriptors."
      }
    ]
  },
  "decision": {
    "smallest_sufficient_route": "TLA+/TLC first; Alloy optional and staged",
    "reason": [
      "The load-bearing questions are action ordering, crash points, restart asymmetry, timeout/verification interference, recovery, and logical nondeterminism. TLA+ expresses these directly as Init/Next actions and separate safety/liveness configurations.",
      "TLA+ can also express resource uniqueness and binding relations, so Alloy is not required to close Bolina section 11.4 if the TLA model and its implementation-conformance bridge are adequate.",
      "Alloy remains useful for a DomainSpec structural projection, small relational counterexamples, and an independent bounded lens. A second coequal behavioral model would duplicate semantics and create drift unless a distinct obligation justifies it.",
      "If both adapters are piloted, they must consume one typed obligation set but retain separate model syntax, configurations, solver receipts, and claim ceilings. Cross-tool agreement is not proof."
    ]
  },
  "property_classification": [
    {
      "marker": "BE-GRANT-01",
      "class": ["safety", "temporal ordering", "durability"],
      "model_obligations": [
        "An effect attempt requires a successfully durable consumed record.",
        "No grant has more than one action-effect attempt.",
        "Crash/restart cannot make a still-acceptable committed grant executable again.",
        "Expiry check 10 precedes durable ledger check 11."
      ],
      "correction": "The brief's formula committed(g) implies always consumed(g) is too strong or underspecified because the same brief requires pruning expired rows. Model observable single-shot behavior plus retention while a grant remains acceptable; require the Bolina owner to decide whether literal forever-retention is normative."
    },
    {
      "marker": "BE-GRANT-01a",
      "class": ["safety", "recovery liveness under assumptions"],
      "model_obligations": [
        "A committed but unpublished action is never automatically retried.",
        "Recovery releases the volatile resource lock.",
        "After a durable published tombstone, recovery emits no further interrupted report.",
        "An orphan is eventually reported only under declared eventual-restart, process-stability, storage, and publication fairness assumptions."
      ],
      "correction": "Exactly-once interrupted publication is unsupported. Publication can occur before its durable tombstone, so a crash in that window permits re-emission. The current preflight reports an explicit at-least-once test. Model at-least-once-until-tombstone and preserve owner resolution."
    },
    {
      "marker": "BE-GRANT-03",
      "class": ["abstract transition safety", "ordered protocol", "separate implementation conformance"],
      "model_obligations": [
        "No modeled transition enters EXECUTING except the verification/start action.",
        "Checks 0 through 10 pass in normative order before check 11.",
        "Ledger commit is durable before effect entry.",
        "A failed check refuses and cannot fabricate an orphan."
      ],
      "correction": "The brief's keep-out decision is wrong. Alloy or TLA+ can check no-bypass over the modeled transition relation. Neither tool automatically establishes that the Zig CFG refines that relation; source extraction, call-graph validation, and implementation binding remain separate."
    },
    {
      "marker": "BE-GRANT-03a",
      "class": ["mutual exclusion safety", "interference safety"],
      "model_obligations": [
        "Verification freezes the intent lifecycle.",
        "Pending timeout cannot fire for the intent while verification is active.",
        "The resource lock remains held through entry to EXECUTING.",
        "No lock reacquisition window exists."
      ]
    },
    {
      "marker": "BE-GRANT-03b",
      "class": ["abstract atomicity", "code reachability conformance"],
      "model_obligations": [
        "No persistent verified-token state exists in the abstract machine.",
        "The action that completes verification starts execution in the same modeled control frame."
      ],
      "claim_limit": "This checks the abstract action vocabulary, not Zig visibility, callback confinement, or M10 call sites."
    },
    {
      "marker": "BE-GRANT-04",
      "class": ["restart safety"],
      "model_obligations": [
        "Restart clears all volatile PENDING state and locks.",
        "No PENDING intent is reconstructed.",
        "The model distinguishes the logical EXPIRED outcome from absent process memory."
      ],
      "open_detail": "The owner must define crash outcomes for APPROVED and verification-in-progress states, which the supplied brief omits."
    },
    {
      "marker": "BE-GRANT-06",
      "class": ["relational invariant", "safety"],
      "model_obligations": [
        "No two PENDING or EXECUTING intents share one canonical resource.",
        "Admission rejects rather than queues a conflicting intent.",
        "Two different resources remain concurrently admissible, preventing accidental global serialization."
      ]
    },
    {
      "marker": "BE-GRANT-06a",
      "class": ["timed transition", "conditional liveness"],
      "model_obligations": [
        "When bounded monotonic time reaches T_pending, PENDING becomes EXPIRED and releases its lock.",
        "Eventual expiry requires a separate time-progress fairness assumption."
      ]
    },
    {
      "marker": "BE-GRANT-06b",
      "class": ["admission safety", "relational uniqueness"],
      "model_obligations": [
        "At most one PENDING intent has a given intent_id."
      ]
    }
  ],
  "candidate_tla_model": {
    "constants": [
      "finite Intents, Grants, GrantIds, Resources",
      "bounded Time",
      "T_pending and expiry limits",
      "finite storage images and crash phases"
    ],
    "variables": [
      "intentState including PENDING, APPROVED, VERIFYING, EXECUTING, EXECUTED, EXECUTION_FAILED, REJECTED, EXPIRED",
      "resourceOf, grantOf, lockOwner",
      "verificationOwner and verificationPC 0..11",
      "stableConsumed, stablePublished, firstReceipt",
      "effectAttemptCount saturated at 2",
      "interruptedPublicationCount saturated at 2",
      "processUp, epoch, now",
      "liveImage, tempImage, syncedTempImage, stableDirectoryMapping, openLedgerTarget",
      "lastAction for transition-origin assertions"
    ],
    "actions": [
      "ReceiveIntent",
      "ApproveOrBeginVerify",
      "VerifyCheck0Through10",
      "CommitConsumedCheck11",
      "EnterExecuting",
      "AttemptEffect",
      "PublishEffect",
      "MarkPublished",
      "FinishExecutedOrFailed",
      "Reject",
      "ExpirePending",
      "AdvanceTime",
      "Crash",
      "Restart",
      "RecoverPublishInterrupted",
      "RecoverMarkPublished",
      "PruneOldTruncateRewrite mutant",
      "PruneTempWrite",
      "TempFsync",
      "AtomicRename",
      "DirectoryFsync",
      "Reopen"
    ],
    "safety_config_without_fairness": [
      "TypeOK",
      "CommitBeforeEffect",
      "AtMostOneActionEffectAttempt",
      "NoLiveGrantUnspent",
      "NoModeledBypass",
      "VerificationLockHeld",
      "RestartClearsPending",
      "ResourceExclusive",
      "IntentIdUnique",
      "NoInterruptedPublicationAfterDurableTombstone",
      "ExecutingPrecedesEffectAndPublication"
    ],
    "liveness_config_with_explicit_environment_assumptions": [
      "OrphanEventuallyReported",
      "PendingEventuallyExpires",
      "Use weak fairness only for continuously enabled recovery/publication/time actions.",
      "Also declare an eventual stable-process interval; fairness on recovery alone does not defeat infinitely recurring crashes."
    ],
    "anti_vacuity": [
      "Require a witness reaching EXECUTED through all checks and durable commit.",
      "Require witnesses for refusal, timeout, crash, restart, orphan recovery, and successful fixed prune.",
      "Record per-action coverage and reject any required action with zero generated successors.",
      "Run the always-refuse mutant and require the success witness to fail.",
      "Keep safety and fairness-enabled liveness configurations separate."
    ]
  },
  "candidate_alloy_model": {
    "status": "optional staged projection",
    "signatures": [
      "Intent, Grant, GrantId, Resource, ProcessEpoch, EffectEvent",
      "IntentState atoms for all normative lifecycle states",
      "one mutable System with state, lock, committed, tombstoned, attempted, interruptedEvents, verificationPC, and lastAction relations"
    ],
    "facts": [
      "Init plus always exactly one declared action or stutter",
      "Complete frame conditions for every action",
      "Static exact bindings among Grant, Intent, GrantId, and canonical Resource",
      "No hidden fact that forces every grant valid or disables crash/recovery."
    ],
    "assertions": [
      "CommitBeforeEffect",
      "AtMostOneActionAttempt",
      "NoLiveUnspend",
      "NoModeledBypass",
      "RestartClearsPending",
      "ResourceExclusive",
      "NoInterruptedAfterTombstone"
    ],
    "witnesses": [
      "run GoodSingleUseTrace",
      "run TwoDifferentResourcesProceed",
      "run CrashAndRecover",
      "run FixedPruneCompletes"
    ],
    "scope_plan": [
      "1 intent, 1 grant, 1 resource for the success and orphan traces",
      "exactly 2 intents, 2 grants, 1 resource for exclusivity",
      "exactly 2 intents and 2 resources to detect overconstraint",
      "at least two process epochs and sufficient steps for commit-effect-publish-crash-recover-tombstone",
      "expand both atom scopes and step horizon; never report an omitted default scope as evidence",
      "If using unbounded steps, describe the result as complete over that finite atom universe only."
    ]
  },
  "storage_assumption_matrix": [
    {
      "operation": "append/write",
      "required_model": "A write may be short; O_APPEND atomically combines offset selection and the write but does not make the row durable or immune to partial transfer. Promote a row only after the implementation-binding proves a complete write loop and checked return status."
    },
    {
      "operation": "file fsync",
      "required_model": "Successful fsync makes the current file data and required inode metadata stable under an explicit truthful-device assumption. On error, execution must not proceed. File fsync alone does not persist the containing directory entry."
    },
    {
      "operation": "crash before successful fsync",
      "required_model": "Recover nondeterministically from the prior stable image or permitted partial in-flight bytes; malformed trailing rows must fail closed rather than become valid ledger facts."
    },
    {
      "operation": "temp-file fsync",
      "required_model": "Makes the completed temp image stable, but does not by itself persist the temp name or later rename."
    },
    {
      "operation": "rename",
      "required_model": "Assume same-filesystem atomic namespace replacement for observers. Do not infer crash durability of the directory mapping from atomic visibility."
    },
    {
      "operation": "directory fsync",
      "required_model": "Use an explicit parent-directory fsync action to commit the renamed directory entry, or retain old/new post-crash namespace outcomes as environmental nondeterminism. A file fsync after reopen is not a substitute under the generic Linux contract."
    },
    {
      "operation": "reopen after rename",
      "required_model": "Existing file descriptors continue to reference the old inode. Reopen selects the new path target for later writes; reopen itself provides no durability guarantee."
    },
    {
      "operation": "clock",
      "required_model": "Pruning safety requires a declared nondecreasing executor clock across restart/redeployment and durable first-receipt semantics where T_recv spans restart. Without those assumptions, an expired-and-pruned grant may become acceptable again."
    }
  ],
  "discriminating_fixtures": [
    {
      "fixture": "good single-use trace",
      "expected": "Success witness exists; all 12 checks, durable commit, EXECUTING, one effect attempt, publication, tombstone, terminal state."
    },
    {
      "fixture": "pre-fix D-063 truncate then crash",
      "expected": "Counterexample to NoLiveGrantUnspent or AtMostOneActionEffectAttempt."
    },
    {
      "fixture": "bypass edge to EXECUTING",
      "expected": "Counterexample to NoModeledBypass; separate Zig CFG case must also fail."
    },
    {
      "fixture": "PENDING survives restart",
      "expected": "Counterexample to RestartClearsPending."
    },
    {
      "fixture": "two intents for one canonical resource",
      "expected": "Counterexample to ResourceExclusive."
    },
    {
      "fixture": "effect before durable consumed commit",
      "expected": "Counterexample to CommitBeforeEffect."
    },
    {
      "fixture": "interrupted publication then crash before tombstone",
      "expected": "Counterexample to the brief's exactly-once claim while remaining compatible with at-least-once-until-tombstone."
    },
    {
      "fixture": "effect and tombstone before EXECUTING",
      "expected": "Counterexample to normative execution ordering. The preflight reports this as current Zig behavior, so it must remain an implementation-conformance discrepancy rather than be normalized into the model."
    },
    {
      "fixture": "always refuse",
      "expected": "Safety may be green, but GoodSingleUseTrace and action-coverage gates fail."
    },
    {
      "fixture": "two different resources",
      "expected": "Both can be admitted; failure exposes accidental global serialization."
    }
  ],
  "claim_ceiling": {
    "alloy_counterexample": "A valid counterexample within the recorded model, atom scope, trace horizon, solver, and configuration.",
    "alloy_no_counterexample": "Bounded no-counterexample, or complete trace exploration only for the recorded finite atom universe if that mode actually terminates.",
    "tlc_counterexample": "A behavior admitted by the exact TLA+ model and finite configuration that violates the checked property.",
    "tlc_complete_run": "Finite-state invariant checked for the exact model/configuration after queue exhaustion, subject to abstraction adequacy, tool correctness, and recorded fingerprint-collision risk.",
    "not_established": [
      "Universal theorem proof",
      "Zig implementation correctness or refinement",
      "Filesystem behavior outside declared assumptions",
      "Exactly-once external publication",
      "Bolina security",
      "DomainSpec authority, adoption, promotion, or deployment"
    ],
    "required_receipt_fields": [
      "source, model, PlusCal translation, configuration, fixture, and adapter digests",
      "exact tool artifact version and SHA-256",
      "solver/backend and options",
      "finite constants, scopes, time horizon, fairness, symmetry, and state constraints",
      "states generated, distinct states, queue exhaustion, action coverage, runtime, exit status, and fingerprint collision estimate",
      "expected versus observed fixture verdict",
      "claim vocabulary restricted to counterexample found, bounded no-counterexample, or finite-state invariant checked"
    ]
  },
  "brief_corrections": [
    "Restore APPROVED, EXECUTED, and EXECUTION_FAILED or provide an explicit, owner-approved abstraction map; DONE is not a silent synonym.",
    "Include BE-GRANT-03 at the abstract transition level and split Zig CFG/call-graph conformance.",
    "Replace exactly-once orphan publication with the current at-least-once-until-tombstone behavior pending owner resolution.",
    "Replace only crash nondeterminism with nondeterministic arrival, refusal, revocation, time advance, effect outcome, crash, restart, and recovery scheduling.",
    "Replace all interleavings with all reachable behaviors admitted by model M under finite configuration C.",
    "Replace converts tested into proved with finite-state model-check evidence plus a separate implementation-conformance result.",
    "Replace crash-safe by construction with conditional crash-safety under explicit write, fsync, rename, directory durability, reopen, clock, and device assumptions."
  ],
  "owner_gates": [
    "Resolve exactly-once versus at-least-once interrupted publication.",
    "Resolve the authoritative meaning and duration of APPROVED and verification-in-progress states.",
    "Resolve whether BE-GRANT-01 requires literal forever-retention or observable no-replay while a grant remains acceptable.",
    "Resolve the reported effect-then-tombstone-then-EXECUTING implementation ordering against the normative state machine.",
    "Declare the supported filesystem and directory-fsync contract.",
    "Declare clock monotonicity and first-receipt persistence across restart.",
    "Approve whether Alloy adds a distinct structural obligation or remains optional."
  ]
}

## Agent 3 — DomainSpec integration architecture

{
  "schema": "domainspec.research-explorer-receipt.v1",
  "action_id": "spawn-0003",
  "role": "domainspec-integration-explorer",
  "status": "complete",
  "mutation": {
    "policy": "read-only",
    "files_written": []
  },
  "result": {
    "headline": "DomainSpec has reusable deterministic graph, obligation, binding, coverage-gap, digest, and receipt precedents, but no validated Alloy/TLA extractor, adapter, model-case type, solver runner, implementation-conformance bridge, or semantic receipt path.",
    "minimum_route": "Use a source-complete Bolina manifest and first-class discrepancy register, derive typed obligations, generate separate tool-native projections, execute claim-bounded cases, and close model evidence separately from implementation-conformance evidence.",
    "tool_decision": "Provisionally start with TLA+/TLC plus a separate Zig conformance lane because the dispatch-described properties are temporal, durability-, restart-, ordering-, and concurrency-sensitive. Keep Alloy as a separate supported adapter, but require a genuinely static relational obligation before adding it to the minimum pilot. Exact BE-GRANT clause classification remains dependent on the Bolina explorer and formal-method explorer."
  },
  "source_snapshot": {
    "repository_commit": "3fe0d8399de8f8e75aebea4bf5e88a64f8b38184",
    "selected_files_match_commit": true,
    "whole_worktree_clean": false,
    "key_digests": {
      "evolvable_validation_findings": "d5d55cb53c419d8074a2ee4528e206440244d7217b5f7835eefd426837ff9fe5",
      "alloy_tla_tower": "3ded7940bb76e93d261c3c263f4e7ad9e1dbeb3d6fdc9266f2d854f24b22677a",
      "language_type_findings": "aa9a90f0ba4fe0ac606168ecd0ff00ddf92db3c3cfcf0e5862ad72b2f83e277e",
      "ir_types": "d4c1a4ad140784b2e0035562a0ae8e93b05627e26fb9066b9a579848b128702d",
      "rules": "c85f4c6f89b515cda41763bfad82beedb7bbfbf34ab5e5aa4000eeb4ecd950e4",
      "test_emitter": "55d358a771ec6921489aee4f5a72c8a44d69c8269d413fa44eb84cf0ab5c6144"
    }
  },
  "existing_surfaces": [
    {
      "surface": "ConceptGraph and Obligation IR",
      "status": "implemented",
      "reuse": "Reuse deterministic normalized input, source anchors, content-addressed obligations, and pure derivation.",
      "limit": "NodeType, EdgeType, and RuleType are closed unions that do not currently encode Bolina grants, storage actions, model obligations, or solver cases. Do not force Bolina semantics into them without an owner-approved extension.",
      "evidence": "impl/test-derivation-engine/src/ir/types.ts:1-101; rules/index.ts:1-56,107-119,692-729"
    },
    {
      "surface": "Obligation key",
      "status": "implemented",
      "reuse": "Preserve the current stable key as an owned local identifier.",
      "limit": "It is SHA-1 over source_anchor, rule_type, and canonical_params; it does not bind repository commit, source bytes, assumptions, model, tool, or config. Add an outer exact-binding digest instead of silently changing existing key semantics.",
      "evidence": "impl/test-derivation-engine/src/keys/index.ts:13-29"
    },
    {
      "surface": "Binding sidecar and generated tests",
      "status": "implemented but narrow",
      "reuse": "Reuse the principle that a binding names the implementation target but cannot supply expected output; preserve explicit coverage gaps.",
      "limit": "Current bindings target pure functions by module/symbol/strategy. They do not describe CFG reachability, check ordering, durable writes, crash points, or model-to-code refinement.",
      "evidence": "bindings/index.ts:1-81; emit/tests.ts:1-21,95-120,330-434"
    },
    {
      "surface": "Receipt precedents",
      "status": "implemented structural precedent plus candidate general contract",
      "reuse": "Reuse digest-bound source/artifact accounting, structural residue, receipt_family, status, and claim_limit.",
      "limit": "The live residue receipt explicitly makes no semantic or implementation-generation claim. The general ReceiptEnvelope remains research-only and has no executed evaluator path.",
      "evidence": "residue/receipt.ts:1-6,30-50; build-receipt.schema.json:4-40; evolvable-validation-framework/findings.md:295-324"
    },
    {
      "surface": "Alloy/TLA integration",
      "status": "absent",
      "reuse": "Reuse only the routing decision: Alloy for bounded static counterexamples, TLA/TLC for finite temporal traces.",
      "limit": "Syntax, extractor contract, adapter execution, configs, solver receipts, and integration are all unvalidated or absent.",
      "evidence": "alloy-tla-modeling/TOWER.md:7-21,38-65,85-92; BRIDGE-DECISIONS.md:7-15; CLAIM-LEDGER.md:31-38"
    },
    {
      "surface": "Imported Lean formalization",
      "status": "precedent only",
      "reuse": "Useful precedent for generated-from-authority drift gates and relative finite-rule metatheorems.",
      "limit": "Non-authority, stale, not built locally, and explicitly unable to certify current authority or Bolina.",
      "evidence": "formalization/README.md:1-8,46-95"
    }
  ],
  "candidate_pipeline": [
    {
      "object": "SourceBinding",
      "owner": "Bolina owns source meaning; DomainSpec adapter owner owns the binding format.",
      "required_fields": [
        "binding_id",
        "repository",
        "commit",
        "path",
        "selector",
        "content_digest",
        "source_role",
        "authority_scope",
        "fragment_digest",
        "parse_manifest_ref"
      ],
      "status": "derived manifest, never source authority",
      "claim_limit": "Identifies exact bytes, selector, and evidence role only.",
      "failure_residue": "missing source, selector drift, digest mismatch, parse omission, or ambiguous role blocks dependent projection"
    },
    {
      "object": "SourceDiscrepancy",
      "owner": "Bolina protocol owner resolves; DomainSpec only preserves and routes it.",
      "required_fields": [
        "discrepancy_id",
        "binding_refs",
        "dimension",
        "competing_propositions",
        "status",
        "owner_decision_ref",
        "permitted_assumption_profiles",
        "blocked_artifacts"
      ],
      "status": "non-authority evidence",
      "claim_limit": "Shows that exact sources disagree; does not select the winner.",
      "failure_residue": "unresolved discrepancies remain explicit blockers or create separately labeled investigative branches"
    },
    {
      "object": "Constraint",
      "owner": "Bolina owns the requirement; DomainSpec owns constraint classes and evaluator routing.",
      "required_fields": [
        "constraint_id",
        "source_binding_ids",
        "class",
        "predicate_or_evaluator_ref",
        "quantification",
        "scope",
        "assumption_refs",
        "discrepancy_refs",
        "lifecycle"
      ],
      "status": "candidate until Bolina owner acceptance",
      "claim_limit": "A typed requirement, not satisfaction evidence.",
      "failure_residue": "unsupported class, undeclared DSL, missing owner, or unresolved semantic conflict"
    },
    {
      "object": "Obligation",
      "owner": "DomainSpec derivation owner, preserving Bolina source ownership.",
      "required_fields": [
        "existing_obligation_key",
        "constraint_id",
        "source_binding_ids",
        "obligation_class",
        "assumption_set",
        "required_evidence_family",
        "claim_limit",
        "depends_on",
        "blocked_by"
      ],
      "status": "derived and content-addressed",
      "claim_limit": "A promise to check, never evidence of satisfaction.",
      "failure_residue": "coverage_gap, unsupported_evaluator, blocked_discrepancy, or incomplete_source"
    },
    {
      "object": "ModelProjection",
      "owner": "Separate Alloy-adapter and TLA-adapter owners.",
      "required_fields": [
        "projection_id",
        "adapter_kind",
        "adapter_version_and_digest",
        "input_binding_and_obligation_digests",
        "assumption_set",
        "preserve_map",
        "drop_map",
        "language_version",
        "model_digest",
        "config_digest"
      ],
      "status": "generated candidate, not canonical intent",
      "claim_limit": "A tool-specific abstraction of named obligations and assumptions.",
      "failure_residue": "unmapped clause/state/action, unapproved drop, syntax failure, unresolved discrepancy, or source drift"
    },
    {
      "object": "ModelCheckCase",
      "owner": "Tool-specific adapter/test owner.",
      "required_fields": [
        "case_id",
        "projection_digest",
        "obligation_ids",
        "polarity",
        "fixture_digest",
        "expected_result_class",
        "finite_bounds",
        "tool_config_digest",
        "anti_vacuity_checks"
      ],
      "status": "generated or explicitly authored test request",
      "claim_limit": "Declares an experiment; it is not execution evidence.",
      "failure_residue": "missing known-bad discriminator, impossible Init, vacuous antecedent, over-constrained facts, or absent bounds"
    },
    {
      "object": "SolverRun",
      "owner": "Tool runner/evidence owner.",
      "required_fields": [
        "run_id",
        "case_id",
        "tool_distribution_version_and_hash",
        "command",
        "model_config_and_fixture_digests",
        "finite_bounds",
        "environment",
        "exit_status",
        "result_class",
        "state_or_instance_counts",
        "witness_trace_or_counterexample_digests"
      ],
      "status": "generated execution evidence",
      "claim_limit": "counterexample_found, bounded_no_counterexample, invariant_violation_trace, or finite_state_no_violation only",
      "failure_residue": "tool error, timeout, parse error, incomplete exploration, missing witness, or non-replayable environment"
    },
    {
      "object": "ImplementationBinding",
      "owner": "Bolina implementation owner.",
      "required_fields": [
        "binding_id",
        "obligation_id",
        "bolina_commit",
        "code_selectors_and_digests",
        "abstract_state_action_to_symbol_map",
        "binding_kind",
        "assumptions",
        "validation_status"
      ],
      "status": "candidate conformance map",
      "claim_limit": "Maps model vocabulary to code; does not prove refinement.",
      "failure_residue": "unmapped mutation path, ambiguous symbol, changed code digest, or unresolved state/order semantics"
    },
    {
      "object": "ConformanceCase",
      "owner": "Bolina implementation-verification owner.",
      "required_fields": [
        "case_id",
        "implementation_binding_id",
        "obligation_id",
        "checker_or_harness",
        "known_good_or_mutant_fixture",
        "expected_relation",
        "observed_result",
        "evidence_digest"
      ],
      "status": "separate code-level or runtime evidence",
      "claim_limit": "implementation_tested or implementation_conformance_checked for the named surface only",
      "failure_residue": "coverage gap, model/code mismatch, harness inadequacy, or stale binding"
    },
    {
      "object": "ReceiptEnvelope",
      "owner": "DomainSpec evidence-contract owner; acceptance remains human/owner-controlled.",
      "required_fields": [
        "receipt_family",
        "subject_and_source_digests",
        "obligation_and_case_ids",
        "adapter_tool_and_config_digests",
        "finite_bounds_and_assumptions",
        "status",
        "claim_limit",
        "witnesses",
        "residue"
      ],
      "status": "generated evidence",
      "claim_limit": "Must not lift model evidence into code correctness, security, authority, or universal proof.",
      "failure_residue": "missing exact binding, mixed receipt families, hidden coverage gap, stale input, or inflated status"
    },
    {
      "object": "DriftReplayGate",
      "owner": "DomainSpec pipeline owner plus Bolina acceptance owner.",
      "required_fields": [
        "accepted_source_set_digest",
        "parse_manifest_digest",
        "discrepancy_snapshot_digest",
        "obligation_set_digest",
        "adapter_model_tool_config_fixture_digests",
        "replay_result",
        "staleness_reason"
      ],
      "status": "freshness and reproducibility evidence only",
      "claim_limit": "Current/stale/replayed; never behavior proof.",
      "failure_residue": "any source, assumption, model, tool, config, or fixture change invalidates downstream receipts and requires regeneration"
    }
  ],
  "required_discrepancy_records": [
    "The supplied brief drops APPROVED, EXECUTED, and EXECUTION_FAILED; no projection may drop them without an explicit abstraction map and preservation obligations.",
    "BE-GRANT-03 must split into an abstract no-bypass transition obligation and a Zig CFG/call-graph conformance obligation.",
    "Exactly-once orphan language conflicts with the current at-least-once re-emission witness; model branches must remain assumption-labeled until owner resolution.",
    "The observed effect -> published tombstone -> beginExecuting ordering conflicts with the specified ordering; preserve it as unresolved implementation evidence rather than normalizing the model to it.",
    "The candidate brief remains non-authority and cannot become a Constraint owner merely by being easier to model."
  ],
  "minimum_non_vacuity_cases": [
    "known-good single-use grant trace",
    "pre-fix prune truncate-before-rewrite crash",
    "abstract bypass edge into EXECUTING plus a separate Zig bypass mutant",
    "PENDING persistence/restart case",
    "two intents competing for one resource",
    "effect before durable commit",
    "crash after interrupted-effect publication but before tombstoning, evaluated under explicitly selected recovery semantics",
    "effect and tombstone before EXECUTING, treated as a conformance case",
    "degenerate always-refuse model, rejected by a positive reachability/non-vacuity requirement",
    "projection-drop mutant that omits one Bolina state or source clause"
  ],
  "gates": [
    "G0 exact source selection and authority-role classification",
    "G1 parse completeness with no silent skipped source",
    "G2 owner-visible discrepancy closure or explicit investigative assumption branch",
    "G3 deterministic obligation derivation and exact binding",
    "G4 adapter-specific preservation/drop review",
    "G5 syntax and tool validation for each generated model",
    "G6 known-good plus discriminating bad fixtures within declared finite bounds",
    "G7 separate implementation-conformance checks, especially BE-GRANT-03 and ordering",
    "G8 typed receipt closure without coverage-gap masking",
    "G9 drift/replay check",
    "G10 separate Bolina/DomainSpec owner acceptance; no automatic promotion"
  ],
  "status_vocabulary": [
    "specified",
    "observed",
    "proposed",
    "blocked",
    "absent",
    "structurally_validated",
    "model_syntax_validated",
    "counterexample_found",
    "bounded_no_counterexample",
    "finite_state_invariant_checked",
    "implementation_tested",
    "implementation_conformance_checked",
    "stale",
    "coverage_gap"
  ],
  "residue": [
    "Exact BE-GRANT clause-to-obligation mappings require the Bolina explorer's authoritative selectors.",
    "Tool semantics and the final one-tool-versus-two-tool decision require the formal-method explorer.",
    "No current DomainSpec source establishes a validated Alloy/TLA model, extractor, solver run, or typed formal receipt.",
    "The selected DomainSpec documents themselves illustrate drift risk: accepted research reports a live 30-signature authority while the imported formalization README mentions 31; root authority was outside this lane and the mismatch was not resolved.",
    "No product, authority, inventory, or receipt file was mutated."
  ]
}

## Connections

- derives → [./findings.md](./findings.md)
