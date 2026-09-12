import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import {execFileSync} from "node:child_process";
import test from "node:test";
import {runIterativeCodingAgent} from "../iterative-agent.mjs";
import {createStatelessRecyclingTransport,createBoundedRecoveryRecyclingTransport,openContextRecycling} from "../context-recycling.mjs";
import {snapshotTree} from "../verifier.mjs";

const hash = (s) => createHash("sha256").update(s).digest("hex");
const event = (id, kind, body) => JSON.stringify({schema_version: "are.coding-agent-event/v1", event_id: id, kind, ...body, authority_effect: "none"});
const toolEvent = (id, name = "observe", args = {}) => event(id, "tool-request", {tool: {name, arguments: args}});
const context = (prompt) => JSON.parse(prompt.split("Durable task context: ")[1].split("\n\n")[0]);

function fixture(t, overrides = {}) {
  const root = mkdtempSync(resolve(tmpdir(), "are-runtime-recycle-"));
  const work = resolve(root, "fixture");
  mkdirSync(work);
  writeFileSync(resolve(work, "a.txt"), "old\n");
  t.after(() => rmSync(root, {recursive: true, force: true}));
  const base = snapshotTree(work);
  const final = (id = "final") => event(id, "final-candidate", {candidate: {schema_version: "are.next-action-candidate/v1", operation: "replace-file", path: "a.txt", expected_base_tree_sha256: base.tree_sha256, expected_file_sha256: hash("old\n"), utf8: "new\n", rationale: "local recycling fixture", authority_effect: "none"}});
  const input = {run_id: "recycle:test", request: "Change old to new", fixture_root: work,
    tool_runtime: {tool_names: ["observe"], tool_contracts: {observe: {arguments: {}}}, invoke: () => ({ok: true, output: "ARCHIVED_FACT=42;" + "x".repeat(6000)})},
    tool_policy: {allow: ["observe", "read-context-evidence"]}, mutation_allowlist: ["a.txt"], verification_command: [process.execPath, "-e", "process.exit(0)"], maximum_steps: 32, approve: false,
    context_recycling: {directory: resolve(root, "state"), context_limit: 11000, recycle_at: 9000, safety_margin: 1000,
      state: {objective: "Change old to new", constraints: ["Preserve approval boundary"], completed: [], pending: ["Produce verified candidate"], facts: ["Existing file contains old"], lessons: ["Include examples when explaining"], evidence_refs: ["fixture:a.txt"]}}, ...overrides};
  return {input, root, work, final};
}

// This deterministic provider uses one byte per synthetic token; these are not
// Luna token estimates. The source-reviewed fixture enforces its output bound.
function transport(request, measure = ({prompt}) => Buffer.byteLength(prompt)) {
  return createStatelessRecyclingTransport({adapter_id: "fixture", source_ref: "context-recycling.test.mjs:synthetic-byte-provider", maximum_output_tokens: 2000, measure_request: measure,
    async request_once(args) {
      const final_bytes = await request(args);
      assert.ok(Buffer.byteLength(final_bytes) <= args.maximum_output_tokens);
      return {final_bytes};
    }});
}

test("existing loop repeatedly recycles, retains state, retrieves old evidence and reaches a candidate", async (t) => {
  const f = fixture(t);
  const prompts = [];
  let retrievalReturned = false;
  f.input.model_transport = transport(({prompt}) => {
    prompts.push(prompt);
    const c = context(prompt);
    assert.deepEqual(c.task_state, f.input.context_recycling.state);
    if (prompts.length <= 8) return toolEvent(`observe:${prompts.length}`);
    if (prompts.length === 9) {
      assert.equal(c.history_count, 8);
      assert.doesNotMatch(prompt, /ARCHIVED_FACT=42/);
      return toolEvent("retrieve", "read-context-evidence", {digest: c.history_ref, offset: 0, max_chars: 1024});
    }
    assert.match(prompt, /ARCHIVED_FACT=42/);
    retrievalReturned = true;
    return f.final();
  });
  const output = await runIterativeCodingAgent(f.input);
  assert.equal(output.status, "AWAITING_APPROVAL", JSON.stringify(output));
  assert.equal(output.steps, 10);
  assert.equal(output.recycling.recycles, 8);
  assert.equal(retrievalReturned, true);
  assert.equal(output.recycling.dispatches.length, prompts.length);
  for (const d of output.recycling.dispatches) assert.ok(d.projected_upper_bound < 9000);
  assert.equal(readFileSync(resolve(f.work, "a.txt"), "utf8"), "old\n");
  const checkpoint = JSON.parse(readFileSync(resolve(f.root, "state/checkpoint.json")));
  assert.equal(checkpoint.history[0].observation.output.length, 6017);
  assert.equal(checkpoint.history.at(-1).event.candidate.utf8, "new\n");
});

