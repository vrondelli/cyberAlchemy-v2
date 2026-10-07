#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const review = path.dirname(fileURLToPath(import.meta.url));
const implementation = path.resolve(review, "../..");
const source = path.join(review, "source/commerce.alch");
const generated = path.join(review, "generated");
const toolchain = path.join(implementation, "scripts/run-toolchain.mjs");
const cli = path.join(implementation, "src/core-cli.ts");

function command(args, options = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd: options.cwd ?? implementation,
    encoding: "utf8",
    timeout: options.timeout ?? 120_000,
  });
  assert.equal(result.status, 0, `${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
  return result.stdout.trim();
}

function stubNativeDependencies(native) {
  const modules = path.join(native, "node_modules");
  fs.mkdirSync(path.join(modules, "@types"), { recursive: true });
  fs.symlinkSync(path.join(implementation, "node_modules/@types/node"),
    path.join(modules, "@types/node"), "dir");
  for (const [name, sourceCode, declarations] of [
    ["nats", "export const headers=()=>({set(){}});export const connect=async()=>({jetstream:()=>({}),drain:async()=>{}});\n",
      "export interface MsgHdrs{set(name:string,value:string):void} export function headers():MsgHdrs; export interface JetStreamClient{publish(subject:string,payload:Uint8Array,options?:{headers?:MsgHdrs}):Promise<{stream:string;seq:number}>} export interface NatsConnection{jetstream():JetStreamClient;drain():Promise<void>} export function connect(options:{servers:string}):Promise<NatsConnection>;\n"],
    ["pg", "export class Pool{constructor(_options){}async connect(){throw Error('stub')}async query(){return{rows:[]}}async end(){}}\n",
      "export interface QueryResult<Row=Record<string,unknown>>{rows:Row[]} export interface PoolClient{query<Row=Record<string,unknown>>(sql:string,values?:readonly unknown[]):Promise<QueryResult<Row>>;release():void} export class Pool{constructor(options?:{connectionString?:string});connect():Promise<PoolClient>;query<Row=Record<string,unknown>>(sql:string,values?:readonly unknown[]):Promise<QueryResult<Row>>;end():Promise<void>}\n"],
  ]) {
    const directory = path.join(modules, name);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, "package.json"), JSON.stringify({ name, type: "module", exports: { ".": { types: "./index.d.ts", import: "./index.js" } } }));
    fs.writeFileSync(path.join(directory, "index.js"), sourceCode);
    fs.writeFileSync(path.join(directory, "index.d.ts"), declarations);
  }
}

const check = JSON.parse(command([toolchain, "tsx", cli, "check", source]));
assert.equal(check.status, "valid");
assert.equal(check.scope, "provider-application-artifacts");
assert.deepEqual(check.unsupported_residue, []);
const verify = JSON.parse(command([toolchain, "tsx", cli, "verify", source, "--out", generated]));
assert.equal(verify.status, "verified");

const graph = JSON.parse(fs.readFileSync(path.join(generated, ".domainspec/application-graph.json"), "utf8"));
assert.match(fs.readFileSync(path.join(generated, "src/features/commerce/application/operations/submit-order.provider.ts"), "utf8"), /WRITE_IDENTITY_MISMATCH/);
const request = graph.operation_requests.find(row => row.operation_ref === "commerce:submit-order");
assert.ok(request, "generated operation request exists");
const binding = request.bindings[0].mapping_binding_ref;
const mapping = graph.runtime_bindings.find(row => row.binding_id === binding);
assert.ok(mapping, "generated request mapping exists");
const body = {};
const parts = mapping.inputs[0].source.path;
let target = body;
for (const part of parts.slice(0, -1)) target = target[part] = {};
if (parts.length) target[parts.at(-1)] = { id: "7", accepted: true };
else Object.assign(body, { id: "7", accepted: true });
const wrongBody = structuredClone(body);
let wrongTarget = wrongBody;
for (const part of parts) wrongTarget = wrongTarget[part];
wrongTarget.id = "8";

const runner = `import assert from 'node:assert/strict';
import {APPLICATION_REQUEST_HANDLERS as handlers} from './src/integrations/application-request-handlers.ts';
async function main(){
const results=[];
for(const [name,payload,row,expected,expectedCall] of [
  ['missing',${JSON.stringify(body)},null,'READ_NOT_FOUND','rollback'],
  ['one',${JSON.stringify(body)},{id:'7',accepted:true},'committed','commit'],
  ['wrong-identity',${JSON.stringify(wrongBody)},{id:'7',accepted:true},'READ_IDENTITY_MISMATCH','rollback']]){
  const calls=[];
  const result=await handlers[${JSON.stringify(binding)}](payload,{store:{begin:async()=>({
    read:async()=>row,querySource:async()=>{throw Error('unexpected Query source')},
    commit:async batch=>{calls.push('commit');assert.equal(batch.writes[0].value.id,7n);return {status:'committed'}},
    rollback:async()=>{calls.push('rollback')}
  })}});
  assert.equal(result.status==='committed'?'committed':result.code,expected);
  assert.deepEqual(calls,[expectedCall]);
  if(name==='one')assert.equal(result.value.id,7n);
  results.push({name,result:expected,transaction:expectedCall});
}
console.log(JSON.stringify(results));
}
main().catch(error=>{console.error(error);process.exitCode=1});`;
const business = JSON.parse(command([toolchain, "tsx", "--eval", runner], { cwd: generated }));
assert.equal(business.length, 3);

const connectedRunner = `import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {GeneratedApplicationRuntime} from './src/providers/reference/application.ts';
import {createWebhookServer} from './src/providers/reference/inbound-http.ts';
async function main(){
  const calls=[];
  const store={begin:async()=>({
    read:async()=>({id:'7',accepted:true}),
    querySource:async()=>{throw Error('unexpected Query source')},
    commit:async batch=>{calls.push('commit');assert.equal(batch.writes[0].value.id,7n);return {status:'committed'}},
    rollback:async()=>{calls.push('rollback')}
  })};
  const application=new GeneratedApplicationRuntime(store);
  const secret='local-review-secret';
  const server=createWebhookServer('127.0.0.1:0',secret,body=>application.handleWebhook(JSON.parse(body)));
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
  try{
    const address=server.address();assert.ok(address&&typeof address==='object');
    const url='http://127.0.0.1:'+address.port+'/orders';
    const body=JSON.stringify(${JSON.stringify(body)});
    const wrongRoute=await fetch('http://127.0.0.1:'+address.port+'/webhook',{method:'POST',body});
    assert.equal(wrongRoute.status,405);
    const invalid=await fetch(url,{method:'POST',headers:{'x-domainspec-signature':'0'.repeat(64)},body});
    assert.equal(invalid.status,401);assert.deepEqual(calls,[]);
    const oversized='x'.repeat(65537);
    const oversizedSignature=createHmac('sha256',secret).update(oversized).digest('hex');
    const tooLarge=await fetch(url,{method:'POST',headers:{'x-domainspec-signature':oversizedSignature},body:oversized});
    assert.equal(tooLarge.status,413);assert.deepEqual(calls,[]);
    const signature=createHmac('sha256',secret).update(body).digest('hex');
    const valid=await fetch(url,{method:'POST',headers:{'x-domainspec-signature':signature},body});
    assert.equal(valid.status,200);
    const response=await valid.json();assert.deepEqual(response,{id:'7',accepted:true});
    assert.deepEqual(calls,['commit']);
    console.log(JSON.stringify({invalid_status:401,valid_status:200,response,transaction:'commit'}));
  }finally{await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()))}
}
main().catch(error=>{console.error(error);process.exitCode=1});`;
const connected = JSON.parse(command([toolchain, "tsx", "--eval", connectedRunner], { cwd: generated }));
assert.equal(connected.valid_status, 200);

const disposable = fs.mkdtempSync(path.join(os.tmpdir(), "alchlang-whole-review-"));
try {
  const native = path.join(disposable, "native");
  fs.cpSync(generated, native, { recursive: true, errorOnExist: true, force: false });
  stubNativeDependencies(native);
  command([toolchain, "tsc", "-p", path.join(native, "tsconfig.json"), "--noEmit", "--types", "node"]);
  command([toolchain, "tsc", "-p", path.join(native, "tsconfig.json"), "--noEmit", "false", "--outDir", path.join(native, "dist"), "--types", "node"]);
  const providerRunner = `import assert from 'node:assert/strict';
