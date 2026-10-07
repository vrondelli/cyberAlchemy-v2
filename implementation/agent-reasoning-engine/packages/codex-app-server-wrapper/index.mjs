// Candidate public API. All decisions and receipts remain non-authorizing.
export {createInteractionReview} from "./src/interaction-review.mjs";
export {validateInteractionHostRequest, materializeInteractionHostInput, interactionHostMessage, learningRequestRef, INTERACTION_HOST_CONTEXT_KEY} from "./src/interaction-host.mjs";
export {loadRepositoryProfile} from "./src/config.mjs";
export {
  REPOSITORY_RUNTIME_BUNDLE_SCHEMA,
  compileRepositoryRuntimeBundle,
  computeRepositoryRuntimeBundleDigest,
  loadVerifiedRepositoryRuntimeBundle,
} from "./src/repository-runtime-bundle.mjs";
export {classifyBackendDiagnostic} from "./src/diagnostics.mjs";
export {materializeDefinitionCatalog, materializeOntologySnapshot} from "./src/source-adapters.mjs";
export {evaluateTurnPreflight} from "./src/preflight.mjs";
export {buildRequestContext, REQUEST_CONTEXT_KEY} from "./src/request-context.mjs";
export {evaluateEffectRequest, bindApprovalResponse} from "./src/effect-boundary.mjs";
export {createGatewayHostedEffectAssessor, createHostedEffectApprovalAdapter, createHostedEffectBroker,
  createHostedEffectDynamicToolHandler} from "./src/hosted-effect-broker.mjs";
