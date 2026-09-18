/** Narrow declaration of the official Anime.js 4.5 API consumed by this prototype. */
export type Targets = string | Element | Element[];
export function createScope(options: {root: HTMLElement; mediaQueries?: Record<string,string>}): {add(callback:(self:{matches:Record<string,boolean>})=>void): {revert():void}};
export function createTimeline(options: {autoplay:boolean; defaults?:{ease:string}}): {add(target:Targets,params:Record<string,unknown>,position?:number):ReturnType<typeof createTimeline>;seek(time:number):void};
export function stagger(value:number,options?:Record<string,unknown>):unknown;
export const svg: {createDrawable(target:Targets):Element[];createMotionPath(target:string|SVGPathElement,offset?:number):Record<string,unknown>};
