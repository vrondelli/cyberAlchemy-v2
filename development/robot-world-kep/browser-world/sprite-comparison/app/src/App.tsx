import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { loadSession, type Session } from './session';
import { Playback } from './playback';
import { createSpriteWorld } from './world/createSpriteWorld';
import type { RobotId, SpriteDiagnostics, SpriteWorldHandle, ViewMode } from './world/types';
import { WorldPanel } from './ui/WorldPanel';
import { ReplayBar } from './ui/ReplayBar';
import { CrewPanel } from './ui/CrewPanel';

const EMPTY_SNAPSHOT = Object.freeze({ index: 0, playing: false, speed: 1 });
const EMPTY_SUBSCRIBE = (_listener: () => void) => () => undefined;

function requestedMode(): ViewMode {
  const value = new URLSearchParams(location.search).get('view');
  return value === 'colony' || value === 'load' ? value : 'bench';
}

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('Loading the pinned recorded session…');
  const [selected, setSelected] = useState<RobotId | null>(null);
  const [playback, setPlayback] = useState<Playback | null>(null);
  const [worldReady, setWorldReady] = useState(false);
  const [diagnostics, setDiagnostics] = useState<SpriteDiagnostics | null>(null);
  const [mode] = useState<ViewMode>(requestedMode);
  const hostRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<SpriteWorldHandle | null>(null);
  const disposalRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    const controller = new AbortController();
    loadSession(controller.signal).then(setSession).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'The recording could not load.'); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!session) return;
    const nextPlayback = new Playback(session);
    setPlayback(nextPlayback);
    return () => nextPlayback.pause();
  }, [session]);
  const snapshot = useSyncExternalStore(playback?.subscribe ?? EMPTY_SUBSCRIBE, playback?.getSnapshot ?? (() => EMPTY_SNAPSHOT));
  useEffect(() => {
    if (!playback || !hostRef.current) return;
    const controller = new AbortController();
    let active = true;
    setError(''); setWorldReady(false); setProgress(mode === 'load' ? 'Loading atlas for synthetic population…' : 'Loading robot atlas and registering frames…');
    (async () => {
      try {
        await disposalRef.current;
        const handle = await createSpriteWorld({ host: hostRef.current!, playback, mode, signal: controller.signal, onSelect: id => { if (active) setSelected(id); }, onProgress: message => { if (active) { setProgress(message); setWorldReady(true); } }, onError: message => { if (active) setError(message); } });
        if (!active || controller.signal.aborted) { await handle.dispose(); return; }
        worldRef.current = handle; setDiagnostics(handle.diagnostics()); setWorldReady(true);
      } catch (reason: unknown) { if (active && !controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'The sprite renderer could not load.'); }
    })();
    return () => {
      active = false; controller.abort();
      const handle = worldRef.current; worldRef.current = null;
      if (handle) disposalRef.current = handle.dispose();
    };
  }, [playback, mode]);
  useEffect(() => {
    let timer = 0;
    const sample = () => { if (worldRef.current) setDiagnostics(worldRef.current.diagnostics()); timer = window.setTimeout(sample, 250); };
    sample();
    return () => window.clearTimeout(timer);
  }, [worldReady]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      if (event.key === ' ' && target?.tagName === 'BUTTON') return;
      if (event.key === ' ' && mode === 'colony') { event.preventDefault(); playback?.toggle(); }
      else if (event.key === '1' && mode === 'colony') { event.preventDefault(); setSelected('explorer'); worldRef.current?.focus('explorer'); }
      else if (event.key === '2' && mode === 'colony') { event.preventDefault(); setSelected('builder'); worldRef.current?.focus('builder'); }
      else if (event.key.toLowerCase() === 'r') { event.preventDefault(); worldRef.current?.reset(); if (mode === 'colony') playback?.seek(0); }
      else if (event.key === 'Escape') { event.preventDefault(); setSelected(null); worldRef.current?.select(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, playback]);

  return <main className="comparison-shell">
    <header><span className="mark">R</span><div><strong>ROBOT WORLD</strong><small>Sprite comparison · 64 px nominal</small></div><span className="status">Prototype</span></header>
    <section className="world-layout">
      <div className="world-column"><WorldPanel hostRef={hostRef} mode={mode} error={error} worldReady={worldReady} /><ReplayBar mode={mode} playback={playback} snapshot={snapshot} session={session} world={worldRef.current} /><p className="shortcut-hint">{mode === 'colony' ? 'Shortcuts: 1 / 2 select · Space play · R reset · Esc clear' : 'Pan and wheel zoom are available inside the world.'}</p></div>
      <CrewPanel mode={mode} session={session} playback={playback} snapshot={snapshot} selected={selected} world={worldRef.current} diagnostics={diagnostics} progress={progress} error={error} onSelect={setSelected} />
    </section>
  </main>;
}
