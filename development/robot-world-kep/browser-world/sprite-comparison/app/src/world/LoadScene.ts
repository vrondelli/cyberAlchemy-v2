import Phaser from 'phaser';
import { LOAD_GRID } from '../art/layout';
import { configureCamera } from './camera';
import { setSceneRuntimeOptions, type SceneRuntimeOptions } from './SpriteBenchScene';

export function requestedLoadCount(): number {
  const raw = Number(new URLSearchParams(location.search).get('count'));
  return [50, 200, 500].includes(raw) ? raw : 50;
}

export class LoadScene extends Phaser.Scene {
  private options!: SceneRuntimeOptions;
  private elapsed = 0;
  private agents: Phaser.GameObjects.Sprite[] = [];

  constructor() { super('sprite-load'); }

  preload(): void {
    this.options = (globalThis as { __spriteSceneRuntime?: SceneRuntimeOptions }).__spriteSceneRuntime ?? (null as unknown as SceneRuntimeOptions);
    this.load.image('robots', '/assets/robots/v1/atlas.png');
    this.load.once('loaderror', (file: { key?: string }) => this.options.onError(`Required load-test asset failed to load: ${file.key ?? 'unknown'}`));
  }

  create(): void {
    const atlas = this.options.atlas;
    const texture = this.textures.get('robots');
    for (const frame of atlas.frames) if (!texture.has(frame.name)) texture.add(frame.name, 0, frame.rect.x, frame.rect.y, frame.rect.w, frame.rect.h);
    configureCamera(this.cameras.main);
    this.add.rectangle(640, 384, 1280, 768, 0xe7eee4).setDepth(-10);
    this.add.rectangle(640, 390, 1160, 590, 0xd2e1d1).setStrokeStyle(2, 0xa9c1af).setDepth(-9);
    const count = requestedLoadCount();
    for (let index = 0; index < count; index++) {
      const column = index % LOAD_GRID.columns;
      const row = Math.floor(index / LOAD_GRID.columns);
      const sprite = this.add.sprite(LOAD_GRID.originX + column * LOAD_GRID.spacing, LOAD_GRID.originY + row * LOAD_GRID.spacing, 'robots', 'idle-00').setOrigin(0.5, 1).setScale(atlas.nominalHeight / atlas.referenceHeightPx * 0.48).setTint(index % 3 === 0 ? 0x78a99f : index % 3 === 1 ? 0xd3914b : 0xffffff);
      this.agents.push(sprite);
    }
    this.add.text(46, 38, `SYNTHETIC LOAD / ${count} ROBOTS`, { color: '#173a42', fontFamily: 'Arial', fontSize: '16px', fontStyle: 'bold' }).setScrollFactor(0).setDepth(10000);
    this.add.text(46, 62, 'Deterministic draw-only population; no fixture agents or session state are mutated.', { color: '#4b675f', fontFamily: 'Arial', fontSize: '12px' }).setScrollFactor(0).setDepth(10000);
    this.add.text(640, 735, 'Load check · 50 / 200 / 500 synthetic sprites', { color: '#31544d', fontFamily: 'Arial', fontSize: '12px' }).setOrigin(0.5).setDepth(100);
    this.options.onReady(this as unknown as import('./SpriteBenchScene').SpriteBenchScene);
  }

  update(_time: number, delta: number): void {
    this.elapsed += Math.max(0, delta) / 1000;
    const frame = this.options.atlas.animations.idle[Math.floor(this.elapsed * this.options.atlas.fps.idle) % this.options.atlas.animations.idle.length];
    for (const sprite of this.agents) sprite.setFrame(frame);
  }
}

export function configureLoadRuntime(options: SceneRuntimeOptions): void {
  (globalThis as { __spriteSceneRuntime?: SceneRuntimeOptions }).__spriteSceneRuntime = options;
  setSceneRuntimeOptions(options);
}
