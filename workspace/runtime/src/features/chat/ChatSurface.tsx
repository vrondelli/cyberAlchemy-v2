import {SourceTaskButton,SourceReturn} from '../runs/SourceTasks';
import {sourceTarget} from '../runs/source-navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { recordPerformanceSample } from "../../performance";
import { chatRequestId, startAreChatControlPlane, subscribeAreChatControlPlane, type AreChatConnection, type AreChatEvent, type AreReasoningReceipt } from "./are-chat-bridge";
import "./chat.css";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  pending?: boolean;
  threadId?: string;
}

interface ApprovalPrompt {
  promptId: string;
  request: Record<string, unknown>;
  decision: Record<string, unknown>;
}

interface ApprovalResolution {
  promptId: string;
  decision: "accept" | "acceptForSession" | "decline";
  mode: "manual" | "automatic";
}

interface UserQuestion {
  header?: string;
  id: string;
  question: string;
  options?: Array<{label: string; description?: string}>;
  isSecret?: boolean;
}

const CHAT_INTENTS = [
  ["understand", "Understand"],
  ["research", "Research"],
  ["define", "Define"],
  ["plan", "Plan"],
  ["implement", "Implement"],
  ["validate", "Validate"],
  ["definition-governance", "Definitions"],
  ["governance", "Governance"],
  ["ontology-query", "Ontology query"],
  ["delegate", "Delegate"],
  ["preview", "Preview"],
  ["publish", "Publish"],
] as const;

type ChatIntent = typeof CHAT_INTENTS[number][0];

export function isNearTranscriptEnd(
  scrollHeight: number,
  scrollTop: number,
  clientHeight: number,
  threshold = 72,
): boolean {
  return scrollHeight - scrollTop - clientHeight <= threshold;
}

export function appendReasoningReceipt(
  current: AreReasoningReceipt[],
  receipt: AreReasoningReceipt,
  limit = 24,
): AreReasoningReceipt[] {
  if (current.some((candidate) => candidate.receiptId === receipt.receiptId)) return current;
  return [...current, receipt].slice(-Math.max(1, limit));
}

export function shouldAutoApprove(event: AreChatEvent, enabled: boolean): boolean {
  return enabled
    && event.type === "approval.requested"
    && typeof event.promptId === "string"
    && event.promptId.length > 0
    && event.permissionDecision?.kind === "permit";
}

function DecisionsPlacement({ target, children }: { target?: HTMLElement | null; children: ReactNode }) {
  return target ? createPortal(children, target) : children;
}