test("unknown budget prevents any dispatch", async (t) => {
  const f = fixture(t);
  let calls = 0;
  f.input.model_transport = transport(() => { calls++; return f.final(); }, () => null);
  const output = await runIterativeCodingAgent(f.input);
  assert.equal(output.status, "BLOCK");
  assert.match(output.model_error, /unknown-input-bound/);
  assert.equal(calls, 0);
});

test("oversized fresh context blocks without truncating mandatory state", async (t) => {
  const f = fixture(t);
  f.input.context_recycling.state.lessons.push("x".repeat(12000));
  let calls = 0;
  f.input.model_transport = transport(() => { calls++; return f.final(); });
  const output = await runIterativeCodingAgent(f.input);
  assert.match(output.model_error, /fresh-context-too-large/);
  assert.equal(calls, 0);
});

test("Codex and unregistered transports cannot opt into a false recycling guarantee", async (t) => {
  const f = fixture(t);
  let calls = 0;
  f.input.model_transport = {kind: "codex-app-server", async generate() { calls++; return {final_bytes: f.final()}; }};
  const output = await runIterativeCodingAgent(f.input);
  assert.match(output.error, /transport-boundary-unsupported/);
  assert.equal(calls, 0);
});

test("direct dispatch and reused reservation are rejected", async (t) => {
  const f = fixture(t);
  let captured;
  let calls = 0;
  const model = transport((args) => { captured = args; calls++; return f.final(); });
  await assert.rejects(model.generate({prompt: "bypass", dispatch: {prompt_digest: "fake"}}), /dispatch-binding-required/);
  await runIterativeCodingAgent({...f.input, model_transport: model});
  await assert.rejects(model.generate(captured), /dispatch-binding-required/);
  assert.equal(calls, 1);
});

test("an uncertain model request is never retried on restart", async (t) => {
  const f = fixture(t);
  let calls = 0;
  f.input.model_transport = transport(() => { calls++; throw new Error("simulated lost response"); });
  assert.equal((await runIterativeCodingAgent(f.input)).status, "BLOCK");
  f.input.model_transport = transport(() => { calls++; return f.final(); });
  const restarted = await runIterativeCodingAgent(f.input);
  assert.match(restarted.error, /uncertain-or-terminal-checkpoint/);
  assert.equal(calls, 1);
});

test("an uncertain tool is never repeated on restart", async (t) => {
  const f = fixture(t);
  let calls = 0;
  let toolCalls = 0;
  f.input.tool_runtime.invoke = () => { toolCalls++; throw new Error("tool result lost"); };
  f.input.model_transport = transport(() => { calls++; return toolEvent("tool:1"); });
  assert.equal((await runIterativeCodingAgent(f.input)).status, "BLOCK");
  assert.equal((await runIterativeCodingAgent(f.input)).status, "BLOCK");
  assert.equal(calls, 1);
  assert.equal(toolCalls, 1);
});

