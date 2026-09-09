import Phaser from 'phaser';
import type { Frame } from '../session';
import type { RobotId, SpriteAtlasSpec, SpriteWorldOptions } from './types';
import { chooseAnimation } from './animation';
import { configureCamera } from './camera';
import { depthFor, projectSource } from './projection';
import type { Playback } from '../playback';
import { setSceneRuntimeOptions, SpriteBenchScene, type SceneRuntimeOptions } from './SpriteBenchScene';

export class ColonyScene extends Phaser.Scene {
  private options!: SceneRuntimeOptions;
  private sprites = new Map<RobotId, Phaser.GameObjects.Sprite>();
  private lastRaw = 0;
  private frameIntervals: number[] = [];
  private playback!: Playback;

  constructor() { super('sprite-colony'); }

  preload(): void {
    this.options = (globalThis as { __spriteSceneRuntime?: SceneRuntimeOptions }).__spriteSceneRuntime ?? (null as unknown as SceneRuntimeOptions);
    this.load.image('robots', '/assets/robots/v1/atlas.png');
    this.load.once('loaderror', (file: { key?: string }) => this.options.onError(`Required sprite asset failed to load: ${file.key ?? 'unknown'}`));
  }

  create(): void {
    this.playback = this.options.playback;
    const texture = this.textures.get('robots');
    for (const frame of this.options.atlas.frames) texture.add(frame.name, 0, frame.rect.x, frame.rect.y, frame.rect.w, frame.rect.h);
    configureCamera(this.cameras.main);
    this.add.rectangle(640, 384, 1280, 768, 0xd8e2d7).setDepth(-10);
    this.add.rectangle(640, 500, 1000, 300, 0xb4c4b3).setDepth(-9);
    for (const id of ['explorer', 'builder'] as const) {
      const sprite = this.add.sprite(640, 384, 'robots', 'idle-00').setOrigin(0.5, 1).setScale(this.options.atlas.nominalHeight / this.options.atlas.referenceHeightPx).setInteractive({ useHandCursor: true });
      sprite.on('pointerdown', () => this.options.onSelect(id));
      this.sprites.set(id, sprite);
    }
    this.add.text(52, 52, 'RECORDED TWO-ROBOT REPLAY / 2D ACTOR CHECK', { color: '#173a42', fontFamily: 'Arial', fontSize: '16px', fontStyle: 'bold' }).setScrollFactor(0);
    this.options.onReady(this as unknown as SpriteBenchScene);
    this.lastRaw = performance.now();
  }

  update(): void {
    const now = performance.now();
    const dt = this.lastRaw ? Math.max(0, now - this.lastRaw) / 1000 : 0;
    this.lastRaw = now;
    this.frameIntervals.push(dt * 1000);
    if (this.frameIntervals.length > 120) this.frameIntervals.shift();
    this.playback.update(dt);
    const frame = this.playback.frame;
    const next = this.playback.nextFrame;
    for (const id of ['explorer', 'builder'] as const) this.updateActor(id, frame, next);
  }

  private updateActor(id: RobotId, frame: Frame, next: Frame): void {
    const sprite = this.sprites.get(id)!;
    const choice = chooseAnimation(frame, next, id, this.playback.fraction, this.options.atlas);
    const position = projectSource(this.playback.position(id));
    const frameSpec = this.options.atlas.frames.find(item => item.name === choice.frame)!;
    sprite.setFrame(choice.frame).setPosition(position.x, position.y).setOrigin(frameSpec.foot.x / frameSpec.rect.w, frameSpec.foot.y / frameSpec.rect.h).setFlipX(choice.facing === 'left').setDepth(depthFor(position, id));
  }
}

export function configureColonyRuntime(options: SceneRuntimeOptions): void {
  (globalThis as { __spriteSceneRuntime?: SceneRuntimeOptions }).__spriteSceneRuntime = options;
  setSceneRuntimeOptions(options);
}
