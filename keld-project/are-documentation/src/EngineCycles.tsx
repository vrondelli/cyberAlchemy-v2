import {useRef} from 'react';
import {SculptureIcon} from './ComponentIcon';
import {BrandMark} from './BrandMark';
import {useIllustrationActivity,useIllustrationPhase} from './motionPreference';
const stages=[['objective','Goal'],['agent','Action'],['evidence','Results'],['evidence','Evidence'],['decision','Compare'],['evolution','Refine']];
export function EngineCycles(){
 const root=useRef<HTMLElement>(null);const motion=useIllustrationActivity(root);const {phase,elapsed}=useIllustrationPhase(motion.running,8,1500);
 return <figure ref={root} className="sculpture-cycles" data-running={motion.running} data-phase={phase} data-time={Math.floor(elapsed)} aria-label="Work and improvement connected by evidence">
  <button className="cycles-motion" type="button" disabled={motion.reduced} aria-pressed={motion.paused} onClick={motion.toggle}>{motion.reduced?'Motion off':motion.userPaused?'Resume motion':'Pause motion'}</button>
  <div className="cycles-layout"><section aria-label="Work cycle"><h3>Work</h3><ol>{stages.slice(0,3).map(([id,label],i)=><li key={label} className={!motion.reduced&&phase===i?'signal-active':''}><SculptureIcon id={id} size={64}/><span>{label}</span>{i<2&&<b aria-hidden="true">→</b>}</li>)}</ol></section>
  <div className="cycles-core" aria-hidden="true"><BrandMark/><span>↔</span></div>
  <section aria-label="Improvement cycle"><h3>Improve</h3><ol>{stages.slice(3).map(([id,label],i)=><li key={label} className={!motion.reduced&&phase===i+3?'signal-active':''}><SculptureIcon id={id} size={64}/><span>{label}</span>{i<2&&<b aria-hidden="true">→</b>}</li>)}</ol></section></div>
 </figure>;
}