test("idle checkpoint resumes in a new process without repeating completed tools", async (t) => {
  const f = fixture(t);
  let calls = 0;
  f.input.model_transport = transport(() => { calls++; return toolEvent("observed"); });
  f.input.is_cancelled = () => calls === 1 && JSON.parse(readFileSync(resolve(f.root, "state/checkpoint.json"))).phase === "idle";
  const first = await runIterativeCodingAgent(f.input);
  assert.equal(first.status, "CANCELLED");
  assert.equal(first.recycling.phase, "idle");
  const data = resolve(f.root, "resume.json");
  writeFileSync(data, JSON.stringify({input: {...f.input, model_transport: undefined, tool_runtime: undefined, is_cancelled: undefined}, final: f.final()}));
  const code = `import {readFileSync} from 'node:fs';
    import {runIterativeCodingAgent} from ${JSON.stringify(new URL("../iterative-agent.mjs", import.meta.url).href)};
    import {createStatelessRecyclingTransport,createBoundedRecoveryRecyclingTransport} from ${JSON.stringify(new URL("../context-recycling.mjs", import.meta.url).href)};
    const data = JSON.parse(readFileSync(process.argv[1]));
    const model_transport = createStatelessRecyclingTransport({adapter_id:'fixture',source_ref:'context-recycling.test.mjs:synthetic-byte-provider',maximum_output_tokens:2000,measure_request:({prompt})=>Buffer.byteLength(prompt),request_once:async()=>({final_bytes:data.final})});
    const output = await runIterativeCodingAgent({...data.input,model_transport,tool_runtime:{tool_names:['observe'],tool_contracts:{observe:{arguments:{}}},invoke(){throw Error('completed tool replayed')}}});
    process.stdout.write(JSON.stringify(output));`;
  const resumed = JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", code, data], {encoding: "utf8", timeout: 10000}));
  assert.equal(resumed.status, "AWAITING_APPROVAL", JSON.stringify(resumed));
  assert.equal(resumed.steps, 2);
  assert.equal(resumed.recycling.recycles, 1);
});

test("scope changes and archive tampering block resume before model invocation", async (t) => {
  const f = fixture(t);
  let calls = 0;
  f.input.model_transport = transport(() => { calls++; return toolEvent("observed"); });
  f.input.is_cancelled = () => calls === 1 && JSON.parse(readFileSync(resolve(f.root, "state/checkpoint.json"))).phase === "idle";
  await runIterativeCodingAgent(f.input);
  const changed = await runIterativeCodingAgent({...f.input, mutation_allowlist: ["elsewhere"]});
  assert.match(changed.error, /scope-or-policy-drift/);
  const cp = JSON.parse(readFileSync(resolve(f.root, "state/checkpoint.json")));
  writeFileSync(resolve(f.root, "state", `${cp.archives.at(-1)}.json`), "[]");
  const corrupt = await runIterativeCodingAgent(f.input);
  assert.match(corrupt.error, /archive-integrity/);
  assert.equal(calls, 1);
});

test("a concurrent writer cannot run the same task", async (t) => {
  const f = fixture(t);
  let release;
  let started;
  const ready = new Promise((r) => { started = r; });
  const hold = new Promise((r) => { release = r; });
  let calls = 0;
  f.input.model_transport = transport(async () => { calls++; started(); await hold; return f.final(); });
  const first = runIterativeCodingAgent(f.input);
  await ready;
  const second = await runIterativeCodingAgent(f.input);
  assert.equal(second.status, "BLOCK");
  assert.match(second.error, /EEXIST/);
  release();
  assert.equal((await first).status, "AWAITING_APPROVAL");
  assert.equal(calls, 1);
});

test("evidence retrieval rejects foreign references", async (t) => {
  const f = fixture(t);
  f.input.model_transport = transport(() => toolEvent("bad-ref", "read-context-evidence", {digest: "0".repeat(64)}));
  const output = await runIterativeCodingAgent(f.input);
  assert.match(output.error, /foreign-evidence/);
});

test("duplicate event IDs remain rejected after recycling", async (t) => {
  const f = fixture(t);
  f.input.model_transport = transport(() => toolEvent("same"));
  const output = await runIterativeCodingAgent(f.input);
  assert.deepEqual(output.reason_codes, ["event.id-duplicate"]);
  assert.equal(output.recycling.recycles, 1);
});

