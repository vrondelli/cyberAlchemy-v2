export {
  AUTHORITY_EFFECT,
  CLI_IDENTITY,
  CLI_PACKAGE_NAME,
  CLI_VERSION,
  FOUNDATION_CONTRACT_SCHEMA,
  SUPPORTED_ARCH,
  SUPPORTED_NODE_VERSION,
  SUPPORTED_PLATFORM
} from "./version.js";

export { runCli, type CliIo } from "./cli/main.js";
export {
  addCalculation,
  addMapping,
  addOperation,
  addPolicy,
  addQuery,
  addRule,
  addThinBackend,
  SourceAuthoringError,
  type AddCalculationInput,
  type AddCalculationResult,
  type AddMappingInput,
  type AddMappingResult,
  type AddOperationInput,
  type AddOperationResult,
  type AddPolicyInput,
  type AddPolicyResult,
  type AddQueryInput,
  type AddQueryResult,
  type AddRuleInput,
  type AddRuleResult,
  type AddThinBackendInput,
  type AddThinBackendResult,
  type ThinBackendKind,
} from "./authoring/add-operation.js";
export {
  observeTarget,
  observeTargetReceipt,
  ConformanceError,
  type TargetObservationV1,
  type TargetObservationFailureV1,
  type TargetObservationReceiptV1,
} from "./conformance/observe-target.js";
export {
  readInstantiationReceipt,
  validateInstantiationReceipt,
  ReceiptError,
  type InstantiationReceiptV1,
} from "./conformance/receipt.js";
export { planInstantiation } from "./generation/plan-instantiation.js";
export { publishInstantiation, PublicationError, type PublicationResult } from "./generation/publish-instantiation.js";
export { planProjectInstantiation, ProjectInstantiationError, type ProjectInstantiationPlanV1 } from "./generation/project-instantiation.js";
export { publishProjectInstantiation, type ProjectPublicationReceiptV1, type ProjectPublicationResult } from "./generation/publish-project.js";
export {
  planProjectBuild,
  publishProjectBuild,
  verifyProjectBuild,
  ProjectBuildError,
  type ProjectBuildPlanV1,
  type ProjectBuildReceiptV1,
  type ProjectBuildVerificationV1,
} from "./generation/project-build.js";
export {
  compileProject,
  createCompiledProjectCertificate,
  materializeCompiledProjectCertificate,
  validateCompiledProjectCertificate,
  CompilationCertificateError,
  type CompiledProjectCertificateV1,
} from "./compilation/certificate.js";
export {
  checkLeanMetaTypeFormalization,
  createMetaTypeFormalizationProjection,
  formalizationProjectionSha256,
  materializeLeanMetaTypeFormalization,
  renderLeanMetaTypeFormalization,
  FormalizationProjectionError,
  type FormalizationMaterializationResult,
  type FormalizationRenderPayload,
  type MetaTypeFormalizationProjection,
  type ObligationFamily,
} from "./formalization/projection.js";
export {
  CompilerRefinementError,
  validateGraphBoundCertificate,
  type CompilerRefinementOutput,
  type FormalizationSourceIdentity,
  type GraphBoundCertificate,
  type TypeScriptProjectionPayload,
} from "./formalization/refinement.js";
export { FORMALIZATION_LEAN_MODULE_FILENAMES, formalizationLeanModuleSources } from "./formalization/kernel.js";
export {
  createCheckedInterchange,
  validateCheckedInterchange,
  CheckedInterchangeError,
  type CheckedInterchangeV1,
} from "./assurance/checked-interchange.js";
export {
  certifyProject,
  checkCertifiedProject,
  CertificationError,
  CERTIFY_LEAN_TOOLCHAIN,
  CERTIFY_LEAN_VERSION,
  type AssuranceCertificateV1,
  type CertificationCheckV1,
} from "./assurance/certify.js";
export {
  loadCompiledProjectGraph,
  loadProjectNode,
  evaluateCompiledObligationWitness,
  validateCompiledProjectGraphObligations,
  ProjectModelError,
  type CompiledProjectGraph,
  type CompiledObligationApplicability,
  type CompiledObligationOutcome,
  type CompiledRelationshipObligationWitness,
  type DecodedProjectNode,
} from "./input/project-model.js";
export { FROZEN_META_TYPE_CATALOG, selectRealization } from "./meta-types/catalog.js";
export {
  FROZEN_RELATIONSHIP_AUTHORITY,
  RELATIONSHIP_AUTHORITY_SHA256,
  RELATIONSHIP_SIGNATURES,
  RelationshipAuthorityError,
  deprecatedRelationship,
  generatedRelationshipView,
  relationshipSignature,
} from "./relationships/authority.js";
export {
  SystemIntegrationError,
  compileSystemIntegrationManifest,
  generatedSystemIntegrationPath,
  loadSystemIntegrationSelection,
  renderSystemIntegrationContract,
  validateSystemIntegrationBindingSet,
  validateSystemIntegrationManifest,
} from "./system-integration/compiler.js";
export { FROZEN_SYSTEM_INTEGRATION, validateFrozenSystemIntegrationProfile } from "./system-integration/profile.js";
export {
  AUTHORING_META_TYPES,
  CLI_HELP,
  COMPILED_META_TYPES,
  EXPERIMENTAL_COMMANDS,
  PRODUCT_CAPABILITIES,
  STABLE_COMMANDS,
  inspectProductEnvironment,
  type ProductDoctorCheck,
} from "./product/capabilities.js";
export type {
  SystemIntegrationBindingManifestV1,
  SystemIntegrationProfileV1,
  SystemIntegrationReceiptBindingV1,
  SystemIntegrationSelectionV1,
} from "./system-integration/types.js";
export {
  DEPLOYMENT_RECIPE_TARGET,
  DeploymentRecipeError,
  decodeDeploymentRecipeRequest,
  parseDeploymentRecipeRequestJson,
  readDeploymentRecipeRequest,
  type DeploymentRecipeArtifactV1,
  type DeploymentRecipeBindingV1,
  type DeploymentRecipeManifestV1,
  type DeploymentRecipeMessageV1,
  type DeploymentRecipePlanV1,
  type DeploymentRecipeReceiptV1,
  type DeploymentRecipeRequestV1,
  type DeploymentRecipeComponentV1,
} from "./recipe/contracts.js";
export { planDeploymentRecipe, deploymentRecipePlanSummary } from "./recipe/plan.js";
export {
  publishDeploymentRecipe,
  verifyDeploymentRecipe,
  validateDeploymentRecipeReceipt,
  type DeploymentRecipePublicationV1,
  type DeploymentRecipeVerificationV1,
} from "./recipe/publish.js";
export {
  RECIPE_QUALIFICATION_LEVEL,
  RECIPE_QUALIFICATION_ONTOLOGY,
  RECIPE_QUALIFICATION_ADAPTER_PROTOCOL,
  RECIPE_QUALIFICATION_TERRAFORM_IMAGE,
  RECIPE_QUALIFICATION_DOCKER_IMAGE,
  RECIPE_QUALIFICATION_REQUIRED_CHECKS,
  RecipeQualificationError,
  createRecipeQualificationProfile,
  decodeRecipeQualificationProfile,
  parseRecipeQualificationProfileJson,
  readRecipeQualificationProfile,
  type RecipeQualificationCertificateV1,
  type RecipeQualificationPlanV1,
  type RecipeQualificationProfileV1,
  type RecipeQualificationResult,
  type RecipeQualificationRunReceiptV1,
} from "./qualification/contracts.js";
export { planRecipeQualification, recipeQualificationPlanSummary } from "./qualification/plan.js";
export {
  qualifyDeploymentRecipe,
  verifyRecipeQualification,
  type RecipeQualificationPublicationV1,
  type RecipeQualificationToolBindings,
  type RecipeQualificationVerificationV1,
} from "./qualification/execute.js";

export { EXACT_UINT64_PROFILE } from "./generation/exact-uint64.js";

export { DECLARATIVE_FUNCTION_PROFILE, compileDeclarativeFunction, type DeclarativeFunctionContract } from './typed-backend/declarative-function.js';
