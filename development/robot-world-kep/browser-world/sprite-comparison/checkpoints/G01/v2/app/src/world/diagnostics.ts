import type { SpriteDiagnostics, SpriteWorldOptions, RobotId } from './types';
import type { Playback } from '../playback';
import type { Session } from '../session';

export function initialDiagnostics(mode: SpriteWorldOptions['mode'], session: Session): SpriteDiagnostics {
  const empty = { explorer: [0, 0] as readonly [number, number], builder: [0, 0] as readonly [number, number] };
  return { build: { id: 'sprite-comparison-p03', session: session.sourceReplaySha256 }, backend: 'pending', phaserVersion: '3.90.0', mode, canvas: { width: 0, height: 0 }, css: { width: 0, height: 0 }, dpr: 1, camera: { center: { x: 640, y: 384 }, zoom: 1, bounds: { x: 128, y: 64, width: 1024, height: 640 } }, selectedId: null, cursor: { index: 0, playing: false, speed: 1, tick: 0, revision: 0 }, sourcePositions: empty, visualPositions: { explorer: { x: 0, y: 0 }, builder: { x: 0, y: 0 } }, atlasFrames: { explorer: 'idle-00', builder: 'idle-00' }, facing: { explorer: 'right', builder: 'right' }, textures: 0, objects: 0, activeGames: 0, realAgentCount: 0, syntheticAgentCount: 0, samples: [], frameTiming: { medianMs: 0, p95Ms: 0, longStallCount: 0 }, loadState: 'loading' };
}

export function updateCursor(diagnostics: SpriteDiagnostics, playback: Playback, selectedId: RobotId | null): SpriteDiagnostics {
  const frame = playback.frame;
  return { ...diagnostics, selectedId, cursor: { index: playback.getSnapshot().index, playing: playback.getSnapshot().playing, speed: playback.getSnapshot().speed, tick: frame.tick, revision: frame.revision } };
}