test("invalid policies, effect approval and checkpoint paths fail closed", async (t) => {
  for (const change of [
    (i) => { i.context_recycling.safety_margin = 0; },
    (i) => { i.context_recycling.recycle_at = 11000; },
    (i) => { i.context_recycling.directory = resolve(i.fixture_root, "checkpoint"); },
    (i) => { i.approve = true; }
  ]) {
    const f = fixture(t);
    let calls = 0;
    f.input.model_transport = transport(() => { calls++; return f.final(); });
    change(f.input);
    assert.equal((await runIterativeCodingAgent(f.input)).status, "BLOCK");
    assert.equal(calls, 0);
  }
});

test("explicit evidence-tool denial blocks before dispatch", async (t) => {
  const f = fixture(t);
  let calls = 0;
  f.input.tool_policy.deny = ["read-context-evidence"];
  f.input.model_transport = transport(() => { calls++; return f.final(); });
  const output = await runIterativeCodingAgent(f.input);
  assert.match(output.error, /evidence-tool-permission-required/);
  assert.equal(calls, 0);
});

test("cancellation while awaiting the model cannot execute its returned tool", async (t) => {
  const f = fixture(t);
  const signal = new AbortController();
  f.input.signal = signal.signal;
  let toolCalls = 0;
  f.input.tool_runtime.invoke = () => { toolCalls++; return {ok: true}; };
  f.input.model_transport = transport(() => { signal.abort(); return toolEvent("late"); });
  const output = await runIterativeCodingAgent(f.input);
  assert.equal(output.status, "CANCELLED");
  assert.equal(toolCalls, 0);
  assert.equal(output.recycling.phase, "model-returned");
});

test("the exact recycle boundary is refused, not treated as spare capacity", async (t) => {
  const f = fixture(t);
  let calls = 0;
  f.input.model_transport = transport(() => { calls++; return f.final(); }, () => 7000);
  const output = await runIterativeCodingAgent(f.input);
  assert.equal(output.status, "BLOCK");
  assert.equal(calls, 0);
});

test("a recycle boundary can pause durably before post-recycle rendering or dispatch", async (t) => {
  const root = mkdtempSync(resolve(tmpdir(), "are-runtime-fork-boundary-")), fixtureRoot = resolve(root, "fixture"), stateRoot = resolve(root, "state");
  mkdirSync(fixtureRoot); writeFileSync(resolve(fixtureRoot, "a.txt"), "source\n");
  t.after(() => rmSync(root, {recursive: true, force: true}));
  let calls = 0, postRecycleRenders = 0;
  const model = createStatelessRecyclingTransport({adapter_id:"fork-fixture",source_ref:"context-recycling.test.mjs:fork",maximum_output_tokens:100,
    measure_request:({prompt})=>prompt.includes("old-visible-history")?7500:100,
    request_once:async()=>{calls++;return {final_bytes:'{"message":{"role":"assistant","content":"ok"}}'};}});
  const scope={request:"fork task"}, options={directory:stateRoot,context_limit:8000,recycle_at:7000,safety_margin:500,
    state:{objective:"fork task",constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:["fixture"]}};
  let recycler=openContextRecycling({options,transport:model,scope,fixture_root:fixtureRoot});
  const first=await recycler.generate({history:[],run_id:"prefix",render:async()=>"fresh"});
  assert.equal(calls,1); recycler.completeStep(["old-visible-history"]);
  await assert.rejects(recycler.generate({history:["old-visible-history"],run_id:"prefix",
    render:async visible=>{if(visible.length===0)postRecycleRenders++;return visible.length?"old-visible-history":"fresh";},
    pause_after_recycle:async boundary=>{assert.equal(boundary.generation,1);assert.equal(boundary.history_count,1);return true;}}),error=>error.code==="boundary-paused");
  assert.equal(calls,1); assert.equal(postRecycleRenders,0);
  let checkpoint=JSON.parse(readFileSync(resolve(stateRoot,"checkpoint.json")));
  assert.equal(checkpoint.phase,"idle"); assert.equal(checkpoint.generation,1); assert.equal(checkpoint.start_index,1); assert.equal(checkpoint.dispatches.length,1);
  recycler.close();
  recycler=openContextRecycling({options,transport:model,scope,fixture_root:fixtureRoot});
  const restored=recycler.initialHistory(["old-visible-history"]);
  await recycler.generate({history:restored,run_id:"control",render:async visible=>{postRecycleRenders++;assert.deepEqual(visible,[]);return "fresh";}});
  assert.equal(calls,2); assert.equal(postRecycleRenders,1); recycler.completeStep(restored,true); recycler.close();
});

