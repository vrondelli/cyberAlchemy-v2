// Fixed vocabulary only: never retain error messages or connection identifiers.
// Open questions: ../TRANSPORT-DIAGNOSTICS.md.
const categories=Object.freeze({ECONNRESET:'connection-reset',ECONNREFUSED:'connection-refused',ETIMEDOUT:'socket-timeout',EAI_AGAIN:'dns-temporary',ENOTFOUND:'dns-not-found',ENETUNREACH:'network-unreachable',EHOSTUNREACH:'host-unreachable',EPIPE:'broken-pipe',ERR_TLS_CERT_ALTNAME_INVALID:'tls-certificate',CERT_HAS_EXPIRED:'tls-certificate',UNABLE_TO_VERIFY_LEAF_SIGNATURE:'tls-certificate',DEPTH_ZERO_SELF_SIGNED_CERT:'tls-certificate',ERR_SSL_WRONG_VERSION_NUMBER:'tls-protocol'});
const own=(value,key)=>{if(!value||typeof value!=='object')return undefined;try{return Object.getOwnPropertyDescriptor(value,key)?.value;}catch{return undefined;}};
export function transportDiagnostic(phase,error){
 if(!['request-construction','request-event','response-event'].includes(phase))throw Error('transport-diagnostic.phase');
 const codes=new Set();let unknown=0;const visit=e=>{const code=own(e,'code');if(typeof code==='string'&&Object.hasOwn(categories,code))codes.add(code);else unknown++;};
 visit(error);const children=own(error,'errors');let isArray=false,aggregate_uninspectable=false;try{isArray=Array.isArray(children);}catch{aggregate_uninspectable=true;unknown++;}const length=isArray?own(children,'length'):0;
 const count=Number.isSafeInteger(length)&&length>=0?Math.min(length,8):0;
 for(let i=0;i<count;i++)visit(own(children,String(i)));
 return {schema:'are.transport-diagnostic/v1',phase,codes:[...codes].sort(),categories:[...new Set([...codes].map(c=>categories[c]))].sort(),unknown_entries:unknown,child_entries_inspected:count,aggregate_uninspectable,child_entries_truncated:Number.isSafeInteger(length)&&length>8,claim:'Observed local error categories only; no remote root-cause conclusion.'};
}
