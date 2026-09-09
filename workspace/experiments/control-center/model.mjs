export const layouts = {
  writing: { label: "Writing", primary: "essay", reason: "Keep the essay in focus, with research and concepts close by." },
  ontology: { label: "Ontology focus", primary: "ontology", reason: "Give the relationships room to be understood. Keep the conversation compact." },
  orchestration: { label: "Orchestration focus", primary: "orchestration", reason: "Follow delegated work and inspect the stage that needs you." },
};
export const surfaces = {
  essay: { id: "essay", workId: "essay-continuity", label: "The continuity of work", kind: "artifact", minWidth: 360 },
  preview: { id: "preview", workId: "essay-continuity", label: "Essay preview", kind: "artifact", minWidth: 360 },
  ontology: { id: "ontology", workId: "ontology-workspace", label: "Workspace ontology", kind: "artifact", minWidth: 360 },
  orchestration: { id: "orchestration", workId: "research-01", label: "Continuity research", kind: "assignment", minWidth: 320 },
  task: { id: "task", workId: "task-control-center", label: "Control-center task", kind: "task", minWidth: 0 },
};
export const initialEssay = "The continuity of work\n\nA workspace should carry the relationships between our intentions, our conversations, and the things we make.\n\nWhen we move from an essay into a graph, the question should travel with us. When an agent returns a result, its purpose should still be visible.\n\nOne conversation, many perspectives\n\nThe conversation provides a stable point of return. The essay gets room to read; the ontology gets room to explore; the orchestration view tells us where our attention is needed.\n\nGood adaptation preserves our place. It makes room without making us start again.";
export function initialState() {
  return {
    layout: "writing", revision: 0, primary: "essay", pin: null, history: [], proposal: null,
    target: { ...surfaces.essay, revision: 1 }, context: null, draft: "", essay: initialEssay,
    availability: { essay: "fresh", ontology: "fresh", orchestration: "fresh" },
    selection: null, anchors: { essay: 0, ontology: 0, orchestration: 0 },
    anchorMissing: false, expanded: false, requests: [], replies: [], attention: {},
    saved: null, split: 64, returnSurface: null, error: "",
  };
}
export function proposalProblem(s) {
  if (!s.proposal) return "No layout is proposed.";
  if (s.proposal.base !== s.revision) return "This proposal is stale. Preview it again against the current layout.";
  if (s.pin && s.pin !== layouts[s.proposal.layout].primary) return "This layout conflicts with your pinned primary surface. Unpin it to apply.";
  return "";
}
export function visibleSurfaces(s, width) {
  return width < 760 ? [s.primary] : [s.primary, ...["essay", "ontology", "orchestration"].filter(id => id !== s.primary)];
}
export function reduce(state, command) {
  const s = structuredClone(state);
  s.error = "";
  switch (command.type) {
    case "draft": s.draft = command.text; break;
    case "edit": s.essay = command.text; break;
    case "select":
      if (!surfaces[command.id] || command.id === "task") break;
      s.primary = command.id === "preview" ? "essay" : command.id;
      s.revision++;
      if (s.pin) s.pin = s.primary; // Explicit user move updates the visible pin.
      break;
    case "target":
      if (!surfaces[command.id]) { s.error = "Choose an available target."; break; }
      s.target = { ...surfaces[command.id], revision: 1 };
      break;
    case "context": s.context = command.context; break;
    case "submit":
      if (!s.draft.trim()) break;
      if (!s.target || (s.availability[s.target.id] && s.availability[s.target.id] !== "fresh")) {
        s.error = "Target unavailable or stale. Select a current target before sending."; break;
      }
      s.requests.push({ id: "request-" + (s.requests.length + 1), text: s.draft, target: structuredClone(s.target), context: structuredClone(s.context) });
      s.replies.push("Preview response · Your request is attached to " + s.target.label + ". Open a layout suggestion to make room for the next step.");
      s.draft = "";
      break;
    case "availability":
      s.availability[command.id] = command.value;
      if (command.value !== "fresh") for (const a of Object.values(s.attention)) if (a.surface === command.id) a.state = "stale";
      break;
    case "propose":
      if (layouts[command.layout]) s.proposal = { layout: command.layout, base: s.revision };
      break;
    case "dismiss": s.proposal = null; break;
    case "apply": {
      const problem = proposalProblem(s);
      if (problem) { s.error = problem; break; }
      s.history.push({ layout: s.layout, primary: s.primary, split: s.split });
      s.layout = s.proposal.layout; s.primary = layouts[s.layout].primary; s.revision++;
      s.proposal = null; s.expanded = false;
      break;
    }
    case "restore": {
      const previous = s.history.at(-1);
      if (!previous) break;
      if (s.pin && previous.primary !== s.pin) { s.error = "Unpin the primary surface before restoring this layout."; break; }
      s.history.pop(); Object.assign(s, previous); s.revision++; break;
    }
    case "pin": s.pin = s.pin ? null : s.primary; break;
    case "expand": s.expanded = !s.expanded; break;
    case "resize": s.split = Math.max(45, Math.min(78, Number(command.value) || 64)); s.revision++; break;
    case "save": s.saved = { layout: s.layout, primary: s.primary, split: s.split }; break;
    case "load":
      if (!s.saved) break;
      if (s.pin && s.saved.primary !== s.pin) { s.error = "The saved layout conflicts with your pin."; break; }
      s.history.push({ layout: s.layout, primary: s.primary, split: s.split });
      Object.assign(s, s.saved); s.revision++; break;
    case "anchor": s.anchors[command.id] = command.value; break;
    case "selection": s.selection = command.value; break;
    case "invalidate-anchor":
      s.anchors.essay = 0; s.selection = null; s.anchorMissing = true;
      s.error = "The reading anchor no longer exists. Returned to the start; your draft is preserved."; break;
    case "attention": {
      const existing = s.attention[command.id];
      s.attention[command.id] = { id: command.id, surface: "orchestration", reason: command.reason,
        state: existing?.state === "acknowledged" ? "acknowledged" : "active" };
      break;
    }
    case "acknowledge": if (s.attention[command.id]) s.attention[command.id].state = "acknowledged"; break;
    case "resolve": if (s.attention[command.id]) s.attention[command.id].state = "resolved"; break;
    case "open-attention":
      s.returnSurface = s.primary; s.primary = "orchestration"; s.revision++; if (s.pin) s.pin = s.primary; break;
    case "return":
      if (s.returnSurface) { s.primary = s.returnSurface; s.returnSurface = null; s.revision++; if (s.pin) s.pin = s.primary; } break;
    case "reset": return initialState();
    default: throw new Error("Unknown command: " + command.type);
  }
  return s;
}
