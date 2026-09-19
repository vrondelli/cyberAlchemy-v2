import {useEffect, useRef, useState} from 'react';
import {ComponentGlyph} from './ComponentIcon';

import './explanation-paths.css';
import './walkthrough.css';

const capabilities=[
 {id:'language',icon:'agent',name:'Your language',title:'Carry a correction into the next conversation',description:'A team can give a term a specific meaning. A scoped lesson makes that correction available for later work in the same setting.',limit:'Prototype: explicit and inferred scoped lessons are exercised in synthetic tests. The host must supply the feedback source and scope. Reliable interpretation of arbitrary language and a model-quality gain are not established.',status:'Interaction-learning prototype',source:'benchmarks/real-reasoning-v1/interaction-learning/README.md',step:1,flow:['“Member” is ambiguous','Confirm the team’s meaning','Reuse within this project']},
 {id:'context',icon:'context',name:'Context management',title:'Bring the right information into the next response',description:'The context window holds what the model can use now. ARE can prepare a selection from the request, instructions, saved progress, and source evidence.',limit:'Selection depends on the integration and available space. Saved information outside the window is not automatically visible to the model; useful information can still be missed.',status:'Implemented module · integration required',source:'packages/context-basis-runtime',step:0,flow:['Available information','Select for this task','Next model response']},
 {id:'state',icon:'state',name:'Working state',title:'Keep the task’s unfinished work connected',description:'A goal, a decision, a result, and an open question have different roles. Keeping those relationships lets an agent recover what matters when it continues.',limit:'The host must record and restore the relevant state. This does not give the model unlimited recall.',status:'Implemented modules · integration required',source:'packages/conversation-runtime',step:3,flow:['Goal and decisions','Recorded working state','Resume with open questions']},
 {id:'feedback',icon:'evidence',name:'Evidence & feedback',title:'Use what happened to inform what happens next',description:'Keep a tool result linked to the action that produced it. The next step can then respond to an observed failure instead of treating an attempted change as success.',limit:'Recording a result does not prove it is correct. Learning from feedback is a separate configured process, not automatic improvement after every interaction.',status:'Implemented modules · integration required',source:'packages/evolution-runtime',step:2,flow:['Attempted change','Observed test failure','Evidence for another attempt']},
 {id:'next',icon:'decision',name:'Next-step support',title:'Continue, investigate, or ask',description:'Use the goal, available evidence, and unresolved questions to support the next decision. A failed check may call for investigation; missing information may call for a question.',limit:'ARE supplies decision support. The agent and its host still carry out the work, and success must be checked.',status:'Implemented decision interface',source:'bin/are.mjs',step:2,flow:['Goal and evidence','Assess what is missing','Continue or ask']},
 {id:'boundaries',icon:'boundary',name:'Action boundaries',title:'Keep a proposed action separate from permission',description:'Before a consequential action, an integration can ask ARE to assess the proposed effect and identify an approval boundary.',limit:'An assessment grants no permission and does not intercept every tool. Enforcement depends on the host integration.',status:'Implemented decision interface',source:'bin/are.mjs',step:3,flow:['Proposed release','Check the action boundary','Ask for approval']},
] as const;

