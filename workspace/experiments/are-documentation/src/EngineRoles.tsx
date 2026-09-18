import {ComponentGlyph} from './ComponentIcon';

const roles=[
 {id:'objective',name:'You',verb:'Set the direction',detail:'Give the goal, requirements and corrections.'},
 {id:'context',name:'A.R.E.',verb:'Prepare the next step',detail:'Connect working state, select context and support the next decision.'},
 {id:'agent',name:'Agent & model',verb:'Work with that context',detail:'Produce a response or propose an action.'},
 {id:'boundary',name:'Host & tools',verb:'Carry out the action',detail:'The host runs tools and applies its permission controls.'},
 {id:'evidence',name:'Results',verb:'Bring back evidence',detail:'Return what happened so the work can be checked and continued.'},
];
export function EngineRoles(){
 return <figure className="engine-roles" aria-labelledby="engine-roles-title">
  <figcaption id="engine-roles-title">How the work stays connected</figcaption>
  <ol className="role-flow">{roles.map(role=><li key={role.id} className={role.name==='A.R.E.'?'role-are':''}>
   <span className="landing-glyph" aria-hidden="true"><svg viewBox="0 0 24 24"><ComponentGlyph id={role.id}/></svg></span>
   <h3>{role.name}</h3><strong>{role.verb}</strong><p>{role.detail}</p>
  </li>)}</ol>
  <p className="role-return"><span aria-hidden="true">↶</span> Results feed back into A.R.E.’s working state, informing what comes next.</p>
  <p className="role-integration">Your host connects these parts. A.R.E.’s contribution depends on the context, results and permissions that integration supplies.</p>
 </figure>;
}
