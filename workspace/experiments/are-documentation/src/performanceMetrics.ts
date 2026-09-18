// Local opt-in counters only. No network, timings, identifiers, or content collection.
const enabled=typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('benchmark')==='1';
declare global {interface Window {__ARE_PERF__?:Record<string,number>}}
export function countPerformance(name:string){if(!enabled)return;const counters=window.__ARE_PERF__??(window.__ARE_PERF__={});counters[name]=(counters[name]??0)+1;}
