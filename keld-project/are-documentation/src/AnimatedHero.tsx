import {createHeroParticlePainter} from './heroParticlePainter';
import {useMotionPreference} from './motionPreference';
import {useEffect, useRef, useState} from 'react';
import {createScope, createTimeline, stagger, svg} from './vendor/anime.esm.min.js';
import {ProjectedEngine} from './ProjectedEngine';
import {BrandMark} from './BrandMark';
import {HeroBackdrop} from './HeroBackdrop';
import {ComponentGlyph} from './ComponentIcon';
import {EngineMap} from './EngineMap';

const chapters = [
  {stage:'Stay focused as work continues'},
  {stage:'The information available for the next response'},
  {stage:'Use each result to guide what comes next'},
  {stage:'Select a component to explore'},
];
const checkpoints = [
  {start:0,stop:.20},
  {start:.22,stop:.46},
  {start:.49,stop:.765},
  {start:.78,stop:1},
];
const count = 96;
const polar = (i:number,r:number,n=count) => ({x:360+Math.cos(i/n*Math.PI*2-Math.PI/2)*r,y:360+Math.sin(i/n*Math.PI*2-Math.PI/2)*r});
const ring = (i:number) => polar(i,218+(i%3)*5);
const grid = (i:number) => ({x:239+(i%12)*22,y:276+Math.floor(i/12)*24});
const loop = (i:number) => ({x:360+220*Math.sin(i/count*Math.PI*2),y:360+125*Math.sin(i/count*Math.PI*4)});
const constellation = (i:number) => {const center=polar(Math.floor(i/12),242,8);return{x:center.x+Math.cos(i%12/12*Math.PI*2)*38,y:center.y+Math.sin(i%12/12*Math.PI*2)*38}};
const stations = ['Your goal','Useful context','Agent & tools','Evidence','Next step','Permissions','Progress','Finish or ask'];
const stationIds=['objective','context','agent','evidence','decision','boundary','state','outcome'];
const feedbackPath='M360 360 C150 155 80 375 245 460 C390 530 535 150 605 260 C680 390 495 525 360 360 C225 195 170 270 170 330 C170 440 290 425 360 360';