import {Postgresql16ApplicationStore} from './dist/src/providers/reference/persistence.js';
import {NatsJetStreamApplicationPublisher} from './dist/src/providers/reference/messaging.js';
import {FetchApplicationGateway} from './dist/src/providers/reference/outbound-http.js';
const statements=[];let releases=0;
const pool={connect:async()=>({query:async sql=>{statements.push(sql);return {rows:[]}},release:()=>{releases++}})};
const store=new Postgresql16ApplicationStore(pool);
const transaction=await store.begin();
assert.deepEqual(await transaction.commit({writes:[{target:'commerce:order',mode:'replace',value:{id:7n,accepted:true}}],events:[]}),{status:'rejected'});
assert.deepEqual(statements,['BEGIN','ROLLBACK']);assert.equal(releases,1);
const empty=await store.begin();
assert.deepEqual(await empty.commit({writes:[],events:[]}),{status:'committed'});
assert.deepEqual(statements,['BEGIN','ROLLBACK','BEGIN','COMMIT']);assert.equal(releases,2);
const publisher=new NatsJetStreamApplicationPublisher({publish:async()=>{throw Error('unexpected publish')}},'orders');
await assert.rejects(publisher.publish({}),/PROVIDER_EVENT_ID_REQUIRED/);
await assert.rejects(publisher.publishPending(pool),/PROVIDER_OUTBOX_DRAIN_NOT_OBSERVED/);
const originalFetch=globalThis.fetch;const sent=[];
globalThis.fetch=async (_url,options)=>{sent.push(options);return new Response(JSON.stringify({ok:true}),{status:200})};
try{
  const gateway=new FetchApplicationGateway('https://payment.invalid');
  await assert.rejects(gateway.invoke('/authorize',{orderId:'7'},''),/PROVIDER_IDEMPOTENCY_KEY_REQUIRED/);
  await assert.rejects(gateway.invoke('/authorize',{orderId:'7'},'invalid key'),/PROVIDER_IDEMPOTENCY_KEY_INVALID/);
  await assert.rejects(gateway.invoke('/authorize',undefined,'submission-7-v1'),/PROVIDER_REQUEST_SERIALIZATION_INVALID/);
  assert.deepEqual(sent,[]);
  assert.deepEqual(await gateway.invoke('/authorize',{orderId:7n,amountMinor:25n},'submission-7-v1'),{ok:true});
  assert.equal(sent[0].headers['Idempotency-Key'],'submission-7-v1');
  assert.equal(sent[0].body,JSON.stringify({orderId:'7',amountMinor:'25'}));
  globalThis.fetch=async (_url,options)=>{sent.push(options);if(sent.length===2)throw Error('ambiguous timeout');return new Response(JSON.stringify({ok:true}),{status:200})};
  await assert.rejects(gateway.invoke('/authorize',{orderId:'7'},'submission-7-v1'),/http:timeout/);
  assert.deepEqual(await gateway.invoke('/authorize',{orderId:'7'},'submission-7-v1'),{ok:true});
  assert.deepEqual(sent.map(call=>call.headers['Idempotency-Key']),['submission-7-v1','submission-7-v1','submission-7-v1']);
}finally{globalThis.fetch=originalFetch}
console.log(JSON.stringify({nonempty_batch:'rejected',empty_batch:'committed',outbox:'not-observed',outbound:'idempotency-key-required'}));`;
  fs.writeFileSync(path.join(native, "provider-check.mjs"), providerRunner);
  const provider = JSON.parse(command([path.join(native, "provider-check.mjs")], { cwd: native }));
  const scenario = path.resolve(implementation, "../../../../../..", "craft/projects/domainspec-v2/impl/cli/examples/reconciled-commerce/scenarios/typescript-webhook.mjs");
  const loopback = JSON.parse(command([scenario, native, "/orders"]));
  assert.deepEqual(loopback, { language: "typescript", startup: "http-listener", invalid_status: 401,
    valid_status: 202, handler_invocations: 1, result: "pass" });

  const graphFile = path.join(native, ".domainspec/application-graph.json");
  fs.appendFileSync(graphFile, "\n");
  const tampered = spawnSync(process.execPath, [toolchain, "tsx", cli, "verify", source, "--out", native],
    { cwd: implementation, encoding: "utf8", timeout: 120_000 });
  assert.notEqual(tampered.status, 0, "tampered graph must fail verification");

  const finalVerify = JSON.parse(command([toolchain, "tsx", cli, "verify", source, "--out", generated]));
  assert.equal(finalVerify.status, "verified");
  process.stdout.write(`${JSON.stringify({ status: "pass", source_check: check.status, output_verify: finalVerify.status,
    generated_artifacts: check.generated_artifacts, manifest_sha256: finalVerify.manifest_sha256,
    business, connected, provider, loopback, tamper_rejected: true, runtime_guarantees_observed: false }, null, 2)}\n`);
} finally {
  fs.rmSync(disposable, { recursive: true, force: true });
}
