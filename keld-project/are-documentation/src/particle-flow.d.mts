export type Core={x:number;y:number;rx:number;ry:number};
export type FlowParticle={x:number;y:number;anchorX?:number;anchorY?:number;vx:number;vy:number;depth:number;phase:number;trail:number[][]};
export function insideBoundary(x:number,y:number):boolean;
export function outsideCore(x:number,y:number,core:Core):boolean;
export function createFlow(count:number,core:Core,seed?:number):FlowParticle[];
export function advanceFlow(particles:FlowParticle[],dt:number,time:number,core:Core):number;
