import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRelationshipOwnerDecision } from "./relationship-owner-decision.mjs";

const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,"..");
const packetPath=resolve(getArg("--packet")||join(here,"results/relationship-packet/generation-001/packet.json"));
const inputPath=resolve(getArg("--input")||join(root,"fixtures/contracts/relationship-owner-decision-current.json"));
const authorityPath=resolve(getArg("--authority")||join(root,"../../definitions/relationships/relationships.yml"));
const outDir=resolve(getArg("--out-dir")||join(here,"results/relationship-decision/generation-001"));
const packet=JSON.parse(readFileSync(packetPath,"utf8"));
const input=JSON.parse(readFileSync(inputPath,"utf8"));
const actualAuthorityDigest=`sha256:${createHash("sha256").update(readFileSync(authorityPath)).digest("hex")}`;
const result=createRelationshipOwnerDecision(input,{packet,actualAuthorityDigest});
const target=join(outDir,"decision.json");
if(existsSync(target)){const existing=JSON.parse(readFileSync(target,"utf8"));if(existing.content_digest===result.content_digest&&existing.generation_id===result.generation_id){console.log("NO-OP: immutable relationship owner-decision generation already exists");process.exit(0);}throw new Error("refusing to overwrite non-identical relationship owner-decision generation");}
mkdirSync(outDir,{recursive:true});writeFileSync(target,`${JSON.stringify(result,null,2)}\n`,"utf8");console.log("PASS: published 4/4 relationship owner decisions with no authority effect");
function getArg(name){const index=process.argv.indexOf(name);return index<0?undefined:process.argv[index+1];}
