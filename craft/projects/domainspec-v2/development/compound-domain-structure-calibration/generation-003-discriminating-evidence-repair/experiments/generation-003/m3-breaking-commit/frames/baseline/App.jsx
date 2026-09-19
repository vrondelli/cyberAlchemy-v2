import React, { useState } from "react";
import { createRoot } from "react-dom/client";

import { SCREEN_REGISTRY, SESSION_FIXTURES, guardStep, nextStep, previousStep, structuredState } from "./model.mjs";
import vectorsDocument from "./vectors.json";

const vectorId = new URLSearchParams(window.location.search).get("vector");
const vector = vectorsDocument.vectors.find((item) => item.vector_id === vectorId);
if (!vector) throw new TypeError(`unknown baseline vector: ${vectorId}`);

window.__CDSC_REACT_VERSION__ = React.version;

function App() {
  const input = vector.input;
  const [step, setStep] = useState(input.current_step);
  const [navigation, setNavigation] = useState({ guardAllowed: null, noticePresent: false, requestedStep: null });
  const mounted = input.mounted;
  const state = structuredState({ mounted, step, ...navigation });

  function go(requested) {
    const session = SESSION_FIXTURES[input.session_fixture];
    if (!session) throw new TypeError(`missing session fixture: ${input.session_fixture}`);
    const result = guardStep(requested, session);
    setStep(result.step);
    setNavigation({ guardAllowed: result.allowed, noticePresent: !result.allowed, requestedStep: requested });
  }

  const actions = {
    navigate: () => go(input.requested_step),
    next: () => go(nextStep(step)),
    back: () => go(previousStep(step)),
  };

  if (!mounted) {
    return <main data-route-tree="unmounted"><StructuredState value={state} /></main>;
  }

  const selected = SCREEN_REGISTRY[step];
  return (
    <main data-route-tree="mounted" data-vector-id={vector.vector_id}>
      <header>
        <p data-requested-step>{state.requested_step ?? "none"}</p>
        <p data-committed-step>{state.committed_step}</p>
        <p data-guard-allowed>{String(state.guard_allowed)}</p>
      </header>
      {state.notice_present && <aside role="alert" data-guard-notice>Etapa protegida pela jornada Savvy</aside>}
      <section data-rendered-child={selected.rendered_child_id}>
        <h1>{selected.rendered_child_id}</h1>
        {selected.interaction_ports.map((port) => (
          <button key={port} type="button" data-action={port === "onNext" ? "next" : "back"} onClick={port === "onNext" ? actions.next : actions.back}>
            {port}
          </button>
        ))}
        {input.action === "navigate" && <button type="button" data-action="navigate" onClick={actions.navigate}>navigate</button>}
      </section>
      <StructuredState value={state} />
    </main>
  );
}

function StructuredState({ value }) {
  return <pre data-structured-state={JSON.stringify(value)}>{JSON.stringify(value)}</pre>;
}

createRoot(document.getElementById("root")).render(<App />);
