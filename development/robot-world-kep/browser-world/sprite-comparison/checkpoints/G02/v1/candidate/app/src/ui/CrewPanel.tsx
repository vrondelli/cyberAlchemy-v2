import type { Session } from '../session';
import type { Playback } from '../playback';
import type { RobotId, SpriteDiagnostics, SpriteWorldHandle, ViewMode } from '../world/types';
import { SpritePortrait } from './SpritePortrait';

export interface CrewPanelProps {
  readonly mode: ViewMode;
  readonly session: Session | null;
  readonly playback: Playback | null;
  readonly snapshot: { readonly index: number; readonly playing: boolean; readonly speed: number };
  readonly selected: RobotId | null;
  readonly world: SpriteWorldHandle | null;
  readonly diagnostics: SpriteDiagnostics | null;
  readonly progress: string;
  readonly error: string;
  readonly onSelect: (id: RobotId | null) => void;
}

export function CrewPanel({ mode, session, playback, snapshot, selected, world, diagnostics, progress, error, onSelect }: CrewPanelProps) {
  const selectedRobot = session?.frames[snapshot.index]?.robots.find(robot => robot.id === selected);
  const synthetic = diagnostics?.syntheticAgentCount ?? 0;
  return <aside className="inspector"><p className="eyebrow">{mode === 'load' ? 'LOAD INSPECTOR' : 'INSPECTOR'}</p><h2>{mode === 'load' ? `${synthetic} synthetic robots` : selectedRobot ? selectedRobot.id : 'No robot selected'}</h2><p className="muted">{mode === 'load' ? 'Draw-only actors stay outside the recorded session and crew state.' : selectedRobot ? `Owner ${selectedRobot.owner} · energy ${selectedRobot.energy} · cargo ${selectedRobot.cargo}` : 'Select a sprite in the world or use the recorded fixture.'}</p>{mode !== 'load' && <div className="crew-list">{(['explorer', 'builder'] as const).map(id => <button key={id} className={selected === id ? 'crew selected' : 'crew'} onClick={() => { onSelect(id); world?.focus(id); }}><SpritePortrait id={id} /><span className={`crew-dot ${id}`} /><span><strong>{id === 'explorer' ? 'Explorer' : 'Builder'}</strong><small>{id === 'explorer' ? 'Alice' : 'Bob'}</small></span></button>)}</div>}{mode !== 'load' && <dl className="facts"><div><dt>Tick</dt><dd>{session?.frames[snapshot.index]?.tick ?? '—'}</dd></div><div><dt>Revision</dt><dd>{session?.frames[snapshot.index]?.revision ?? '—'}</dd></div><div><dt>Built</dt><dd>{session?.frames[snapshot.index]?.built ?? '—'}</dd></div></dl>}<p className="renderer-status" aria-live="polite">{error || progress}</p>{error && <button onClick={() => location.reload()}>Try again</button>}<p className="limitation">Recorded local fixture only. This comparison does not call live agents, KEP, ARE or AlchLang.</p></aside>;
}
