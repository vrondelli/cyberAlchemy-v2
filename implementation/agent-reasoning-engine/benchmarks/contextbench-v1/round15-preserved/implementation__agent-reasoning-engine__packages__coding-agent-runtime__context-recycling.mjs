import {createHash, randomUUID} from "node:crypto";
import {closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, realpathSync, renameSync, unlinkSync, writeFileSync} from "node:fs";
import {dirname, resolve, sep} from "node:path";

const adapters = new WeakMap();
const integer = (v) => Number.isSafeInteger(v) && v >= 0;
const requireCondition = (condition, reason) => { if (!condition) throw new Error(`recycling.${reason}`); };
const stable = (value) => JSON.stringify(value, (_, item) => item && typeof item === "object" && !Array.isArray(item)
  ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, item[key]])) : item);
const digest = (value) => createHash("sha256").update(stable(value)).digest("hex");
const clone = (value) => JSON.parse(stable(value));
const TOOL = "read-context-evidence";

/** Trusted adapter boundary: request_once must be stateless, enforce the supplied
 * output cap, and never retry or invoke tools. measure_request must include all
 * provider framing. Registering callbacks is not evidence that they conform.
 * Live adapters require separate source review and conformance tests. */
export function createStatelessRecyclingTransport(options) { return registerRecyclingTransport(options, "are-stateless-recycling"); }

/** Explicit opt-in boundary for in-process recovery of one stateless inference.
 * Each logical dispatch allows at most two physical attempts of identical bytes.
 * The adapter owns a durable total retry budget; crash resume must fail closed.
 * This does not authorize tool replay or recovery in the default adapter. */
export function createBoundedRecoveryRecyclingTransport({request_bounded, ...options}) {
  requireCondition(typeof request_bounded === "function", "adapter-callbacks-required");
  return registerRecyclingTransport({...options, request_once: async input => {
    const result = await request_bounded(Object.freeze({...input, maximum_attempts: 2}));
    const attempts = result?.attempt_receipts;
    requireCondition(Array.isArray(attempts) && attempts.length >= 1 && attempts.length <= 2, "recovery-attempts-invalid");
    requireCondition(attempts.every((r,i) => r?.attempt_index === i && r.request_sha256 === attempts[0].request_sha256
      && /^[a-f0-9]{64}$/.test(r.request_sha256) && r.model_request_sequence === input.dispatch.sequence), "recovery-attempt-binding");
    requireCondition(attempts.length === 1 || (attempts[0].retryable === true && attempts[0].dispatched === true), "recovery-failure-required");
    requireCondition(stable(result.receipt) === stable(attempts.at(-1)), "recovery-final-receipt");
    return result;
  }}, "are-bounded-recovery-recycling");
}

function registerRecyclingTransport({adapter_id, source_ref, measure_request, request_once, maximum_output_tokens}, kind) {
  requireCondition(typeof adapter_id === "string" && adapter_id.length > 0 && typeof source_ref === "string" && source_ref.length > 0, "adapter-identity-required");
  requireCondition(typeof measure_request === "function" && typeof request_once === "function", "adapter-callbacks-required");
  requireCondition(integer(maximum_output_tokens) && maximum_output_tokens > 0, "output-bound-required");
  const reservations = new WeakSet();
  const transport = Object.freeze({kind, transport_id: adapter_id,
    async generate({prompt, run_id, dispatch}) {
      requireCondition(dispatch && reservations.has(dispatch) && dispatch.prompt_digest === digest(prompt), "dispatch-binding-required");
      reservations.delete(dispatch);
      return request_once(Object.freeze({prompt, run_id, maximum_output_tokens, dispatch: Object.freeze({...dispatch})}));
    }});
  adapters.set(transport, {adapter_id, source_ref, measure_request, maximum_output_tokens,
    reserve(dispatch) { reservations.add(dispatch); }});
  return transport;
}

function writeDurable(path, value) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  const fd = openSync(temporary, "wx", 0o600);
  try { writeFileSync(fd, stable(value)); fsyncSync(fd); } finally { closeSync(fd); }
  renameSync(temporary, path);
  const directory = openSync(resolve(path, ".."), "r");
  try { fsyncSync(directory); } finally { closeSync(directory); }
}

