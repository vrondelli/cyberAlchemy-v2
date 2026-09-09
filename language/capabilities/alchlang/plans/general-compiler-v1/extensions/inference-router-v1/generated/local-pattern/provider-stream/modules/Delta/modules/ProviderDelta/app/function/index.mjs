
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
export const invokeWithTrace=createTracedInvoker(model,bindings,api,execute,validateInput,ontology,{...{"source_sha256":"3abede7f7d2b1f084e7cf6014b39a1c4184ee4d19a59dbc675321644d097eefd","ontology_sha256":"d0cf683c15ddf014772b6c409f08ffc3e0cb3d9f19f3a099c9c5fe4cc66958e6","behavior_sha256":"59552ba1ed3917f00cbbd8e56d41ec88b08baf1b0842c2df8cc1c6af919af54c","contract_sha256":"2c7295fe76e93dd507d89917f48d35ba1ed463400d15240e4436cea2e86a6d29"},manifest},createBoundary,modules);
export default {fetch:handler};
