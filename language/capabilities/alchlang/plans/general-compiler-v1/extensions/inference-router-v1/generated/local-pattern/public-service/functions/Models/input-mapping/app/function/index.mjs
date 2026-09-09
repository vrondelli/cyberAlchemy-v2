
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
export const invokeWithTrace=createTracedInvoker(model,bindings,api,execute,validateInput,ontology,{...{"source_sha256":"efd10d29ba49180eceeb54b1bb82ef27c1d30c187d4b0fdb1ef7c6c37f98b2a1","ontology_sha256":"7ba5a79e9d375aaca1fb5e702ae2eda78192402bad3807aabbc0d920c886301a","behavior_sha256":"7a65af85e5fb76a276746eb525e232cca865aa7785bcbc05c96e1351f2e3c66f","contract_sha256":"8eff3a3707d7eb36836ddfbc540ce1bd53c36c169c38e958afab798400dda0e6"},manifest},createBoundary,modules);
export default {fetch:handler};