export function openContextRecycling({options, transport, scope, fixture_root}) {
  const adapter = adapters.get(transport);
  requireCondition(adapter, "transport-boundary-unsupported");
  const {context_limit, recycle_at, safety_margin, state, directory} = options ?? {};
  requireCondition([context_limit, recycle_at, safety_margin].every(integer) && safety_margin > 0 && recycle_at > 0 && recycle_at <= context_limit - safety_margin, "invalid-budget-policy");
  requireCondition(typeof directory === "string" && directory.length > 0, "directory-required");
  requireCondition(state && state.objective === scope.request, "objective-mismatch");
  for (const key of ["constraints", "completed", "pending", "facts", "lessons", "evidence_refs"]) requireCondition(Array.isArray(state[key]), `state-${key}-required`);
  requireCondition(state.evidence_refs.length > 0, "state-evidence-required");
  // Never write checkpoint material inside the immutable coding fixture.
  const fixture = realpathSync(fixture_root);
  const requested = resolve(directory);
  requireCondition(requested !== fixture && !requested.startsWith(`${fixture}${sep}`), "store-inside-fixture");
  let ancestor = requested;
  while (!existsSync(ancestor)) ancestor = dirname(ancestor);
  const actualAncestor = realpathSync(ancestor);
  requireCondition(actualAncestor !== fixture && !actualAncestor.startsWith(`${fixture}${sep}`), "store-inside-fixture");
  mkdirSync(requested, {recursive: true, mode: 0o700});
  const root = realpathSync(requested);
  requireCondition(root !== fixture && !root.startsWith(`${fixture}${sep}`), "store-inside-fixture");
  const lock = resolve(root, "writer.lock");
  const fd = openSync(lock, "wx", 0o600);
  closeSync(fd);
  let closed = false;
  const close = () => { if (!closed) { closed = true; unlinkSync(lock); } };
  try {
    const boundState = clone(state);
    const binding = digest({scope, state: boundState, context_limit, recycle_at, safety_margin,
      adapter: {adapter_id: adapter.adapter_id, source_ref: adapter.source_ref, maximum_output_tokens: adapter.maximum_output_tokens}});
    const path = resolve(root, "checkpoint.json");
    let checkpoint = {version: 1, binding, phase: "idle", generation: 0, start_index: 0, history: [], archives: [], dispatches: [], recoverable_failures: [], recycles: 0};
    if (existsSync(path)) {
      const {checkpoint_digest, ...loaded} = JSON.parse(readFileSync(path, "utf8"));
      requireCondition(digest(loaded) === checkpoint_digest && loaded.version === 1, "checkpoint-integrity");
      requireCondition(loaded.binding === binding, "scope-or-policy-drift");
      requireCondition(loaded.phase === "idle", "uncertain-or-terminal-checkpoint");
      checkpoint = loaded;
      if (!Array.isArray(checkpoint.recoverable_failures)) checkpoint.recoverable_failures = [];
    }
    const persist = () => writeDurable(path, {...checkpoint, checkpoint_digest: digest(checkpoint)});
    const archive = (history) => {
      const ref = digest(history);
      const evidencePath = resolve(root, `${ref}.json`);
      if (existsSync(evidencePath)) requireCondition(digest(JSON.parse(readFileSync(evidencePath, "utf8"))) === ref, "archive-integrity");
      else writeDurable(evidencePath, history);
      if (!checkpoint.archives.includes(ref)) checkpoint.archives.push(ref);
      return ref;
    };
    // Verify all retained evidence before admitting a resumed checkpoint.
    for (const ref of checkpoint.archives) {
      requireCondition(/^[a-f0-9]{64}$/.test(ref), "archive-reference-invalid");
      requireCondition(digest(JSON.parse(readFileSync(resolve(root, `${ref}.json`), "utf8"))) === ref, "archive-integrity");
    }
    let busy = false;
    return {
      close,
      tool_name: TOOL,
      tool_contract: {arguments: {digest: "required SHA256 from this task's evidence reference", offset: "optional UTF-16 character offset, default 0", max_chars: "optional 1..1024, default 1024"}, example: {digest: "<history_ref>", offset: 0, max_chars: 1024}},
      initialHistory(initial) {
        if (initial !== undefined) requireCondition(digest(initial) === digest(checkpoint.history), "initial-history-mismatch");
        return clone(checkpoint.history);
      },
      readEvidence({digest: ref, offset = 0, max_chars = 1024} = {}) {
        requireCondition(checkpoint.archives.includes(ref) && /^[a-f0-9]{64}$/.test(ref), "foreign-evidence");
        requireCondition(integer(offset) && integer(max_chars) && max_chars > 0 && max_chars <= 1024, "evidence-range-invalid");
        const bytes = readFileSync(resolve(root, `${ref}.json`), "utf8");
        requireCondition(digest(JSON.parse(bytes)) === ref, "archive-integrity");
        return {ok: true, output: {digest: ref, offset, next_offset: Math.min(bytes.length, offset + max_chars), total_chars: bytes.length, text: bytes.slice(offset, offset + max_chars)}};
      },
      async generate({history, render, render_candidates, admit_dispatch, pause_after_recycle, run_id}) {
        requireCondition(!closed && !busy && checkpoint.phase === "idle", "request-already-pending");
        requireCondition(pause_after_recycle === undefined || typeof pause_after_recycle === "function", "pause-after-recycle-invalid");
        busy = true;
        try {
          requireCondition(digest(history) === digest(checkpoint.history), "history-drift");
          const history_ref = archive(history);
          const renderAt = async (start) => await render(history.slice(start), {task_state: boundState, history_ref, history_count: history.length, generation: checkpoint.generation});
          const measure = async (prompt) => {
            const upper = await adapter.measure_request(Object.freeze({prompt, maximum_output_tokens: adapter.maximum_output_tokens}));
            requireCondition(integer(upper), "unknown-input-bound");
            const projected = upper + adapter.maximum_output_tokens;
            requireCondition(integer(projected), "budget-overflow");
            return {input_upper_bound: upper, output_reservation: adapter.maximum_output_tokens, projected_upper_bound: projected};
          };
          let prompt = await renderAt(checkpoint.start_index);
          let budget = await measure(prompt);
          if (budget.projected_upper_bound >= recycle_at) {
            requireCondition(history.length > checkpoint.start_index, "fresh-context-too-large");
            checkpoint.generation += 1;
            checkpoint.start_index = history.length;
            checkpoint.recycles += 1;
            // This idle checkpoint is the causal fork boundary: all prior model,
            // tool and history effects are complete, while no post-recycle prompt
            // has been rendered, reserved or dispatched.
            persist();
            if (pause_after_recycle !== undefined) {
              const boundary = clone({binding, generation: checkpoint.generation, start_index: checkpoint.start_index,
                recycles: checkpoint.recycles, history_ref, history_count: history.length, history_digest: digest(history)});
              if (await pause_after_recycle(boundary) === true) {
                const error = new Error("recycling.boundary-paused");
                error.code = "boundary-paused";
                error.boundary = boundary;
                throw error;
              }
            }
            if (render_candidates === undefined) {
              prompt = await renderAt(checkpoint.start_index);
              budget = await measure(prompt);
            } else {
              // Trusted projection seam, not a budget exemption. The caller's
              // scope must bind its policy/source. Never retry a model request.
              const candidates = await render_candidates(clone(history), {task_state: clone(boundState), history_ref,
                history_count: history.length, generation: checkpoint.generation});
              requireCondition(Array.isArray(candidates) && candidates.length > 0 && candidates.length <= 3
                && candidates.every(candidate => typeof candidate === 'string' && candidate.length > 0), "retention-candidates-invalid");
              for (const candidate of candidates) {
                prompt = candidate;
                budget = await measure(prompt);
                if (budget.projected_upper_bound < recycle_at) break;
              }
            }
          }
          requireCondition(budget.projected_upper_bound < recycle_at, "fresh-context-too-large");
          const dispatch = {binding, generation: checkpoint.generation, sequence: checkpoint.dispatches.length + 1, prompt_digest: digest(prompt), history_ref, ...budget};
          // Optional caller budget restriction, evaluated after exact measurement
          // and before a dispatch is recorded or a provider request is possible.
          // It may deny an otherwise context-admissible request, never relax it.
          if (admit_dispatch !== undefined) {
            requireCondition(typeof admit_dispatch === 'function', "dispatch-admission-invalid");
            requireCondition(await admit_dispatch(Object.freeze({...dispatch})) === true, "dispatch-admission-denied");
          }
          checkpoint.dispatches.push(dispatch);
          checkpoint.phase = "model-pending";
          persist(); // Failure or crash from here must never trigger a blind replay.
          adapter.reserve(dispatch);
          let generated;
          try { generated = await transport.generate({prompt, run_id, dispatch}); }
          catch (error) {
            if (error?.code === "incomplete-output") {
              checkpoint.recoverable_failures.push({sequence: dispatch.sequence, generation: dispatch.generation, prompt_digest: dispatch.prompt_digest, code: error.code});
              checkpoint.phase = "model-failed-recoverable";
              persist();
            }
            throw error;
          }
          requireCondition(typeof generated?.final_bytes === "string" && generated.final_bytes.length > 0, "invalid-model-output");
          checkpoint.phase = "model-returned";
          checkpoint.output_digest = digest(generated.final_bytes);
          persist();
          return generated;
        } finally { busy = false; }
      },
      beforeTool() {
        requireCondition(checkpoint.phase === "model-returned", "tool-phase-invalid");
        checkpoint.phase = "tool-pending";
        persist();
      },
      acknowledgeIncompleteOutput() {
        requireCondition(checkpoint.phase === "model-failed-recoverable" && checkpoint.recoverable_failures.at(-1)?.code === "incomplete-output", "incomplete-output-not-recorded");
        checkpoint.phase = "idle";
        persist();
      },
      completeStep(history, terminal = false) {
        requireCondition(["tool-pending", "model-returned"].includes(checkpoint.phase), "completion-phase-invalid");
        checkpoint.history = clone(history);
        archive(checkpoint.history);
        checkpoint.phase = terminal ? "terminal" : "idle";
        persist();
      },
      snapshot() { return clone({generation: checkpoint.generation, recycles: checkpoint.recycles, phase: checkpoint.phase, dispatches: checkpoint.dispatches, recoverable_failures: checkpoint.recoverable_failures, history_digest: digest(checkpoint.history)}); }
    };
  } catch (error) { close(); throw error; }
}
