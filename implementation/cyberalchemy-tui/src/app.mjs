import React, {createElement as h, useEffect, useMemo, useState} from "react";
import {Box, Text, useAnimation, useApp, useInput, usePaste, useStdout} from "ink";

import {createDefineController} from "./controller.mjs";
import {createCodingAgentController} from "./coding-agent-controller.mjs";
import {controlCenterCounts, conversationStatus, createControlCenterState, reduceControlCenterEvent} from "./control-center.mjs";
import {CAPABILITIES, COMMANDS, initialShellState, isTerminalConversationPhase, reduceShellEvent} from "./model.mjs";
import {DEFINITIONS, ONTOLOGY_RELATIONS, renderRelationLine} from "./ontology-view.mjs";

function statusColor(phase) {
  if (phase === "completed") return "green";
  if (phase === "error" || phase === "stopped" || phase === "uncertain") return "red";
  if (phase === "waiting" || phase === "review") return "cyan";
  return "yellow";
}

function Header({phase}) {
  const working = phase === "working" || phase === "applying" || phase === "self-testing";
  const {frame} = useAnimation({interval: 80, isActive: working});
  const spinner = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"][frame % 10];
  return h(Box, {borderStyle: "round", borderColor: "magenta", paddingX: 1, justifyContent: "space-between"},
    h(Text, {bold: true, color: "magenta"}, "CyberAlchemy v2"),
    h(Text, {color: statusColor(phase)}, phase === "applying" ? `${spinner} applying` : phase === "self-testing" ? `${spinner} self-test` : working ? `${spinner} reasoning` : phase),
  );
}

export function ActivityIndicator({phase}) {
  const active = phase === "working" || phase === "applying" || phase === "self-testing";
  const {frame, time} = useAnimation({interval: 100, isActive: active});
  if (!active) return null;
  const spinner = ["◐", "◓", "◑", "◒"][frame % 4];
  const seconds = Math.floor(time / 1000);
  const message = phase === "applying"
    ? "Approval accepted · applying the bound candidate and running sandbox verification"
    : phase === "self-testing"
      ? "Self-test running · disposable fixture only · user repository is not an approval target"
    : "Request running · mapping allowed repository context and waiting for the model";
  return h(Box, {borderStyle: "round", borderColor: "yellow", paddingX: 1, marginX: 1, flexDirection: "column", "aria-role": "progressbar", "aria-label": message},
    h(Text, {bold: true, color: "yellow"}, `${spinner} ${message}`),
    h(Text, {dimColor: true}, `Elapsed ${seconds}s · Ctrl+C cancels the session · no effect authority inferred`),
  );
}

function CapabilityBar({activeId}) {
  return h(Box, {paddingX: 1, gap: 2}, ...CAPABILITIES.map((capability) => h(Text, {
    key: capability.id,
    bold: capability.id === activeId,
    color: capability.status === "available" ? "cyan" : "gray",
    dimColor: capability.status !== "available",
  }, capability.id === activeId ? `● ${capability.title}` : `○ ${capability.title}`)));
}

const SESSION_MARK = Object.freeze({idle: "○", queued: "◌", running: "◐", "waiting-human": "!", blocked: "×", completed: "✓", cancelled: "−"});

export function SessionsPanel({state}) {
  return h(Box, {borderStyle: "round", borderColor: state.focus === "sessions" ? "cyan" : "gray", paddingX: 1, flexDirection: "column", width: 26},
    h(Text, {bold: true, color: "cyan"}, "Sessions"),
    ...state.sessions.map((session) => h(Text, {
      key: session.sessionId,
      bold: session.sessionId === state.selectedSessionId,
      color: session.status === "blocked" ? "red" : session.status === "completed" ? "green" : session.status === "waiting-human" ? "yellow" : "white",
      wrap: "truncate",
    }, `${session.sessionId === state.selectedSessionId ? "›" : " "} ${SESSION_MARK[session.status] ?? "?"} ${session.title}${session.attentionCount ? `  [${session.attentionCount}]` : ""}`)),
    h(Text, {dimColor: true, marginTop: 1}, "Ctrl+1 · ↑↓ select"),
  );
}

