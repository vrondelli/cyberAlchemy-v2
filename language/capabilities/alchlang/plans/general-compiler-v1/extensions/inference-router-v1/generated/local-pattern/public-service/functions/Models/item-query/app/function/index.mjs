
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
export const invokeWithTrace=createTracedInvoker(model,bindings,api,execute,validateInput,ontology,{...{"source_sha256":"29b560509df769144ca31349576910fc2f6275b9f5f7a2d1c6614c2fef96cede","ontology_sha256":"5c7125bbca67d7e460216f3bc972e51016f0d2bddefe43d100c9a5518b497d7f","behavior_sha256":"faa02885e465076d5f35257e2e8c24eb3daa63fe3c2cc43046d5132b3ac0da95","contract_sha256":"a9f44a8cb48d9e6363021497c3f14b31f587220e73c8f323a0eef700463d06f1"},manifest},createBoundary,modules);
export default {fetch:handler};
