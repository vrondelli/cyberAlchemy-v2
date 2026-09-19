/**
 * DomainSpec concept anchors.
 * Auto-generated from docs/registry.json to provide deterministic concept-to-code bindings.
 */

// @biz What | type: key-aspects
export const conceptAnchor_001 = "What";

// @biz Start session, receive access token | type: login-issueaccesstoken-sessionlifecycle-tokenlifecycle
export const conceptAnchor_002 = "Start session, receive access token";

// @biz Verify bearer token, build auth context | type: authenticaterequest-jwtclaimstoauthcontext-authcontext
export const conceptAnchor_003 = "Verify bearer token, build auth context";

// @biz Enforce route permission (deny-overrides) | type: authorizerequest-permissionresolutionpolicy-accessdenied
export const conceptAnchor_004 = "Enforce route permission (deny-overrides)";

// @biz Terminate session, revoke tokens | type: logout-tokenrevoked-logoutcompleted
export const conceptAnchor_005 = "Terminate session, revoke tokens";

// @biz Inspect token state with inactive reason | type: introspecttoken-level-reason-precedence
export const conceptAnchor_006 = "Inspect token state with inactive reason";

// @biz List permission keys for admin UI | type: getpermissioncatalog-namespace-deprecated-filter
export const conceptAnchor_007 = "List permission keys for admin UI";

// @biz Auto-seed admin + role grants on boot | type: seedsystembootstrap-roledefinition-permissiongrant
export const conceptAnchor_008 = "Auto-seed admin + role grants on boot";

// @biz Depends On | type: via
export const conceptAnchor_009 = "Depends On";

// @biz shared | type: contains
export const conceptAnchor_010 = "shared";

// @biz Consumes Capability | type: via
export const conceptAnchor_011 = "Consumes Capability";

// @biz Authenticate Request, Authorize Request | type: operation
export const conceptAnchor_012 = "Authenticate Request, Authorize Request";

// @biz Authorize Request | type: mapping
export const conceptAnchor_013 = "Authorize Request";

// @biz Browse Permission Catalog | type: query
export const conceptAnchor_014 = "Browse Permission Catalog";

// @biz Implementation Found | type: domainspec-added
export const conceptAnchor_015 = "Implementation Found";

// @biz yes | type: yes
export const conceptAnchor_016 = "yes";

// @biz partial strategy docs | type: no-domainspec-set-yet
export const conceptAnchor_017 = "partial strategy docs";

// @biz financial-settlement.SettlementResult | type: value-object
export const conceptAnchor_018 = "financial-settlement.SettlementResult";

// @biz financial-settlement.GenerateSettlement | type: operation
export const conceptAnchor_019 = "financial-settlement.GenerateSettlement";

// @biz financial-settlement.ApplyMakeupPolicy | type: policy
export const conceptAnchor_020 = "financial-settlement.ApplyMakeupPolicy";

// @biz financial-settlement.SettlementExecutionState | type: state-machine
export const conceptAnchor_021 = "financial-settlement.SettlementExecutionState";

// @biz financial-settlement.SettlementAPI | type: interface
export const conceptAnchor_022 = "financial-settlement.SettlementAPI";

// @biz financial-settlement.GetSettlementPreview | type: query
export const conceptAnchor_023 = "financial-settlement.GetSettlementPreview";

// @biz financial-settlement.SettlementGenerated | type: event
export const conceptAnchor_024 = "financial-settlement.SettlementGenerated";

// @biz financial-settlement.PayoutCreated | type: event
export const conceptAnchor_025 = "financial-settlement.PayoutCreated";

// @biz financial-settlement.SettlementRequestToInput | type: mapping
export const conceptAnchor_026 = "financial-settlement.SettlementRequestToInput";

// @biz financial-settlement.SettlementWorkflow | type: workflow
export const conceptAnchor_027 = "financial-settlement.SettlementWorkflow";

// @biz player-makeup.MakeupBalance | type: value-object
export const conceptAnchor_028 = "player-makeup.MakeupBalance";

// @biz player-makeup.MakeupPolicy | type: value-object
export const conceptAnchor_029 = "player-makeup.MakeupPolicy";

// @biz player-makeup.MakeupOperationType | type: enum
export const conceptAnchor_030 = "player-makeup.MakeupOperationType";

// @biz player-makeup.AdjustPlayerMakeup | type: operation
export const conceptAnchor_031 = "player-makeup.AdjustPlayerMakeup";

// @biz player-makeup.GetPlayerMakeup | type: query
export const conceptAnchor_032 = "player-makeup.GetPlayerMakeup";

// @biz player-makeup.GetPlayerMakeupHistory | type: query
export const conceptAnchor_033 = "player-makeup.GetPlayerMakeupHistory";

// @biz player-makeup.GetMakeupPolicy | type: query
export const conceptAnchor_034 = "player-makeup.GetMakeupPolicy";

// @biz player-makeup.MakeupDebtState | type: state-machine
export const conceptAnchor_035 = "player-makeup.MakeupDebtState";

// @biz player-makeup.MakeupAPI | type: interface
export const conceptAnchor_036 = "player-makeup.MakeupAPI";

// @biz player-makeup.PlayerDirectoryAPI | type: interface
export const conceptAnchor_037 = "player-makeup.PlayerDirectoryAPI";

