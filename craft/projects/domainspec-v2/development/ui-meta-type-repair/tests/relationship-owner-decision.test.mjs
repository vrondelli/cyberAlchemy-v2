import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createRelationshipOwnerDecision } from "../evidence/relationship-owner-decision.mjs";

const root=dirname(dirname(fileURLToPath(import.meta.url)));
const packet=JSON.parse(readFileSync(join(root,"evidence/results/relationship-packet/generation-001/packet.json"),"utf8"));
const fixture=JSON.parse(readFileSync(join(root,"fixtures/contracts/relationship-owner-decision-current.json"),"utf8"));
const digest=fixture.authority_digest;
const builder=join(root,"evidence/build-relationship-decision-generation.mjs");
const build=(input=fixture,extra={})=>createRelationshipOwnerDecision(input,{packet,...extra,actualAuthorityDigest:extra.actualAuthorityDigest??digest});

test("all four decisions are traceable and have no authority effect",()=>{const result=build();assert.equal(result.semantic.decisions.length,4);assert.equal(result.semantic.authority.effect,"none");assert.ok(result.semantic.decisions.every((entry)=>entry.authority_effect==="none"&&entry.admitted_signatures.length===0));const action=result.semantic.decisions.find((entry)=>entry.question_id==="action-source");assert.equal(action.disposition,"route-open");assert.ok(action.evidence_obligations.length>=5);});
test("stale digest, missing, duplicate, unknown, and invalid options fail closed",()=>{assert.throws(()=>build(fixture,{actualAuthorityDigest:`sha256:${"0".repeat(64)}`}),/authority digest drift/);const missing=structuredClone(fixture);missing.decisions.pop();assert.throws(()=>build(missing),/exactly four decisions/);const duplicate=structuredClone(fixture);duplicate.decisions[3]={...duplicate.decisions[0]};assert.throws(()=>build(duplicate),/duplicate decision/);const invalid=structuredClone(fixture);invalid.decisions[0].selected_option_id="unknown";assert.throws(()=>build(invalid),/invalid option/);});
test("route-open without obligations and all authority mutation claims reject",()=>{const noObligations=structuredClone(fixture);noObligations.decisions[0].evidence_obligations=[];assert.throws(()=>build(noObligations),/route-open requires/);const admitted=structuredClone(fixture);admitted.decisions[0].admitted_signatures=["Action --[does]--> Target"];assert.throws(()=>build(admitted),/no signature may be admitted/);for(const field of ["changed_signature_count","invented_verb","invented_target","ds_d1_promotion","packet_mutation"]){const value=structuredClone(fixture);value.decisions[0][field]=true;assert.throws(()=>build(value),new RegExp(`${field} is prohibited`));}});
test("builder publishes and replays immutably",()=>{const temp=mkdtempSync(join(tmpdir(),"uir-rel-decision-"));try{let run=spawnSync(process.execPath,[builder,"--out-dir",temp],{encoding:"utf8"});assert.equal(run.status,0,run.stderr);assert.match(run.stdout,/PASS: published 4\/4/);const target=join(temp,"decision.json");const before=readFileSync(target,"utf8");run=spawnSync(process.execPath,[builder,"--out-dir",temp],{encoding:"utf8"});assert.equal(run.status,0,run.stderr);assert.match(run.stdout,/NO-OP/);const changed=JSON.parse(before);changed.content_digest=`sha256:${"f".repeat(64)}`;writeFileSync(target,JSON.stringify(changed),"utf8");run=spawnSync(process.execPath,[builder,"--out-dir",temp],{encoding:"utf8"});assert.notEqual(run.status,0);assert.match(run.stderr,/refusing to overwrite/);}finally{rmSync(temp,{recursive:true,force:true});}});