export function AttentionPanel({state}) {
  const pending = state.attention.filter((item) => item.state === "pending" || item.state === "viewed");
  return h(Box, {borderStyle: "round", borderColor: state.focus === "attention" ? "yellow" : "gray", paddingX: 1, flexDirection: "column", width: 34},
    h(Text, {bold: true, color: "yellow"}, `Attention · ${pending.length}`),
    ...(pending.length ? pending : [{attentionId: "none", title: "Nothing needs attention", originSessionId: ""}]).map((item) => h(Box, {key: item.attentionId, flexDirection: "column", marginBottom: 1},
      h(Text, {bold: item.attentionId === state.selectedAttentionId, color: item.severity === "blocker" ? "red" : "white", wrap: "truncate"}, `${item.attentionId === state.selectedAttentionId ? "›" : " "} ${item.title}`),
      item.originSessionId ? h(Text, {dimColor: true}, `  from ${item.originSessionId}`) : null,
    )),
    h(Text, {dimColor: true}, "Ctrl+3/Ctrl+A · ↑↓ · Enter open"),
  );
}

export function QueueFooter({state}) {
  const counts = controlCenterCounts(state);
  return h(Box, {borderStyle: "round", borderColor: "gray", paddingX: 1, justifyContent: "space-between"},
    h(Text, null, `Queue  ${counts.running} running · ${counts.waiting} ready · ${counts.blocked} blocked`),
    h(Text, {color: counts.pendingAttention ? "yellow" : "green"}, `${counts.pendingAttention} need attention`),
    h(Text, {dimColor: true}, "Ctrl+1 sessions · Ctrl+2 chat · Ctrl+3 attention"),
  );
}

export function ControlCenterPanels({state, center, columns = 120}) {
  if (columns < 100) {
    const labels = [["sessions", "Sessions"], ["chat", "Chat"], ["attention", `Attention ${controlCenterCounts(state).pendingAttention}`]];
    const selected = state.focus === "sessions" ? h(SessionsPanel, {state}) : state.focus === "attention" ? h(AttentionPanel, {state}) : center;
    return h(Box, {flexGrow: 1, flexDirection: "column"},
      h(Box, {paddingX: 1, gap: 2}, ...labels.map(([id, label]) => h(Text, {key: id, bold: state.focus === id, color: state.focus === id ? "cyan" : "gray"}, state.focus === id ? `● ${label}` : `○ ${label}`))),
      selected,
    );
  }
  return h(Box, {flexGrow: 1, flexDirection: "row"},
    h(SessionsPanel, {state}),
    h(Box, {flexGrow: 1, flexDirection: "column", borderStyle: "round", borderColor: state.focus === "chat" ? "cyan" : "gray"}, center),
    h(AttentionPanel, {state}),
  );
}

function Transcript({items, rows, capabilityId}) {
  const budget = Math.max(3, Math.min(10, rows - 12));
  const visible = items.slice(-budget);
  if (visible.length === 0) {
    const implement = capabilityId === "implement";
    return h(Box, {flexGrow: 1, paddingX: 2, paddingY: 1, flexDirection: "column"},
      h(Text, {bold: true}, implement ? "Request a bounded change." : "Begin broadly."),
      h(Text, {color: "gray"}, implement
        ? "Chat about the repository. Changes remain proposals until you confirm their exact approval digest."
        : "Describe a domain, subject, context, or project. CyberAlchemy will narrow it with you."),
    );
  }
  return h(Box, {flexGrow: 1, paddingX: 2, paddingY: 1, flexDirection: "column"}, ...visible.map((item, index) =>
    h(Box, {key: `${items.length - visible.length + index}`, flexDirection: "column", marginBottom: 1},
      h(Text, {bold: true, color: item.role === "human" ? "cyan" : item.role === "error" ? "red" : "magenta"},
        item.role === "human" ? "You" : item.role === "error" ? "Error" : "CyberAlchemy"),
      h(Text, {wrap: "wrap"}, item.text),
    ),
  ));
}

function CommandOverlay() {
  return h(Box, {borderStyle: "double", borderColor: "cyan", paddingX: 2, paddingY: 1, flexDirection: "column"},
    h(Text, {bold: true, color: "cyan"}, "Commands"),
    ...COMMANDS.map((command) => h(Box, {key: command.id, gap: 2},
      h(Text, {bold: true}, command.invocation.padEnd(10)),
      h(Text, {color: "gray"}, command.title),
      command.key ? h(Text, {color: "yellow"}, command.key) : null,
    )),
    h(Text, {dimColor: true}, "Esc closes this overlay"),
  );
}