export {createFileHostedEffectJournal} from "./src/hosted-effect-journal.mjs";
export {materializeHostedCommandExec} from "./src/hosted-effect-command.mjs";
export {
  evaluateDualLaneContinuation,
  isContinuationReference,
  materializeObjectiveFrontier,
  normalizeContinuationProposals,
  projectObjectiveFrontierForTurnStart,
} from "./src/continuation.mjs";
export {createEvidenceLedger} from "./src/evidence-ledger.mjs";
export {
  addContinuityContext,
  CONTINUITY_CANDIDATE_REF,
  CONTINUITY_CONTEXT_KEY,
  CONTINUITY_LEARNING_PACKAGE_DIGEST,
  CONTINUITY_OWNER_DECISION_DIGEST,
  CONTINUITY_PROJECTION_SCHEMA,
  materializeContinuityProjection,
  renderDeterministicContinuity,
  validContinuityRendererConfiguration,
} from "./src/continuity-renderer.mjs";
export {
  CONTINUITY_HOST_RECEIPT_SCHEMA,
  createContinuityHostConsumer,
  validateContinuityNotification,
} from "./src/continuity-consumer.mjs";
export {
  CONTINUITY_BINDING_RECEIPT_SCHEMA,
  CONTINUITY_BINDING_SNAPSHOT_SCHEMA,
  createContinuityBindingProvider,
  loadContinuityBindingSnapshot,
  materializeContinuityBindingSnapshot,
  resolveContinuityBindingProvider,
  validateContinuityBindingSnapshot,
} from "./src/continuity-binding-provider.mjs";
export {
  CONTINUITY_ACTIVATION_MANIFEST_SCHEMA,
  CONTINUITY_ACTIVATION_RECEIPT_SCHEMA,
  loadContinuityActivationManifest,
  materializeContinuityActivationManifest,
  resolveContinuityActivation,
  resolveEntrypointContinuity,
  validateContinuityActivationManifest,
} from "./src/continuity-activation.mjs";
export {createCodexAppServerWrapper} from "./src/wrapper.mjs";
export {
  acquireReasoningStateWriterLock,
  inspectReasoningStateWriterLock,
  bindCacheTelemetryObservation,
  appendReasoningCounterevidence,
  appendReasoningStateReduction,
  assessReasoningStateTransition,
  checkpointReasoningStateByRisk,
  compareReasoningProvenance,
  createAppendOnlyFileReasoningStateSink,
  createMemoryReasoningStateSink,
  createReasoningStateLedger,
  createReasoningStateBranch,
  deriveReasoningReplayFixture,
  executeReasoningStateTransition,
  exportPortableReasoningEpoch,
  importPortableReasoningEpoch,
  materializeCacheAffinityProjection,
  materializeContextBoundCacheAffinityProjection,
  REASONING_CACHE_TELEMETRY_OBSERVATION_SCHEMA,
  planReasoningStateTransition,
  getReasoningStateFrontier,
  getReasoningStateEpoch,
  listReasoningStateFrontiers,
  listReasoningStateEpochs,
  rebuildReasoningStateIndexes,
  recoverReasoningStateLedger,
  selectReasoningCheckpointPolicy,
  selectReusableCounterevidence,
  sealReasoningStateFrontier,
  selectRecoverableCheckpoint,
  verifyReasoningStateFrontier,
  verifyReasoningStateTransitionPlan,
  verifyReasoningStateTransitionReceipt,
  verifyReasoningReplayFixture,
  verifyPortableReasoningEpoch,
  verifyReasoningStateLog,
} from "../reasoning-state-runtime/index.mjs";
export {
  assessReasoningEvolution,
  composeReasoningEvolution,
  loadReasoningPolicy,
  materializeContextReductionPlan,
} from "../reasoning-policy-runtime/index.mjs";
export {CODEX_SEMANTIC_COMPLETION_SCHEMA, evaluateSemanticCompletion} from "./src/semantic-completion.mjs";
export {CODEX_EVOLUTION_SIGNAL_EMISSION_SCHEMA, emitCompletionImprovementSignals} from "./src/evolution-signals.mjs";
export {addIntentLifecycleContext, CODEX_INTENT_LIFECYCLE_SCHEMA, INTENT_CONTEXT_KEY, prepareCodexIntentLifecycle} from "./src/intent-lifecycle.mjs";
export {
  deriveReasoningReceiptConstraints,
  isVerifiedReasoningReceiptConstraints,
  REASONING_RECEIPT_CONSTRAINT_SCHEMA,
} from "./src/reasoning-receipt-constraints.mjs";
export {runStdioProxy} from "./src/stdio-proxy.mjs";
export {resolveBackendCommand, spawnCodexBackend} from "./src/backend.mjs";
export {ADAPTER_OBSERVATION_SCHEMA, projectAdapterObservation} from "./src/adapter-observation.mjs";
export {readAdapterObservation} from "./src/adapter-observation-client.mjs";
export {GATEWAY_THREAD_OBSERVATION_SCHEMA, projectGatewayThreadObservation, projectWrapperReasoningThreads} from "./src/thread-observation.mjs";
export {readGatewayThreadObservation} from "./src/thread-observation-client.mjs";
export {GATEWAY_DECISION_OBSERVATION_SCHEMA, projectGatewayDecisionObservation, projectWrapperDecisionTrace} from "./src/decision-observation.mjs";
export {readGatewayDecisionObservation} from "./src/decision-observation-client.mjs";
export {
  createCodexGatewayBackendAdapter,
  createJsonLineProcessBackendAdapter,
  GATEWAY_BACKEND_ADAPTER_SCHEMA,
  GATEWAY_BACKEND_CAPABILITIES_SCHEMA,
  gatewayBackendCapabilities,
  spawnGatewayBackend,
  validateGatewayBackendAdapter,
} from "./src/backend-adapter.mjs";
export {
  classifyGatewayTurnLifecycle,
  GATEWAY_BACKEND_LIFECYCLE_SCHEMA,
  inspectGatewayBackendLifecycle,
  validateGatewayBackendLifecycle,
} from "./src/backend-lifecycle-contract.mjs";
export {
  CONVERSATION_BINDING_EVENT_SCHEMA,
  CONVERSATION_BINDING_SCHEMA,
  createConversationBindingContract,
  createGatewayBackedConversationBindingContract,
} from "./src/conversation-binding-contract.mjs";
export {
  ACKNOWLEDGED_CONTINUITY_MODE,
  createPersistentGateway,
  GATEWAY_ACK_SCHEMA,
  GATEWAY_CONNECT_SCHEMA,
  GATEWAY_CONNECTED_SCHEMA,
  GATEWAY_DELIVERY_SCHEMA,
  GATEWAY_TURN_RECOVERY_GET,
  GATEWAY_TURN_RECOVERY_CONFIRM,
  GATEWAY_TURN_RECOVERY_SCHEMA,
  GATEWAY_STEER_OUTCOME_GET,
  GATEWAY_STEER_OUTCOME_SCHEMA,
  GATEWAY_THREAD_CREATION_RECOVERY_GET,
  GATEWAY_THREAD_CREATION_RECOVERY_CONFIRM,
  GATEWAY_THREAD_CREATION_RECOVERY_SCHEMA,
  GATEWAY_OWNED_RUNTIME_GET,
  GATEWAY_OWNED_RUNTIME_SCHEMA,
  GATEWAY_SESSION_EXPIRATION_SCHEMA,
  GATEWAY_REQUEST_META_KEY,
  THREAD_OBSERVATION_REQUEST_SCHEMA,
  THREAD_OBSERVATION_RESPONSE_SCHEMA,
} from "./src/gateway.mjs";
export {deriveGatewayReasoningStateProfile} from "./src/gateway-reasoning-state.mjs";
export {CACHE_TELEMETRY_EXTRACTION_SCHEMA, compareProviderCacheObservations, extractProviderCacheUsage, PROVIDER_CACHE_USAGE_SCHEMA} from "./src/cache-telemetry.mjs";
export {
  CODEX_CONTEXT_WINDOW_OBSERVATION_SCHEMA,
  CODEX_CONTEXT_WINDOW_TELEMETRY_SCHEMA,
  createCodexContextWindowTracker,
  extractCodexContextWindowObservation,
} from "./src/context-window-telemetry.mjs";
export {
  createFileGatewaySessionStore,
  createMemoryGatewaySessionStore,
  GATEWAY_SESSION_EVENT_SCHEMA,
  GATEWAY_SESSION_INDEX_SCHEMA,
  inspectFileGatewaySessionStoreWriterLock,
} from "./src/gateway-session-store.mjs";
export {runGatewayClientProxy} from "./src/gateway-client.mjs";
export {connectGatewayRpcTransport} from "./src/gateway-client.mjs";
export {AppServerRpcError, createAppServerRpcClient, spawnAppServerRpcTransport} from "./src/rpc-client.mjs";
export {
  createApprovalBroker,
  createElicitationBroker,
  createUserInputBroker,
  createWindowsClientHost,
  WINDOWS_CLIENT_EVENT_SCHEMA,
  WINDOWS_CLIENT_STATE_SCHEMA,
} from "./src/windows-client-host.mjs";
export {createWindowsClientRecoveryState, WINDOWS_CLIENT_RECOVERY_SCHEMA} from "./src/windows-client-recovery-state.mjs";
// The POSIX single-writer record also serves other acknowledged gateway clients.
export {createWindowsClientRecoveryState as createGatewayClientRecoveryState} from "./src/windows-client-recovery-state.mjs";
export * from "./src/protocol.mjs";
