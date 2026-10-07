const DEFAULT_ORIGIN='http://127.0.0.1:8787';
const ROUTES=['/runs','/lab','/ontology','/operations','/adapters'];

export function orchestratorUrl(path:string, configuredOrigin?:string):string {
 const origin=new URL(configuredOrigin||DEFAULT_ORIGIN);
 if(!['http:','https:'].includes(origin.protocol)||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash){
  throw new Error('VITE_ORCHESTRATOR_URL must be an HTTP origin');
 }
 const selected=path.startsWith('/')&&!path.startsWith('//')&&!path.includes('\\')&&ROUTES.some(route=>path===route||path.startsWith(route+'/'))?path:'/runs';
 return origin.origin+selected;
}
