const defaultArePublicOrigin = 'https://are.keld.studio/';

export function normalizeArePublicOrigin(value: string | undefined): string {
  let origin: URL;
  try {
    origin = new URL(value || defaultArePublicOrigin);
  } catch {
    throw new Error('VITE_ARE_PUBLIC_ORIGIN must be an absolute HTTPS origin');
  }
  if (
    origin.protocol !== 'https:' ||
    !origin.hostname ||
    origin.username ||
    origin.password ||
    origin.port ||
    origin.pathname !== '/' ||
    origin.search ||
    origin.hash
  ) throw new Error('VITE_ARE_PUBLIC_ORIGIN must be an absolute HTTPS origin');
  return `${origin.origin}/`;
}

export const ARE_PUBLIC_ORIGIN = normalizeArePublicOrigin(import.meta.env?.VITE_ARE_PUBLIC_ORIGIN);
