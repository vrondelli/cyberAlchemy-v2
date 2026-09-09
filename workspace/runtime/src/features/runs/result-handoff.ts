import {normalizeMarkdown,type EssaysSavedDraftObservation} from '@cyberalchemy/essays-runtime/markdown';
import type {RunView} from './run-contract';
// Local candidate provenance, not execution or acceptance authority.
// Open questions: ../../../plans/orchestrator-integration/T5-RELATIONSHIPS.md.
export const HANDOFF_KEY='ca2.run-result-handoff.v1';
export interface ResultHandoff {
 schema:'workspace-result-handoff/v1'; id:string; title:string; content:string;
 source:{viewId:string;runKey:string;runtimeId:string;revision:number|null;completionDigest:string;mode:RunView['mode']};
 target:null|{workspaceId:string;baseRevision:number;stageEpoch:number};
 saved:null|{workspaceRevision:number;essayRevision:number;match:'exact'|'edited'};
}
export function canOfferResult(run:RunView):boolean {
 return run.execution==='succeeded'&&!!run.runRef&&run.result.verification==='owner-verified'&&!!run.result.completionDigest&&!!run.result.content?.trim();
}
export function captureResult(run:RunView,id:string):ResultHandoff {
 if(!canOfferResult(run))throw Error('A completed result verified against owner history is required.');
 return {schema:'workspace-result-handoff/v1',id,title:run.title,content:run.result.content!,source:{viewId:run.viewId,runKey:run.runRef!.runKey,runtimeId:run.runRef!.runtimeId,revision:run.source.revision,completionDigest:run.result.completionDigest!,mode:run.mode},target:null,saved:null};
}
export function observeHandoff(record:ResultHandoff,observation:EssaysSavedDraftObservation):ResultHandoff {
 if(!record.target||record.target.workspaceId!==observation.workspaceId||observation.workspaceRevision<=record.target.baseRevision||record.saved&&observation.workspaceRevision<=record.saved.workspaceRevision)return record;
 return {...record,saved:{workspaceRevision:observation.workspaceRevision,essayRevision:observation.essayRevision,match:normalizeMarkdown(record.content)===normalizeMarkdown(observation.canonicalMarkdown)?'exact':'edited'}};
}
export function parseHandoff(raw:string|null):ResultHandoff|null {
 if(raw===null)return null;
 const v=JSON.parse(raw);
 const string=(x:unknown)=>typeof x==='string'&&x.length>0;
 const revision=(x:unknown)=>Number.isSafeInteger(x)&&Number(x)>=0;
 if(v?.schema!=='workspace-result-handoff/v1'||!string(v.id)||!string(v.title)||!string(v.content)||!string(v.source?.viewId)||!string(v.source?.runKey)||!string(v.source?.runtimeId)||!string(v.source?.completionDigest)||!['fixture','live','unknown'].includes(v.source.mode)||!(v.source.revision===null||revision(v.source.revision))||
 !(v.target===null||string(v.target?.workspaceId)&&revision(v.target.baseRevision)&&revision(v.target.stageEpoch))||
 !(v.saved===null||v.target&&revision(v.saved?.workspaceRevision)&&revision(v.saved?.essayRevision)&&['exact','edited'].includes(v.saved.match)))throw Error('Stored result handoff is invalid. Dismiss it and reopen the recorded result.');
 return v;
}
