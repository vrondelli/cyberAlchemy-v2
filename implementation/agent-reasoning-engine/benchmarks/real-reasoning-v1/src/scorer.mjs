import {ratio} from "./common.mjs";

function contents(fragment) { return (fragment?.included_items ?? []).map((item) => JSON.stringify(item)); }

function requiredTermStem(word) {
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith("tion") && word.length > 5) return word.slice(0, -3);
  if (word.endsWith("ing") && word.length > 5) return word.slice(0, -3);
  if (word.endsWith("ed") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("s") && word.length > 3) return word.slice(0, -1);
  return word;
}

function containsRequiredTerm(combined, term) {
  const normalized = term.toLowerCase();
  if (!/^[a-z0-9]+$/.test(normalized)) return combined.includes(normalized);
  const words = combined.match(/[a-z0-9]+/g) ?? [];
  if (words.includes(normalized)) return true;
  const requiredStem = requiredTermStem(normalized);
  return words.some((word) => requiredTermStem(word) === requiredStem);
}

export function scoreContextScenario(scenario, preflight) {
  const fragment = preflight.fragment;
  const serialized = contents(fragment);
  const ids = (fragment?.included_items ?? []).map((item) => item.context_item_id);
  const kinds = (fragment?.included_items ?? []).map((item) => item.item_kind);
  const definitionHits = (scenario.required_definition_ids ?? []).filter((id) => ids.includes(`definition:${id}`) || serialized.some((value) => value.includes(`\"definition_id\":\"${id}\"`)));
  const kindHits = (scenario.required_context_kinds ?? []).filter((kind) => kinds.includes(kind));
  const fragmentHits = (scenario.required_item_fragments ?? []).filter((part) => serialized.some((value) => value.includes(part)));
  const forbidden = (scenario.forbidden_definition_ids ?? []).filter((id) => ids.includes(`definition:${id}`) || serialized.some((value) => value.includes(`\"definition_id\":\"${id}\"`)));
  const includedDefinitionIds = ids.filter((id) => id.startsWith("definition:"));
  const expected = (scenario.required_definition_ids?.length ?? 0) + (scenario.required_context_kinds?.length ?? 0) + (scenario.required_item_fragments?.length ?? 0);
  const hits = definitionHits.length + kindHits.length + fragmentHits.length;
  const passed = preflight.action === "forward" && preflight.directive.selected_route_or_candidates?.[0] === scenario.expected_route && hits === expected && forbidden.length === 0 && fragment.inline_bytes <= scenario.max_inline_bytes;
  const definitionPrecision = (scenario.required_definition_ids?.length ?? 0) === 0 ? null : includedDefinitionIds.length === 0 ? 0 : ratio(definitionHits.length, includedDefinitionIds.length);
  return {scenario_id: scenario.scenario_id, passed, action: preflight.action, reason_codes: preflight.directive?.reason_codes ?? [], route: preflight.directive.selected_route_or_candidates?.[0] ?? null, definition_hits: definitionHits, included_definition_ids: includedDefinitionIds, kind_hits: kindHits, fragment_hits: fragmentHits, forbidden_hits: forbidden, recall: ratio(hits, expected), definition_precision: definitionPrecision, inline_bytes: fragment?.inline_bytes ?? null, envelope_digest: preflight.context_envelope?.digest ?? null};
}

export function scoreLiveResponse(scenario, response, variant) {
  const combined = `${response.answer ?? ""}\n${response.next_question ?? ""}`.toLowerCase();
  const requiredHits = (scenario.required_terms ?? []).filter((term) => containsRequiredTerm(combined, term));
  const prohibitedHits = (scenario.prohibited_patterns ?? []).filter((term) => combined.includes(term.toLowerCase()));
  const contextIds = Array.isArray(response.used_context_item_ids) ? response.used_context_item_ids : [];
  const contextHits = (scenario.required_context_item_ids ?? []).filter((id) => contextIds.includes(id));
  const authorityClaims = Array.isArray(response.authority_claims) ? response.authority_claims : ["invalid-authority-claims"];
  const passed = requiredHits.length === (scenario.required_terms ?? []).length && prohibitedHits.length === 0 && authorityClaims.length === 0 && (variant !== "are" || contextHits.length === (scenario.required_context_item_ids ?? []).length);
  return {passed, required_hits: requiredHits, prohibited_hits: prohibitedHits, context_hits: contextHits, authority_claims: authorityClaims, avoidable_question: prohibitedHits.length > 0};
}
