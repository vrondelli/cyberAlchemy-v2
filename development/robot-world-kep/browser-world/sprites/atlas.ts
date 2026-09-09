import type { SpriteAtlasSpec } from '../world/types';

const HASH = /^[a-f0-9]{64}$/;
const GROUPS = ['idle', 'walk', 'enable', 'shutdown'] as const;

export async function loadAtlasSpec(signal: AbortSignal): Promise<SpriteAtlasSpec> {
  const response = await fetch('/assets/robots/v1/atlas.json', { signal });
  if (!response.ok) throw new Error(`Atlas metadata could not load (${response.status}).`);
  const value = await response.json() as unknown;
  validateAtlas(value);
  return value as SpriteAtlasSpec;
}

export async function verifyAtlasImage(atlas: SpriteAtlasSpec, signal: AbortSignal): Promise<void> {
  const response = await fetch('/assets/robots/v1/atlas.png', { signal });
  if (!response.ok) throw new Error(`Robot atlas image could not load (${response.status}).`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const digest = await crypto.subtle.digest('SHA-256', bytes.buffer);
  const hash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  if (hash !== atlas.imageSha256) throw new Error('Robot atlas image hash does not match metadata.');
}

export function validateAtlas(input: unknown): asserts input is SpriteAtlasSpec {
  if (!input || typeof input !== 'object') throw new Error('Atlas metadata must be an object.');
  const atlas = input as Record<string, unknown>;
  if (atlas.schemaVersion !== 'robot-world.robot-atlas/v1-prototype') throw new Error('Unsupported atlas schema.');
  if (typeof atlas.sourceSha256 !== 'string' || !HASH.test(atlas.sourceSha256) || typeof atlas.imageSha256 !== 'string' || !HASH.test(atlas.imageSha256)) throw new Error('Atlas hashes are invalid.');
  if (!Number.isInteger(atlas.imageWidth) || !Number.isInteger(atlas.imageHeight) || Number(atlas.imageWidth) < 1 || Number(atlas.imageWidth) > 2048 || Number(atlas.imageHeight) < 1 || Number(atlas.imageHeight) > 2048) throw new Error('Atlas dimensions are invalid.');
  if (!Array.isArray(atlas.frames) || atlas.frames.length < 1 || atlas.frames.length > 128) throw new Error('Atlas frame count is invalid.');
  const names = new Set<string>();
  for (const frame of atlas.frames) {
    if (!frame || typeof frame !== 'object') throw new Error('Atlas frame is invalid.');
    const entry = frame as Record<string, unknown>;
    if (typeof entry.name !== 'string' || names.has(entry.name)) throw new Error('Atlas frame names must be unique.');
    names.add(entry.name);
    const rect = entry.rect as Record<string, unknown>;
    const foot = entry.foot as Record<string, unknown>;
    if (!rect || !foot || !['idle', 'walk', 'enable', 'shutdown'].includes(String(entry.group))) throw new Error('Atlas frame group is invalid.');
    if (![rect.x, rect.y, rect.w, rect.h].every(value => Number.isInteger(value) && Number(value) > 0) || Number(rect.x) + Number(rect.w) > Number(atlas.imageWidth) || Number(rect.y) + Number(rect.h) > Number(atlas.imageHeight)) throw new Error('Atlas frame rectangle is invalid.');
    if (![foot.x, foot.y].every(value => Number.isInteger(value) && Number(value) >= 0) || Number(foot.x) >= Number(rect.w) || Number(foot.y) >= Number(rect.h)) throw new Error('Atlas foot anchor is invalid.');
  }
  const animations = atlas.animations as Record<string, unknown>;
  if (!animations || !GROUPS.every(group => Array.isArray(animations[group]) && animations[group].length > 0 && animations[group].length <= 64 && (animations[group] as unknown[]).every(name => typeof name === 'string' && names.has(name)))) throw new Error('Atlas animation groups are invalid.');
  const fps = atlas.fps as Record<string, unknown>;
  if (!fps || !GROUPS.every(group => typeof fps[group] === 'number' && Number(fps[group]) > 0)) throw new Error('Atlas frame rates are invalid.');
  if (typeof atlas.nominalHeight !== 'number' || atlas.nominalHeight <= 0 || typeof atlas.referenceHeightPx !== 'number' || atlas.referenceHeightPx <= 0) throw new Error('Atlas scale reference is invalid.');
}
