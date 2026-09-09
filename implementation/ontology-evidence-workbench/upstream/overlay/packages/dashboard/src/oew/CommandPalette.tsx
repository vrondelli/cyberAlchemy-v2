// @ts-nocheck
import {useEffect, useRef} from "react";
import {KEYBOARD_COMMANDS} from "./keyboard.ts";

export default function CommandPalette({
  open,
  query,
  onQuery,
  results,
  onSelect,
  onClose,
}) {
  const input = useRef(null);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  if (!open) return null;
  return (
    <div className="oew-command-backdrop" onMouseDown={onClose} role="presentation">
      <section
        aria-label="Evidence command palette"
        aria-modal="true"
        className="oew-command"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <label>
          <span className="oew-sr-only">Search evidence</span>
          <input
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search exact evidence, relation, path, diagnostic…"
            ref={input}
            value={query}
          />
          <kbd>esc</kbd>
        </label>
        <div className="oew-command-results">
          {results.slice(0, 8).map((row) => (
            <button key={row.sourceRef} onClick={() => onSelect(row.sourceRef)}>
              <span><strong>{row.sourceRef}</strong><small>{row.sourceKind}</small></span>
              <span>{row.name}</span>
            </button>
          ))}
          {!results.length && <p>No exact evidence matches this query.</p>}
        </div>
        <footer>
          {KEYBOARD_COMMANDS.slice(2).map((item) => (
            <span key={item.command}><kbd>{item.keys.join("+")}</kbd> {item.label}</span>
          ))}
        </footer>
      </section>
    </div>
  );
}
