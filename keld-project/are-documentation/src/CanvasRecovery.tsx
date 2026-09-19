import {Component,type ReactNode} from 'react';
export class CanvasRecovery extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<div role="status" className="page-loading">The canvas could not load. Your saved layout is retained. <button onClick={()=>location.reload()}>Reload canvas</button></div>:this.props.children;}
}
