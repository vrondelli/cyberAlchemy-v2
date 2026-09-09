import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { loadSession, type Session } from './session';
import { Playback } from './playback';
import { createSpriteWorld } from './world/createSpriteWorld';
import type { RobotId, SpriteWorldHandle, ViewMode } from './world/types';

const EMPTY_SNAPSHOT = Object.freeze({ index: 0, playing: false, speed: 1 });
const EMPTY_SUBSCRIBE = (_listener: () => void) => () => undefined;

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('Loading the pinned recorded session…');
  const [selected, setSelected] = useState<RobotId | null>(null);
  const [playback, setPlayback] = useState<Playback | null>(null);
  const [worldReady, setWorldReady] = useState(false);
  const [mode] = useState<ViewMode>(() => new URLSearchParams(location.search).get('view') === 'colony' ? 'colony' : 'bench');
  const hostRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<SpriteWorldHandle | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    loadSession(controller.signal).then(setSession).catch((reason: unknown) => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'The recording could not load.');
    });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    const nextPlayback = new Playback(session);
    setPlayback(nextPlayback);
    return () => controller.abort();
  }, [session]);
  const snapshot = useSyncExternalStore(playback?.subscribe ?? EMPTY_SUBSCRIBE, playback?.getSnapshot ?? (() => EMPTY_SNAPSHOT));
  useEffect(() => {
    if (!playback || !hostRef.current) return;
    const controller = new AbortController();
    setProgress('Loading robot atlas and registering frames…');
    createSpriteWorld({ host: hostRef.current, playback, mode, signal: controller.signal, onSelect: setSelected, onProgress: message => { setProgress(message); setWorldReady(true); }, onError: setError }).then(handle => {
      if (controller.signal.aborted) { void handle.dispose(); return; }
      worldRef.current = handle;
      setWorldReady(true);
    }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'The sprite renderer could not load.'); });
    return () => { controller.abort(); const handle = worldRef.current; worldRef.current = null; if (handle) void handle.dispose(); };
  }, [playback, mode]);
  const selectedRobot = session?.frames[snapshot.index]?.robots.find(robot => robot.id === selected);
  return <main className="comparison-shell">
    <header><span className="mark">R</span><div><strong>ROBOT WORLD</strong><small>Sprite comparison</small></div><span className="status">Prototype</span></header>
    <section className="world-layout">
      <div className="world-column">
        <div className="section-heading"><div><p className="eyebrow">{mode === 'colony' ? 'RECORDED ACTOR CHECK' : 'G01 SCALE BENCH'}</p><h1>{error ? 'The renderer needs attention' : mode === 'colony' ? 'Two robots, one exact replay' : 'How small should the robots feel?'}</h1></div><span className={worldReady ? 'live-dot ready' : 'live-dot'}>{worldReady ? 'LIVE PREVIEW' : 'LOADING'}</span></div>
        <div className="world-host" ref={hostRef} aria-label="Robot world renderer" />
        <div className="replay-bar" aria-label="Replay controls">
          <button onClick={() => playback?.toggle()} disabled={!playback || mode === 'bench'}>{snapshot.playing ? 'Pause' : 'Play'}</button>
          <button className="secondary" onClick={() => playback?.seek(0)} disabled={!playback || mode === 'bench'}>Restart</button>
          <label className="timeline"><span>{mode === 'bench' ? 'Art preview clock' : `Frame ${snapshot.index + 1} / ${session?.frames.length ?? 0}`}</span><input type="range" min="0" max={Math.max(0, (session?.frames.length ?? 1) - 1)} value={snapshot.index} onChange={event => playback?.seek(Number(event.target.value))} disabled={!playback || mode === 'bench'} /></label>
          <div className="speed-buttons" aria-label="Playback speed">{[0.5, 1, 2].map(speed => <button key={speed} className={snapshot.speed === speed ? 'selected' : 'secondary'} onClick={() => playback?.setSpeed(speed)} disabled={mode === 'bench'}>{speed}×</button>)}</div>
        </div>
      </div>
      <aside className="inspector"><p className="eyebrow">INSPECTOR</p><h2>{selectedRobot ? selectedRobot.id : 'No robot selected'}</h2><p className="muted">{selectedRobot ? `Owner ${selectedRobot.owner} · energy ${selectedRobot.energy} · cargo ${selectedRobot.cargo}` : 'Select a sprite in the world or use the recorded fixture.'}</p><div className="crew-list">{(['explorer', 'builder'] as const).map(id => <button key={id} className={selected === id ? 'crew selected' : 'crew'} onClick={() => { setSelected(id); worldRef.current?.focus(id); }}><span className={`crew-dot ${id}`} /><span><strong>{id === 'explorer' ? 'Explorer' : 'Builder'}</strong><small>{id === 'explorer' ? 'Alice' : 'Bob'}</small></span></button>)}</div><dl className="facts"><div><dt>Tick</dt><dd>{session?.frames[snapshot.index]?.tick ?? '—'}</dd></div><div><dt>Revision</dt><dd>{session?.frames[snapshot.index]?.revision ?? '—'}</dd></div><div><dt>Built</dt><dd>{session?.frames[snapshot.index]?.built ?? '—'}</dd></div></dl><p className="renderer-status" aria-live="polite">{error || progress}</p>{error && <button onClick={() => location.reload()}>Try again</button>}<p className="limitation">Recorded local fixture only. This comparison does not call live agents, KEP, ARE or AlchLang.</p></aside>
    </section>
  </main>;
}
