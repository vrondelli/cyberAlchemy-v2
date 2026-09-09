type JsonRecord = Record<string, unknown>;

export const OEW_RELATION_ENCODING_REGISTRY =
  "oew.relation-encoding-registry.v1";

export class RelationEncodingError extends Error {
  readonly code = "OEW_RELATION_ENCODING_REJECTED";
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    const stable = [...new Set(issues)].sort();
    super(stable.join(", "));
    this.name = "RelationEncodingError";
    this.issues = Object.freeze(stable);
  }
}

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const requiredString = (value: unknown, issue: string) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new RelationEncodingError([issue]);
  }
  return value;
};

const hexColor = (value: unknown) =>
  typeof value === "string" && /^#[a-f0-9]{6}$/i.test(value);

const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
};

export type RelationEncodingRegistry = Readonly<{
  schema_version: typeof OEW_RELATION_ENCODING_REGISTRY;
  authority_effect: "none";
  minimum_graphical_contrast: number | null;
  predicateColorMap: Readonly<Record<string, string>>;
  colorTokens: Readonly<JsonRecord>;
  presentationPatternMap: Readonly<Record<string, string>>;
  patternTokens: Readonly<JsonRecord>;
}>;

export function createRelationEncodingRegistry(
  candidate: unknown,
): RelationEncodingRegistry {
  if (!isRecord(candidate) || candidate.authority_effect !== "none") {
    throw new RelationEncodingError(["ENCODING_AUTHORITY_INVALID"]);
  }
  const predicateColorMap = candidate.predicateColorMap;
  const colorTokens = candidate.colorTokens;
  const presentationPatternMap = candidate.presentationPatternMap;
  const patternTokens = candidate.patternTokens;
  if (
    !isRecord(predicateColorMap) ||
    !isRecord(colorTokens) ||
    !isRecord(presentationPatternMap) ||
    !isRecord(patternTokens)
  ) {
    throw new RelationEncodingError(["ENCODING_REGISTRY_INVALID"]);
  }

  const issues: string[] = [];
  const tokenOwners = new Map<string, string>();
  const darkOwners = new Map<string, string>();
  const lightOwners = new Map<string, string>();
  const minimum = candidate.minimum_graphical_contrast;
  const minimumContrast =
    typeof minimum === "number" && Number.isFinite(minimum) ? minimum : null;

  for (const [predicate, tokenName] of Object.entries(predicateColorMap)) {
    if (!predicate || typeof tokenName !== "string" || !tokenName) {
      issues.push(`PREDICATE_MAPPING_INVALID:${predicate}`);
      continue;
    }
    const token = colorTokens[tokenName];
    if (!isRecord(token)) {
      issues.push(`COLOR_TOKEN_MISSING:${predicate}:${tokenName}`);
      continue;
    }
    if (token.predicate !== undefined && token.predicate !== predicate) {
      issues.push(`COLOR_TOKEN_PREDICATE_DRIFT:${predicate}:${tokenName}`);
    }
    if (!hexColor(token.dark) || !hexColor(token.light)) {
      issues.push(`COLOR_TOKEN_INVALID:${predicate}:${tokenName}`);
    }
    const priorTokenOwner = tokenOwners.get(tokenName);
    if (priorTokenOwner && priorTokenOwner !== predicate) {
      issues.push(`COLOR_TOKEN_COLLISION:${priorTokenOwner}:${predicate}`);
    }
    tokenOwners.set(tokenName, predicate);
    for (const [mode, owners] of [
      ["dark", darkOwners],
      ["light", lightOwners],
    ] as const) {
      const color = String(token[mode] ?? "").toLowerCase();
      const owner = owners.get(color);
      if (color && owner && owner !== predicate) {
        issues.push(`COLOR_VALUE_COLLISION:${mode}:${owner}:${predicate}`);
      }
      if (color) owners.set(color, predicate);
    }
    if (minimumContrast !== null) {
      for (const mode of ["dark", "light"] as const) {
        const contrast = token[`${mode}_contrast`];
        if (typeof contrast !== "number" || contrast < minimumContrast) {
          issues.push(`COLOR_CONTRAST_INSUFFICIENT:${predicate}:${mode}`);
        }
      }
    }
  }

  for (const [family, tokenName] of Object.entries(presentationPatternMap)) {
    if (!family || typeof tokenName !== "string" || !tokenName) {
      issues.push(`PATTERN_MAPPING_INVALID:${family}`);
      continue;
    }
    const token = patternTokens[tokenName];
    if (!isRecord(token) || typeof token.label !== "string") {
      issues.push(`PATTERN_TOKEN_MISSING:${family}:${String(tokenName)}`);
    }
  }
  if (issues.length > 0) throw new RelationEncodingError(issues);

  return deepFreeze({
    schema_version: OEW_RELATION_ENCODING_REGISTRY,
    authority_effect: "none",
    minimum_graphical_contrast: minimumContrast,
    predicateColorMap: {...predicateColorMap} as Record<string, string>,
    colorTokens: structuredClone(colorTokens),
    presentationPatternMap: {
      ...presentationPatternMap,
    } as Record<string, string>,
    patternTokens: structuredClone(patternTokens),
  });
}

