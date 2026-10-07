import type {FrontendProps} from './contract';
import {orchestratorUrl} from './orchestrator-url';

// The in-repository Control Center owns its API and navigation. Workspace does
// not translate its runs into the older console's unrelated projection model.
export const styles=`
.orchestrator-host { display:flex; flex-direction:column; height:100%; min-height:680px; color:#202722; background:#f6f7f4; }
.orchestrator-host header { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:10px 16px; border-bottom:1px solid #d5d8ce; }
.orchestrator-host h1 { margin:0; font:600 18px system-ui,sans-serif; }
.orchestrator-host p { margin:2px 0 0; font:13px system-ui,sans-serif; }
.orchestrator-host a { color:#245a66; font:600 13px system-ui,sans-serif; }
.orchestrator-host iframe { flex:1; width:100%; min-height:620px; border:0; background:white; }
`;

export function OrchestratorFrontend({path}:FrontendProps){
 const url=orchestratorUrl(path,import.meta.env.VITE_ORCHESTRATOR_URL);
 return <main className="orchestrator-host">
  <header><div><h1>Orchestrator</h1><p>In-repository Control Center · separate local runtime</p></div><a href={url} target="_blank" rel="noopener noreferrer">Open directly ↗</a></header>
  <iframe title="CyberAlchemy Orchestrator Control Center" src={url} />
 </main>;
}
