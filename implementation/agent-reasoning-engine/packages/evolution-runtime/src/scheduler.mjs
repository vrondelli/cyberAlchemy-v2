export function createEvolutionScheduler({run_cycle} = {}) {
  if (typeof run_cycle !== "function") throw new TypeError("run_cycle is required");
  let running = false;
  const completed = new Map();

  async function runOnce(trigger = {}) {
    const triggerId = String(trigger.trigger_id ?? "").trim();
    if (!triggerId) throw new TypeError("trigger_id is required");
    if (completed.has(triggerId)) return Object.freeze({ok: true, disposition: "replayed", result: completed.get(triggerId), authority_effect: "none"});
    if (running) return Object.freeze({ok: false, disposition: "busy", reason_codes: ["evolution.cycle-already-running"], authority_effect: "none"});
    running = true;
    try {
      const result = await run_cycle(Object.freeze({...trigger, trigger_id: triggerId}));
      completed.set(triggerId, result);
      return Object.freeze({ok: true, disposition: "completed", result, authority_effect: "none"});
    } finally {
      running = false;
    }
  }

  return Object.freeze({runOnce, inspect: () => Object.freeze({running, completed_trigger_ids: [...completed.keys()].sort(), authority_effect: "none"})});
}
