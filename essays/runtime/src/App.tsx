import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { LocalStorageWorkspaceRepository } from "./adapters/local-storage-repository";
import { normalizeMarkdown, type EssaysSavedDraftObservation, type EssaysStagedBuffer } from "./domain/markdown";
import { EssaysProblem, type EssayExportManifest, type EssayWorkspace, type ReviewComment } from "./domain/model";
import { EssaysRuntime } from "./domain/runtime";

const DEFAULT_WORKSPACE_ID = "local-essay-workspace";
const STAGES = ["intent", "plan", "draft", "review", "validated"] as const;
const MilkdownEditor = lazy(() => import("./adapters/milkdown-editor").then((module) => ({ default: module.MilkdownEditor })));

export interface EssaysAppProps {
  embedded?: boolean;
  onWorkspaceChange?: (workspace: EssayWorkspace | null) => void;
  stagedBuffer?: EssaysStagedBuffer | null;
  onSavedDraftObservation?: (observation: EssaysSavedDraftObservation) => void;
}

export function selectEditorInitialMarkdown(input: {
  draftMarkdown: string;
  workspaceId: string;
  hasCompositionPlan: boolean;
  stagedBuffer: EssaysStagedBuffer | null;
  appliedStageEpoch: number | null;
}): string {
  const staged = input.stagedBuffer;
  return staged
    && staged.workspaceId === input.workspaceId
    && input.hasCompositionPlan
    && input.appliedStageEpoch !== staged.stageEpoch
    ? staged.markdown
    : input.draftMarkdown;
}

export function countMarkdownWords(markdown: string): number {
  return markdown.split(/\s+/).filter(Boolean).length;
}

function useDebouncedWordCount(markdown: string, delayMs = 160): number {
  const [wordCount, setWordCount] = useState(() => countMarkdownWords(markdown));
  useEffect(() => {
    const timeout = window.setTimeout(() => setWordCount(countMarkdownWords(markdown)), delayMs);
    return () => window.clearTimeout(timeout);
  }, [delayMs, markdown]);
  return wordCount;
}

function messageFor(error: unknown): string {
  if (error instanceof EssaysProblem) return error.message;
  if (error instanceof Error) return error.message;
  return "Something unexpected happened in the local studio.";
}

