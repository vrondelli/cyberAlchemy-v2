
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
export const invokeWithTrace=createTracedInvoker(model,bindings,api,execute,validateInput,ontology,{...{"source_sha256":"97457dc2fd36624cb9af4f8f8f68830e218afa6827e2e722dd5779ac8c0d5ee7","ontology_sha256":"a083d27d2b09b45d2e4987e03aca197c8e02d98fb8a330fd4d30f96962a7c25f","behavior_sha256":"0832d296ea062bf5fd9378dc7c6b3a38223ff8510653f28b23b23b1e2b9f9bfe","contract_sha256":"5b51b9a3a7eeeedc5061cf915f382aac59b6302103c3c3baea34e1fd7ccb6144"},manifest},createBoundary,modules);
export default {fetch:handler};
