import { defaultValueCtx, Editor, prosePluginsCtx, rootAttrsCtx, rootCtx, serializerCtx } from "@milkdown/core";
import { history } from "@milkdown/plugin-history";
import { Plugin } from "@milkdown/prose/state";
import { commonmark } from "@milkdown/preset-commonmark";
import { useEffect, useRef, useState } from "react";

interface MilkdownEditorProps {
  initialMarkdown: string;
  onMarkdownChange: (markdown: string) => void;
  onSettlingChange: (settling: boolean) => void;
  describedBy: string;
}

export function MilkdownEditor({ initialMarkdown, onMarkdownChange, onSettlingChange, describedBy }: MilkdownEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onMarkdownChange);
  const onSettlingRef = useRef(onSettlingChange);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  onChangeRef.current = onMarkdownChange;
  onSettlingRef.current = onSettlingChange;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let disposed = false;
    let projectionScheduled = false;
    let pendingMarkdown = initialMarkdown;
    let inputStartedAt: number | null = null;
    let inputToUpdateMs: number | null = null;
    let serializationMs: number | null = null;
    const projectMarkdown = () => {
      if (!projectionScheduled) return;
      projectionScheduled = false;
      if (disposed) return;
      onChangeRef.current(pendingMarkdown);
      onSettlingRef.current(false);
      if (inputStartedAt !== null) {
        const duration = performance.now() - inputStartedAt;
        const samples = (window as Window & { __CA2_PERFORMANCE_SAMPLES__?: Array<Record<string, unknown>> }).__CA2_PERFORMANCE_SAMPLES__ ?? [];
        samples.push({
          name: "essays.editor-input-to-projection",
          durationMs: duration,
          recordedAtUnixMs: Date.now(),
          detail: { inputToUpdateMs, serializationMs, completion: "markdown-published" },
        });
        if (samples.length > 256) samples.splice(0, samples.length - 256);
        (window as Window & { __CA2_PERFORMANCE_SAMPLES__?: Array<Record<string, unknown>> }).__CA2_PERFORMANCE_SAMPLES__ = samples;
        inputStartedAt = null;
      }
    };
    const editor = Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, initialMarkdown);
        ctx.set(rootAttrsCtx, {
          "aria-label": "Essay Markdown editor",
          "aria-describedby": describedBy,
          "data-testid": "milkdown-editor",
        });
        ctx.update(prosePluginsCtx, (plugins) => plugins.concat(new Plugin({
          view: () => ({
            update: (view, previousState) => {
              if (view.state.doc.eq(previousState.doc)) return;
              const serializationStartedAt = performance.now();
              inputToUpdateMs = inputStartedAt === null ? null : serializationStartedAt - inputStartedAt;
              pendingMarkdown = ctx.get(serializerCtx)(view.state.doc);
              serializationMs = performance.now() - serializationStartedAt;
              if (!projectionScheduled) {
                projectionScheduled = true;
                if (inputStartedAt !== null) projectMarkdown();
                else queueMicrotask(projectMarkdown);
              }
            },
          }),
        })));
      })
      .use(commonmark)
      .use(history);

    const markSettling = () => {
      inputStartedAt = performance.now();
      if (projectionScheduled) projectMarkdown();
    };
    // DOM observers can publish before even the input capture phase. Start before
    // the browser edits the DOM, and replace any cancelled input's old timestamp.
    root.addEventListener("beforeinput", markSettling, true);
    void editor
      .create()
      .then(() => {
        if (!disposed) setStatus("ready");
      })
      .catch(() => {
        if (!disposed) setStatus("failed");
      });

    return () => {
      disposed = true;
      root.removeEventListener("beforeinput", markSettling, true);
      onSettlingRef.current(false);
      void editor.destroy();
    };
    // A deliberate remount is controlled by the parent key after an accepted revision.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="editor-adapter" data-editor-status={status}>
      {status === "loading" && <p className="editor-status">Preparing the writing surface…</p>}
      {status === "failed" && <p className="editor-status error">The editor could not start. Reload the local studio.</p>}
      <div ref={rootRef} />
    </div>
  );
}
