
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
export const invokeWithTrace=createTracedInvoker(model,bindings,api,execute,validateInput,ontology,{...{"source_sha256":"419159266b15f5c9b6db0ad163ad3648e8ed943630a0c1c9fb6bbc0de5690033","ontology_sha256":"1d93d992618aa8238ae6c464da8c75b0c393c0dcf0dd6416c8e850aa644448cf","behavior_sha256":"b3d721ed0f2fbba6e77e132a1b1827bf3bb1888aa3d8f14d57c70556d8472ead","contract_sha256":"8770c23018afb7680d7bb3096032c87379f364482bace5d1c03cbcf2a62db839"},manifest},createBoundary,modules);
export default {fetch:handler};
