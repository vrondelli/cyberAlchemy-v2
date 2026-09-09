
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
export const invokeWithTrace=createTracedInvoker(model,bindings,api,execute,validateInput,ontology,{...{"source_sha256":"9886311508523bb07627f2fde37e3ff163bf999d7c9fa0d2a52cadf383547da8","ontology_sha256":"e235cc374e76ba27c7f10ae1b2cd0cea9e556d58cf464e1fe1271ca4316fffe4","behavior_sha256":"f4882e8ee818609a54c92992bf3ef31380be2d50eda887ee125ca55754853aeb","contract_sha256":"4d34ff90f3e96d0eefb9f4c8e687b82205b4fea6f7e0ba9e2bb425469aaa8ab5"},manifest},createBoundary,modules);
export default {fetch:handler};
