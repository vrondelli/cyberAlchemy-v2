import { createHash } from "node:crypto";
import { readFileSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

export const OPERATION_PROFILE_PROPERTY_IDS = [
  "APE.ImplementationProperty.operation.outcome-cohesion",
  "APE.ImplementationProperty.operation.value-effect-placement",
  "APE.ImplementationProperty.operation.hof-direction",
  "APE.ImplementationProperty.operation.role-contract-specificity",
  "APE.ImplementationProperty.operation.repository-boundary",
  "APE.ImplementationProperty.operation.unit-of-work-boundary",
  "APE.ImplementationProperty.operation.event-handler-stage",
  "APE.ImplementationProperty.operation.durable-intent-stage",
  "APE.ImplementationProperty.operation.external-transport-stage",
  "APE.ImplementationProperty.operation.cost-observation",
  "APE.ImplementationProperty.operation.traversal-equivalence",
  "APE.ImplementationProperty.operation.pure-rule-placement",
  "APE.ImplementationProperty.operation.instrumentation-placement",
] as const;

export type OperationProfilePropertyId =
  (typeof OPERATION_PROFILE_PROPERTY_IDS)[number];

export const OPERATION_DEPENDENCY_ROLES = [
  "repository",
  "unit-of-work",
  "event-handler",
  "outbox-repository",
  "transporter",
  "client",
  "clock",
  "generator",
  "hasher",
  "codec",
  "metrics-recorder",
  "typed-config",
] as const;

export type OperationDependencyRole =
  (typeof OPERATION_DEPENDENCY_ROLES)[number];

export type OperationEvidenceState =
  | "pass"
  | "fail"
  | "missing"
  | "unsupported"
  | "owner-blocked"
  | "block";

export type OperationObserverDiagnostic =
  | "AOP_OBSERVER_SOURCE_PATH_ESCAPE"
  | "AOP_OBSERVER_SOURCE_MISSING"
  | "AOP_OBSERVER_SOURCE_STALE"
  | "AOP_OBSERVER_INPUT_INVALID"
  | "AOP_DEPENDENCY_PASS"
  | "AOP_DEPENDENCY_FACTORY_MISSING"
  | "AOP_DEPENDENCY_RETURN_CALLABLE_MISSING"
  | "AOP_DEPENDENCY_ROLE_MISSING"
  | "AOP_DEPENDENCY_GENERIC_CONTRACT"
  | "AOP_DEPENDENCY_CONCRETE_PROVIDER_IMPORT"
  | "AOP_DEPENDENCY_SERVICE_LOCATOR"
  | "AOP_DEPENDENCY_COMPOSITION_BINDING_MISSING"
  | "AOP_DEPENDENCY_DYNAMIC_UNSUPPORTED";

export interface LockedSourceInput {
  repoRoot: string;
  sourceRef: string;
  sourceDigest: string;
}

export interface LockedTextSource {
  sourceRef: string;
  sourceDigest: string;
  text: string;
}

export type LockedSourceResult =
  | {
      result: "pass";
      diagnostic: "AOP_DEPENDENCY_PASS";
      selector: string;
      source: LockedTextSource;
    }
  | {
      result: "block" | "missing";
      diagnostic:
        | "AOP_OBSERVER_SOURCE_PATH_ESCAPE"
        | "AOP_OBSERVER_SOURCE_MISSING"
        | "AOP_OBSERVER_SOURCE_STALE"
        | "AOP_OBSERVER_INPUT_INVALID";
      selector: string;
      expectedDigest?: string;
      actualDigest?: string;
    };

export interface ExpectedOperationDependency {
  parameterName: string;
  contractName: string;
  role: OperationDependencyRole;
  consumerContractRef: string;
}

export interface CompositionBindingEvidence {
  parameterName: string;
  role: OperationDependencyRole;
  adapterRef: string;
  adapterDigest: string | null;
  suppliedAtCompositionRoot: boolean;
}

export interface OperationDependencyObserverInput {
  source: LockedSourceInput;
  factoryName: string;
  expectedDependencies: readonly ExpectedOperationDependency[];
  compositionBindings: readonly CompositionBindingEvidence[];
  forbiddenConcreteImportPatterns: readonly string[];
  dynamicResolutionPatterns?: readonly string[];
}

export interface PacketImplementationBinding {
  implementation_binding_id: string;
  dependency_role: OperationDependencyRole;
  consumer_contract_ref: string;
  adapter_ref: string;
  adapter_digest: string | null;
}

export interface PacketObservationProjection {
  observation_id: string;
  projection_kind: "observed" | "unsupported";
  property_id: OperationProfilePropertyId;
  implementation_binding_id: string;
  source_ref: string;
  source_digest: string;
  observed_value: Record<string, unknown>;
  provenance_ref: string;
}

export interface DependencyObservationResult {
  result: OperationEvidenceState;
  diagnostic: OperationObserverDiagnostic;
  selector: string;
  factoryName: string;
  imports: readonly string[];
  parameters: readonly { name: string; typeName: string; optional: boolean }[];
  bindings: readonly PacketImplementationBinding[];
  observations: readonly PacketObservationProjection[];
  runtimeGuaranteeClaimed: false;
}

const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function sha256(bytes: string | Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function orderedStringDigest(values: readonly string[]): string {
  return sha256(`${values.join("\n")}\n`);
}

function referencePath(ref: string): string {
  const marker = ref.indexOf("#");
  return marker === -1 ? ref : ref.slice(0, marker);
}

function sourceFailure(
  result: "block" | "missing",
  diagnostic: Exclude<LockedSourceResult, { result: "pass" }> ["diagnostic"],
  selector: string,
  expectedDigest?: string,
  actualDigest?: string,
): LockedSourceResult {
  return {
    result,
    diagnostic,
    selector,
    ...(expectedDigest === undefined ? {} : { expectedDigest }),
    ...(actualDigest === undefined ? {} : { actualDigest }),
  };
}

export function loadLockedTextSource(
  input: LockedSourceInput,
  selector = "$.source",
): LockedSourceResult {
  if (
    typeof input.repoRoot !== "string" ||
    input.repoRoot.length === 0 ||
    typeof input.sourceRef !== "string" ||
    input.sourceRef.length === 0 ||
    !SHA256_PATTERN.test(input.sourceDigest)
  ) {
    return sourceFailure("block", "AOP_OBSERVER_INPUT_INVALID", selector);
  }

  const pathPart = referencePath(input.sourceRef);
  if (
    pathPart.length === 0 ||
    pathPart.includes("\\") ||
    pathPart.includes("\0") ||
    isAbsolute(pathPart)
  ) {
    return sourceFailure(
      "block",
      "AOP_OBSERVER_SOURCE_PATH_ESCAPE",
      `${selector}.sourceRef`,
    );
  }

  const root = resolve(input.repoRoot);
  const target = resolve(root, pathPart);
  const lexicalRelative = relative(root, target);
  if (
    lexicalRelative === "" ||
    lexicalRelative === ".." ||
    lexicalRelative.startsWith(`..${sep}`) ||
    isAbsolute(lexicalRelative)
  ) {
    return sourceFailure(
      "block",
      "AOP_OBSERVER_SOURCE_PATH_ESCAPE",
      `${selector}.sourceRef`,
    );
  }

  let bytes: Buffer;
  try {
    if (!statSync(target).isFile()) {
      return sourceFailure(
        "missing",
        "AOP_OBSERVER_SOURCE_MISSING",
        selector,
        input.sourceDigest,
        "missing",
      );
    }
    const realRoot = realpathSync(root);
    const realTarget = realpathSync(target);
    const physicalRelative = relative(realRoot, realTarget);
    if (
      physicalRelative === "" ||
      physicalRelative === ".." ||
      physicalRelative.startsWith(`..${sep}`) ||
      isAbsolute(physicalRelative)
    ) {
      return sourceFailure(
        "block",
        "AOP_OBSERVER_SOURCE_PATH_ESCAPE",
        `${selector}.sourceRef`,
      );
    }
    bytes = readFileSync(realTarget);
  } catch {
    return sourceFailure(
      "missing",
      "AOP_OBSERVER_SOURCE_MISSING",
      selector,
      input.sourceDigest,
      "missing",
    );
  }

  const actualDigest = sha256(bytes!);
  if (actualDigest !== input.sourceDigest) {
    return sourceFailure(
      "block",
      "AOP_OBSERVER_SOURCE_STALE",
      selector,
      input.sourceDigest,
      actualDigest,
    );
  }

  return {
    result: "pass",
    diagnostic: "AOP_DEPENDENCY_PASS",
    selector,
    source: {
      sourceRef: input.sourceRef,
      sourceDigest: actualDigest,
      text: bytes!.toString("utf8"),
    },
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function importedModules(source: string): string[] {
  const modules: string[] = [];
  const importFrom = /^\s*import(?:\s+type)?\s+[\s\S]*?\s+from\s+["']([^"']+)["'];?/gm;
  const sideEffect = /^\s*import\s+["']([^"']+)["'];?/gm;
  for (const pattern of [importFrom, sideEffect]) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source)) !== null) modules.push(match[1]);
  }
  return [...new Set(modules)].sort();
}