function downloadManifest(manifest: EssayExportManifest): void {
  const blob = new Blob([`${JSON.stringify(manifest, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${manifest.workspaceId}-revision-${manifest.essayRevision}.reviewable.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function StageRail({ workspace }: { workspace: EssayWorkspace }) {
  const active = STAGES.indexOf(workspace.lifecycleStage);
  return (
    <ol className="stage-rail" aria-label="Essay lifecycle">
      {STAGES.map((stage, index) => (
        <li key={stage} className={index < active ? "complete" : index === active ? "active" : "pending"}>
          <span aria-hidden="true">{index < active ? "✓" : String(index + 1).padStart(2, "0")}</span>
          <span>{stage}</span>
        </li>
      ))}
    </ol>
  );
}

function Setup({ onCreated, embedded }: { onCreated: (workspace: EssayWorkspace) => void; embedded: boolean }) {
  const [title, setTitle] = useState("Ontology as a Product Practice");
  const [writer, setWriter] = useState("Writer");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const repository = new LocalStorageWorkspaceRepository(window.localStorage);
      const runtime = new EssaysRuntime(repository);
      let workspace = await runtime.createEssayWorkspace({
        workspaceId: DEFAULT_WORKSPACE_ID,
        title,
        writer: { writerId: "local-writer", displayName: writer },
      });
      workspace = await runtime.startEssay(workspace.workspaceId, workspace.currentRevision);
      onCreated(workspace);
    } catch (cause) {
      setError(messageFor(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={`essays-root setup-shell ${embedded ? "essays-embedded" : ""}`}>
      <section className="setup-card" aria-labelledby="setup-title">
        <p className="eyebrow">CyberAlchemy · Essays</p>
        <h1 id="setup-title">Begin with intent, not a blank page.</h1>
        <p className="setup-copy">
          A local writing studio where plans advise, writers decide, and every unresolved question remains visible.
        </p>
        <form onSubmit={submit} className="setup-form">
          <label>
            Essay working title
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label>
            Writer name
            <input value={writer} onChange={(event) => setWriter(event.target.value)} required />
          </label>
          <button className="primary" disabled={busy}>{busy ? "Creating…" : "Create local studio"}</button>
          {error && <p className="form-error" role="alert">{error}</p>}
        </form>
        <p className="local-note">Saved only in this browser. No account, network, or publication connection.</p>
      </section>
    </main>
  );
}

interface IntentFormProps {
  workspace: EssayWorkspace;
  onSubmit: (value: { objective: string; audience: string; tone: string; constraints: string[] }) => Promise<void>;
  busy: boolean;
}

function IntentForm({ workspace, onSubmit, busy }: IntentFormProps) {
  const [objective, setObjective] = useState(workspace.textIntent?.objective ?? "Explain how ontology engineering changes product-making decisions");
  const [audience, setAudience] = useState(workspace.textIntent?.audience ?? "Engineers and product leaders working with DDD");
  const [tone, setTone] = useState(workspace.textIntent?.tone ?? "technical, descriptive, and narrative");
  const [constraints, setConstraints] = useState((workspace.textIntent?.constraints ?? ["Use a believable bug-ticket debugging story", "Preserve uncertainty and fault evidence"]).join("\n"));

  return (
    <form
      className="intent-form"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit({
          objective,
          audience,
          tone,
          constraints: constraints.split("\n").map((item) => item.trim()).filter(Boolean),
        });
      }}
    >
      <label>Objective<textarea value={objective} onChange={(event) => setObjective(event.target.value)} rows={3} required /></label>
      <label>Audience<input value={audience} onChange={(event) => setAudience(event.target.value)} required /></label>
      <label>Tone<input value={tone} onChange={(event) => setTone(event.target.value)} required /></label>
      <label>Constraints <span>one per line</span><textarea value={constraints} onChange={(event) => setConstraints(event.target.value)} rows={4} /></label>
      <button className="primary" disabled={busy}>{workspace.textIntent ? "Accept revised intent" : "Accept intent"}</button>
    </form>
  );
}

function ReviewCard({ comment, onResolve, busy }: { comment: ReviewComment; onResolve: (comment: ReviewComment, disposition: "accepted" | "dismissed") => void; busy: boolean }) {
  return (
    <article
      className={`review-card ${comment.priority}`}
      aria-labelledby={`${comment.commentId}-title`}
      data-block-id={comment.blockId}
    >
      <div className="review-meta">
        <span>{comment.priority}</span>
        <span>{comment.issueType}</span>
      </div>
      <h3 id={`${comment.commentId}-title`}>{comment.comment}</h3>
      <p className="block-reference">Block {comment.blockId} · {comment.requestedChangeMode}</p>
      {comment.disposition === "open" ? (
        <div className="review-actions">
          <button disabled={busy} onClick={() => onResolve(comment, "accepted")}>Mark addressed</button>
          <button disabled={busy} onClick={() => onResolve(comment, "dismissed")}>Dismiss with judgment</button>
        </div>
      ) : (
        <p className="resolved-note">{comment.disposition}: {comment.dispositionNote}</p>
      )}
    </article>
  );
}

export default function App({ embedded = false, onWorkspaceChange, stagedBuffer = null, onSavedDraftObservation }: EssaysAppProps = {}) {
  const runtime = useMemo(
    () => new EssaysRuntime(new LocalStorageWorkspaceRepository(window.localStorage)),
    [],
  );
  const [workspace, setWorkspace] = useState<EssayWorkspace | null | undefined>(undefined);
  const [draftMarkdown, setDraftMarkdown] = useState("");
  const [editorSettling, setEditorSettling] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const appliedStageEpoch = useRef<number | null>(null);
  const wordCount = useDebouncedWordCount(draftMarkdown);

  useEffect(() => {
    void runtime.openEssayWorkspace(DEFAULT_WORKSPACE_ID).then((loaded) => {
      setWorkspace(loaded);
      setDraftMarkdown(loaded?.essay?.markdown ?? "");
    }).catch((cause) => {
      setError(messageFor(cause));
      setWorkspace(null);
    });
  }, [runtime]);

  useEffect(() => {
    if (workspace !== undefined) onWorkspaceChange?.(workspace);
  }, [onWorkspaceChange, workspace]);

  useEffect(() => {
    if (
      !stagedBuffer
      || workspace?.workspaceId !== stagedBuffer.workspaceId
      || !workspace.compositionPlan
      || appliedStageEpoch.current === stagedBuffer.stageEpoch
    ) return;
    appliedStageEpoch.current = stagedBuffer.stageEpoch;
    setDraftMarkdown(stagedBuffer.markdown);
    setError("");
    setNotice(`Proposal ${stagedBuffer.proposalId} staged in the unsaved editor buffer.`);
  }, [stagedBuffer, workspace?.workspaceId, workspace?.compositionPlan]);

  useEffect(() => {
    if (!workspace?.essay?.revision) return;
    onSavedDraftObservation?.({
      workspaceId: workspace.workspaceId,
      workspaceRevision: workspace.currentRevision,
      essayRevision: workspace.essay.revision,
      canonicalMarkdown: normalizeMarkdown(workspace.essay.markdown),
    });
  }, [onSavedDraftObservation, workspace?.workspaceId, workspace?.currentRevision, workspace?.essay?.revision, workspace?.essay?.markdown]);

  const run = useCallback(async (operation: () => Promise<EssayWorkspace>, success: string) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const updated = await operation();
      setWorkspace(updated);
      setDraftMarkdown(updated.essay?.markdown ?? draftMarkdown);
      setNotice(success);
      return updated;
    } catch (cause) {
      setError(messageFor(cause));
      return null;
    } finally {
      setBusy(false);
    }
  }, [draftMarkdown]);

  if (workspace === undefined) return <main className={`essays-root loading-shell ${embedded ? "essays-embedded" : ""}`}><p>Opening the local studio…</p></main>;
  if (workspace === null) return <Setup embedded={embedded} onCreated={(created) => { setWorkspace(created); setNotice("Local studio created."); }} />;

  const acceptIntent = async (value: { objective: string; audience: string; tone: string; constraints: string[] }) => {
    await run(() => runtime.captureTextIntent({ workspaceId: workspace.workspaceId, expectedRevision: workspace.currentRevision, ...value }), "Intent accepted by the writer.");
  };

  const generatePlan = async () => {
    const updated = await run(
      () => runtime.generateCompositionPlan(workspace.workspaceId, workspace.currentRevision),
      "Local plan generated and accepted by your explicit action.",
    );
    if (updated?.compositionPlan && !updated.essay?.markdown) {
      setDraftMarkdown(`# ${updated.title}\n\n`);
    }
  };

  const resolveComment = (comment: ReviewComment, disposition: "accepted" | "dismissed") => {
    const note = disposition === "accepted"
      ? "Writer confirms the issue has been addressed in the current prose."
      : "Writer explicitly declines this observation for this revision.";
    void run(
      () => runtime.resolveEditorialReview({
        workspaceId: workspace.workspaceId,
        expectedRevision: workspace.currentRevision,
        commentId: comment.commentId,
        disposition,
        dispositionNote: note,
      }),
      "Review disposition recorded; prose was not changed.",
    );
  };

  const exportEssay = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await runtime.exportReviewableEssay(workspace.workspaceId, workspace.currentRevision);
      setWorkspace(result.workspace);
      downloadManifest(result.manifest);
      setNotice("Reviewable package exported locally. It has not been published.");
    } catch (cause) {
      setError(messageFor(cause));
    } finally {
      setBusy(false);
    }
  };

  const plan = workspace.compositionPlan;
  const review = workspace.review;
  const residue = workspace.residue;
  const essay = workspace.essay;
  const editorInitialMarkdown = selectEditorInitialMarkdown({
    draftMarkdown,
    workspaceId: workspace.workspaceId,
    hasCompositionPlan: Boolean(workspace.compositionPlan),
    stagedBuffer,
    appliedStageEpoch: appliedStageEpoch.current,
  });
  return (
    <div className={`essays-root app-shell ${embedded ? "essays-embedded" : ""}`}>
      <header className="topbar">
        <div>
          <p className="eyebrow">CyberAlchemy · Essays</p>
          <h1>{workspace.title}</h1>
        </div>
        <div className="save-state" aria-live="polite">
          <span className="status-dot" aria-hidden="true" />
          Local revision {workspace.currentRevision}
        </div>
      </header>

      <StageRail workspace={workspace} />

      {(notice || error) && (
        <div className={error ? "notice error" : "notice"} role={error ? "alert" : "status"}>
          {error || notice}
        </div>
      )}

      <main className="studio-frame">
        <aside className="intent-panel" aria-labelledby="intent-heading">
          <div className="panel-heading">
            <span className="panel-number">01</span>
            <div><p>Direction</p><h2 id="intent-heading">Text intent</h2></div>
          </div>
          <IntentForm workspace={workspace} onSubmit={acceptIntent} busy={busy} />

          <div className="plan-section">
            <div className="section-label"><span>02</span><h2>Composition plan</h2></div>
            {!workspace.textIntent ? (
              <p className="muted">Accept the intent to make a plan.</p>
            ) : !plan ? (
              <button className="secondary wide" onClick={() => void generatePlan()} disabled={busy}>Generate &amp; accept local plan</button>
            ) : (
              <div className="plan-card">
                <p className="plan-anchor">{plan.narrativeAnchor}</p>
                <ol>{plan.sections.map((section) => <li key={section}>{section}</li>)}</ol>
                <p className="capability-note">Deterministic local guidance informed by Whisper’s lifecycle. No writing agent was invoked.</p>
              </div>
            )}
          </div>
        </aside>

        <section className="editor-panel" aria-labelledby="draft-heading">
          <div className="panel-heading editor-heading">
            <span className="panel-number">03</span>
            <div><p>Authoritative only when saved</p><h2 id="draft-heading">Working draft</h2></div>
            {essay && <span className="essay-revision">Essay r{essay.revision}</span>}
          </div>
          <p id="editor-instructions" className="editor-instructions">
            Write in the editor. Tab enters the writing surface; standard Markdown shortcuts apply. Changes remain a working buffer until you choose Save accepted draft.
          </p>
          {plan ? (
            <>
              <Suspense fallback={<div className="empty-editor"><p>Preparing the writing surface…</p></div>}>
                <MilkdownEditor
                  key={`${essay?.essayId ?? "essay"}-${essay?.revision ?? 0}-${stagedBuffer?.stageEpoch ?? "no-stage"}`}
                  initialMarkdown={editorInitialMarkdown}
                  onMarkdownChange={setDraftMarkdown}
                  onSettlingChange={setEditorSettling}
                  describedBy="editor-instructions"
                />
              </Suspense>
              <div className="editor-footer">
                <span aria-live="polite">{editorSettling ? "Syncing buffer…" : `${wordCount} words`}</span>
                <button
                  className="primary"
                  disabled={busy || editorSettling || !draftMarkdown.trim()}
                  onClick={() => void run(
                    () => runtime.saveDraftRevision({
                      workspaceId: workspace.workspaceId,
                      expectedRevision: workspace.currentRevision,
                      markdown: draftMarkdown,
                    }),
                    "Writer-approved draft revision saved.",
                  )}
                >Save accepted draft</button>
              </div>
            </>
          ) : (
            <div className="empty-editor"><p>The writing surface opens after you accept a composition plan.</p></div>
          )}
        </section>

        <aside className="review-panel" aria-labelledby="review-heading">
          <div className="panel-heading">
            <span className="panel-number">04</span>
            <div><p>Addressable observations</p><h2 id="review-heading">Editorial review</h2></div>
          </div>
          {!essay?.revision ? (
            <p className="muted">Save a draft to open review.</p>
          ) : (
            <button
              className="secondary wide"
              disabled={busy}
              onClick={() => void run(
                () => runtime.openEditorialReview(workspace.workspaceId, workspace.currentRevision),
                "Review opened against the exact current essay revision.",
              )}
            >{review?.status === "stale" ? "Refresh review for this revision" : "Open editorial review"}</button>
          )}

          {review && (
            <div className="review-list" aria-label={`Review ${review.reviewId} for essay revision ${review.reviewedRevision}`}>
              <p className="review-summary">Essay r{review.reviewedRevision} · {review.status} · {review.comments.filter((item) => item.disposition === "open").length} open</p>
              {review.comments.length === 0 ? <p className="clean-review">No deterministic review observations. Validation may still preserve residue.</p> : review.comments.map((comment) => (
                <ReviewCard key={comment.commentId} comment={comment} onResolve={resolveComment} busy={busy} />
              ))}
            </div>
          )}

          <section className="residue-section" aria-labelledby="residue-heading">
            <div className="section-label"><span>05</span><h2 id="residue-heading">Residue &amp; export</h2></div>
            <p className="muted">Validation keeps open uncertainty visible instead of smoothing it away.</p>
            <button
              className="secondary wide"
              disabled={busy || !essay?.revision}
              onClick={() => void run(
                () => runtime.validateEssay(workspace.workspaceId, workspace.currentRevision),
                "Current essay revision validated.",
              )}
            >Validate current revision</button>
            {residue && (
              <ul className="residue-list">
                {residue.items.length === 0 ? <li className="ready">No unresolved residue.</li> : residue.items.map((item) => (
                  <li key={item.itemId} className={item.blocking ? "blocking" : "advisory"}>
                    <span>{item.blocking ? "Block" : "Flag"}</span>{item.message}
                  </li>
                ))}
              </ul>
            )}
            <button
              className="export-button"
              disabled={busy || !essay?.exportEligible}
              onClick={() => void exportEssay()}
            >Export reviewable package</button>
            <p className="publication-note">Local file only · publication effect: none</p>
          </section>
        </aside>
      </main>
    </div>
  );
}
