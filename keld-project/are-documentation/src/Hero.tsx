import {lazy, Suspense, useEffect, useRef, useState} from 'react';
import {EngineCycles} from './EngineCycles';
import {BrandMark} from './BrandMark';
import {ExplanationPaths} from './ExplanationPaths';
import {CapabilityOverview} from './Capabilities';
import './hero.css';

const AnimatedHero=lazy(()=>import('./AnimatedHero').then(module=>({default:module.AnimatedHero})));

function AnimationPlaceholder({loading=false}:{loading?:boolean}){
  return <section id="are-story" className="scroll-hero motion-v2 animation-first animation-pending" aria-label={loading?'Loading the A.R.E. animation':'A.R.E. animation starts when you scroll'} aria-busy={loading||undefined}>
    {loading&&<p role="status">Preparing the engine…</p>}
  </section>;
}

export function Hero({onExplore}:{onExplore:()=>void}) {
  const [animationReady,setAnimationReady]=useState(false);
  const revealPending=useRef(false);

  useEffect(()=>{
    if(animationReady)return;
    const activate=()=>setAnimationReady(true);
    const onKey=(event:KeyboardEvent)=>{
      const target=event.target as HTMLElement|null;
      if(target?.closest('input,textarea,select,[contenteditable="true"],[role="textbox"]'))return;
      if(['ArrowDown','PageDown','End',' '].includes(event.key))activate();
    };
    const onPointer=(event:PointerEvent)=>{
      const scrollbar=document.documentElement.clientWidth-innerWidth;
      if(event.button===1||event.clientX>=document.documentElement.clientWidth-Math.max(20,Math.abs(scrollbar)))activate();
    };
    window.addEventListener('wheel',activate,{passive:true});
    window.addEventListener('touchmove',activate,{passive:true});
    window.addEventListener('keydown',onKey);
    window.addEventListener('pointerdown',onPointer);
    return()=>{
      window.removeEventListener('wheel',activate);
      window.removeEventListener('touchmove',activate);
      window.removeEventListener('keydown',onKey);
      window.removeEventListener('pointerdown',onPointer);
    };
  },[animationReady]);

  useEffect(()=>{
    if(!animationReady||!revealPending.current)return;
    let second=0;
    const first=requestAnimationFrame(()=>{second=requestAnimationFrame(()=>{
      revealPending.current=false;
      const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
      document.getElementById('are-story')?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});
    })});
    return()=>{cancelAnimationFrame(first);cancelAnimationFrame(second)};
  },[animationReady]);

  const revealEngine=()=>{revealPending.current=true;setAnimationReady(true)};
  return <main className="continuous-intro"><section className="are-offer" aria-labelledby="are-offer-title">
    <div className="are-offer-grid">
      <div className="are-offer-head">
        <div className="are-offer-brand" aria-label="A.R.E. — Agent Reasoning Engine">
          <BrandMark className="are-offer-brand-mark" aria-hidden="true"/>
          <span><strong>A.R.E.</strong><small>Agent Reasoning Engine</small></span>
        </div>
        <h1 id="are-offer-title">
          <span className="are-offer-setup">What if your <em>agent</em> could</span>
          <span className="are-offer-promise"><em>keep the thread</em>, connect what matters, and <em>learn from the work?</em></span>
          <span className="are-offer-relief-line">Without asking you to become its memory, router, and quality control.</span>
        </h1>
      </div>
      <div className="are-offer-copy">
        <div className="are-offer-outcomes" aria-label="The outcomes">
          <span><b>01</b><strong>Keep</strong><small>the thread</small></span>
          <span><b>02</b><strong>Connect</strong><small>what matters</small></span>
          <span><b>03</b><strong>Learn</strong><small>from the work</small></span>
        </div>
      </div>
      <div className="are-offer-friction" aria-label="Work you should not have to keep doing">
        <p><span>01</span>You repeat the goal and explain how you work.</p>
        <p><span>02</span>You rebuild context after the useful thread disappears.</p>
        <p><span>03</span>You check whether the right evidence survived to the next step.</p>
      </div>
      <p className="are-offer-lead">A capable model is only the beginning. The work still needs a way to hold together.</p>
      <div className="are-offer-question">
        <button type="button" onClick={revealEngine}>See the missing layer <span aria-hidden="true">↓</span></button>
      </div>
    </div>
  </section>
    {animationReady?<Suspense fallback={<AnimationPlaceholder loading/>}><AnimatedHero/></Suspense>:<AnimationPlaceholder/>}
    <article className="engine-explanation" aria-labelledby="engine-explanation-title">
        <section className="landing-introduction" aria-labelledby="engine-explanation-title">
        <h2 id="engine-explanation-title" tabIndex={-1}>Why is it called an Agent Reasoning Engine?</h2>
        <p className="explanation-lead">Because it connects how your agent works now with how that work improves over time.</p>
        <p className="landing-summary">A.R.E. keeps the goal, useful context, tools, actions, and results in one working thread. Each result becomes evidence: first for the next decision, then for testing whether the engine itself should change.</p>
        <EngineCycles/>
        <p className="cycle-bridge">Work creates evidence. Evidence informs tested improvements. Those improvements return to the next task. <a href="#view=docs&amp;doc=runtime&amp;topic=evolution">Explore the two cycles ↗</a></p>
        </section>
        <CapabilityOverview/>
        <ExplanationPaths/>
        <section className="landing-close" aria-labelledby="landing-close-title"><p className="landing-label">LOOK INSIDE</p><h3 id="landing-close-title">Explore the engine<br/>behind the next step.</h3><p>Follow the connections between goals, context, evidence, and action in the interactive documentation.</p><button className="primary" onClick={onExplore}>Explore how it works ↗</button></section>
      </article>
  
  </main>;
}
