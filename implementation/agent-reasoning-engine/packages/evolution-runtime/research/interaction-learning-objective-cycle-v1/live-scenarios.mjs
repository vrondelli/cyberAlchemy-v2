export const CHECKPOINT_SYSTEM_PROMPT = `You are testing objective continuity in a long agent workflow. Before answering, bind the active objective and cycle, classify the user's requested transition, and keep benchmark, evolution-cycle, and engine identities distinct. Ask at most one clarification only when acting would materially choose the wrong objective. Return JSON only with exactly these keys: transition, active_objective, active_cycle, relationship, next_action, clarification_needed, response. transition must be continue, refine, interrupt, replace, or new. clarification_needed must be a boolean. Preserve the user's language in response. Never claim completion without evidence.`;

const rows = [
  ["01", "Build one evolution runtime for several separate cycle kinds", "benchmark-research", "The last ContextBench run produced evidence but coordinator settlement is pending.", "Which cycle was that benchmark inside, and what remains?", "continue"],
  ["02", "Complete an interaction-learning objective cycle", "interaction-learning", "A historical baseline has been measured; no candidate is active.", "I am lost: is benchmark research the engine cycle?", "continue"],
  ["03", "Complete an interaction-learning objective cycle", "interaction-learning", "The first hypothesis is ready for validation.", "Now test the other evolution cycles with the engine too.", "replace"],
  ["04", "Finish the selected ContextBench hypothesis", "benchmark-research", "Four development tasks are scored; the campaign goal remains open.", "continue", "continue"],
  ["05", "Run a bounded benchmark campaign", "benchmark-research", "The run is frozen and ready for dispatch.", "Before that, diagnose why Docker disappeared after the WSL reset.", "interrupt"],
  ["06", "Improve ARE interaction continuity", "interaction-learning", "The historical cohort is frozen.", "Instead, focus only on evidence archiving and disk use.", "replace"],
  ["07", "Improve ARE interaction continuity", "interaction-learning", "Scope transitions are the dominant failure class.", "Also include language clarity and decision ordering as guardrails.", "refine"],
  ["08", "Resume the ARE benchmark workflow", "benchmark-research", "The environment was reset after two completed tasks; receipts remain valid.", "WSL restarted. Pick up from the receipts and do not repeat finished work.", "continue"],
  ["09", "Settle a live ContextBench benchmark", "benchmark-research", "Generation and scoring are complete but engine settlement is not.", "What exactly did we run, and is the cycle complete?", "continue"],
  ["10", "Create the shared evolution runtime", "engine-improvement", "Three benchmark campaigns are known but none is selected.", "Run the benchmark now.", "continue", true],
  ["11", "Concluir o ciclo de aprendizado por interação", "interaction-learning", "A linha de base histórica foi medida.", "Agora teste interaction-learning com o engine e mantenha os ciclos separados.", "continue"],
  ["12", "Concluir o ciclo de aprendizado por interação", "interaction-learning", "The assistant previously merged benchmark research with the engine lifecycle.", "Não, benchmark-research não é o engine cycle; corrija a relação e continue.", "refine"],
  ["13", "Define the interaction-learning cycle", "interaction-learning", "Several unresolved decisions exist.", "Show one decision at a time from now on.", "refine"],
  ["14", "Choose the storage policy", "interaction-learning", "One decision gate was presented with A as the recommended option.", "A", "continue"],
  ["15", "Define lifecycle states", "interaction-learning", "A state labeled E was presented without a plain-language explanation.", "What is this E? I do not understand how it fits.", "continue"],
  ["16", "Define lifecycle functions", "interaction-learning", "The draft lists start, execute, and finish only.", "Why is there no recover state or diagnose function?", "refine"],
  ["17", "Validate a benchmark result independently", "benchmark-research", "The runtime produced a candidate result awaiting review.", "Send the runtime output to a different agent to evaluate it.", "refine"],
  ["18", "Run the approved GLM validation", "interaction-learning", "Provider execution is the only remaining operational step.", "All GLM requests for this bounded run are approved.", "refine"],
  ["19", "Complete the multi-cycle architecture", "engine-improvement", "Benchmark research is documented; interaction learning has not run.", "So what is next—interaction-learning?", "continue"],
  ["20", "Preserve the evolution workflow after reset", "interaction-learning", "Architecture and decisions exist but the narrative docs are stale.", "Create and update the documentation, then resume the cycle from evidence.", "refine"],
];

export const LIVE_SCENARIOS = Object.freeze(rows.map(([id, active_objective, active_cycle, state, user_request, expected_transition, clarification_expected = false]) => Object.freeze({
  scenario_id: `IL-LIVE-${id}`,
  active_objective,
  active_cycle,
  state,
  user_request,
  expected_transition,
  clarification_expected,
})));

