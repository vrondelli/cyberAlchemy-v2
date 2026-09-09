import Phaser from 'phaser';
import type { Playback } from '../playback';
import { loadAtlasSpec, verifyAtlasImage } from '../sprites/atlas';
import { initialDiagnostics, updateCursor } from './diagnostics';
import { ColonyScene, configureColonyRuntime } from './ColonyScene';
import { SpriteBenchScene, setSceneRuntimeOptions, type SceneRuntimeOptions } from './SpriteBenchScene';
import type { RobotId, SpriteDiagnostics, SpriteWorldHandle, SpriteWorldOptions } from './types';

export async function createSpriteWorld(options: SpriteWorldOptions): Promise<SpriteWorldHandle> {
  const atlas = await loadAtlasSpec(options.signal);
  await verifyAtlasImage(atlas, options.signal);
  if (options.signal.aborted) throw new DOMException('Renderer creation aborted.', 'AbortError');
  let diagnostics = initialDiagnostics(options.mode, options.playback.session);
  let selectedId: RobotId | null = null;
  let game: Phaser.Game | null = null;
  let scene: SpriteBenchScene | ColonyScene | null = null;
  let disposed = false;
  const update = () => { diagnostics = updateCursor(diagnostics, options.playback, selectedId); };
  const choose = (id: RobotId | null) => { if (!disposed) { selectedId = id; diagnostics = { ...diagnostics, selectedId }; options.onSelect(id); } };
  const sceneOptions: SceneRuntimeOptions = { atlas, playback: options.playback, mode: options.mode, onReady: readyScene => { scene = readyScene; diagnostics = { ...diagnostics, backend: game?.renderer?.constructor?.name ?? 'canvas', loadState: 'ready', activeGames: 1, realAgentCount: options.mode === 'colony' ? 2 : 0, textures: 2, objects: readyScene.children.length }; options.onProgress('Renderer ready.'); }, onSelect: choose, onError: options.onError };
  if (options.mode === 'colony') configureColonyRuntime(sceneOptions); else setSceneRuntimeOptions(sceneOptions);
  const ready = new Promise<void>((resolve, reject) => {
    const previous = sceneOptions.onReady;
    sceneOptions.onReady = value => { previous(value); resolve(); };
    sceneOptions.onError = message => { options.onError(message); reject(new Error(message)); };
    try {
      game = new Phaser.Game({ type: Phaser.AUTO, parent: options.host, width: 1280, height: 768, backgroundColor: options.mode === 'bench' ? '#f5efe5' : '#d8e2d7', pixelArt: true, antialias: false, roundPixels: true, transparent: false, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 1280, height: 768 }, scene: options.mode === 'colony' ? ColonyScene : SpriteBenchScene });
      game.events.once(Phaser.Core.Events.CONTEXT_LOST, () => options.onError('The renderer lost its graphics context. Retry to recreate it.'));
    } catch (error) { reject(error); }
  });
  try { await ready; } catch (error) { const currentGame = game as Phaser.Game | null; currentGame?.destroy(true); diagnostics = { ...diagnostics, loadState: 'error', activeGames: 0 }; throw error; }
  if (options.signal.aborted) { const currentGame = game as Phaser.Game | null; currentGame?.destroy(true); diagnostics = { ...diagnostics, loadState: 'disposed', activeGames: 0 }; throw new DOMException('Renderer creation aborted.', 'AbortError'); }
  const resize = (width: number, height: number) => { game?.scale.resize(width, height); if (game?.canvas) diagnostics = { ...diagnostics, canvas: { width: game.canvas.width, height: game.canvas.height }, css: { width: game.canvas.clientWidth, height: game.canvas.clientHeight }, dpr: window.devicePixelRatio || 1 }; };
  const observer = new ResizeObserver(entries => { const rect = entries[0]?.contentRect; if (rect) resize(rect.width, rect.height); });
  observer.observe(options.host);
  const onVisibility = () => { if (document.hidden) options.playback.pause(); };
  document.addEventListener('visibilitychange', onVisibility);
  const handle: SpriteWorldHandle = { select: choose, focus: id => { selectedId = id; choose(id); const target = options.playback.position(id); const camera = scene?.cameras.main; camera?.centerOn(640 + target[0] * 80, 384 - target[1] * 48); }, reset: () => { scene?.cameras.main.centerOn(640, 384); scene?.cameras.main.setZoom(1); }, zoom: step => { const camera = scene?.cameras.main; if (camera) camera.setZoom(Math.max(0.75, Math.min(2, camera.zoom + step * 0.125))); }, resize, diagnostics: () => { update(); return diagnostics; }, dispose: async () => { if (disposed) return; disposed = true; observer.disconnect(); document.removeEventListener('visibilitychange', onVisibility); diagnostics = { ...diagnostics, loadState: 'disposed', activeGames: 0 }; await new Promise<void>(resolve => { if (!game) return resolve(); game.events.once(Phaser.Core.Events.DESTROY, () => resolve()); game.destroy(true); window.setTimeout(resolve, 100); }); game = null; } };
  resize(options.host.clientWidth, options.host.clientHeight);
  update();
  Object.defineProperty(window, '__robotWorldSprites', { configurable: true, get: () => handle.diagnostics() });
  options.signal.addEventListener('abort', () => { void handle.dispose(); }, { once: true });
  return handle;
}