function ContextOverlay() {
  return h(Box, {borderStyle: "double", borderColor: "magenta", paddingX: 2, paddingY: 1, flexDirection: "column"},
    h(Text, {bold: true, color: "magenta"}, "Context · definitions and ontology"),
    h(Text, {bold: true, marginTop: 1}, "Definitions"),
    ...DEFINITIONS.slice(0, 4).map((definition) => h(Text, {key: definition.id},
      h(Text, {color: "cyan"}, `${definition.term}`),
      h(Text, {dimColor: true}, ` (${definition.id}) — `),
      definition.meaning,
    )),
    h(Text, {bold: true, marginTop: 1}, "Relations"),
    ...ONTOLOGY_RELATIONS.slice(0, 6).map((relation, index) => h(Text, {key: index, color: "green"}, renderRelationLine(relation))),
    h(Text, {dimColor: true, marginTop: 1}, "Projection only · authority effect: none · Esc closes"),
  );
}

function DiagnosticsOverlay({diagnostics}) {
  return h(Box, {borderStyle: "double", borderColor: "cyan", paddingX: 2, paddingY: 1, flexDirection: "column"},
    h(Text, {bold: true, color: "cyan"}, "Redacted run receipt"),
    h(Text, {wrap: "wrap"}, diagnostics ? JSON.stringify(diagnostics, null, 2) : "No run receipt is available."),
    h(Text, {dimColor: true, marginTop: 1}, "Candidate content, secret values, and private locators are excluded · Esc closes"),
  );
}

function PreflightPanel({receipt}) {
  if (!receipt?.checks) return null;
  return h(Box, {paddingX: 1, flexDirection: "column"},
    h(Text, {bold: true, color: receipt.status === "PASS" ? "green" : "red"}, `Preflight ${receipt.status}`),
    h(Text, {dimColor: true}, receipt.checks.map((entry) => `${entry.check_id}:${entry.status}`).join(" · ")),
  );
}

export function RecoveryPanel({observation}) {
  const label = observation?.status === "checking" ? "Checking owned host history"
    : observation?.disposition === "host-terminal" ? `Matching host turn: ${observation.turn_status}`
      : observation?.disposition === "host-active" ? "Matching host turn: active"
        : observation?.disposition === "host-active-unbound" ? "Owned host thread active; turn unbound"
          : observation?.disposition === "host-idle-unbound" ? "Owned host thread idle; turn unbound"
            : "Host turn unverified";
  return h(Box, {borderStyle: "round", borderColor: "red", paddingX: 1, flexDirection: "column",
    "aria-role": "alert", "aria-label": "Proposal recovery blocked"},
  h(Text, {bold: true, color: "red"}, `Recovery blocked · ${label}`),
  h(Text, {dimColor: true}, "No proposal was restored. No automatic retry or new proposal. Ctrl+R rechecks host history."));
}

export function Composer({value, prompt, disabled}) {
  return h(Box, {borderStyle: "round", borderColor: disabled ? "gray" : "cyan", paddingX: 1, flexDirection: "column"},
    h(Text, {color: disabled ? "gray" : "white", wrap: "truncate"}, prompt),
    h(Box, null,
      h(Text, {bold: true, color: "cyan"}, "> "),
      h(Text, null, value),
      h(Text, {inverse: !disabled}, disabled ? "" : " "),
    ),
  );
}

export function isComposerDisabled(phase, terminal = false) {
  return terminal || phase === "working" || phase === "applying" || phase === "self-testing" || phase === "uncertain";
}

export function DiagnosticTimeline({items = []}) {
  const visible = items.slice(-4);
  if (visible.length === 0) return null;
  return h(Box, {paddingX: 1, flexDirection: "column"},
    h(Text, {bold: true, color: "cyan"}, "Run phases"),
    ...visible.map((item, index) => h(Text, {key: `${item.at}:${index}`, dimColor: true}, `${item.phase}: ${item.detail}`)),
  );
}

export function ApprovalButton({digest}) {
  const exact = typeof digest === "string" && /^[a-f0-9]{64}$/u.test(digest) ? digest : null;
  return h(Box, {paddingX: 1, paddingBottom: 1, flexDirection: "column"},
    h(Box, {borderStyle: "round", borderColor: exact ? "green" : "red", paddingX: 2, "aria-role": "button", "aria-label": "Confirm exact pending digest and apply"},
      h(Text, {bold: true, inverse: exact, color: exact ? "green" : "red"}, exact ? " Confirm & apply " : " Approval unavailable "),
      exact ? h(Text, {color: "gray"}, "  Enter") : null,
    ),
    exact ? h(Text, {dimColor: true}, `Exact digest: ${exact}`) : null,
    h(Text, {dimColor: true}, "Type /reject to cancel. No implicit approval."),
  );
}

