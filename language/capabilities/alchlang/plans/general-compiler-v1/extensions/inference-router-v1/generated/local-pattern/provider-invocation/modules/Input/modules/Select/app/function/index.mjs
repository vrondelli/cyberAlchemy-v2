
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
export const invokeWithTrace=createTracedInvoker(model,bindings,api,execute,validateInput,ontology,{...{"source_sha256":"7003f50f2cef4d37b2d0cfc68658675f27984923eb5e047b075eac63e0dea388","ontology_sha256":"72c70e47d4f9ab3c1959f3f473dba38b1a9eb7a0499ba4144c258f79ac1d2210","behavior_sha256":"c9a1e3f36be863bb1f40826726a3c6453aa20deb7c88e7a27a0b281f1a99c116","contract_sha256":"ceccf5ee17cb388d2a3f233d08c748fef3b2032d010a9738bf8098154781221f"},manifest},createBoundary,modules);
export default {fetch:handler};