// @biz player-makeup.MakeupAdjusted | type: event
export const conceptAnchor_038 = "player-makeup.MakeupAdjusted";

// @biz player-makeup.MakeupApplied | type: event
export const conceptAnchor_039 = "player-makeup.MakeupApplied";

// @biz player-makeup.MakeupAdjustmentWorkflow | type: workflow
export const conceptAnchor_040 = "player-makeup.MakeupAdjustmentWorkflow";

// @biz player-makeup.SettlementMakeupApplicationContract | type: workflow
export const conceptAnchor_041 = "player-makeup.SettlementMakeupApplicationContract";

// @biz Register player + flat list | type: createplayer-getallplayers-post-players-get-players
export const conceptAnchor_042 = "Register player + flat list";

// @biz Portfolio projections + progression check | type: getplayersoverview-playertooverviewdto-checkprogression
export const conceptAnchor_043 = "Portfolio projections + progression check";

// @biz Register coach + list coaches | type: createcoach-getallcoaches-post-coaches-get-coaches
export const conceptAnchor_044 = "Register coach + list coaches";

// @biz Assign/unassign coach, list assigned players | type: assigncoach-unassigncoach-getcoachplayers
export const conceptAnchor_045 = "Assign/unassign coach, list assigned players";

// @biz Cross-cutting player access resolver | type: resolveplayervisibility-makeup-stats-consumers
export const conceptAnchor_046 = "Cross-cutting player access resolver";

// @biz [auth-access-control.AuthorizeRequest](../auth-access-control/operations.md#authorizerequest) | type: operation
export const conceptAnchor_047 = "[auth-access-control.AuthorizeRequest](../auth-access-control/operations.md#authorizerequest)";

// @biz [player-stats.GetPlayerStatsWindow](../player-stats/queries.md#getplayerstatswindow) | type: query
export const conceptAnchor_048 = "[player-stats.GetPlayerStatsWindow](../player-stats/queries.md#getplayerstatswindow)";

// @biz [player-makeup](../player-makeup/SPEC.md) | type: contains
export const conceptAnchor_049 = "[player-makeup](../player-makeup/SPEC.md)";

// @biz [player-progression.CheckProgression](../player-progression/SPEC.md) | type: delegates
export const conceptAnchor_050 = "[player-progression.CheckProgression](../player-progression/SPEC.md)";

// @biz List All Players | type: query
export const conceptAnchor_051 = "List All Players";

// @biz Players Overview | type: interface
export const conceptAnchor_052 = "Players Overview";

// @biz Resolve Player Visibility | type: query
export const conceptAnchor_053 = "Resolve Player Visibility";

// @biz List Coach Players | type: interface
export const conceptAnchor_054 = "List Coach Players";

// @biz player-onboarding.CandidateApplication | type: entity
export const conceptAnchor_055 = "player-onboarding.CandidateApplication";

// @biz player-onboarding.RuleAcceptance | type: value-object
export const conceptAnchor_056 = "player-onboarding.RuleAcceptance";

// @biz player-onboarding.ApplicationStatus | type: enum-type
export const conceptAnchor_057 = "player-onboarding.ApplicationStatus";

// @biz player-onboarding.SubmitCandidateApplication | type: operation
export const conceptAnchor_058 = "player-onboarding.SubmitCandidateApplication";

// @biz player-onboarding.ReviewCandidateApplication | type: operation
export const conceptAnchor_059 = "player-onboarding.ReviewCandidateApplication";

// @biz player-onboarding.CandidateApplicationState | type: state-machine
export const conceptAnchor_060 = "player-onboarding.CandidateApplicationState";

// @biz player-onboarding.CandidateApplicationSubmitted | type: event
export const conceptAnchor_061 = "player-onboarding.CandidateApplicationSubmitted";

// @biz player-onboarding.CandidateApplicationReviewed | type: event
export const conceptAnchor_062 = "player-onboarding.CandidateApplicationReviewed";

// @biz player-onboarding.PublicOnboardingAPI | type: interface
export const conceptAnchor_063 = "player-onboarding.PublicOnboardingAPI";

// @biz player-onboarding.SubmitCandidateRequestToEntity | type: mapping
export const conceptAnchor_064 = "player-onboarding.SubmitCandidateRequestToEntity";

// @biz player-onboarding.CandidateOnboardingFlow | type: workflow
export const conceptAnchor_065 = "player-onboarding.CandidateOnboardingFlow";

// @biz player-onboarding.RuleScreenGroupingPolicy | type: policy
export const conceptAnchor_066 = "player-onboarding.RuleScreenGroupingPolicy";

// @biz [player-management.GetAllPlayers](../player-management/queries.md#getallplayers) | type: query
export const conceptAnchor_067 = "[player-management.GetAllPlayers](../player-management/queries.md#getallplayers)";

// @biz [player-management.Player](../player-management/domain.md#player) | type: query-optional
export const conceptAnchor_068 = "[player-management.Player](../player-management/domain.md#player)";

// @biz Get Player Stats Window | type: query
export const conceptAnchor_069 = "Get Player Stats Window";

// @biz Get Player Stats History | type: interface
export const conceptAnchor_070 = "Get Player Stats History";