export function CyberAlchemyApp(props) {
  const {exit} = useApp();
  const {stdout} = useStdout();
  const rows = stdout?.rows ?? 30;
  const columns = stdout?.columns ?? 120;
  const defineController = useMemo(() => props.controller ?? createDefineController({gatewaySocket: props.gatewaySocket}), []);
  const codingController = useMemo(() => props.codingController ?? createCodingAgentController(props.codingAgent), []);
  const [defineConversation, setDefineConversation] = useState(defineController.snapshot());
  const [codingConversation, setCodingConversation] = useState(codingController.snapshot());
  const [shell, setShell] = useState(() => props.initialCapability === "implement"
    ? reduceShellEvent(initialShellState(), {type: "capability.open", capabilityId: "implement"})
    : initialShellState());
  const [input, setInput] = useState("");
  const [controlCenter, setControlCenter] = useState(() => createControlCenterState({demo: props.controlCenterDemo === true}));
  const controller = shell.capabilityId === "implement" ? codingController : defineController;
  const conversation = shell.capabilityId === "implement" ? codingConversation : defineConversation;
  const terminal = isTerminalConversationPhase(conversation.phase);
  const composerDisabled = isComposerDisabled(conversation.phase, terminal);

  useEffect(() => defineController.subscribe(setDefineConversation), [defineController]);
  useEffect(() => codingController.subscribe(setCodingConversation), [codingController]);
  useEffect(() => {
    if (codingConversation.phase === "uncertain" && codingConversation.reconciliation === null) {
      void codingController.reconcilePendingTurn?.();
    }
  }, [codingConversation.phase, codingConversation.reconciliation, codingController]);
  useEffect(() => {
    const approvalDigest = codingConversation.phase === "review" ? codingConversation.result?.approval_digest : null;
    setControlCenter((current) => reduceControlCenterEvent(current, {
      type: "conversation.sync",
      status: conversationStatus(codingConversation.phase),
      attentionItem: approvalDigest ? {subjectDigest: approvalDigest} : null,
    }));
  }, [codingConversation.phase, codingConversation.result?.approval_digest]);
  useEffect(() => {
    if (props.initialOpening) void controller.start(props.initialOpening);
    return () => {
      void defineController.close();
      void codingController.close();
    };
  }, []);

  async function quit() {
    await Promise.all([defineController.close(), codingController.close()]);
    exit();
  }

  function command(value) {
    if (value === "/help") setShell((current) => reduceShellEvent(current, {type: "overlay.open", overlay: "commands"}));
    else if (value === "/context" || value === "/ontology") setShell((current) => reduceShellEvent(current, {type: "overlay.open", overlay: "context"}));
    else if (value === "/define") setShell((current) => reduceShellEvent(current, {type: "capability.open", capabilityId: "define"}));
    else if (value === "/implement") setShell((current) => reduceShellEvent(current, {type: "capability.open", capabilityId: "implement"}));
    else if (value === "/self-test" && shell.capabilityId === "implement") void codingController.selfTest();
    else if (value === "/diagnostics" && shell.capabilityId === "implement") setShell((current) => reduceShellEvent(current, {type: "overlay.open", overlay: "diagnostics"}));
    else if (value === "/reconcile" && shell.capabilityId === "implement") void codingController.reconcilePendingTurn?.();
    else if (value === "/quit") void quit();
    else return false;
    return true;
  }

  useInput((character, key) => {
    if (key.ctrl && character === "c") return void quit();
    if (key.ctrl && character === "p") return command("/help");
    if (key.ctrl && character === "o") return command("/context");
    if (key.ctrl && character === "r" && shell.capabilityId === "implement") return command("/reconcile");
    if (key.ctrl && character === "1") return setControlCenter((current) => reduceControlCenterEvent(current, {type: "focus.select", focus: "sessions"}));
    if (key.ctrl && character === "2") return setControlCenter((current) => reduceControlCenterEvent(current, {type: "focus.select", focus: "chat"}));
    if (key.ctrl && (character === "3" || character === "a")) return setControlCenter((current) => reduceControlCenterEvent(current, {type: "focus.select", focus: "attention"}));
    if (key.escape && shell.overlay) {
      setShell((current) => reduceShellEvent(current, {type: "overlay.close"}));
      return;
    }
    if (shell.overlay) return;
    if (controlCenter.focus === "sessions" && (key.upArrow || key.downArrow)) return setControlCenter((current) => reduceControlCenterEvent(current, {type: "session.move", delta: key.upArrow ? -1 : 1}));
    if (controlCenter.focus === "attention" && (key.upArrow || key.downArrow)) return setControlCenter((current) => reduceControlCenterEvent(current, {type: "attention.move", delta: key.upArrow ? -1 : 1}));
    if (controlCenter.focus === "attention" && key.return && controlCenter.selectedAttentionId) return setControlCenter((current) => reduceControlCenterEvent(current, {type: "attention.open", attentionId: current.selectedAttentionId}));
    if (props.controlCenterDemo && controlCenter.focus === "chat") return;
    if (composerDisabled && !key.return) return;
    if (key.return && terminal) return void quit();
    if (key.return) {
      const value = input.trim();
      if (!value && conversation.phase === "review" && shell.capabilityId === "implement") {
        codingController.confirmPending();
        return;
      }
      if (!value) return;
      setInput("");
      if (!command(value)) controller.submit(value);
      return;
    }
    if (key.backspace || key.delete) return setInput((value) => value.slice(0, -1));
    if (key.ctrl && character === "u") return setInput("");
    if (!key.ctrl && !key.meta && character && !composerDisabled) setInput((value) => `${value}${character}`);
  });
  usePaste((value) => {
    if (!shell.overlay && !composerDisabled) setInput((current) => `${current}${value.replaceAll("\r", "")}`);
  });

  const center = shell.overlay === "commands" ? h(CommandOverlay)
    : shell.overlay === "context" ? h(ContextOverlay)
      : shell.overlay === "diagnostics" ? h(DiagnosticsOverlay, {diagnostics: conversation.diagnostics})
        : h(React.Fragment, null,
          h(Transcript, {items: conversation.transcript, rows, capabilityId: shell.capabilityId}),
          props.controlCenterDemo ? h(Box, {paddingX: 2, paddingBottom: 1, flexDirection: "column"},
            h(Text, {bold: true, color: "cyan"}, "Safe interactive preview"),
            h(Text, {dimColor: true}, "Navigate the fixture sessions and attention queue. No model, tool, approval, or repository effect is connected."),
          ) : null,
          !shell.overlay && shell.capabilityId === "implement" && conversation.phase === "review" ? h(ApprovalButton, {digest: conversation.result?.approval_digest}) : null,
          !shell.overlay && !props.controlCenterDemo ? h(Composer, {
            value: input,
            prompt: terminal ? `${conversation.prompt} Press Enter to exit.` : conversation.phase === "review" ? "Press Enter to activate Confirm & apply, or type /reject." : conversation.prompt,
            disabled: composerDisabled,
          }) : null,
        );

  return h(Box, {width: "100%", height: rows, flexDirection: "column"},
    h(Header, {phase: conversation.phase}),
    h(CapabilityBar, {activeId: shell.capabilityId}),
    !shell.overlay ? h(ActivityIndicator, {phase: conversation.phase}) : null,
    !shell.overlay && shell.capabilityId === "implement" ? h(PreflightPanel, {receipt: conversation.preflight}) : null,
    !shell.overlay && shell.capabilityId === "implement" ? h(DiagnosticTimeline, {items: conversation.timeline}) : null,
    !shell.overlay && shell.capabilityId === "implement" && conversation.phase === "uncertain"
      ? h(RecoveryPanel, {observation: conversation.reconciliation}) : null,
    h(ControlCenterPanels, {state: controlCenter, center, columns}),
    h(QueueFooter, {state: controlCenter}),
    h(Box, {paddingX: 1},
      h(Text, {dimColor: true}, props.controlCenterDemo
        ? "Demo data only · no background process or effect authority · Ctrl+C exit"
        : conversation.phase === "uncertain"
        ? "Ctrl+R recheck host history · Enter exit · no automatic retry"
        : terminal
        ? "Enter exit · Ctrl+P commands · Ctrl+O context · Ctrl+C exit · no implicit authority"
        : conversation.phase === "review"
          ? "Enter confirm exact digest · /reject cancel · Ctrl+C exit · no implicit authority"
          : "Enter send · Ctrl+P commands · Ctrl+O context · Ctrl+C exit · no implicit authority"),
    ),
  );
}
