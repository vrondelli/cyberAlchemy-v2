import type { Playback } from '../playback';
import type { Session } from '../session';
import type { ViewMode } from '../world/types';
import type { SpriteWorldHandle } from '../world/types';

export function ReplayBar({ mode, playback, snapshot, session, world }: { readonly mode: ViewMode; readonly playback: Playback | null; readonly snapshot: { readonly index: number; readonly playing: boolean; readonly speed: number }; readonly session: Session | null; readonly world: SpriteWorldHandle | null }) {
  const disabled = !playback || mode !== 'colony';
  return <div className="replay-bar" aria-label="Replay controls">
    <button onClick={() => playback?.toggle()} disabled={disabled}>{snapshot.playing ? 'Pause' : 'Play'}</button>
    <button className="secondary" onClick={() => playback?.seek(0)} disabled={disabled}>Restart</button>
    <label className="timeline"><span>{mode === 'colony' ? `Frame ${snapshot.index + 1} / ${session?.frames.length ?? 0}` : mode === 'load' ? 'Synthetic actors are draw-only' : 'Art preview clock'}</span><input type="range" min="0" max={Math.max(0, (session?.frames.length ?? 1) - 1)} value={snapshot.index} onChange={event => playback?.seek(Number(event.target.value))} disabled={disabled} /></label>
    <div className="speed-buttons" aria-label="Playback speed">{[0.5, 1, 2].map(speed => <button key={speed} className={snapshot.speed === speed ? 'selected' : 'secondary'} onClick={() => playback?.setSpeed(speed)} disabled={disabled}>{speed}×</button>)}</div>
    <div className="camera-buttons" aria-label="Camera controls"><button className="secondary" onClick={() => world?.zoom(-1)} disabled={!world}>−</button><button className="secondary" onClick={() => world?.zoom(1)} disabled={!world}>+</button><button className="secondary" onClick={() => world?.reset()} disabled={!world}>Reset view</button></div>
  </div>;
}
