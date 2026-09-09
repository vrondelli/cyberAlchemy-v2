/** Optional preload work must not compete with control-plane attachment. */
export function scheduleSurfaceWarmup(
  attachment: Promise<unknown>,
  loaders: Array<() => Promise<unknown>>,
  schedule: (task: () => void) => () => void,
): () => void {
  let stopped = false;
  let cancel: (() => void) | undefined;
  let index = 0;
  const next = () => {
    if (stopped || index === loaders.length) return;
    cancel = schedule(() => {
      if (stopped) return;
      const loader = loaders[index++];
      // A failed optional preload must not prevent navigation or later preloads.
      void Promise.resolve().then(loader).catch(() => undefined).then(next);
    });
  };
  void attachment.catch(() => undefined).then(next);
  return () => { stopped = true; cancel?.(); };
}
