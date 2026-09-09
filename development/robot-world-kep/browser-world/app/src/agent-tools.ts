import type { Playback } from './playback';

/** Optional page inspection; no simulation actions or external connections. */
export function registerInspectionTool(playback: Playback): () => void {
  type Context = { registerTool(tool: Record<string, unknown>, options: { signal: AbortSignal }): void | Promise<void> };
  const context = (document as Document & { modelContext?: Context }).modelContext;
  if (!context?.registerTool) return () => {};
  const lifecycle = new AbortController();
  try {
    void Promise.resolve(context.registerTool({
      name: 'read_colony_snapshot', title: 'Inspect recorded colony',
      description: 'Read the currently selected recorded frame, its robots and source revisions. This does not run a simulation or change playback.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input: unknown) {
        if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) throw new Error('Expected an empty object.');
        return { mode: playback.session.mode, cursor: playback.getSnapshot(), frame: structuredClone(playback.frame), sourceReplaySha256: playback.session.sourceReplaySha256 };
      },
    }, { signal: lifecycle.signal })).catch(error => { console.warn('Page inspection tool unavailable', error); });
  } catch (error) { console.warn('Page inspection tool unavailable', error); }
  return () => lifecycle.abort();
}