export function ChatSurface({ decisionsTarget,sourceHash="" }: { decisionsTarget?: HTMLElement | null;sourceHash?:string } = {}) {
  const [connection, setConnection] = useState<AreChatConnection | null>(null);
  const [status, setStatus] = useState<"connecting" | "ready" | "busy" | "unavailable" | "error">("connecting");
  const [threadId, setThreadId] = useState<string | null>(null);
  const threadRef=useRef<string|null>(null);
  const [draft, setDraft] = useState("");
  const [intent, setIntent] = useState<ChatIntent>("understand");
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: "boundary",
    role: "system",
    text: "This chat routes through the Agent Reasoning Engine. Repository effects remain gated and exact-digest bound.",
  }]);
  const [approval, setApproval] = useState<ApprovalPrompt | null>(null);
  const [autoApprove, setAutoApprove] = useState(false);
  const [lastApprovalResolution, setLastApprovalResolution] = useState<ApprovalResolution | null>(null);
  const [questions, setQuestions] = useState<{promptId: string; items: UserQuestion[]} | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [continuation, setContinuation] = useState<Record<string, unknown> | null>(null);
  const [preflight, setPreflight] = useState<Record<string, unknown> | null>(null);
  const [reasoningReceipts, setReasoningReceipts] = useState<AreReasoningReceipt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [decisionsOpen, setDecisionsOpen] = useState(false);
  const decisionsToggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (approval || questions || error || preflight?.kind === "block"
      || (Array.isArray(continuation?.proposal_bindings) && continuation.proposal_bindings.length > 0)) {
      setDecisionsOpen(true);
    }
  }, [approval, questions, continuation, error, preflight]);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const streamingMessageRef = useRef<HTMLElement>(null);
  const streamingTextRef = useRef<HTMLParagraphElement>(null);
  const transcriptPinned = useRef(true);
  const pendingDeltas = useRef<Array<{text: string; emittedAtMs: number; receivedAtMs: number}>>([]);
  const deltaFlushScheduled = useRef(false);
  const deltaPaintFrames = useRef<Set<number>>(new Set());
  const connectionRef = useRef<AreChatConnection | null>(null);
  const autoApproveRef = useRef(false);

  const flushDeltas = useCallback(() => {
    deltaFlushScheduled.current = false;
    const batch = pendingDeltas.current.splice(0);
    if (!batch.length) return;
    const streamingMessage = streamingMessageRef.current;
    const streamingText = streamingTextRef.current;
    if (streamingMessage && streamingText) {
      streamingText.textContent += batch.map((item) => item.text).join("");
      streamingMessage.hidden = false;
    }
    const oldest = Math.min(...batch.map((item) => item.emittedAtMs));
    const firstReceived = Math.min(...batch.map((item) => item.receivedAtMs));
    const scrollStartedAt = Date.now();
    if (transcriptPinned.current) {
      const transcript = transcriptRef.current;
      if (transcript) transcript.scrollTop = transcript.scrollHeight;
    }
    // scrollHeight can synchronously flush layout. Count that work as projection,
    // rather than attributing it to waiting for the following animation frame.
    const recordedAt = Date.now();
    const scrollMs = Math.max(0, recordedAt - scrollStartedAt);
    recordPerformanceSample({
      name: "chat.delta-to-projection",
      durationMs: Math.max(0, recordedAt - oldest),
      recordedAtUnixMs: recordedAt,
      detail: {
        deltaCount: batch.length,
        transportMs: Math.max(0, firstReceived - oldest),
        frameWaitMs: Math.max(0, recordedAt - firstReceived),
        scrollMs,
        completion: "synchronous-dom-commit",
      },
    });
    const frame = requestAnimationFrame(() => {
      deltaPaintFrames.current.delete(frame);
      const paintedAt = Date.now();
      recordPerformanceSample({
        name: "chat.delta-to-paint",
        durationMs: Math.max(0, paintedAt - oldest),
        recordedAtUnixMs: paintedAt,
        detail: {
          deltaCount: batch.length,
          transportMs: Math.max(0, firstReceived - oldest),
          projectionMs: Math.max(0, recordedAt - firstReceived),
          scrollMs,
          frameWaitMs: Math.max(0, paintedAt - recordedAt),
          completion: "next-animation-frame-boundary",
        },
      });
    });
    deltaPaintFrames.current.add(frame);
  }, []);

  const onEvent = useCallback((event: AreChatEvent) => {
    if (event.type === "session.ready") {
      threadRef.current=event.threadId??null;
      setThreadId(event.threadId ?? null);
      setStatus("ready");
    } else if (event.type === "reasoning.receipt" && event.receipt?.authorityEffect === "none") {
      setReasoningReceipts((current) => appendReasoningReceipt(current, event.receipt as AreReasoningReceipt));
    } else if (event.type === "assistant.delta" && typeof event.text === "string") {
      pendingDeltas.current.push({text: event.text, emittedAtMs: event.emittedAtMs, receivedAtMs: Date.now()});
      if (!deltaFlushScheduled.current) {
        deltaFlushScheduled.current = true;
        flushDeltas();
      }
    } else if (event.type === "preflight.completed") {
      setPreflight(event.decision ?? null);
    } else if (event.type === "approval.requested" && event.promptId) {
      const pending = {promptId: event.promptId, request: event.request ?? {}, decision: event.decision ?? {}};
      if (shouldAutoApprove(event, autoApproveRef.current) && connectionRef.current) {
        void connectionRef.current.send({
          type: "approval.resolve",
          requestId: chatRequestId("approval-auto"),
          promptId: event.promptId,
          decision: "accept",
          resolutionMode: "automatic",
        }).catch((cause) => {
          setApproval(pending);
          setError(cause instanceof Error ? cause.message : String(cause));
        });
      } else {
        setApproval(pending);
      }
    } else if (event.type === "approval.resolved" && event.promptId && event.approvalDecision && event.resolutionMode) {
      setApproval((current) => current?.promptId === event.promptId ? null : current);
      setLastApprovalResolution({
        promptId: event.promptId,
        decision: event.approvalDecision,
        mode: event.resolutionMode,
      });
    } else if (event.type === "user-input.requested" && event.promptId) {
      const items = Array.isArray(event.params?.questions) ? event.params.questions as UserQuestion[] : [];
      setQuestions({promptId: event.promptId, items});
      setAnswers({});
    } else if (event.type === "continuation.completed") {
      setContinuation(event.decision ?? null);
    } else if (event.type === "turn.completed") {
      const finalize = () => {
        setStatus("ready");
        const completedText = streamingTextRef.current?.textContent ?? "";
        if (completedText) {
          setMessages((current) => [...current, {
            id: chatRequestId("assistant"),
            role: "assistant",
            threadId: threadRef.current??undefined,
            text: completedText,
          }]);
        }
        if (streamingTextRef.current) streamingTextRef.current.textContent = "";
        if (streamingMessageRef.current) streamingMessageRef.current.hidden = true;
      };
      if (deltaPaintFrames.current.size === 0) finalize();
      else {
        // Preserve one presented streaming frame before replacing it with the
        // durable transcript entry when completion follows the delta in a burst.
        const presentationFrame = requestAnimationFrame(() => {
          deltaPaintFrames.current.delete(presentationFrame);
          const finalizeFrame = requestAnimationFrame(() => {
            deltaPaintFrames.current.delete(finalizeFrame);
            finalize();
          });
          deltaPaintFrames.current.add(finalizeFrame);
        });
        deltaPaintFrames.current.add(presentationFrame);
      }
    } else if (event.type === "request.failed") {
      setStatus("error");
      setError(event.error?.message ?? "The ARE bridge rejected the request.");
    } else if (event.type === "bridge.closed") {
      setStatus("unavailable");
      autoApproveRef.current = false;
      setAutoApprove(false);
    }
  }, [flushDeltas]);

  useEffect(() => {
    let disposed = false;
    const unsubscribe = subscribeAreChatControlPlane(onEvent);
    void startAreChatControlPlane().then((active) => {
      if (disposed) return;
      connectionRef.current = active;
      setConnection(active);
    }).catch((cause) => {
      if (!disposed) {
        const message = cause instanceof Error ? cause.message : String(cause);
        const webMode = message === "ARE_CHAT_WEB_MODE";
        setStatus(webMode ? "unavailable" : "error");
        setError(webMode
          ? "Chat requires the Tauri desktop and a host-configured ARE Codex bridge."
          : message);
      }
    });
    return () => {
      disposed = true;
      connectionRef.current = null;
      unsubscribe();
      for (const frame of deltaPaintFrames.current) cancelAnimationFrame(frame);
      deltaPaintFrames.current.clear();
    };
  }, [onEvent]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!connection || !text || status !== "ready") return;
    const requestId = chatRequestId("turn");
    const dispatched = connection.send({
      type: "turn.start",
      requestId,
      text,
      requestContext: {
        objective_kind: intent,
        evidence_refs: ["workspace-chat:intent-selector"],
      },
    });
    setDraft("");
    setError(null);
    setPreflight(null);
    setContinuation(null);
    setStatus("busy");
    setMessages((current) => [...current, {id: requestId, role: "user", text,threadId:threadRef.current??undefined}]);
    transcriptPinned.current = true;
    requestAnimationFrame(() => {
      const transcript = transcriptRef.current;
      if (transcript) transcript.scrollTop = transcript.scrollHeight;
    });
    try {
      await dispatched;
    } catch (cause) {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const resolveApproval = async (
    decision: "accept" | "acceptForSession" | "decline",
    resolutionMode: "manual" | "automatic" = "manual",
  ) => {
    if (!connection || !approval) return;
    const promptId = approval.promptId;
    setApproval(null);
    await connection.send({type: "approval.resolve", requestId: chatRequestId("approval"), promptId, decision, resolutionMode});
  };

  const toggleAutoApprove = () => {
    const enabled = !autoApprove;
    autoApproveRef.current = enabled;
    setAutoApprove(enabled);
    if (enabled && approval) void resolveApproval("accept", "automatic");
  };

  const resolveQuestions = async () => {
    if (!connection || !questions) return;
    const promptId = questions.promptId;
    const payload = Object.fromEntries(questions.items.map((question) => [question.id, {
      answers: question.isSecret ? [] : [answers[question.id] ?? ""].filter(Boolean),
    }]));
    setQuestions(null);
    await connection.send({type: "user-input.resolve", requestId: chatRequestId("answer"), promptId, answers: payload});
  };

  const source=useMemo(()=>sourceTarget(sourceHash),[sourceHash]);
  const selectedMessage=source?.source.kind==='chat'?messages.find(message=>message.threadId===source.source.id&&'message:'+message.id===source.source.selector):undefined;
  const bindings = Array.isArray(continuation?.proposal_bindings)
    ? continuation.proposal_bindings as Array<Record<string, unknown>>
    : [];

  return (
    <main className="chat-surface">
      <header className="chat-header">
        <div><p>Agent Reasoning Engine</p><h1>Work in conversation.</h1></div>
        <button type="button" className="chat-decisions-toggle" ref={decisionsToggleRef}
          aria-expanded={decisionsOpen} aria-controls="are-decisions-panel"
          onClick={() => setDecisionsOpen(open => !open)}>
          {decisionsOpen ? "Close decisions" : "Decisions & receipts"}
          {(approval || questions || error || preflight?.kind === "block" || (Array.isArray(continuation?.proposal_bindings) && continuation.proposal_bindings.length > 0)) && " · Attention"}
        </button>
        <div className={`chat-status chat-status-${status}`}><span />{status}</div>
      </header>
      <div className="chat-boundary"><strong>Governed path</strong><span>Workspace → Tauri → ARE wrapper → Codex app-server</span><code>{threadId ? threadId.slice(0, 18) : "no thread"}</code></div>
      <SourceReturn target={source?.source.kind==="chat"?source:null} selected={selectedMessage?.threadId?{kind:"chat",id:selectedMessage.threadId,selector:"message:"+selectedMessage.id}:null} text={selectedMessage?.text??null}/>
      <div className="chat-layout">
        <section className="chat-conversation" aria-label="ARE Codex conversation">
          <div
            className="chat-transcript"
            tabIndex={0}
            role="region"
            aria-label="Conversation history"
            ref={transcriptRef}
            aria-live="polite"
            onScroll={(event) => {
              const transcript = event.currentTarget;
              transcriptPinned.current = isNearTranscriptEnd(
                transcript.scrollHeight,
                transcript.scrollTop,
                transcript.clientHeight,
              );
            }}
          >
            {messages.map((message) => <article key={message.id} className={`chat-message chat-message-${message.role}${message.pending ? " chat-message-streaming" : ""}`}>
              <span>{message.role}</span><p>{message.text || (message.pending ? "Thinking…" : "")}</p>
              {message.threadId&&!message.pending&&message.role!=="system"&&<SourceTaskButton source={{kind:"chat",id:message.threadId,selector:"message:"+message.id}} text={message.text} label="this message"/>}
            </article>)}
            <article ref={streamingMessageRef} className="chat-message chat-message-assistant chat-message-streaming" hidden>
              <span>assistant</span><p ref={streamingTextRef} />
            </article>
          </div>
          <form className="chat-composer" onSubmit={(event) => void submit(event)}>
            <div className="chat-composer-heading">
              <label htmlFor="are-chat-input">Message the governed Codex session</label>
              <label className="chat-intent" htmlFor="are-chat-intent">
                Intent
                <select
                  id="are-chat-intent"
                  value={intent}
                  disabled={status === "busy" || status === "connecting"}
                  onChange={(event) => setIntent(event.target.value as ChatIntent)}
                >
                  {CHAT_INTENTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            </div>
            <textarea id="are-chat-input" value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} disabled={status !== "ready"} placeholder="Describe the next bounded piece of work…" />
            <div><small>Enter text here; exact effects still require a separate decision.</small><button type="submit" disabled={!draft.trim() || status !== "ready"}>Send</button></div>
          </form>
        </section>
        <DecisionsPlacement target={decisionsTarget}><aside className="chat-decisions" id="are-decisions-panel" data-panel-open={decisionsOpen}
          aria-label="ARE decisions" tabIndex={0} onKeyDown={event => {
            if (event.key === "Escape" && decisionsOpen) {
              event.stopPropagation(); setDecisionsOpen(false); decisionsToggleRef.current?.focus();
            }
          }}>
          <div className="chat-decision-heading">
            <div><p>Live boundary</p><h2>Decisions &amp; residue</h2></div>
            <button
              type="button"
              className={`auto-approve-toggle${autoApprove ? " auto-approve-toggle-enabled" : ""}`}
              role="switch"
              aria-checked={autoApprove}
              disabled={!connection || status === "unavailable"}
              onClick={toggleAutoApprove}
            >
              <span>Auto approve</span><strong>{autoApprove ? "On" : "Off"}</strong>
            </button>
          </div>
          <p className="auto-approve-boundary">Session-only · exact ARE-permitted approvals · user questions and continuations stay manual.</p>
          {lastApprovalResolution && <p className="approval-resolution" role="status">
            {lastApprovalResolution.mode === "automatic" ? "Auto approved" : "Resolved manually"}: {lastApprovalResolution.decision}
          </p>}
          {error && <p className="chat-error" role="alert">{error}</p>}
          {preflight && <section className={`decision-card${preflight.kind === "block" ? " decision-card-blocked" : ""}`}>
            <span>Preflight</span>
            <strong>{preflight.kind === "block" ? "No route selected" : String(preflight.kind ?? "unknown")}</strong>
            {typeof (preflight.selected as Record<string, unknown> | null)?.label === "string" && <p>{String((preflight.selected as Record<string, unknown>).label)}</p>}
            {Array.isArray(preflight.reason_codes) && <ul>{preflight.reason_codes.map((reason) => <li key={String(reason)}>{String(reason)}</li>)}</ul>}
            <code>{String(preflight.decision_digest ?? "no digest")}</code>
            {preflight.kind === "block" && <small>Choose the intended route beside the composer, then send again.</small>}
          </section>}
          {approval && <section className="decision-card decision-card-attention">
            <span>Exact effect approval</span><strong>{String(approval.request.method ?? "Codex effect")}</strong><code>{String(approval.decision.effect_digest ?? "missing digest")}</code>
            <pre>{JSON.stringify(approval.request.params ?? approval.request, null, 2)}</pre>
            <div className="decision-actions"><button onClick={() => void resolveApproval("decline")}>Decline</button><button onClick={() => void resolveApproval("accept")}>Approve once</button></div>
          </section>}
          {questions && <section className="decision-card decision-card-attention">
            <span>Codex question</span>
            {questions.items.map((question) => <label key={question.id}>{question.header ?? question.id}<small>{question.question}</small><input value={answers[question.id] ?? ""} disabled={question.isSecret} placeholder={question.isSecret ? "Secret input refused" : question.options?.map((option) => option.label).join(" / ")} onChange={(event) => setAnswers((current) => ({...current, [question.id]: event.target.value}))} /></label>)}
            <button onClick={() => void resolveQuestions()}>Return answers</button>
          </section>}
          {bindings.map((binding) => <section className="decision-card decision-card-attention" key={String(binding.proposal_digest)}>
            <span>Continuation gate</span><strong>{String(binding.option_id)}</strong><code>{String(binding.proposal_digest)}</code>
            <div className="decision-actions"><button onClick={() => connection && void connection.send({type: "continuation.resolve", requestId: chatRequestId("continuation"), decisionDigest: String(continuation?.decision_digest), optionId: String(binding.option_id), proposalDigest: String(binding.proposal_digest), decision: "decline"})}>Leave closed</button><button disabled={!binding.has_next_turn} onClick={() => connection && void connection.send({type: "continuation.resolve", requestId: chatRequestId("continuation"), decisionDigest: String(continuation?.decision_digest), optionId: String(binding.option_id), proposalDigest: String(binding.proposal_digest), decision: "accept"})}>Accept exact next turn</button></div>
          </section>)}
          {!preflight && !approval && !questions && bindings.length === 0 && <p className="chat-empty-decision">No decision is waiting. Directives appear here before work crosses a boundary.</p>}
          <section className="reasoning-receipts" aria-label="Reasoning engine receipts">
            <div className="reasoning-receipts-heading">
              <span>Reasoning receipts</span><strong>{reasoningReceipts.length}</strong>
            </div>
            {reasoningReceipts.length === 0
              ? <p>Runtime evidence will appear as the engine evaluates this session.</p>
              : <ol>{reasoningReceipts.slice(-12).map((receipt) => <li key={receipt.receiptId}>
                <div><strong>{receipt.kind}</strong><span className={`receipt-status receipt-status-${receipt.status}`}>{receipt.status}</span></div>
                {receipt.route && <small>{receipt.route}</small>}
                <code title={receipt.evidenceDigest}>{receipt.evidenceDigest.slice(0, 16)}</code>
                {receipt.reasonCodes.length > 0 && <p>{receipt.reasonCodes.join(" · ")}</p>}
              </li>)}</ol>}
            <small>Live journal projection · authority effect: none</small>
          </section>
        </aside></DecisionsPlacement>
      </div>
    </main>
  );
}
