// @ts-nocheck
import tour from "./tours/poker-o13.json";

export default function PokerTour({
  open,
  step,
  onStep,
  onFocus,
  onClose,
  onOpenReceipts,
}) {
  if (!open) return null;
  const current = tour.steps[step];
  const move = (next) => {
    const bounded = Math.max(0, Math.min(tour.steps.length - 1, next));
    onStep(bounded);
    const target = tour.steps[bounded];
    target.focus === "receipt" ? onOpenReceipts() : onFocus(target.focus, target.view);
  };
  return (
    <section className="oew-tour" aria-live="polite">
      <div>
        <span className="oew-kicker">Poker walkthrough · {step + 1}/{tour.steps.length}</span>
        <h3>{current.title}</h3>
        <p>{current.body}</p>
      </div>
      <div className="oew-tour-actions">
        <button disabled={step === 0} onClick={() => move(step - 1)}>Back</button>
        {step < tour.steps.length - 1 ? (
          <button className="is-primary" onClick={() => move(step + 1)}>Next evidence</button>
        ) : (
          <button className="is-primary" onClick={onClose}>Finish</button>
        )}
        <button aria-label="Close tour" className="oew-tour-close" onClick={onClose}>×</button>
      </div>
    </section>
  );
}
