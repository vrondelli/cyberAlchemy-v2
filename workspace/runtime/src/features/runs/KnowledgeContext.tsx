import {SourceReturn,SourceTaskButton} from './SourceTasks';
import {knowledgeContextText,type KnowledgeRecord} from './knowledge-context';
import type {SourceTarget} from './source-navigation';
// Open questions: ../../../../plans/orchestrator-integration/T5D-KNOWLEDGE-CONTEXT.md.
export function KnowledgeContext({record,target}:{record:KnowledgeRecord|null;target:SourceTarget|null}){
 const text=knowledgeContextText(record);
 const selected=record&&text?{kind:'knowledge' as const,id:record.id,selector:'record-context'}:null;
 return <section className="knowledge-context" aria-label="Selected knowledge context">
  <SourceReturn target={target} selected={selected} text={text}/>
  {record?<><h2>Context for a task</h2>{text&&selected?<><p>Only this concept, its recorded status and source references will be selected. Referenced files and neighboring records are not included.</p><details><summary>Preview concept context</summary><pre>{text}</pre></details><SourceTaskButton source={selected} text={text} label="this concept"/></>:<p>This {record.kind} record is available for inspection. Select a concept to prepare task context.</p>}</>:<p>Select a concept in the map or record list to inspect its context.</p>}
  <p>Inspection changes no permissions, lifecycle status or execution state.</p>
 </section>;
}