export function resolveRelationEncoding(
  projection: Readonly<JsonRecord>,
  registry: RelationEncodingRegistry,
) {
  if (!isRecord(projection) || !isRecord(projection.display_cues)) {
    throw new RelationEncodingError(["RELATION_PROJECTION_INVALID"]);
  }
  const predicate = requiredString(
    projection.predicate,
    "RELATION_PREDICATE_REQUIRED",
  );
  const family = requiredString(
    projection.display_cues.presentation_family,
    `PRESENTATION_FAMILY_REQUIRED:${predicate}`,
  );
  const colorToken = requiredString(
    registry.predicateColorMap[predicate],
    `PREDICATE_ENCODING_MISSING:${predicate}`,
  );
  const patternToken = requiredString(
    registry.presentationPatternMap[family],
    `PATTERN_ENCODING_MISSING:${family}`,
  );
  const color = registry.colorTokens[colorToken];
  const pattern = registry.patternTokens[patternToken];
  if (!isRecord(color)) {
    throw new RelationEncodingError([`COLOR_TOKEN_MISSING:${colorToken}`]);
  }
  if (!isRecord(pattern)) {
    throw new RelationEncodingError([`PATTERN_TOKEN_MISSING:${patternToken}`]);
  }

  const compatibilityColor = projection.display_cues.color_token;
  const compatibilityPattern = projection.display_cues.pattern_token;
  if (compatibilityColor !== null && compatibilityColor !== colorToken) {
    throw new RelationEncodingError([`COLOR_CUE_DRIFT:${predicate}`]);
  }
  if (compatibilityPattern !== null && compatibilityPattern !== patternToken) {
    throw new RelationEncodingError([`PATTERN_CUE_DRIFT:${predicate}`]);
  }
  const visibleLabel = requiredString(
    projection.display_cues.visible_label ?? predicate,
    `VISIBLE_LABEL_REQUIRED:${predicate}`,
  );
  const directionText = requiredString(
    projection.traversal_phrase ?? projection.source_direction,
    `DIRECTION_TEXT_REQUIRED:${predicate}`,
  );

  return deepFreeze({
    predicate,
    color_token: colorToken,
    color_dark: color.dark,
    color_light: color.light,
    pattern_token: patternToken,
    pattern_label: pattern.label,
    stroke_dasharray:
      typeof pattern.stroke_dasharray === "string"
        ? pattern.stroke_dasharray
        : "none",
    visible_label: visibleLabel,
    direction_text: directionText,
    accessible_text: `${visibleLabel}; ${directionText}; ${String(pattern.label)}`,
  });
}
