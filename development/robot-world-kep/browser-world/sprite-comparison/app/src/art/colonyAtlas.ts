import Phaser from 'phaser';

const HASH = /^[a-f0-9]{64}$/;

export interface ColonyFrame {
  readonly name: string;
  readonly imageKey: 'tiles' | 'props';
  readonly rect: Readonly<{ x: number; y: number; w: number; h: number }>;
  readonly foot: Readonly<{ x: number; y: number }>;
}

export interface ColonyAtlasSpec {
  readonly schemaVersion: 'robot-world.colony-atlas/v1-prototype';
  readonly reference: Readonly<{ nominalRobotHeight: number; robotAtlas: string; g01CandidateManifest: string; g01Decision: string }>;
  readonly images: Readonly<Record<'tiles' | 'props', Readonly<{ fileName: string; sha256: string; width: number; height: number }>>>;
  readonly frames: readonly ColonyFrame[];
}

export async function loadColonyAtlas(signal: AbortSignal): Promise<ColonyAtlasSpec> {
  const response = await fetch('/assets/colony/v1/atlas.json', { signal });
  if (!response.ok) throw new Error(`Colony atlas metadata could not load (${response.status}).`);
  const value = await response.json() as unknown;
  validateColonyAtlas(value);
  return value as ColonyAtlasSpec;
}

export async function verifyColonyImages(atlas: ColonyAtlasSpec, signal: AbortSignal): Promise<void> {
  for (const key of ['tiles', 'props'] as const) {
    const response = await fetch(`/assets/colony/v1/${atlas.images[key].fileName}`, { signal });
    if (!response.ok) throw new Error(`Colony image could not load (${response.status}).`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const digest = await crypto.subtle.digest('SHA-256', bytes.buffer);
    const hash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    if (hash !== atlas.images[key].sha256) throw new Error(`Colony ${key} image hash does not match metadata.`);
  }
}

export function validateColonyAtlas(input: unknown): asserts input is ColonyAtlasSpec {
  if (!input || typeof input !== 'object') throw new Error('Colony atlas metadata must be an object.');
  const atlas = input as Record<string, unknown>;
  if (atlas.schemaVersion !== 'robot-world.colony-atlas/v1-prototype') throw new Error('Unsupported colony atlas schema.');
  const reference = atlas.reference as Record<string, unknown>;
  if (!reference || !Number.isInteger(reference.nominalRobotHeight) || Number(reference.nominalRobotHeight) !== 64 || typeof reference.robotAtlas !== 'string' || typeof reference.g01CandidateManifest !== 'string' || !HASH.test(reference.g01CandidateManifest) || typeof reference.g01Decision !== 'string') throw new Error('Colony atlas reference is invalid.');
  const images = atlas.images as Record<string, unknown>;
  if (!images) throw new Error('Colony atlas images are missing.');
  for (const key of ['tiles', 'props'] as const) {
    const image = images[key] as Record<string, unknown>;
    if (!image || typeof image.fileName !== 'string' || !HASH.test(String(image.sha256)) || !Number.isInteger(image.width) || !Number.isInteger(image.height)) throw new Error(`Colony ${key} image metadata is invalid.`);
  }
  if (!Array.isArray(atlas.frames) || atlas.frames.length < 8 || atlas.frames.length > 32) throw new Error('Colony atlas frame count is invalid.');
  const names = new Set<string>();
  for (const value of atlas.frames) {
    if (!value || typeof value !== 'object') throw new Error('Colony frame is invalid.');
    const frame = value as Record<string, unknown>;
    if (typeof frame.name !== 'string' || names.has(frame.name) || !['tiles', 'props'].includes(String(frame.imageKey))) throw new Error('Colony frame identity is invalid.');
    names.add(frame.name);
    const rect = frame.rect as Record<string, unknown>;
    const foot = frame.foot as Record<string, unknown>;
    if (!rect || !foot || ![rect.x, rect.y].every(v => Number.isInteger(v) && Number(v) >= 0) || ![rect.w, rect.h].every(v => Number.isInteger(v) && Number(v) > 0) || ![foot.x, foot.y].every(v => Number.isInteger(v) && Number(v) >= 0) || Number(foot.x) >= Number(rect.w) || Number(foot.y) >= Number(rect.h)) throw new Error('Colony frame geometry is invalid.');
    const image = images[String(frame.imageKey)] as Record<string, unknown>;
    if (Number(rect.x) + Number(rect.w) > Number(image.width) || Number(rect.y) + Number(rect.h) > Number(image.height)) throw new Error('Colony frame exceeds image bounds.');
  }
  for (const name of ['ground', 'path', 'workshop', 'parts-store', 'research-shelter', 'charging-pad', 'cargo', 'plant']) if (!names.has(name)) throw new Error(`Colony frame ${name} is required.`);
}

export function registerColonyFrames(textures: Phaser.Textures.TextureManager, atlas: ColonyAtlasSpec): void {
  for (const frame of atlas.frames) textures.get(frame.imageKey).add(frame.name, 0, frame.rect.x, frame.rect.y, frame.rect.w, frame.rect.h);
}
