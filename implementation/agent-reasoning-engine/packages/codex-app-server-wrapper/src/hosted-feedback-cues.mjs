// Candidate deterministic feedback adapter for an explicitly selected,
// learning-enabled hosted human-chat consumer. It is not a general correction
// interpreter and must not be used to classify arbitrary quoted/tool text.
const CUE = /^Your last (?:answer|response) was (too verbose|too technical|too brief)\.\s+(?:From now on|For the rest of this conversation),\s+(keep responses concise|use plain language|explain in more detail)\.(?:\s+(?:Explain|Review|Implement|Plan)\b[^\n]{1,1000})?$/iu;
const INSTRUCTIONS = new Map([
  ["too verbose:keep responses concise", "Keep responses concise."],
  ["too technical:use plain language", "Use plain language."],
  ["too brief:explain in more detail", "Explain in more detail."],
]);

export function selectHostedFeedbackCueProvider({consumer_id, lane, learning_enabled} = {}) {
  if (!learning_enabled || consumer_id !== "codex:human-chat" || lane !== "interaction-bound") return undefined;
  return ({request, interaction_ref, state}) => {
    if (typeof request !== "string" || Buffer.byteLength(request) > 4096 || !state?.turns) return {};
    const match = CUE.exec(request.trim());
    if (!match) return {};
    const instruction = INSTRUCTIONS.get(`${match[1].toLowerCase()}:${match[2].toLowerCase()}`);
    if (!instruction) return {};
    const prior = Object.values(state.turns).filter((turn) => turn.interaction_ref === interaction_ref).at(-1);
    if (!prior?.outcome || prior.completion_status !== "completed" || prior.response_present !== true || !prior.turn_ref) return {};
    return {feedback: {episode_ref: prior.request_ref, quote: match[2], instruction,
      target: "response", posture: "explicit", retention_scope: "current-interaction",
      correction_kind: "new-preference", expected_checks: []}};
  };
}
