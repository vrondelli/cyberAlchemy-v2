import type { Frame, Session } from './session';

export interface CursorSnapshot { readonly index: number; readonly playing: boolean; readonly speed: number }

export class Playback {
  private remainder = 0;
  private snapshot: CursorSnapshot = Object.freeze({ index: 0, playing: false, speed: 1 });
  private listeners = new Set<() => void>();
  readonly frameSeconds = 0.65;
  constructor(readonly session: Session) {}
  getSnapshot = (): CursorSnapshot => this.snapshot;
  subscribe = (fn: () => void): (() => void) => { this.listeners.add(fn); return () => this.listeners.delete(fn); };
  private publish(next: CursorSnapshot) {
    if (next.index === this.snapshot.index && next.playing === this.snapshot.playing && next.speed === this.snapshot.speed) return;
    this.snapshot = Object.freeze(next); this.listeners.forEach(fn => fn());
  }
  get frame(): Frame { return this.session.frames[this.snapshot.index]; }
  get nextFrame(): Frame { return this.session.frames[Math.min(this.snapshot.index + 1, this.session.frames.length - 1)]; }
  get fraction(): number { return this.snapshot.playing ? this.remainder / this.frameSeconds : 0; }
  seek(index: number) {
    if (!Number.isFinite(index)) return;
    this.remainder = 0;
    this.publish({ ...this.snapshot, index: Math.max(0, Math.min(Math.round(index), this.session.frames.length - 1)), playing: false });
  }
  play() {
    if (this.snapshot.index === this.session.frames.length - 1) this.seek(0);
    this.publish({ ...this.snapshot, playing: true });
  }
  pause() { this.remainder = 0; this.publish({ ...this.snapshot, playing: false }); }
  toggle() { if (this.snapshot.playing) this.pause(); else this.play(); }
  setSpeed(speed: number) {
    if (![0.5, 1, 2].includes(speed)) return;
    this.publish({ ...this.snapshot, speed });
  }
  update(dt: number) {
    if (!this.snapshot.playing || !Number.isFinite(dt) || dt < 0) return;
    this.remainder += dt * this.snapshot.speed;
    const steps = Math.floor((this.remainder + 1e-10) / this.frameSeconds);
    if (!steps) return;
    const index = Math.min(this.snapshot.index + steps, this.session.frames.length - 1);
    this.remainder = Math.max(0, this.remainder - steps * this.frameSeconds);
    const end = index === this.session.frames.length - 1;
    if (end) this.remainder = 0;
    this.publish({ ...this.snapshot, index, playing: !end });
  }
  position(id: string): readonly [number, number] {
    const a = this.frame.robots.find(r => r.id === id)!;
    const b = this.nextFrame.robots.find(r => r.id === id)!;
    const t = this.fraction;
    return [a.position[0] + (b.position[0] - a.position[0]) * t, a.position[1] + (b.position[1] - a.position[1]) * t];
  }
}