function factorySignature(
  source: string,
  factoryName: string,
): { parameterSource: string; returnsCallable: boolean } | null {
  const name = escapeRegExp(factoryName);
  const pattern = new RegExp(
    `(?:export\\s+)?const\\s+${name}\\s*=\\s*\\(([\\s\\S]*?)\\)\\s*=>\\s*((?:async\\s*)?\\()`,
    "m",
  );
  const match = pattern.exec(source);
  if (match === null) return null;
  return { parameterSource: match[1], returnsCallable: match[2].includes("(") };
}

function splitParameters(source: string): string[] {
  const results: string[] = [];
  let start = 0;
  let depth = 0;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if ("<({[".includes(character)) depth += 1;
    if (">)}]".includes(character)) depth = Math.max(0, depth - 1);
    if (character === "," && depth === 0) {
      results.push(source.slice(start, index));
      start = index + 1;
    }
  }
  results.push(source.slice(start));
  return results.map((part) => part.trim()).filter(Boolean);
}

function parsedParameters(
  source: string,
): Array<{ name: string; typeName: string; optional: boolean }> | null {
  const parsed: Array<{ name: string; typeName: string; optional: boolean }> = [];
  for (const part of splitParameters(source)) {
    const match = /^(?:\.\.\.)?([A-Za-z_$][\w$]*)(\?)?\s*:\s*([^=]+?)(?:\s*=\s*[\s\S]*)?$/.exec(part);
    if (match === null) return null;
    parsed.push({ name: match[1], typeName: match[3].trim(), optional: match[2] === "?" });
  }
  return parsed;
}

