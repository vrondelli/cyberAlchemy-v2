import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { loadSession, type Session } from './session';
import { Playback } from './playback';
import { registerInspectionTool } from './agent-tools';
import type { WorldHandle } from './world';
import './style.css';

type IconName = 'play'|'pause'|'reset'|'plus'|'minus'|'focus'|'bolt'|'box'|'chevron'|'close'|'orbit'|'leaf'|'arrow';
function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    play: <path d="m8 5 11 7-11 7Z" fill="currentColor" stroke="none" />,
    pause: <><path d="M8 5v14M16 5v14" strokeWidth="4" /></>,
    reset: <><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6" /></>,
    plus: <path d="M12 5v14M5 12h14" />, minus: <path d="M5 12h14" />,
    focus: <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" /><circle cx="12" cy="12" r="3" /></>,
    bolt: <path d="m13 2-8 12h6l-1 8 9-13h-6Z" fill="currentColor" stroke="none" />,
    box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9ZM4 7.5l8 5 8-5M12 12.5V21m-4-16 8 5" /></>,
    chevron: <path d="m8 10 4 4 4-4" />, close: <path d="m6 6 12 12M6 18 18 6" />,
    orbit: <><ellipse cx="12" cy="12" rx="10" ry="4.3" transform="rotate(-30 12 12)" /><circle cx="12" cy="12" r="2" /></>,
    leaf: <><path d="M5 19C-1 9 10 4 20 4c0 10-5 17-12 12M5 21l10-12" /></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Colony({ session }: { session: Session }) {
  const [playback] = useState(() => { const p = new Playback(session); p.seek(session.frames.length - 1); return p; });
  const cursor = useSyncExternalStore(playback.subscribe, playback.getSnapshot);
  const frame = playback.frame;
  const canvas = useRef<HTMLCanvasElement>(null), labels = useRef<HTMLDivElement>(null);
  const world = useRef<WorldHandle | null>(null);
  const [selected, setSelected] = useState<string | null>('explorer');
  const selectedRef = useRef(selected); selectedRef.current = selected;
  const [ready, setReady] = useState(false), [progress, setProgress] = useState('Preparing colony');
  const [portraits, setPortraits] = useState<Record<string, string>>({});
  const [error, setError] = useState(''), [generation, setGeneration] = useState(0);
  const select = (id: string | null) => { setSelected(id); world.current?.select(id); };
  useEffect(() => registerInspectionTool(playback), [playback]);
  useEffect(() => {
    const abort = new AbortController(); let owned: WorldHandle | null = null;
    setReady(false); setError('');
    void import('./world').then(async ({ createWorld }) => {
      if (abort.signal.aborted) return;
      owned = await createWorld({ canvas: canvas.current!, labels: labels.current!, playback,
        onSelect: id => { setSelected(id); owned?.select(id); }, onProgress: setProgress,
        onPortrait: (id, data) => { if (!abort.signal.aborted) setPortraits(p => ({ ...p, [id]: data })); },
        onContextLost: () => { setReady(false); setError('The 3D view lost its graphics connection. Reload the view to continue.'); }, signal: abort.signal });
      if (abort.signal.aborted) { owned.dispose(); return; }
      world.current = owned; owned.select(selectedRef.current); setReady(true);
      Object.defineProperty(window, '__robotWorld', { configurable: true, get: () => owned?.diagnostics() });
    }).catch(e => { if (!abort.signal.aborted) { console.error(e); setError(e instanceof Error ? e.message : 'The colony could not load.'); } });
    return () => { abort.abort(); owned?.dispose(); world.current = null; delete (window as any).__robotWorld; };
  }, [playback, generation]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!ready || e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      const el = e.target as HTMLElement;
      if (el.closest('input,select,textarea,[contenteditable="true"],button')) return;
      if (e.code === 'Space') { e.preventDefault(); playback.toggle(); }
      else if (e.key === '1') select('explorer');
      else if (e.key === '2') select('builder');
      else if (e.key.toLowerCase() === 'r') world.current?.reset();
      else if (e.key === 'Escape') select(null);
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [playback, ready]);

  const robot = frame.robots.find(r => r.id === selected);
  const title = (id: string) => id === 'explorer' ? 'Explorer' : 'Builder';
  return <main className="application">
    <header className="topbar">
      <div className="brand"><span className="brand-mark">R<span /></span><div><strong>ROBOT WORLD</strong><span className="brand-caption">A place to build together</span></div></div>
      <div className="world-tab"><Icon name="orbit" size={19} />World</div>
      <div className="session-badge"><span className="status-dot" />Recorded session</div>
    </header>

    <section className="world-workspace" aria-label="Workshop Valley">
      <div className="world-surface">
        <canvas key={generation} ref={canvas} className="world-canvas" aria-label="3D robot colony. Drag to orbit and scroll to zoom. Select robots using the crew panel." tabIndex={0} />
        <div className="world-labels" ref={labels} aria-hidden={!ready}>
          {['explorer','builder'].map(id => <button key={id} className={`world-label ${id} ${selected === id ? 'selected' : ''}`} data-robot-label={id} onClick={() => select(id)} disabled={!ready}><span className="label-dot" />{title(id)}<span className="label-owner">{id === 'explorer' ? 'Alice' : 'Bob'}</span></button>)}
        </div>
        <div className="valley-heading"><p className="eyebrow">COLONY 001</p><h1>Workshop Valley</h1><div className="valley-status"><span />Shared workshop · recorded run</div></div>
        <div className="world-counters" aria-label="Recorded world state">
          <div><strong>{frame.built}</strong><span>Constructions</span></div><div><strong>{frame.robots.length}</strong><span>Agents</span></div><div><strong>{frame.knowledge.length}</strong><span>Discoveries</span></div>
        </div>
        <div className="canvas-tools" aria-label="Camera controls">
          <button onClick={() => world.current?.zoom(-2)} aria-label="Zoom in" title="Zoom in" disabled={!ready}><Icon name="plus" /></button>
          <button onClick={() => world.current?.zoom(2)} aria-label="Zoom out" title="Zoom out" disabled={!ready}><Icon name="minus" /></button>
          <span />
          <button onClick={() => world.current?.reset()} aria-label="Reset view" title="Reset view (R)" disabled={!ready}><Icon name="focus" /></button>
        </div>
        <div className="camera-hint"><Icon name="orbit" size={16} /><span>Drag to explore</span><i />Scroll to zoom</div>
        {(!ready || error) && <div className="loading-layer" role={error ? 'alert' : 'status'}><div className="loading-card"><span className="loading-mark">R</span><h2>{error ? 'Let’s reconnect the view' : 'Arriving in the valley'}</h2><p>{error || progress}</p>{error ? <button className="primary" onClick={() => setGeneration(g => g + 1)}>Reload view</button> : <div className="loading-track"><span /></div>}</div></div>}
      </div>

      <aside className="crew-panel" aria-label="Colony crew">
        <div className="crew-heading"><p className="eyebrow">YOUR COLONY</p><h2>Meet the crew<span>02</span></h2></div>
        <div className="crew-list">{['explorer','builder'].map(id => {
          const r = frame.robots.find(a => a.id === id)!;
          return <button key={id} className={`crew-card ${id} ${selected === id ? 'is-selected' : ''}`} onClick={() => select(id)} aria-label={`Select ${title(id)}, ${id === 'explorer' ? 'Alice' : 'Bob'}`} aria-pressed={selected === id} disabled={!ready}>
            <div className="crew-top"><span className="agent-number">0{id === 'explorer' ? 1 : 2}</span><span className="agent-role">{id === 'explorer' ? 'EXPLORATION' : 'CONSTRUCTION'}</span><span className="selection-indicator" /></div>
            <div className="crew-identity"><div className="portrait">{portraits[id] && <img src={portraits[id]} alt="" />}</div><div><h3>{title(id)}</h3><p>{id === 'explorer' ? 'Alice' : 'Bob'}</p></div><Icon name="chevron" size={18} /></div>
            <div className="energy-row"><Icon name="bolt" size={17} /><div className="energy-track"><span style={{ width: `${r.energy}%` }} /></div><strong>{r.energy}%</strong></div>
          </button>;
        })}</div>
        {robot ? <section className="inspection" aria-label={`${title(robot.id)} inspection`}>
          <div className="inspection-heading"><span className={`mini-dot ${robot.id}`} /><h3>{title(robot.id)} · details</h3><button aria-label="Close inspection" onClick={() => select(null)}><Icon name="close" size={16} /></button></div>
          <dl><div><dt><Icon name="box" size={15} />Cargo</dt><dd>{robot.cargo}<span> units</span></dd></div><div><dt>Position</dt><dd>{robot.position.map(p => p.toFixed(1)).join(' , ')}</dd></div></dl>
          <button className="focus-button" onClick={() => world.current?.focus(robot.id)} disabled={!ready}><Icon name="focus" size={16} />Focus on {title(robot.id)}<Icon name="arrow" size={16} /></button>
        </section> : <div className="selection-prompt">Select a robot to see its details.</div>}
        <div className="colony-resource"><span className="resource-icon"><Icon name="leaf" size={20} /></span><div><strong>{frame.resource} resources</strong><span>{frame.stock} in shared storage</span></div><span className="resource-dot" /></div>
      </aside>
    </section>

    <footer className="playback-bar" aria-label="Replay controls">
      <button className="play-button" onClick={() => playback.toggle()} disabled={!ready}><Icon name={cursor.playing ? 'pause' : 'play'} size={18} />{cursor.playing ? 'Pause' : cursor.index === session.frames.length - 1 ? 'Replay' : 'Play'}</button>
      <button className="restart-button" onClick={() => playback.seek(0)} aria-label="Restart recording" title="Restart recording" disabled={!ready}><Icon name="reset" size={18} /></button>
      <div className="timeline-label"><strong>Tick {String(frame.tick).padStart(3, '0')}<span> / {String(session.frames.at(-1)!.tick).padStart(3, '0')}</span></strong><span>Frame {cursor.index + 1} of {session.frames.length} · rev {frame.revision}</span></div>
      <input className="timeline" type="range" aria-label="Recording frame" min="0" max={session.frames.length - 1} value={cursor.index} onChange={e => playback.seek(Number(e.target.value))} disabled={!ready} style={{ '--progress': `${cursor.index / (session.frames.length - 1) * 100}%` } as React.CSSProperties} />
      <label className="speed-control"><span className="sr-only">Playback speed</span><select value={cursor.speed} onChange={e => playback.setSpeed(Number(e.target.value))} disabled={!ready}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select><Icon name="chevron" size={17} /></label>
    </footer>
    <div className="bottom-line"><span>WORKSHOP VALLEY <i />LOCAL OBSERVATION</span></div>
  </main>;
}

function App() {
  const [session, setSession] = useState<Session | null>(null), [error, setError] = useState('');
  useEffect(() => { const abort = new AbortController(); loadSession(abort.signal).then(setSession).catch(e => { if (!abort.signal.aborted) setError(e instanceof Error ? e.message : 'Session failed to load.'); }); return () => abort.abort(); }, []);
  if (!session) return <div className="boot-screen"><span className="loading-mark">R</span><h1>{error ? 'The recording could not load' : 'Opening Robot World'}</h1><p role={error ? 'alert' : 'status'}>{error || 'Preparing Workshop Valley…'}</p>{error && <button className="primary" onClick={() => location.reload()}>Try again</button>}</div>;
  return <Colony session={session} />;
}

createRoot(document.getElementById('root')!).render(<App />);