test("a resumed recycle boundary selects bounded render candidates before fresh-context rejection", async (t) => {
  const root=mkdtempSync(resolve(tmpdir(),"are-runtime-resumed-projection-")),fixtureRoot=resolve(root,"fixture"),stateRoot=resolve(root,"state");mkdirSync(fixtureRoot);writeFileSync(resolve(fixtureRoot,"a.txt"),"source\n");t.after(()=>rmSync(root,{recursive:true,force:true}));
  let calls=0,lastPrompt=null;
  const model=createStatelessRecyclingTransport({adapter_id:"resumed-projection",source_ref:"context-recycling.test.mjs:resumed-projection",maximum_output_tokens:100,
    measure_request:({prompt})=>prompt==="projected"?100:7500,request_once:async({prompt})=>{calls++;lastPrompt=prompt;return{final_bytes:'{"message":{"role":"assistant","content":"ok"}}'};}});
  const scope={request:"resume projection"},options={directory:stateRoot,context_limit:8000,recycle_at:7000,safety_margin:500,state:{objective:"resume projection",constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:["fixture"]}};
  let recycler=openContextRecycling({options,transport:model,scope,fixture_root:fixtureRoot});
  // Seed one completed dispatch whose history will force recycling next.
  // The first prompt must fit, so use the projected candidate as the seed.
  await recycler.generate({history:[],run_id:"prefix",render:async()=>"projected"});recycler.completeStep(["oversized pending exchange"]);
  await assert.rejects(recycler.generate({history:["oversized pending exchange"],run_id:"prefix",render:async()=>"full",
    render_candidates:async()=>["full","projected"],pause_after_recycle:async()=>true}),error=>error.code==="boundary-paused");
  assert.equal(calls,1);let checkpoint=JSON.parse(readFileSync(resolve(stateRoot,"checkpoint.json")));assert.equal(checkpoint.post_recycle_render_pending.generation,1);recycler.close();
  recycler=openContextRecycling({options,transport:model,scope,fixture_root:fixtureRoot});
  await recycler.generate({history:["oversized pending exchange"],run_id:"branch",render:async()=>{throw Error("ordinary render must not run");},render_candidates:async()=>["full","projected"]});
  assert.equal(calls,2);assert.equal(lastPrompt,"projected");checkpoint=JSON.parse(readFileSync(resolve(stateRoot,"checkpoint.json")));assert.equal(checkpoint.post_recycle_render_pending,null);assert.equal(checkpoint.phase,"model-returned");const resumedDigest=checkpoint.dispatches.at(-1).prompt_digest;recycler.completeStep(["oversized pending exchange"],true);recycler.close();
  const uninterruptedState=resolve(root,"uninterrupted"),uninterruptedPrompts=[];
  const uninterruptedModel=createStatelessRecyclingTransport({adapter_id:"resumed-projection",source_ref:"context-recycling.test.mjs:resumed-projection",maximum_output_tokens:100,
    measure_request:({prompt})=>prompt==="projected"?100:7500,request_once:async({prompt})=>{uninterruptedPrompts.push(prompt);return{final_bytes:'{"message":{"role":"assistant","content":"ok"}}'};}});
  const uninterrupted=openContextRecycling({options:{...options,directory:uninterruptedState},transport:uninterruptedModel,scope,fixture_root:fixtureRoot});
  await uninterrupted.generate({history:[],run_id:"uninterrupted",render:async()=>"projected"});uninterrupted.completeStep(["oversized pending exchange"]);
  await uninterrupted.generate({history:["oversized pending exchange"],run_id:"uninterrupted",render:async()=>"full",render_candidates:async()=>["full","projected"]});
  const uninterruptedCheckpoint=JSON.parse(readFileSync(resolve(uninterruptedState,"checkpoint.json")));assert.equal(uninterruptedPrompts.at(-1),lastPrompt);assert.equal(uninterruptedCheckpoint.dispatches.at(-1).prompt_digest,resumedDigest);uninterrupted.completeStep(["oversized pending exchange"],true);uninterrupted.close();
});

