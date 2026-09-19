// Additive repair of prospective linkage. Open questions: RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md.
import assert from 'node:assert/strict';import {readFileSync,writeFileSync} from 'node:fs';import {join,resolve} from 'node:path';import {createHash} from 'node:crypto';
import {buildProspectiveDag,verifyProspectiveDag} from './schema-agreement-prospective-dag-r1.mjs';
const c=import.meta.dirname,root=resolve(c,'../../../../../..'),read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const candidatePath=join(c,'SCHEMA-AGREEMENT-RESEARCH-R1.json'),candidate=read(candidatePath),parent=read(candidate.parent_ref);
for(const b of candidate.source_bindings)assert.equal(hash(resolve(root,b.path)),b.sha256);
const graph=buildProspectiveDag({candidate,parent});assert.equal(verifyProspectiveDag({graph,candidate,parent}),true);
const refs=[candidatePath,candidate.parent_ref,join(c,'schema-agreement-prospective-dag-r1.mjs'),join(c,'register-schema-agreement-overlay-r1.mjs')];
const artifact={schema:'are.schema-agreement-prospective-registration/v1',candidate_ref:candidatePath,parent_ref:candidate.parent_ref,graph,source_bindings:refs.map(path=>({path,sha256:hash(path)})),historical_artifact_unchanged:true,registration_review_required:true,dispatch_admitted:false,provider_calls:0,open_questions_ref:'RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md'};
writeFileSync(join(c,'SCHEMA-AGREEMENT-PROSPECTIVE-OVERLAY-R1.json'),JSON.stringify(artifact,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({nodes:graph.nodes.length,edges:graph.edges.length,layers:graph.dependency_layers.length,provider_calls:0}));
