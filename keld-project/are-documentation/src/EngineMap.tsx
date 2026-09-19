import {useRef} from 'react';
import {SculptureIcon} from './ComponentIcon';
import {BrandMark} from './BrandMark';
import {coreSculptures,sculptureAssets,componentHref,type SculptureId} from './sculptureAssets';
import {useIllustrationActivity,useIllustrationPhase} from './motionPreference';
const point=(i:number)=>({x:360+Math.sin(i/8*Math.PI*2)*242,y:360-Math.cos(i/8*Math.PI*2)*242});
const steps:([SculptureId,SculptureId]|null)[]=[['objective','context'],['context','agent'],['agent','evidence'],['evidence','decision'],['decision','boundary'],['boundary','agent'],['agent','evidence'],['evidence','state'],['state','context'],['evidence','decision'],['decision','outcome'],['boundary','outcome'],null];
export function EngineMap({staticView=false}:{staticView?:boolean}){
 const root=useRef<HTMLDivElement>(null);const motion=useIllustrationActivity(root,!staticView);const {phase,elapsed}=useIllustrationPhase(motion.running,steps.length);
 const current=motion.reduced||staticView?null:steps[phase];
 const from=current?point(coreSculptures.indexOf(current[0])):null,to=current?point(coreSculptures.indexOf(current[1])):null;
 return <div ref={root} className={`final-engine-map ${staticView?'static-map':''}`} data-running={motion.running} data-phase={phase} data-steps={steps.length} data-time={Math.floor(elapsed)}>
  <svg className="final-map-lines" viewBox="0 0 720 720" aria-hidden="true">
   {coreSculptures.map((id,i)=>{const p=point(i);return <path key={id} d={`M360 360L${p.x} ${p.y}`} className="final-membership"/>})}
   {from&&to&&<path key={phase} className="final-map-signal" pathLength="100" style={{animationPlayState:motion.running?'running':'paused'}} d={`M${from.x} ${from.y} Q360 360 ${to.x} ${to.y}`}/>}
   <circle cx="360" cy="360" r="57" fill="#10263d" stroke="#547698"/><BrandMark x="310" y="310" width="100" height="100"/>
  </svg>
  <nav className="final-map-links" aria-label="Explore the eight A.R.E components">{coreSculptures.map((id,i)=>{const p=point(i);return <a key={id} href={componentHref(id)} className={`final-map-link ${current?.includes(id)?'signal-active':''}`} style={{left:`${p.x/7.2}%`,top:`${p.y/7.2}%`}}><SculptureIcon id={id}/><span>{sculptureAssets[id].label}</span></a>})}</nav>
  <span className="sr-only">Conceptual connections, not live execution. Goal informs context; tools produce evidence; decisions respect permissions, preserve progress, or finish and ask.</span>
 </div>;
}