test("a hard process exit leaves a reservation and writer lock that prevent replay", async (t) => {
  const f = fixture(t);
  const data = resolve(f.root, "crash.json");
  writeFileSync(data, JSON.stringify({...f.input, tool_runtime: undefined}));
  const code = `import {readFileSync} from 'node:fs';
    import {runIterativeCodingAgent} from ${JSON.stringify(new URL("../iterative-agent.mjs", import.meta.url).href)};
    import {createStatelessRecyclingTransport,createBoundedRecoveryRecyclingTransport} from ${JSON.stringify(new URL("../context-recycling.mjs", import.meta.url).href)};
    const input = JSON.parse(readFileSync(process.argv[1]));
    const model_transport = createStatelessRecyclingTransport({adapter_id:'fixture',source_ref:'context-recycling.test.mjs:synthetic-byte-provider',maximum_output_tokens:2000,measure_request:({prompt})=>Buffer.byteLength(prompt),request_once:async()=>process.exit(23)});
    await runIterativeCodingAgent({...input,model_transport,tool_runtime:{tool_names:['observe'],tool_contracts:{observe:{arguments:{}}},invoke(){throw Error('unreachable')}}});`;
  assert.throws(() => execFileSync(process.execPath, ["--input-type=module", "-e", code, data], {timeout: 10000}), (e) => e.status === 23);
  const cp = JSON.parse(readFileSync(resolve(f.root, "state/checkpoint.json")));
  assert.equal(cp.phase, "model-pending");
  assert.equal(cp.dispatches.length, 1);
  let calls = 0;
  f.input.model_transport = transport(() => { calls++; return f.final(); });
  const resumed = await runIterativeCodingAgent(f.input);
  assert.match(resumed.error, /EEXIST/);
  assert.equal(calls, 0);
});

test('bounded recovery adapter requires matching attempt evidence while default stays single-attempt',async t=>{
 for(const broken of [null,'hash','sequence','unclassified','excess','final']){
  const f=fixture(t);let calls=0;
  f.input.model_transport=createBoundedRecoveryRecyclingTransport({adapter_id:'recovery-fixture',source_ref:'trusted-recovery-fixture',maximum_output_tokens:2000,measure_request:()=>100,
   request_bounded:async({dispatch,maximum_attempts})=>{
    calls++;assert.equal(maximum_attempts,2);
    const first={attempt_index:0,model_request_sequence:dispatch.sequence,request_sha256:'a'.repeat(64),dispatched:true,retryable:true};
    const second={...first,attempt_index:1};const attempts=[first,second];
    if(broken==='hash')second.request_sha256='b'.repeat(64);
    if(broken==='sequence')second.model_request_sequence++;
    if(broken==='unclassified')first.retryable=false;
    if(broken==='excess')attempts.push({...second,attempt_index:2});
    return {final_bytes:f.final(),receipt:broken==='final'?first:second,attempt_receipts:attempts};
   }});
  const r=await runIterativeCodingAgent(f.input);assert.equal(calls,1);assert.equal(r.status,broken?'BLOCK':'AWAITING_APPROVAL');
 }
});
