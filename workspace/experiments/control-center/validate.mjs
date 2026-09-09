import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
const root=path.dirname(fileURLToPath(import.meta.url));
const load=p=>JSON.parse(fs.readFileSync(path.join(root,p)));
const fail=m=>{throw Error(m);};
const hash=b=>crypto.createHash("sha256").update(b).digest("hex");
const profile=load("profile.json");
execFileSync("python3", ["-c", "import json,sys; from pathlib import Path; from jsonschema import Draft202012Validator; p=Path(sys.argv[1]); s=json.loads((p/'ontology-schema.json').read_text()); Draft202012Validator.check_schema(s); [(Draft202012Validator({'$ref':'#/$defs/'+n,'$defs':s['$defs']}).validate(json.loads((p/(n+'.json')).read_text()))) for n in ('business','system','bridge')]", root], {stdio:"pipe"});
const packPath=path.resolve(root,profile.source.path),raw=fs.readFileSync(packPath);
if(hash(raw)!==profile.source.sha256)fail("Definition Pack drift");
const pack=JSON.parse(raw);
for(const src of pack.sources) {
 const bytes=fs.readFileSync(path.resolve(path.dirname(packPath),src.path));
 if(hash(bytes)!==src.sha256)fail("Upstream source drift: "+src.id);
 for(const selector of src.selectors)if(!bytes.toString().includes(selector))fail("Missing selector");
}
const business=load("business.json"),system=load("system.json"),bridge=load("bridge.json");
const b=new Set(business.nodes.map(n=>n.id)),s=new Set(system.nodes.map(n=>n.id));
if(b.size!==6||s.size!==7)fail("Identity coverage");
for(const c of pack.concepts) {
 const n=business.nodes.find(n=>n.id===c.id);
 if(n?.invariant!==c.formal||n?.meaning!==c.normative||n?.parent_ref!==c.parent)fail("Meaning drift");
 for(const t of n.transitions)if(!n.states.includes(t.from)||!n.states.includes(t.to))fail("State closure");
}
for(const edge of business.relations)if(!b.has(edge.from)||!b.has(edge.to))fail("Business endpoint");
for(const edge of bridge.relations)if(!b.has(edge.from)||!s.has(edge.to)||edge.type!=="planned_realization")fail("Bridge endpoint/posture");
for(const n of system.nodes)if(!fs.existsSync(path.join(root,n.implementation_ref)))fail("Missing implementation");
const scenarios=load("scenarios.json"),tests=fs.readFileSync(path.join(root,"model.test.mjs"),"utf8");
if(scenarios.length!==21||new Set(scenarios.map(s=>s.id)).size!==21)fail("Scenario coverage");
for(const scenario of scenarios)if(!tests.includes(scenario.id+":"))fail("Missing scenario test");
for(const doc of [profile,business,system,bridge])if(doc.authority_effect!=="none")fail("Authority inflation");
console.log("PASS: source currency, six contracts, seven components, bridge closure, 21 scenario mappings. Planned mappings remain candidate.");
