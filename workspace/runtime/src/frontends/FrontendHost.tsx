import {Component,lazy,Suspense,useCallback,useEffect,useMemo,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import type {FrontendRegistration} from './contract';
import {frontendHref} from './registry';
import {focusRouteHeading,waitForRouteHeading} from './route-focus';
// Open questions: README.md#open-questions.
class FrontendBoundary extends Component<{children:ReactNode},{failed:boolean}> {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<p role="alert">This frontend could not load. Reload to try again.</p>:this.props.children;}
}
export function FrontendHost({app,path,active=true}:{app:FrontendRegistration;path:string;active?:boolean}) {
 const [root,setRoot]=useState<ShadowRoot|null>(null);
 const attach=useCallback((element:HTMLDivElement|null)=>{if(element)setRoot(element.shadowRoot??element.attachShadow({mode:'open'}));},[]);
 useEffect(()=>{if(root&&active)return waitForRouteHeading(root);},[root,path,active]);
 const Feature=useMemo(()=>lazy(async()=>{const module=await app.load();return {default:(props:import('./contract').FrontendProps)=><><style>{module.styles}</style><module.Component {...props}/></>};}),[app]);
 const href=useCallback((next:string)=>frontendHref(app,next),[app]);
 const navigate=useCallback((next:string)=>{window.location.hash=href(next);},[href]);
 return <div ref={attach} data-workspace-frontend={app.id} style={{position:'relative',display:'block',height:'100%',minHeight:0,overflow:'auto'}}>
  {root&&createPortal(<><style>{`
.frontend-skip { position:absolute; z-index:100; top:8px; left:8px; padding:12px; color:#fff; background:#202722; border:2px solid currentColor; transform:translateY(-200%); }
.frontend-skip:focus { transform:none; }
:host { scroll-padding-bottom: var(--workspace-bottom-obstruction, 0px); }
:is(a, button, input, textarea, select, summary, [tabindex]) { scroll-margin-bottom: var(--workspace-bottom-obstruction, 0px); }
h1:focus-visible { outline:2px solid currentColor; outline-offset:4px; }
`}</style><button type="button" className="frontend-skip" onClick={()=>focusRouteHeading(root)}>Skip to {app.label} content</button><FrontendBoundary><Suspense fallback={<p role="status">Loading {app.label}…</p>}><Feature path={path} href={href} navigate={navigate}/></Suspense></FrontendBoundary></>,root)}
 </div>;
}