export function AnimatedHero() {
  const root=useRef<HTMLElement>(null);
  const [active,setActive]=useState(0);
  const playback=useRef({paused:false,seek:(_chapter:number)=>{},wake:()=>{}});
  const [finished,setFinished]=useState(false);
  const [sceneHolding,setSceneHolding]=useState(true);
  const [assemblyPhase,setAssemblyPhase]=useState('Parts, ready to connect');
  const motion=useMotionPreference();
  const ambientPaused=motion.paused;
  playback.current.paused=ambientPaused;
  useEffect(()=>{playback.current.wake()},[ambientPaused]);
  const [controlsIntroduced,setControlsIntroduced]=useState(false);
  useEffect(()=>{const timer=window.setTimeout(()=>setControlsIntroduced(true),4000);return()=>window.clearTimeout(timer)},[]);
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{
    const el=root.current!;
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const reflect=()=>setReduced(media.matches);reflect();media.addEventListener('change',reflect);
    const particlePoints=Array.from({length:count},(_,i)=>({...ring(i),r:1.6}));
    const painter=createHeroParticlePainter(el.querySelector<HTMLCanvasElement>('.story-particles')!,particlePoints);
    let frame=0;
    let progress=0, chapter=0, hold=800, previous=0, visible=true;
    let render=()=>{};
    let wake=()=>{};
    let update=(_now:number)=>{};
    const scope=createScope({root:el,mediaQueries:{reduce:'(prefers-reduced-motion: reduce)'}}).add(self=>{
      const timeline=self.matches.reduce?null:createTimeline({autoplay:false,defaults:{ease:'linear'}});
      let previousTimelineTime=-1;
      if(timeline){
        timeline
          .add('.rotor-outer',{rotate:[0,210],duration:4000},0)
          .add('.rotor-inner',{rotate:[0,-320],duration:4000},0)
          .add('.rotor-depth',{rotate:[0,100],scale:[1,.87],duration:4000},0)
          .add('.calibration-tick',{opacity:[.18,.85],duration:260,delay:stagger(9,{from:'center'})},0)
          .add('.generated-base',{translateX:[-100,0],translateY:[125,0],scale:[.65,1],duration:370,ease:'inOut(3)'},0)
          .add('.generated-block',{translateX:[145,0],translateY:[-55,0],scale:[.65,1],duration:330,ease:'inOut(3)'},40)
          .add('.generated-intake',{translateX:[-90,0],translateY:[-260,0],scale:[.65,1],duration:310,ease:'inOut(3)'},75)
          .add('.generated-assembly-parts',{opacity:[1,0],duration:100},350)
          .add('.generated-engine',{opacity:[0,1],duration:120},340)
          .add('.projector-emitter',{opacity:[0,1],duration:130},460)
          .add('.projector-beam',{opacity:[0,1],scaleY:[0,1],duration:160,ease:'out(3)'},500)
          .add('.projected-brain',{opacity:[0,.9],translateY:[30,0],scale:[.92,1],clipPath:['inset(100% 0% 0% 0%)','inset(0% 0% 0% 0%)'],duration:210,ease:'inOut(2)'},580)
          .add('.hero-hologram',{scale:[1,.64],translateY:[0,-60],opacity:[1,.09],duration:700,ease:'inOut(3)'},850)
          .add(particlePoints,{x:(_point:unknown,i:number)=>[ring(i).x,grid(i).x],y:(_point:unknown,i:number)=>[ring(i).y,grid(i).y],r:[1.6,3.4],duration:600,delay:stagger(3,{from:'center'}),ease:'inOut(3)'},900)
          .add('.context-layer',{opacity:[0,1],duration:350},1150)
          .add('.context-window',{scale:[1.4,1],duration:600,ease:'out(4)'},1150)
          .add('.context-layer',{opacity:[1,0],duration:250},1920)
          .add('.hero-hologram',{opacity:[.09,0],duration:300},1950)
          .add(particlePoints,{x:(_point:unknown,i:number)=>[grid(i).x,loop(i).x],y:(_point:unknown,i:number)=>[grid(i).y,loop(i).y],r:[3.4,2],duration:650,delay:stagger(2),ease:'inOut(3)'},2000)
          .add('.feedback-layer',{opacity:[0,1],duration:200},2250)
          .add(svg.createDrawable('.feedback-track'),{draw:['0 0','0 1'],duration:650,ease:'inOut(2)'},2250)
          .add('.feedback-tracer',{...svg.createMotionPath('.feedback-track'),duration:700,ease:'linear'},2350)
          .add('.feedback-layer',{opacity:[1,0],duration:250},3070)
          .add(particlePoints,{x:(_point:unknown,i:number)=>[loop(i).x,constellation(i).x],y:(_point:unknown,i:number)=>[loop(i).y,constellation(i).y],r:[2,1.5],duration:550,delay:stagger(2,{from:'center'}),ease:'inOut(3)'},3100)
          .add('.map-layer',{opacity:[0,1],duration:300},3250)
          .add('.map-brand .brand-stroke',{opacity:[0,1],translateY:[10,0],duration:350,delay:stagger(110),ease:'out(3)'},3300)
          .add(svg.createDrawable('.map-wire'),{draw:['0 0','0 1'],duration:350,delay:stagger(45)},3250)
          .add('.map-station',{opacity:[0,1],scale:[.75,1],duration:400,delay:stagger(50),ease:'out(3)'},3300)
          .add('.rotor-inner',{opacity:[1,.12],duration:450},3200);
      }
      render=()=>{
        setSceneHolding(hold>0||progress===1);
        const timelineTime=Math.min(progress,.78)*4000;
        if(timelineTime!==previousTimelineTime){timeline?.seek(timelineTime);previousTimelineTime=timelineTime;painter.draw();}
        el.dataset.progress=progress.toFixed(4);
        setAssemblyPhase(progress<.015?'Parts, ready to connect':progress<.115?'Assembling the cyber engine':progress<.145?'Energizing the projector':progress<.20?'Projecting the reasoning field':'A cyber engine. A projected mind.');
        setActive(checkpoints.reduce((scene,point,i)=>progress>=point.start?i:scene,0));
      };
      playback.current.seek=(i)=>{
        chapter=Math.max(0,i);progress=i<0?0:checkpoints[i].stop;
        hold=i<0?800:4000;previous=0;
        setFinished(i===chapters.length-1);render();wake();
      };
      update=(now)=>{
        frame=0;
        if(playback.current.paused||media.matches||!visible||document.hidden||progress>=1){previous=0;return;}
        const dt=previous?Math.min(now-previous,80):0;previous=now;
        if(hold>0)hold=Math.max(0,hold-dt);
        else {
          const stop=checkpoints[chapter].stop;
          if(progress>=stop){chapter++;hold=0;}
          if(chapter<checkpoints.length){
            progress=Math.min(checkpoints[chapter].stop,progress+dt/16000);
            if(progress===checkpoints[chapter].stop){hold=4000;if(progress===1)setFinished(true);}
          }
          render();
        }
        frame=requestAnimationFrame(update);
      };
      render();
    });
    wake=()=>{cancelAnimationFrame(frame);frame=0;previous=0;if(!playback.current.paused&&!media.matches&&visible&&!document.hidden&&progress<1)frame=requestAnimationFrame(update)};
    playback.current.wake=wake;wake();
    document.addEventListener('visibilitychange',wake);media.addEventListener('change',wake);
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;wake()});
    observer.observe(el);
    return()=>{playback.current.wake=()=>{};document.removeEventListener('visibilitychange',wake);media.removeEventListener('change',wake);observer.disconnect();painter.dispose();cancelAnimationFrame(frame);media.removeEventListener('change',reflect);scope.revert()};
  },[]);
  function goChapter(i:number){playback.current.seek(i)}
  useEffect(()=>{
    if(reduced)return;
    const onKey=(event:KeyboardEvent)=>{
      const target=event.target as HTMLElement|null;
      if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||target?.closest('input,textarea,select,[contenteditable="true"],[role="textbox"]'))return;
      if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
      const bounds=root.current?.getBoundingClientRect();
      if(!bounds||bounds.bottom<=0||bounds.top>=innerHeight)return;
      event.preventDefault();
      goChapter(Math.max(0,Math.min(chapters.length-1,active+(event.key==='ArrowRight'?1:-1))));
    };
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[active,reduced]);
  return <>{reduced&&<section className="static-intro"><p className="eyebrow">AGENT REASONING ENGINE</p><h2 tabIndex={-1}>A Brain for your agent</h2><p>Language, context, memory and tools. One coherent working experience.</p><a href="#view=docs&amp;doc=understand">Go to documentation ↗</a><a href="#are-walkthrough">Try ARE live ↓</a><EngineMap staticView/></section>}<section id="are-story" className={`scroll-hero motion-v2 animation-first ${ambientPaused?'ambient-paused':''} ${reduced?'reduced':''}`} ref={root} data-stage={active}>
    <div className="hero-sticky">
      <div className="hero-grain"/><HeroBackdrop paused={ambientPaused||sceneHolding}/>
      <header className={`intro-heading ${controlsIntroduced?'controls-introduced':''}`}>
        <footer className="hero-footer"><nav className="chapter-nav" aria-label="Story chapters"><button className="chapter-arrow" aria-label="Previous chapter" aria-keyshortcuts="ArrowLeft" disabled={active===0} onClick={()=>goChapter(active-1)}>←</button>{chapters.map((c,i)=><button key={i} aria-label={`Chapter ${i+1}: ${c.stage}`} aria-current={active===i?'step':undefined} onClick={()=>goChapter(i)}><span>0{i+1}</span><i/></button>)}<button className="chapter-arrow" aria-label="Next chapter" aria-keyshortcuts="ArrowRight" disabled={active===chapters.length-1} onClick={()=>goChapter(active+1)}>→</button></nav></footer>
        <div className="intro-heading-copy"><h2 className="intro-title" tabIndex={-1}><BrandMark className="intro-brand-mark"/><span>A Brain for your agent</span></h2><p className="intro-tagline">AGENT REASONING ENGINE</p></div>
        {!reduced&&<button className="ambient-toggle hero-pause" aria-label={ambientPaused?'Resume animation':'Pause animation'} aria-pressed={ambientPaused} onClick={motion.toggle}>{ambientPaused?'Resume animation':'Pause animation'}</button>}
      </header>
      <div className="story-visual">
        <div className="visual-inner" aria-hidden="true">
          <div className="engine-aura"/>
          <svg className="engine-orbits" viewBox="0 0 720 720">
            <defs><linearGradient id="silver" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e5f0ff"/><stop offset=".35" stopColor="#4d6b93"/><stop offset=".6" stopColor="#c8d6ed"/><stop offset="1" stopColor="#314868"/></linearGradient><linearGradient id="blue" x1="0" x2="1"><stop stopColor="#3879f4"/><stop offset="1" stopColor="#7dd6ff"/></linearGradient></defs>
            <g className="rotor-depth"><circle cx="360" cy="360" r="310"/><circle cx="360" cy="360" r="298" strokeDasharray="1 9"/></g>
            <g className="rotor-outer"><g className="idle-rotor-outer">{[0,1,2,3].map(i=><circle key={i} cx="360" cy="360" r="280" stroke={i%2?'url(#silver)':'url(#blue)'} strokeWidth={i%2?2:3} strokeDasharray="350 1410" transform={`rotate(${i*90} 360 360)`}/>)}</g></g>
            <g className="rotor-inner"><g className="idle-rotor-inner"><circle cx="360" cy="360" r="259" strokeDasharray="320 25 35 25 75 400"/>{Array.from({length:72},(_,i)=>{const a=polar(i,247,72),b=polar(i,i%6===0?236:242,72);return <line className="calibration-tick" key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}/>})}</g></g>
          </svg>
          <div className="hologram-shell schematic-shell"><ProjectedEngine/></div>
          <canvas className="story-particles" aria-hidden="true"/>
          <svg className="mechanism-field" viewBox="0 0 720 720">
            <g className="context-layer">
              <g className="context-window"><rect x="162" y="190" width="396" height="344" rx="12"/><path d="M162 214v-24h24M534 190h24v24M558 510v24h-24M186 534h-24v-24"/></g>
              <text className="scene-heading" x="360" y="157" textAnchor="middle">Context window</text>
              {[['Instructions','What the agent must follow'],['Your request','What you want to achieve'],['Conversation','What you have already discussed'],['Tools & sources','What the agent has found'],['Saved progress','What to carry forward']].map(([label,value],i)=><g key={label}><text className="context-label" x="186" y={224+i*63}>{label}</text><text className="context-item" x="186" y={247+i*63}>{value}</text></g>)}
              <text x="360" y="567" textAnchor="middle" className="subtext">What the model can see now</text>
            </g>
            <g className="feedback-layer"><path className="feedback-track" d={feedbackPath}/><circle className="feedback-tracer" r="6"/><g className="feedback-live"><path className="feedback-signal" d={feedbackPath} pathLength="100"/><circle className="feedback-heartbeat" cx="360" cy="360" r="17"/><circle className="feedback-heartbeat feedback-echo" cx="360" cy="360" r="17"/><circle className="feedback-center" cx="360" cy="360" r="4"/></g><g className="feedback-labels"><text x="230" y="205" textAnchor="middle">Act</text><text x="490" y="205" textAnchor="middle">Check</text><text x="360" y="510" textAnchor="middle">Choose</text></g><text x="360" y="563" textAnchor="middle" className="subtext">Results guide the next step</text></g>
            <g className="map-layer">{stations.map((name,i)=>{const p=polar(i,242,8);return <path className="map-wire" key={name} d={`M360 360 L${p.x} ${p.y}`}/>})}{stations.map((name,i)=>{const p=polar(i,242,8);return <path className="map-flow" key={`flow-${name}`} d={`M360 360 L${p.x} ${p.y}`} pathLength="100" style={{animationDelay:`${-i*.6}s`}}/>})}<circle className="map-core" cx="360" cy="360" r="45"/><BrandMark className="map-brand" x="322" y="322" width="76" height="76"/><text className="brand-map-label" x="360" y="423" textAnchor="middle">A.R.E.</text>{stations.map((name,i)=>{const p=polar(i,242,8);return <g key={name} transform={`translate(${p.x} ${p.y})`}><g className="map-station"><circle r="26"/><g transform="translate(-12 -12)"><ComponentGlyph id={stationIds[i]}/></g></g></g>})}</g>
          </svg>
        </div>
        {active===3&&<EngineMap/>}
      </div>
      <p className="visual-caption">{active===0?assemblyPhase:chapters[active].stage}</p>
      <div className="intro-actions">
      {finished&&<button className="docs-trigger" onClick={()=>{goChapter(-1)}}>Replay ↺</button>}
      <button className="understand-trigger" onClick={()=>{const heading=document.getElementById('engine-explanation-title');heading?.focus({preventScroll:true});heading?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'})}}>Continue to explanation ↓</button>
      <a className="docs-trigger" href="#are-walkthrough">Try ARE live ↓</a><a className="docs-trigger" href="#view=continuity&amp;tour=request&amp;step=request">Take a guided tour →</a>
      <a className="docs-trigger" href="#view=docs&amp;doc=understand">Go to docs ↗</a>
      </div>
    </div>
  </section></>;
}