function compilePatterns(patterns: readonly string[]): RegExp[] | null {
  try {
    return patterns.map((pattern) => new RegExp(pattern, "u"));
  } catch {
    return null;
  }
}

function emptyResult(
  result: OperationEvidenceState,
  diagnostic: OperationObserverDiagnostic,
  selector: string,
  factoryName: string,
  imports: readonly string[] = [],
  parameters: readonly { name: string; typeName: string; optional: boolean }[] = [],
): DependencyObservationResult {
  return {
    result,
    diagnostic,
    selector,
    factoryName,
    imports,
    parameters,
    bindings: [],
    observations: [],
    runtimeGuaranteeClaimed: false,
  };
}

export function observeOperationDependencies(
  input: OperationDependencyObserverInput,
): DependencyObservationResult {
  const locked = loadLockedTextSource(input.source);
  if (locked.result !== "pass") {
    return emptyResult(
      locked.result,
      locked.diagnostic,
      locked.selector,
      input.factoryName,
    );
  }

  if (
    typeof input.factoryName !== "string" ||
    input.factoryName.length === 0 ||
    !Array.isArray(input.expectedDependencies) ||
    !Array.isArray(input.compositionBindings) ||
    !Array.isArray(input.forbiddenConcreteImportPatterns)
  ) {
    return emptyResult("block", "AOP_OBSERVER_INPUT_INVALID", "$", input.factoryName);
  }

  const expectedNames = input.expectedDependencies.map((dependency) => dependency.parameterName);
  if (new Set(expectedNames).size !== expectedNames.length) {
    return emptyResult(
      "block",
      "AOP_OBSERVER_INPUT_INVALID",
      "$.expectedDependencies",
      input.factoryName,
    );
  }

  const imports = importedModules(locked.source.text);
  const concretePatterns = compilePatterns(input.forbiddenConcreteImportPatterns);
  const dynamicPatterns = compilePatterns(
    input.dynamicResolutionPatterns ?? [
      "\\bReflect\\.get\\s*\\(",
      "\\bimport\\s*\\(",
      "\\brequire\\s*\\(\\s*[^'\"]",
    ],
  );
  if (concretePatterns === null || dynamicPatterns === null) {
    return emptyResult("block", "AOP_OBSERVER_INPUT_INVALID", "$.patterns", input.factoryName, imports);
  }

  if (/\b(?:container|serviceLocator|locator)\s*\.\s*(?:resolve|get)\s*\(/u.test(locked.source.text)) {
    return emptyResult(
      "fail",
      "AOP_DEPENDENCY_SERVICE_LOCATOR",
      "$.source",
      input.factoryName,
      imports,
    );
  }
  const concreteImportIndex = imports.findIndex((module) =>
    concretePatterns.some((pattern) => pattern.test(module)),
  );
  if (concreteImportIndex !== -1) {
    return emptyResult(
      "fail",
      "AOP_DEPENDENCY_CONCRETE_PROVIDER_IMPORT",
      `$.imports[${concreteImportIndex}]`,
      input.factoryName,
      imports,
    );
  }
  if (dynamicPatterns.some((pattern) => pattern.test(locked.source.text))) {
    return emptyResult(
      "unsupported",
      "AOP_DEPENDENCY_DYNAMIC_UNSUPPORTED",
      "$.source",
      input.factoryName,
      imports,
    );
  }

  const signature = factorySignature(locked.source.text, input.factoryName);
  if (signature === null) {
    return emptyResult(
      "missing",
      "AOP_DEPENDENCY_FACTORY_MISSING",
      `$.factoryName`,
      input.factoryName,
      imports,
    );
  }
  if (!signature.returnsCallable) {
    return emptyResult(
      "missing",
      "AOP_DEPENDENCY_RETURN_CALLABLE_MISSING",
      `$.factoryName`,
      input.factoryName,
      imports,
    );
  }
  const parameters = parsedParameters(signature.parameterSource);
  if (parameters === null) {
    return emptyResult(
      "unsupported",
      "AOP_DEPENDENCY_DYNAMIC_UNSUPPORTED",
      `$.factoryName.parameters`,
      input.factoryName,
      imports,
    );
  }

  for (let index = 0; index < input.expectedDependencies.length; index += 1) {
    const dependency = input.expectedDependencies[index];
    if (
      !OPERATION_DEPENDENCY_ROLES.includes(dependency.role) ||
      !dependency.parameterName ||
      !dependency.contractName ||
      !dependency.consumerContractRef
    ) {
      return emptyResult(
        "block",
        "AOP_OBSERVER_INPUT_INVALID",
        `$.expectedDependencies[${index}]`,
        input.factoryName,
        imports,
        parameters,
      );
    }
    if (/^(?:Dependency)?Port(?:<|$)/u.test(dependency.contractName)) {
      return emptyResult(
        "fail",
        "AOP_DEPENDENCY_GENERIC_CONTRACT",
        `$.expectedDependencies[${index}].contractName`,
        input.factoryName,
        imports,
        parameters,
      );
    }
    const parameter = parameters.find((candidate) => candidate.name === dependency.parameterName);
    if (parameter === undefined || !parameter.typeName.includes(dependency.contractName)) {
      return emptyResult(
        "missing",
        "AOP_DEPENDENCY_ROLE_MISSING",
        `$.expectedDependencies[${index}]`,
        input.factoryName,
        imports,
        parameters,
      );
    }
  }

  const bindings: PacketImplementationBinding[] = [];
  const observations: PacketObservationProjection[] = [];
  for (let index = 0; index < input.expectedDependencies.length; index += 1) {
    const dependency = input.expectedDependencies[index];
    const composition = input.compositionBindings.find(
      (candidate) => candidate.parameterName === dependency.parameterName,
    );
    if (composition === undefined || composition.role !== dependency.role) {
      return emptyResult(
        "missing",
        "AOP_DEPENDENCY_COMPOSITION_BINDING_MISSING",
        `$.compositionBindings.${dependency.parameterName}`,
        input.factoryName,
        imports,
        parameters,
      );
    }
    if (!composition.suppliedAtCompositionRoot) {
      return emptyResult(
        "fail",
        "AOP_DEPENDENCY_COMPOSITION_BINDING_MISSING",
        `$.compositionBindings.${dependency.parameterName}.suppliedAtCompositionRoot`,
        input.factoryName,
        imports,
        parameters,
      );
    }
    if (composition.adapterDigest === null || composition.adapterRef === "unsupported") {
      return emptyResult(
        "unsupported",
        "AOP_DEPENDENCY_DYNAMIC_UNSUPPORTED",
        `$.compositionBindings.${dependency.parameterName}.adapterRef`,
        input.factoryName,
        imports,
        parameters,
      );
    }
    const adapter = loadLockedTextSource(
      {
        repoRoot: input.source.repoRoot,
        sourceRef: composition.adapterRef,
        sourceDigest: composition.adapterDigest,
      },
      `$.compositionBindings.${dependency.parameterName}.adapter`,
    );
    if (adapter.result !== "pass") {
      return emptyResult(
        adapter.result,
        adapter.diagnostic,
        adapter.selector,
        input.factoryName,
        imports,
        parameters,
      );
    }

    const stableName = dependency.parameterName.replace(/[^A-Za-z0-9_.-]/gu, "-");
    const bindingId = `APE.ImplementationBinding.operation.${stableName}`;
    bindings.push({
      implementation_binding_id: bindingId,
      dependency_role: dependency.role,
      consumer_contract_ref: dependency.consumerContractRef,
      adapter_ref: composition.adapterRef,
      adapter_digest: composition.adapterDigest,
    });
    observations.push({
      observation_id: `APE.ObservationProjection.operation.dependency.${stableName}`,
      projection_kind: "observed",
      property_id:
        dependency.role === "repository"
          ? "APE.ImplementationProperty.operation.repository-boundary"
          : "APE.ImplementationProperty.operation.role-contract-specificity",
      implementation_binding_id: bindingId,
      source_ref: input.source.sourceRef,
      source_digest: input.source.sourceDigest,
      observed_value: {
        factory_name: input.factoryName,
        parameter_name: dependency.parameterName,
        contract_name: dependency.contractName,
        dependency_role: dependency.role,
        direction: "consumer-to-adapter",
        supplied_at_composition_root: true,
        runtime_guarantee: false,
      },
      provenance_ref: `${input.source.sourceRef}#${input.factoryName}`,
    });
  }

  return {
    result: "pass",
    diagnostic: "AOP_DEPENDENCY_PASS",
    selector: "$",
    factoryName: input.factoryName,
    imports,
    parameters,
    bindings,
    observations,
    runtimeGuaranteeClaimed: false,
  };
}
