#!/usr/bin/env node
// Provider-free production freeze builder. Importing and preparing never accesses credential bytes.
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {chmodSync, closeSync, constants, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync} from "node:fs";
import {basename, dirname, join, resolve} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {ADAPTER_PATH, EVALUATOR_FREEZE_SCHEMA, RECOVERY_SEAL_FILE_SHA256, RUBRIC_PATH, RUBRIC_SHA256, SCORER_PATH, normalizeRecoverySeal, openUnexposedEvaluator} from "./evaluate-unexposed-v1.mjs";
import {inspectGateway} from "./provider-gateway-unexposed-v1.mjs";
import {sha} from "./adapter-unexposed-v1.mjs";

const here = import.meta.dirname;
const HASH = /^[a-f0-9]{64}$/;
export const PREPARE_SCHEMA = "are.longmemeval-unexposed-evaluation-preparation/v1";
export const rawSha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const readJson = (path) => JSON.parse(readFileSync(path));
const regular = (path) => { const stat = lstatSync(path); assert.ok(stat.isFile() && !stat.isSymbolicLink(), `not regular: ${path}`); return stat; };
const binding = (role, path) => { const absolute = resolve(path); regular(absolute); const raw = readFileSync(absolute); return {role, path:absolute, bytes:raw.length, sha256:rawSha(raw)}; };
const syncDir = (path) => { const fd=openSync(path,constants.O_RDONLY|constants.O_DIRECTORY);try{fsyncSync(fd);}finally{closeSync(fd);} };
const writeExclusive = (directory, name, value) => { const path=join(directory,name),fd=openSync(path,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL,0o600);try{writeFileSync(fd,`${JSON.stringify(value)}\n`);fsyncSync(fd);}finally{closeSync(fd);}chmodSync(path,0o400);syncDir(directory);return binding(name,path); };

