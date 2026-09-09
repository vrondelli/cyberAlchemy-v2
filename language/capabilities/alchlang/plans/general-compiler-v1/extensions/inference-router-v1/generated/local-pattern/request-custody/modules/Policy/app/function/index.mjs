
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
export const invokeWithTrace=createTracedInvoker(model,bindings,api,execute,validateInput,ontology,{...{"source_sha256":"5c6a582fa4aef459cb7d276364b84ea00af4dd0039d01ef5b4644bbbebc765b7","ontology_sha256":"b7af9618e855752c54a8750ae4f642ee8058bdd3e1d9c23d644b12034f2671d4","behavior_sha256":"73abed19d70e436bea1b1b0131145a85c09c3f584d5e2f646bce3366c99e7355","contract_sha256":"2b697a23d66a8cc8942bfdf5f577017cb632e2bdf1744a36bdc4de14e3c5692d"},manifest},createBoundary,modules);
export default {fetch:handler};
