import type { RefObject } from 'react';
import type { ViewMode } from '../world/types';

export interface WorldPanelProps {
  readonly hostRef: RefObject<HTMLDivElement | null>;
  readonly mode: ViewMode;
  readonly error: string;
  readonly worldReady: boolean;
}

export function WorldPanel({ hostRef, mode, error, worldReady }: WorldPanelProps) {
  const load = mode === 'load';
  return <>
    <div className="section-heading"><div><p className="eyebrow">{mode === 'colony' ? 'RECORDED ACTOR CHECK' : load ? 'GRAPHICS LOAD CHECK' : 'G01 SCALE BENCH'}</p><h1>{error ? 'The renderer needs attention' : mode === 'colony' ? 'Two robots, one exact replay' : load ? 'How many small robots can the browser draw?' : 'How small should the robots feel?'}</h1></div><span className={worldReady ? 'live-dot ready' : 'live-dot'}>{worldReady ? 'LIVE PREVIEW' : 'LOADING'}</span></div>
    <div className={`world-host ${load ? 'load-host' : ''}`} ref={hostRef} aria-label={load ? 'Synthetic robot load renderer' : 'Robot world renderer'} />
  </>;
}