export function prepareEvaluation(config, {gatewayInspector=inspectGateway}={}) {
  const required=["source_file","source_manifest","source_directory","reference_directory","recovery_seal","output_directory"];
  for(const key of required) assert.equal(typeof config?.[key],"string",key);
  const sourceFile=resolve(config.source_file),sourceManifest=resolve(config.source_manifest),sourceDirectory=resolve(config.source_directory),referenceDirectory=resolve(config.reference_directory),recoverySeal=resolve(config.recovery_seal),output=resolve(config.output_directory);
  assert.match(basename(output),/^longmemeval-unexposed-evaluation-prepare-r[1-9][0-9]*$/);assert.ok(!existsSync(output),"preparation output exists");
  assert.equal(binding("source-file",sourceFile).sha256,"d6f21ea9d60a0d56f34a05b609c79c88a451d2ae03597821ea3d5a9678c3a442");
  assert.equal(regular(sourceFile).size,277383467);assert.equal(regular(sourceFile).mode&0o222,0,"source file must remain read-only");
  const sealRaw=readFileSync(recoverySeal);assert.equal(rawSha(sealRaw),RECOVERY_SEAL_FILE_SHA256);const seal=JSON.parse(sealRaw),normalized=normalizeRecoverySeal(seal);
  const projectionPath=join(referenceDirectory,"PROJECTION-RECEIPT.json"),projection=readJson(projectionPath);assert.equal(projection.schema_version,"are.longmemeval-unexposed-offline-reference-projection/v1");assert.equal(projection.status,"verified");assert.equal(resolve(projection.source.path),sourceFile);assert.equal(resolve(projection.destination),referenceDirectory);assert.equal(projection.recovery_seal.sha256,RECOVERY_SEAL_FILE_SHA256);assert.equal(projection.provider_calls,0);assert.equal(projection.judge_calls,0);assert.equal(projection.automatic_retries,0);assert.equal(projection.generator_reference_access,false);
  const sourceManifestValue=readJson(sourceManifest),opened=openUnexposedEvaluator({source_manifest:sourceManifestValue,source_directory:sourceDirectory,reference_directory:referenceDirectory});
  const codePaths={adapter:ADAPTER_PATH,scorer:SCORER_PATH,rubric:RUBRIC_PATH,projector_wrapper:join(here,"project-unexposed-references-v1.py"),projector:join(here,"../project_references.py"),parser:join(here,"../project_stream.py"),prepare:fileURLToPath(import.meta.url),runner:join(here,"live-evaluation-unexposed-v1.mjs"),provider_gateway:join(here,"provider-gateway-unexposed-v1.mjs")};
  assert.deepEqual(projection.question_ids,["0e4e4c46","gpt4_5438fa52","ef66a6e5","0862e8bf_abs"]);assert.equal(projection.source.sha256,"d6f21ea9d60a0d56f34a05b609c79c88a451d2ae03597821ea3d5a9678c3a442");assert.equal(projection.bindings.wrapper_sha256,binding("projector-wrapper",codePaths.projector_wrapper).sha256);assert.equal(projection.bindings.projector_sha256,binding("projector",codePaths.projector).sha256);assert.equal(projection.bindings.parser_sha256,binding("parser",codePaths.parser).sha256);assert.equal(projection.bindings.reference_receipt_sha256,binding("reference-receipt",join(referenceDirectory,"reference-acquisition.json")).sha256);for(const item of projection.bindings.reference_files)assert.equal(binding(`reference:${item.question_id}`,join(referenceDirectory,item.path)).sha256,item.sha256);
  const bindings=[binding("source-file",sourceFile),binding("source-manifest",sourceManifest),binding("source-acquisition",join(sourceDirectory,"acquisition.json")),binding("projection-receipt",projectionPath),binding("reference-receipt",join(referenceDirectory,"reference-acquisition.json")),binding("recovery-seal",recoverySeal),...Object.entries(codePaths).map(([role,path])=>binding(role,path))];
  for(const item of projection.bindings.reference_files)bindings.push(binding(`reference:${item.question_id}`,join(referenceDirectory,item.path)));
  for(const item of bindings)assert.ok(HASH.test(item.sha256));
  const gateway=gatewayInspector(),referenceBinding=opened.binding;
  const parent=dirname(output);mkdirSync(parent,{recursive:true,mode:0o700});const staging=join(parent,`.${basename(output)}.${process.pid}.tmp`);mkdirSync(staging,{mode:0o700});
  try{
    const referenceBindingFile=writeExclusive(staging,"REFERENCE-BINDING.json",referenceBinding);
    const freeze={schema:EVALUATOR_FREEZE_SCHEMA,approved:true,review_required:true,production:true,model:"glm-5.3-flash",context_limit:8000,maximum_judge_calls:8,maximum_judge_tokens:64000,tokenizer_timeout_ms:1200000,automatic_retries:0,generator_reference_access:false,source_file:sourceFile,source_manifest:sourceManifest,source_directory:sourceDirectory,reference_directory:referenceDirectory,recovery_seal:recoverySeal,reference_binding_file:{path:join(output,"REFERENCE-BINDING.json"),sha256:referenceBindingFile.sha256},reference_binding_sha256:sha(referenceBinding),recovery_seal_file_sha256:RECOVERY_SEAL_FILE_SHA256,recovery_seal_object_sha256:sha(seal),normalized_scorer_view_sha256:sha(normalized),adapter_sha256:binding("adapter",ADAPTER_PATH).sha256,scorer_sha256:binding("scorer",SCORER_PATH).sha256,rubric_sha256:RUBRIC_SHA256,gateway_binding:gateway,bindings,provider_calls:0,judge_calls:0,authority_effect:"evaluator-only",claim_ceiling:"Four fixed unexposed full-S tasks; not full-benchmark perfection."};
    const freezeFile=writeExclusive(staging,"FREEZE.json",freeze);const preparation={schema_version:PREPARE_SCHEMA,status:"prepared-pending-independent-review",freeze_sha256:freezeFile.sha256,reference_binding_sha256:freeze.reference_binding_sha256,bindings:[{...referenceBindingFile,path:join(output,"REFERENCE-BINDING.json")},{...freezeFile,path:join(output,"FREEZE.json")}],provider_calls:0,judge_calls:0,credentials_accessed:false,authority_effect:"none"};writeExclusive(staging,"PREPARATION-RECEIPT.json",preparation);
    renameSync(staging,output);syncDir(parent);return {freeze,freeze_sha256:freezeFile.sha256,preparation};
  }catch(error){try{rmSync(staging,{recursive:true,force:true});}catch{}throw error;}
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){assert.equal(process.argv.length,3,"usage: prepare-unexposed-evaluation-v1.mjs CONFIG.json");const prepared=prepareEvaluation(readJson(process.argv[2]));process.stdout.write(`${JSON.stringify({status:prepared.preparation.status,freeze_sha256:prepared.freeze_sha256,provider_calls:0,judge_calls:0})}\n`);}
