import {useCallback,useLayoutEffect,useRef} from 'react';
// Stable event identity with current committed state, without subscribing graph
// nodes to unrelated application state. Never call this handler during render.
export function useStableEvent<A extends unknown[],R>(handler:(...args:A)=>R){
 const ref=useRef(handler);useLayoutEffect(()=>{ref.current=handler;});
 return useCallback((...args:A)=>ref.current(...args),[]);
}
