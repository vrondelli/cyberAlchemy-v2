
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
export const invokeWithTrace=createTracedInvoker(model,bindings,api,execute,validateInput,ontology,{...{"source_sha256":"7bc16d03e789ec7dfaa9d754f701c602e1d99ea1f4b4b38cbe3494de8c1aba73","ontology_sha256":"d4593682e09212ddb7e9439d5fc266bf587ea8a3ae063d504dffcf5e77acc154","behavior_sha256":"b7804b09bb280fedd800f77889237851d92e8228d6590d1f43ad5712380d01eb","contract_sha256":"074e39d35b6dbde3675debdd76167367b1bb611254e086791e2b948e843197a9"},manifest},createBoundary,modules);
export default {fetch:handler};
