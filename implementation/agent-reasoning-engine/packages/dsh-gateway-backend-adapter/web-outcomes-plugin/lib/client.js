window.__ModuleLoader__.load({
  id: "@cyberalchemy/are-dsh-web-outcomes",
  factory(require) {
    const React = require("react");
    const STATUS = new Set(["accepted", "uncertain", "recovered"]);
    const TERMINAL = new Set(["completed", "interrupted", "failed"]);

    function latestOutcome(value) {
      if (!Array.isArray(value)) return null;
      const item = value.at(-1);
      if (!item || typeof item !== "object"
        || !STATUS.has(item.disposition)
        || item.terminal !== null && !TERMINAL.has(item.terminal)) return null;
      return item;
    }

    function ArePromptOutcome({useProjection}) {
      const outcome = latestOutcome(useProjection("arePromptOutcomes"));
      if (outcome === null) return null;
      const label = outcome.terminal ?? outcome.disposition;
      const concern = outcome.disposition === "uncertain" || outcome.terminal === "failed";
      return React.createElement("span", {
        role: "status",
        "aria-label": `ARE prompt ${label}`,
        title: `ARE prompt: ${label}`,
        "data-are-prompt-outcome": label,
        style: {
          display: "inline-flex", alignItems: "center", minHeight: "24px",
          padding: "0 8px", borderRadius: "12px", fontSize: "12px",
          lineHeight: "18px", whiteSpace: "nowrap",
          color: concern ? "var(--dsw-alias-state-warning-primary, #a45c00)"
            : "var(--dsw-alias-label-secondary, #666)",
          border: "1px solid var(--dsw-alias-border-l4, #ddd)"
        }
      }, `ARE · ${label}`);
    }

    function apply(ctx) {
      ctx.slots.inject("conversation.session.header.utilities", () => ctx.slots.register({
        name: "conversation.session.header.utilities",
        id: "are-prompt-outcome",
        order: 20
      }, ArePromptOutcome));
    }

    return {apply, inject: ["slots"]};
  }
});
