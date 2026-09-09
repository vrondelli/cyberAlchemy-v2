import Phaser from 'phaser';
import type { Frame } from '../session';
import type { RobotId } from './types';
import { chooseAnimation } from './animation';
import { configureCamera } from './camera';
import { depthFor, projectSource } from './projection';
import type { Playback } from '../playback';
import { COLONY_LAYOUT } from '../art/layout';
import { registerColonyFrames } from '../art/colonyAtlas';
import { setSceneRuntimeOptions, type SceneRuntimeOptions } from './SpriteBenchScene';
import type { ColonyAtlasSpec } from '../art/colonyAtlas';

type ColonyRuntimeOptions = SceneRuntimeOptions & { readonly colony?: ColonyAtlasSpec };

export class ColonyScene extends Phaser.Scene {
  private options!: SceneRuntimeOptions;
  private sprites = new Map<RobotId, Phaser.GameObjects.Sprite>();
  private playback!: Playback;
  private lastRaw = 0;
  private frameIntervals: number[] = [];
  private builtLabel!: Phaser.GameObjects.Text;
  private constructionMarks: Phaser.GameObjects.GameObject[] = [];

  constructor() { super('sprite-colony'); }

  preload(): void {
    this.options = (globalThis as { __spriteSceneRuntime?: SceneRuntimeOptions }).__spriteSceneRuntime ?? (null as unknown as SceneRuntimeOptions);
    this.load.image('robots', '/assets/robots/v1/atlas.png');
    this.load.image('tiles', '/assets/colony/v1/tiles.png');
    this.load.image('props', '/assets/colony/v1/props.png');
    this.load.once('loaderror', (file: { key?: string }) => this.options.onError(`Required colony asset failed to load: ${file.key ?? 'unknown'}`));
  }

  create(): void {
    this.playback = this.options.playback;
    const atlas = this.options.atlas;
    const robotTexture = this.textures.get('robots');
    for (const frame of atlas.frames) if (!robotTexture.has(frame.name)) robotTexture.add(frame.name, 0, frame.rect.x, frame.rect.y, frame.rect.w, frame.rect.h);
    const colony = (this.options as ColonyRuntimeOptions).colony;
    if (!colony) throw new Error('Colony atlas is missing from scene options.');
    registerColonyFrames(this.textures, colony);
    configureCamera(this.cameras.main);
    this.drawColony();
    for (const id of ['explorer', 'builder'] as const) {
      const sprite = this.add.sprite(640, 500, 'robots', 'idle-00').setOrigin(0.5, 1).setScale(atlas.nominalHeight / atlas.referenceHeightPx).setInteractive({ useHandCursor: true });
      sprite.on('pointerdown', () => this.options.onSelect(id));
      this.sprites.set(id, sprite);
    }
    this.add.text(46, 38, 'RECORDED COLONY / 64 PX ROBOTS', { color: '#173a42', fontFamily: 'Arial', fontSize: '16px', fontStyle: 'bold' }).setScrollFactor(0).setDepth(10000);
    this.builtLabel = this.add.text(46, 62, '', { color: '#4b675f', fontFamily: 'Arial', fontSize: '12px' }).setScrollFactor(0).setDepth(10000);
    this.options.onReady(this as unknown as import('./SpriteBenchScene').SpriteBenchScene);
    this.lastRaw = performance.now();
    this.updateConstruction(this.playback.frame);
  }

  private drawColony(): void {
    this.add.rectangle(640, 384, 1280, 768, 0xb7caa8).setDepth(-30);
    for (const tile of COLONY_LAYOUT.tiles) this.add.image(tile.x, tile.y, 'tiles', tile.frame).setOrigin(0.5, 0.5).setScale(tile.scale).setDepth(-20);
    this.add.rectangle(640, 384, 2, 640, 0x6f8c74).setAlpha(0.25).setDepth(-5);
    this.add.rectangle(640, 384, 1020, 2, 0x6f8c74).setAlpha(0.25).setDepth(-5);
    for (const prop of COLONY_LAYOUT.props) {
      const object = this.add.image(prop.x, prop.y, 'props', prop.frame).setOrigin(0.5, 1).setScale(prop.scale).setDepth(prop.y * 10);
      this.add.text(prop.x, prop.y + 10, prop.label, { color: '#3a5d55', fontFamily: 'Arial', fontSize: '11px', fontStyle: 'bold', align: 'center' }).setOrigin(0.5, 0).setDepth(prop.y * 10 + 1);
      if (prop.frame === 'workshop') object.setTint(0xffffff);
    }
    this.add.text(640, 740, 'Workshop · Parts Store · Research Shelter · Charge · Cargo · Grow', { color: '#31544d', fontFamily: 'Arial', fontSize: '12px' }).setOrigin(0.5).setDepth(100);
  }

  private updateConstruction(frame: Frame): void {
    this.builtLabel.setText(`TICK ${frame.tick}  ·  BUILT ${frame.built}/3  ·  RESOURCE ${frame.resource}  ·  STOCK ${frame.stock}`);
    this.constructionMarks.forEach(mark => mark.destroy());
    this.constructionMarks = [];
    const pending = Math.max(0, 3 - frame.built);
    for (let index = 0; index < pending; index++) {
      const marker = this.add.circle(152 + index * 36, 82, 8, 0xd3914b).setStrokeStyle(2, 0xfff6d7).setScrollFactor(0).setDepth(10000);
      this.constructionMarks.push(marker);
    }
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
    this.updateConstruction(frame);
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
