interface FocusPortal {
  id: string;
  source: string;
  target: string;
  type: string;
  description: string;
  direction: string;
  sourceRef: string | null;
  sourceRelation: string | null;
  presentationRelation: string;
  authorityEffect: string | null;
  evidenceRefs: string[];
}

interface KnowledgeFocusPortalsProps {
  mode: "tour" | "focus";
  portals: FocusPortal[];
  history: string[];
  nodeName: (nodeId: string) => string;
  onPivot: (portal: FocusPortal) => void;
  onBack: () => void;
}

const arrow = (direction: string) =>
  direction === "backward" ? "←" : direction === "bidirectional" ? "↔" : "→";

export default function KnowledgeFocusPortals({
  mode,
  portals,
  history,
  nodeName,
  onPivot,
  onBack,
}: KnowledgeFocusPortalsProps) {
  return (
    <section
      className="absolute left-3 right-3 bottom-3 z-10 max-h-[38%] overflow-auto rounded-lg border border-border-medium bg-surface/95 p-3 shadow-xl backdrop-blur motion-reduce:transition-none"
      aria-label={`${mode === "tour" ? "Tour" : "Focus"} scene portals`}
      data-testid="knowledge-focus-portals"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-accent">
            {mode === "tour" ? "Tour scene" : "Focus scene"}
          </div>
          <div className="text-xs text-text-muted">
            {portals.length} labeled boundary portal{portals.length === 1 ? "" : "s"}
          </div>
        </div>
        {history.length > 0 && (
          <button
            type="button"
            onClick={onBack}
            className="rounded border border-border-medium px-2.5 py-1 text-xs text-text-secondary outline-offset-2 hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent forced-colors:border-[ButtonText]"
          >
            ← Back to {nodeName(history[history.length - 1])}
          </button>
        )}
      </div>

      {history.length > 0 && (
        <div className="mb-2 text-[11px] text-text-muted" aria-label="Focus breadcrumb">
          {history.map(nodeName).join(" › ")}
        </div>
      )}

      {portals.length === 0 ? (
        <p className="text-xs text-text-muted">No relations leave this scene.</p>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {portals.map((portal) => (
            <button
              key={portal.id}
              type="button"
              onClick={() => onPivot(portal)}
              className="rounded-md border border-border-subtle bg-elevated/80 p-2 text-left outline-offset-2 transition-colors hover:border-accent/60 hover:bg-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent motion-reduce:transition-none forced-colors:border-[ButtonText]"
              data-source={portal.source}
              data-target={portal.target}
              data-presentation-relation={portal.presentationRelation}
              data-source-relation={portal.sourceRelation ?? ""}
              data-authority-effect={portal.authorityEffect ?? "unavailable"}
            >
              <span className="block text-xs font-medium text-text-primary">
                {nodeName(portal.source)} —{portal.presentationRelation} {arrow(portal.direction)}{" "}
                {nodeName(portal.target)}
              </span>
              <span className="mt-1 block text-[10px] text-text-muted">
                original: {(portal.sourceRelation ?? portal.description) || "unavailable"}
                {" · "}direction: {portal.direction}
                {" · "}authority: {portal.authorityEffect ?? "unavailable"}
              </span>
              {portal.evidenceRefs.length > 0 && (
                <span className="mt-1 block truncate text-[10px] text-text-muted">
                  evidence: {portal.evidenceRefs.join(", ")}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
