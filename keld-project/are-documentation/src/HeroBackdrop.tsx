import './hero-backdrop.css';
import {ParticleSurface} from './ParticleSurface';
const options=['halo','grid','light','signals','particles'];
export function HeroBackdrop({paused=false}:{paused?:boolean}){
 const kind=new URLSearchParams(window.location.search).get('background')??'particles';
 if(!kind||!options.includes(kind))return null;
 return <div className={`hero-backdrop backdrop-${kind}`} aria-hidden="true" data-paused={paused}>
  <div className="backdrop-glow"/>
  {kind==='grid'&&<><div className="backdrop-grid-pattern"/><div className="backdrop-grid-floor"/></>}
  {kind==='light'&&<><div className="backdrop-ribbon ribbon-one"/><div className="backdrop-ribbon ribbon-two"/><div className="backdrop-ribbon ribbon-three"/></>}
  {kind==='signals'&&<svg className="backdrop-signal-field" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="backdrop-signal-gradient"><stop stopColor="#477cba" stopOpacity="0"/><stop offset=".55" stopColor="#85c6ff" stopOpacity=".8"/><stop offset="1" stopColor="#90cbff" stopOpacity="0"/></linearGradient></defs>{Array.from({length:9},(_,i)=>{const y=150+i*64;const d=`M-120 ${y} C210 ${y-180} 220 ${y+200} 580 425 S990 ${y-80} 1320 ${y+50}`;return <g key={i}><path d={d} className="bg-signal-track"/><path d={d} className="bg-signal-pulse" pathLength="100" style={{animationDelay:`${-i*1.7}s`}}/></g>})}</svg>}
  {kind==='particles'&&<><div className="particle-horizon"/><ParticleSurface paused={paused}/></>}
  <div className="backdrop-vignette"/>
 </div>
}
