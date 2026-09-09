
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
export const invokeWithTrace=createTracedInvoker(model,bindings,api,execute,validateInput,ontology,{...{"source_sha256":"f71286396b2f866a22ec24d25ee6ee2db3a760554535f55dcf73a19e502069b3","ontology_sha256":"7dc2aaa0ba173682db857db3e951b812290b2a00ea105440d40c000cdf2cf7c4","behavior_sha256":"cc809e166c11875995e646bef792587d5d353df5746fb721e8f4691dbfe177e4","contract_sha256":"6de56633b2e4d60ad71615f1a6cfe423d62a22296aafff2418e288e6be6be91e"},manifest},createBoundary,modules);
export default {fetch:handler};
