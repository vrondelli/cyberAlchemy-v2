import type {FrontendRegistration} from './contract';
// Explicit build-time registrations; no remote script discovery.
// Open questions: README.md#open-questions.
export const frontends:readonly FrontendRegistration[]=[{
 id:'orchestrator',label:'Runs',icon:'runs',mountPath:'/apps/orchestrator',
 load:()=>import('./orchestrator').then(module=>({Component:module.OrchestratorFrontend,styles:module.styles})),
}];
export function frontendHref(app:FrontendRegistration,path:string) {
 if(!path.startsWith('/')||path.startsWith('//')||path.includes('#'))throw Error('Invalid frontend route');
 return '#'+app.mountPath+path;
}
export function frontendRoute(hash:string):{app:FrontendRegistration;path:string}|null {
 // Historical dashboard and Runs links preserve the exact encoded identity.
 if(hash==='#/runs'||hash.startsWith('#/runs/'))return {app:frontends[0],path:hash.slice(1)};
 if(hash.startsWith('#/dashboard/result/'))return {app:frontends[0],path:'/runs/'+hash.slice('#/dashboard/result/'.length)};
 for(const app of frontends)if(hash==='#'+app.mountPath||hash.startsWith('#'+app.mountPath+'/'))return {app,path:hash.slice(app.mountPath.length+1)||'/runs'};
 return null;
}