const steps=[
 {name:'Prepare context',cap:'context'},
 {name:'Agree on meaning',cap:'language'},
 {name:'Use a test result',cap:'feedback'},
 {name:'Resume the work',cap:'state'},
] as const;
type Lens={
 title:string; event:string; contribution:string; next:string; action:string;
 beforeTitle:string;afterTitle:string;
 before:readonly (readonly [string,string])[];after:readonly (readonly [string,string])[];
 takeaway:string;scope:string;
};
const lenses:Record<string,Lens>={
 context:{
  title:'The requirement changes. The next response should too.',
  event:'“For launch, people need an invitation to sign up.”',
  contribution:'Select the new rule and the checks it affects.',
  next:'The agent proposes a change using that context.',
  action:'See the prepared context',
  beforeTitle:'Before · the previous context',
  afterTitle:'After · prepared for the next response',
  before:[['Request','Update the signup flow.'],['Existing decisions','Agreed form design and email verification checks.']],
  after:[['Invitation-only requirement','Sets the goal for this response.'],['Form design + email checks','Preserves decisions and behavior that still apply.'],['Invitation rule + expiry checks','Needed to check the new requirement.']],
  takeaway:'The next response includes the new rule. The pricing discussion stays saved outside it.',
  scope:'Selection is illustrative. Saved information is not automatically visible to the model.',
 },
 language:{
  title:'A team’s words have a specific meaning.',
  event:'“Here, a member is a paying customer. Trial accounts are users.”',
  contribution:'Keep the confirmed meaning with this project.',
  next:'A later access-rule request can include that meaning.',
  action:'See the project lesson',
  beforeTitle:'Before · a term without an agreed meaning',
  afterTitle:'After · a scoped lesson for later work',
  before:[['Member','The request does not yet include the team’s definition.']],
  after:[['Confirmed meaning','Member → paying customer.'],['Scope','This team’s signup project.'],['Later use','Include this meaning when preparing access-rule context.']],
  takeaway:'A correction becomes available for later work in the same setting.',
  scope:'Interaction-learning prototype. This does not train the model’s weights.',
 },
 feedback:{
  title:'A change was made. The check still fails.',
  event:'The test reports: an expired invitation was accepted.',
  contribution:'Link the result to the attempted change and its rule.',
  next:'The agent can investigate with the actual failure in view.',
  action:'See the connected evidence',
  beforeTitle:'Before · an attempted change',
  afterTitle:'After · evidence attached to the work',
  before:[['Attempt','Reject expired invitations.'],['Status','A code change alone does not establish success.']],
  after:[['Expected','Reject an expired invitation.'],['Observed','The expired invitation was accepted.'],['Linked work','The expiry-handling change remains unresolved.']],
  takeaway:'The failed result stays connected to the change it checks.',
  scope:'Illustrative test output. Recording evidence does not prove it is correct.',
 },
 next:{
  title:'A failed check changes the next decision.',
  event:'The expiry test failed; the launch goal is still unfinished.',
  contribution:'Use the goal and failure to identify the unresolved work.',
  next:'The agent investigates expiry handling before claiming completion.',
  action:'See the next-step assessment',
  beforeTitle:'Before · a decision is still needed',
  afterTitle:'After · a reason to continue investigating',
  before:[['Goal','Complete invitation-only signup.'],['Evidence','An expired invitation still works.']],
  after:[['Suggested next step','Investigate the expiry check.'],['Reason','The observed behavior contradicts the invitation rule.'],['Completion','Not established. Check the next result.']],
  takeaway:'The evidence informs a decision; the agent and host still carry out the work.',
  scope:'Decision support, not a guarantee of a successful repair.',
 },
 state:{
  title:'Tomorrow starts with the unfinished work.',
  event:'The team returns to the signup task the next day.',
  contribution:'Bring back the goal, decision and remaining check.',
  next:'The agent can continue investigating the expiry failure.',
  action:'See the restored work',
  beforeTitle:'Before · work is paused',
  afterTitle:'After · relevant progress is available again',
  before:[['Situation','The task continues in a new conversation.']],
  after:[['Goal','Launch the signup flow.'],['Decision','Signup requires an invitation.'],['Open check','Expired invitations must be rejected.']],
  takeaway:'The next conversation can begin with the task’s state, not a complete replay of every message.',
  scope:'The host must record and restore state. This is not unlimited recall.',
 },
 boundaries:{
  title:'Preparing a release does not grant permission.',
  event:'Later, the agent proposes deploying the signup change.',
  contribution:'Assess the proposed effect and identify the approval boundary.',
  next:'The host asks for approval before deployment.',
  action:'See the action boundary',
  beforeTitle:'Before · a proposed action',
  afterTitle:'After · approval is still required',
  before:[['Proposal','Deploy the signup change.'],['Scenario','A separate release proposal; earlier checks are not asserted to have passed.']],
  after:[['Proposed effect','Deployment.'],['Boundary','Approval required in this illustration.'],['Host responsibility','Enforce permission before carrying out the action.']],
  takeaway:'A prepared action and permission to perform it remain separate.',
  scope:'ARE’s assessment grants no permission. Enforcement depends on the host.',
 },
};
export function GuidedWalkthrough(){
 useEffect(()=>{
  let frame=0;
  const openSection=()=>{
   if(location.hash!=='#are-walkthrough')return;
   cancelAnimationFrame(frame);
   frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(()=>document.getElementById('are-walkthrough')?.scrollIntoView({block:'start',behavior:'instant'}))});
  };
  openSection();window.addEventListener('hashchange',openSection);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('hashchange',openSection)};
 },[]);

 const [selected,setSelected]=useState('context');
 const [revealed,setRevealed]=useState<Record<string,boolean>>({});
 const [showBefore,setShowBefore]=useState(false);
 const stage=useRef<HTMLDivElement>(null);
 const explorer=useRef<HTMLDetailsElement>(null);
 const capability=capabilities.find(c=>c.id===selected)!;
 const step=capability.step,lens=lenses[selected];
 const hasResult=!!revealed[selected],showResult=hasResult&&!showBefore;
 const focusStage=()=>requestAnimationFrame(()=>{
  const el=stage.current;if(!el)return;
  el.focus({preventScroll:true});
  const r=el.getBoundingClientRect();
  const top=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--are-header-height'))||84;
  if(r.top<top||r.top>innerHeight*.65)el.scrollIntoView({block:'start',behavior:'instant'});
 });
 const choose=(id:string)=>{setSelected(id);setShowBefore(false);focusStage()};
 const restart=()=>{setRevealed({});setShowBefore(false);setSelected('context');focusStage()};
 const primary=()=>{
  if(!showResult){setRevealed(v=>({...v,[selected]:true}));setShowBefore(false)}
  else if(step<steps.length-1)choose(steps[step+1].cap);
  else restart();
 };
 return <section id="are-walkthrough" className="explanation-paths landing-band walkthrough" aria-labelledby="walkthrough-title">
  <header className="walk-intro">
   <p className="landing-label">FOLLOW ONE TASK</p>
   <h3 id="walkthrough-title">One task.<br/>Each step builds on the last.</h3>
   <p>A team is building invitation-only signup. Follow what changes, what A.R.E. contributes, and what the agent does next.</p>
   <p className="walk-disclaimer">Interactive illustration · prepared story snapshots, no live model calls.</p>
  </header>
  <div className="walk-layout">
   <nav className="walk-steps" aria-label="Task walkthrough">
    <p className="walk-nav-label">The story</p>
    <ol>{steps.map((s,i)=><li key={s.cap}><button aria-current={step===i?'step':undefined} onClick={()=>choose(s.cap)}>
     <span className="walk-step-number">0{i+1}</span><span>{s.name}</span>
    </button></li>)}</ol>
   </nav>
   <div className="walk-stage" ref={stage} tabIndex={-1} aria-label="Current task step">
    <p className="walk-position">STEP {step+1} OF {steps.length} <span>· {capability.name}</span></p>
    <h4>{lens.title}</h4>
    <ol className={'walk-cause '+(showResult?'is-revealed':'')}>
     <li><span className="walk-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><ComponentGlyph id="objective"/></svg></span><p className="walk-node-label">What happened</p><p>{lens.event}</p></li>
     <li><span className="walk-icon are-node" aria-hidden="true"><svg viewBox="0 0 24 24"><ComponentGlyph id={capability.icon}/></svg></span><p className="walk-node-label">A.R.E. contributes</p><p>{lens.contribution}</p></li>
     <li><span className="walk-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><ComponentGlyph id="agent"/></svg></span><p className="walk-node-label">What happens next</p><p>{lens.next}</p></li>
    </ol>
    <div className={'walk-artifact '+(showResult?'is-revealed':'')} data-lens={selected} data-result={showResult}>
     <div className="walk-artifact-heading"><h5>{showResult?lens.afterTitle:lens.beforeTitle}</h5>
      {hasResult&&<button className="walk-compare" onClick={()=>setShowBefore(v=>!v)}>{showBefore?'Show after':'Compare with before'}</button>}
     </div>
     <dl>{(showResult?lens.after:lens.before).map(([name,value])=><div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>
     {selected==='context'&&<p className="walk-saved"><span aria-hidden="true">↳</span> Pricing discussion: saved outside this response. Selected information also remains saved.</p>}
    </div>
    <p className="walk-takeaway" role="status" aria-live="polite">{showResult?lens.takeaway:'Reveal the result to inspect what A.R.E. contributes.'}</p>
    <div className="walk-actions">
     <button className="walk-primary" onClick={primary}>{!showResult?lens.action:step<steps.length-1?'Next: '+steps[step+1].name+' →':'Restart the story ↺'}</button>
     {step>0&&<button className="walk-back" onClick={()=>choose(steps[step-1].cap)}>← {steps[step-1].name}</button>}
    </div>
    <p className="walk-scope">{lens.scope}</p>
    <details className="walk-implementation" key={selected}><summary>Capability details &amp; implementation</summary><p>{capability.description}</p><p>{capability.status}</p><p>{capability.limit}</p><code>{capability.source}</code><p>Source relative to implementation/agent-reasoning-engine. This illustration is not evidence of a benchmark gain.</p></details>
   </div>
  </div>
  <details className="walk-explorer" ref={explorer}>
   <summary>Explore by capability <span>Six ways A.R.E. supports the work</span></summary>
   <div className="walk-capabilities">{capabilities.map(c=><button key={c.id} aria-pressed={selected===c.id} onClick={()=>{choose(c.id);if(explorer.current)explorer.current.open=false}}>
    <span className="walk-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><ComponentGlyph id={c.icon}/></svg></span><span>{c.name}</span>
   </button>)}</div>
  </details>
 </section>;
}
