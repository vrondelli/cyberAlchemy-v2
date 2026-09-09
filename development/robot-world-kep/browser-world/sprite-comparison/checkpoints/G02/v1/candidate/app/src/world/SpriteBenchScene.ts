import Phaser from 'phaser';
import type { Playback } from '../playback';
import type { SpriteAtlasSpec, RobotId, SpriteWorldOptions } from './types';
import { benchFrame } from './animation';
import { configureCamera } from './camera';

export interface SceneRuntimeOptions {
  readonly atlas: SpriteAtlasSpec;
  readonly playback: Playback;
  onReady: (scene: SpriteBenchScene) => void;
  onSelect: (id: RobotId | null) => void;
  onError: (message: string) => void;
  readonly mode: SpriteWorldOptions['mode'];
}

let runtime: SceneRuntimeOptions | null = null;
export function setSceneRuntimeOptions(options: SceneRuntimeOptions): void { runtime = options; }

type Sample = { readonly label: string; readonly nominalHeight: number; readonly sprite: Phaser.GameObjects.Sprite };

export class SpriteBenchScene extends Phaser.Scene {
  private options!: SceneRuntimeOptions;
  private samples: Sample[] = [];
  private elapsed = 0;
  private dragging = false;
  private dragStart = { x: 0, y: 0 };

  constructor() { super('sprite-bench'); }

  preload(): void {
    this.options = runtime!;
    this.load.image('robots', '/assets/robots/v1/atlas.png');
    this.load.image('building', '/assets/bench/v1/building.png');
    this.load.once('loaderror', (file: { key?: string }) => this.options.onError(`Required sprite asset failed to load: ${file.key ?? 'unknown'}`));
  }

  create(): void {
    const atlas = this.options.atlas;
    const texture = this.textures.get('robots');
    for (const frame of atlas.frames) texture.add(frame.name, 0, frame.rect.x, frame.rect.y, frame.rect.w, frame.rect.h);
    configureCamera(this.cameras.main);
    this.drawBench();
    this.installPan();
    this.options.onReady(this);
  }

  private drawBench(): void {
    this.add.rectangle(640, 384, 1280, 768, 0xf5efe5).setDepth(-10);
    this.add.rectangle(640, 208, 1160, 280, 0xfaf7f1).setStrokeStyle(2, 0xd8cabb).setDepth(-9);
    this.add.rectangle(640, 560, 1160, 280, 0x1c2b37).setStrokeStyle(2, 0x49606d).setDepth(-9);
    this.add.text(72, 76, 'LIGHT / IDLE PREVIEW', { color: '#4b675f', fontFamily: 'Arial', fontSize: '16px', fontStyle: 'bold' });
    this.add.text(72, 428, 'DARK / WALK PREVIEW', { color: '#c7e1df', fontFamily: 'Arial', fontSize: '16px', fontStyle: 'bold' });
    const heights = [48, 64, 80] as const;
    heights.forEach((height, index) => {
      const x = 150 + index * 315;
      this.add.text(x - 52, 112, `${height}px NOMINAL`, { color: '#18343b', fontFamily: 'Arial', fontSize: '14px', fontStyle: 'bold' });
      const idle = this.add.sprite(x, 300, 'robots', 'idle-00').setOrigin(0.5, 1).setScale(height / this.options.atlas.referenceHeightPx).setTint(index === 1 ? 0x8fb7b2 : 0xffffff).setInteractive({ useHandCursor: true });
      idle.on('pointerdown', () => this.options.onSelect('explorer'));
      this.samples.push({ label: `idle-${height}`, nominalHeight: height, sprite: idle });
      const building = this.add.image(x + 102, 300, 'building').setOrigin(0.5, 1).setScale((height * 3) / 1196);
      building.setAlpha(0.92);
      this.add.text(x - 52, 468, `${height}px NOMINAL`, { color: '#d3ebe8', fontFamily: 'Arial', fontSize: '14px', fontStyle: 'bold' });
      const walk = this.add.sprite(x, 666, 'robots', 'walk-00').setOrigin(0.5, 1).setScale(height / this.options.atlas.referenceHeightPx).setTint(index === 1 ? 0xf0c36a : 0xffffff).setInteractive({ useHandCursor: true });
      walk.on('pointerdown', () => this.options.onSelect('builder'));
      this.samples.push({ label: `walk-${height}`, nominalHeight: height, sprite: walk });
      const darkBuilding = this.add.image(x + 102, 666, 'building').setOrigin(0.5, 1).setScale((height * 3) / 1196).setAlpha(0.9);
      darkBuilding.setTint(0x7195a0);
    });
    this.add.text(72, 732, 'Art preview clock runs independently; the recorded session is unchanged.', { color: '#9ab8bf', fontFamily: 'Arial', fontSize: '13px' });
  }

  private installPan(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => { this.dragging = false; this.dragStart = { x: pointer.x, y: pointer.y }; });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => { if (!pointer.isDown) return; const dx = pointer.x - this.dragStart.x; const dy = pointer.y - this.dragStart.y; if (Math.hypot(dx, dy) < 6) return; this.dragging = true; this.cameras.main.scrollX -= pointer.velocity.x / Math.max(this.cameras.main.zoom, 0.1); this.cameras.main.scrollY -= pointer.velocity.y / Math.max(this.cameras.main.zoom, 0.1); });
    this.input.on('pointerup', () => { this.dragStart = { x: 0, y: 0 }; });
    this.input.on('pointercancel', () => { this.dragging = false; });
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _objects: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      const next = Math.max(0.75, Math.min(2, this.cameras.main.zoom + (dy < 0 ? 0.125 : -0.125)));
      this.cameras.main.setZoom(next);
    });
  }

  update(_time: number, delta: number): void {
    this.elapsed += Math.max(0, delta) / 1000;
    const idle = benchFrame(this.options.atlas, 'idle', this.elapsed);
    const walk = benchFrame(this.options.atlas, 'walk', this.elapsed);
    for (const sample of this.samples) sample.sprite.setFrame(sample.label.startsWith('idle') ? idle : walk);
  }
}
