// @ts-nocheck
import "./trust.css";

export function deriveTrustState(receipt) {
  const verified =
    receipt?.schema_version === "oew.adapter-receipt.v1" &&
    receipt?.result === "pass" &&
    receipt?.state === "receipt-complete" &&
    receipt?.authority_effect === "none" &&
    receipt?.protected_source_check?.read_only === true &&
    receipt?.determinism?.byte_identical === true;
  return {
    verified,
    source: verified ? "verified" : "blocked",
    adapter: verified ? "verified" : "blocked",
    candidate: true,
    authority: "none",
    localOnly: true,
    upstreamCommit: receipt?.upstream_contract?.commit ?? "unknown",
    runId: receipt?.source_run?.run_id ?? "unknown",
  };
}

export default function TrustRail({receipt, onOpenReceipts}) {
  const trust = deriveTrustState(receipt);
  if (!trust.verified) {
    return (
      <section className="oew-trust-block" role="alert">
        <strong>Evidence blocked</strong>
        <span>The adapter receipt is missing, failed, or incomplete.</span>
      </section>
    );
  }
  return (
    <header className="oew-trust-rail" aria-label="Evidence trust status">
      <div className="oew-brand">
        <span aria-hidden="true" className="oew-brand-mark">◇</span>
        <span>
          <strong>Ontology Evidence Workbench</strong>
          <small>Poker O13 · verified local candidate</small>
        </span>
      </div>
      <div className="oew-trust-pills">
        <span className="oew-pill oew-pill--verified">SOURCE ✓</span>
        <span className="oew-pill oew-pill--verified">ADAPTER ✓</span>
        <span className="oew-pill oew-pill--candidate">CANDIDATE ONLY</span>
        <span className="oew-pill oew-pill--authority">AUTHORITY: NONE</span>
      </div>
      <button className="oew-receipt-button" onClick={onOpenReceipts}>
        Receipts
        <span aria-hidden="true">↗</span>
      </button>
    </header>
  );
}
