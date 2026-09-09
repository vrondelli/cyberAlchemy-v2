
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
export const invokeWithTrace=createTracedInvoker(model,bindings,api,execute,validateInput,ontology,{...{"source_sha256":"684058f2126cce660ed31c0a1052ce46d24e654704be02b0a16b2776346579de","ontology_sha256":"d309f7fd14b4aeb0917055001260c752d16e11a65af8d28d78a6be1e2fa6cb42","behavior_sha256":"219b12a004b8781b9dde0f0d758c6da95310c3d14d4a2ea72cf099b787cb9037","contract_sha256":"67a0d2d1b9afcb54209620c4f0f87ef0c25dd447b5726480e63d6dc55a9f522f"},manifest},createBoundary,modules);
export default {fetch:handler};
