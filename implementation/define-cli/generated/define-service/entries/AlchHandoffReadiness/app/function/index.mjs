
import {createBoundary} from '../../runtime/boundary.mjs';
import {createTracedInvoker} from '../../runtime/invocation-trace.mjs';
import ontology from '../../provenance/function/ontology.json' with {type:'json'};
import manifest from '../../manifest.json' with {type:'json'};
import {execute,validateInput} from './behavior.mjs';
import api from '../../domain/typescript/lib/index.js';
import model from '../../provenance/function/function.json' with {type:'json'};
import bindings from '../../provenance/function/bindings.json' with {type:'json'};
const modules={};
export function createInvoker(observe){const relay=event=>{const n=ontology.nodes.find(n=>n.name===event.declaration)??ontology.nodes.find(n=>n.kind==='result');observe?.({...event,definition:event.definition??(n?{name:n.name,id:n.id,source:n.source,clauses:n.clauses}:null)});};return createBoundary(model,bindings,scope=>execute(scope,api,relay),scope=>validateInput(scope,relay),modules,relay,(scope,binding)=>execute(scope,api,relay,binding),(scope,binding)=>execute(scope,api,relay,binding,'input'));};
export const {invoke,handler}=createInvoker();
export const invokeWithTrace=createTracedInvoker(model,bindings,api,execute,validateInput,ontology,{...{"source_sha256":"08d76a85a62282738337cf087facd0155d343d8416ebf5a0bb7daebf88e289e0","ontology_sha256":"4808fecf8c1a55c943afcaedb8d35283f76579937aff2b9dc68a9a0f535e89aa","behavior_sha256":"1990a6659dd090c8f52842baf0ff8a26c4672063e82d7e21a5e114053f5a806b","contract_sha256":"e1e3d59f9aa8835f3733f502faccbf5e95e955b7e4a5ba885330978284f25336"},manifest},createBoundary,modules);
export default {fetch:handler};
