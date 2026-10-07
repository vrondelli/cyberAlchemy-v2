// Additive HEN-11 driver; frozen HEN-10 driver remains unchanged.
import {createNativeInvestigationDriver} from "./investigation-budget-native-driver.mjs";
import {runIntentAnchorEpisode} from "./intent-anchor-episode-r3.mjs";

const uncoveredArm = "intent-anchor-terminal-shortlist-uncovered-requirement-r1";
const identifierArms = ["intent-anchor-terminal-shortlist-distinctive-identifier-r1", "intent-anchor-terminal-shortlist-distinctive-reasoning-view-r1", "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1", uncoveredArm];
const distinctiveArms = ["intent-anchor-terminal-shortlist-distinctive-r1", "intent-anchor-terminal-shortlist-distinctive-early-r1", "intent-anchor-terminal-shortlist-distinctive-conditional-r1", ...identifierArms];
const objectiveArms = ["intent-anchor-terminal-shortlist-objective-r1", ...distinctiveArms];
const adaptiveArms = ["intent-anchor-terminal-shortlist-adaptive-r1", ...objectiveArms];
const shortlistArms = ["intent-anchor-terminal-shortlist-r1", "intent-anchor-terminal-shortlist-cap12-r1", ...adaptiveArms];
const allArms = ["intent-anchor-convergence-r3", "intent-anchor-source-neighborhood-r1", "intent-anchor-search-followthrough-r1", "intent-anchor-objective-search-r1", "intent-anchor-api-search-r1", "intent-anchor-api-search-r2", "intent-anchor-api-search-r3", ...shortlistArms];

export async function runIntentAnchorNativeEpisode({arm, native, ...options}) {
  if (!allArms.includes(arm)) throw new Error("intent-anchor-native.unknown-arm");
  if (options.transport_reliability !== undefined && options.transport_reliability !== "bounded-view-and-output-cap-r1") throw new Error("intent-anchor-native.transport-reliability");
  if (!Array.isArray(native.client?.index_receipts)) throw new Error("intent-anchor-native.index-receipts-required");
  const base = createNativeInvestigationDriver({...native, persist: options.persist});
  const driver = Object.freeze({...base, index_receipts: native.client.index_receipts});
  let result;
  try {
    result = await runIntentAnchorEpisode({...options, driver,
      source_neighborhood: arm === "intent-anchor-source-neighborhood-r1",
      search_followthrough: arm === "intent-anchor-search-followthrough-r1",
      objective_search: arm === "intent-anchor-objective-search-r1",
      api_search: arm === "intent-anchor-api-search-r3" ? "r3" : arm === "intent-anchor-api-search-r2" ? "r2" : arm === "intent-anchor-api-search-r1",
      terminal_shortlist: shortlistArms.includes(arm),
      discovery_call_cap: arm === "intent-anchor-terminal-shortlist-cap12-r1" ? 12 : adaptiveArms.includes(arm) ? 24 : 95,
      adaptive_shortlist: adaptiveArms.includes(arm), objective_anchor_gate: objectiveArms.includes(arm),
      distinctive_acquisition: distinctiveArms.includes(arm),
      early_evidence_stop: arm === "intent-anchor-terminal-shortlist-distinctive-early-r1",
      conditional_evidence_stop: arm === "intent-anchor-terminal-shortlist-distinctive-conditional-r1",
      objective_identifier_search: identifierArms.includes(arm),
      uncovered_requirement_search: arm === uncoveredArm,
      omit_reasoning_from_view: arm === "intent-anchor-terminal-shortlist-distinctive-reasoning-view-r1",
      omit_reasoning_on_denial: options.transport_reliability === "bounded-view-and-output-cap-r1" || arm === "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1",
      output_cap_correction: options.transport_reliability === "bounded-view-and-output-cap-r1"});
    return result;
  }
  finally { try { await driver.close(); } catch (error) { if (result) error.result = result; throw error; } }
}
