
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
export const invokeWithTrace=createTracedInvoker(model,bindings,api,execute,validateInput,ontology,{...{"source_sha256":"065e5c4b05f2e85a7a916a264f1dca86a4f6041487b7fe158805b5d232a100e8","ontology_sha256":"6f67408763eea7a327730d95441d4ba347618f98134a1c763cf49f3e62cef27d","behavior_sha256":"5e5304aca355d5362253bafe5b1c6cd770c29046765387301325b1f94f5a4e08","contract_sha256":"baa18c6d6fe6bfaf17f453b41f94b98c526757e932ff6a8da01e34d1d89242b0"},manifest},createBoundary,modules);
export default {fetch:handler};
