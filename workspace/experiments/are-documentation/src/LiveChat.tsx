import {useEffect, useRef, useState} from 'react';
import './live-chat.css';

type Activity = {kind: string; [key: string]: unknown};
type Turn = {id: number; user: string; answer: string; activity: Activity[]; error?: string};
type SessionState = {preferences: string[]; routes: {route_id: string | null}[]; learned_route_rules: number; turns_remaining: number; context_messages: number};
type ResetScope = 'language' | 'routing' | 'all';
const freshState: SessionState = {preferences: [], routes: [], learned_route_rules: 0, turns_remaining: 20, context_messages: 0};
const initialSuggestions = ['Explain how ARE helps an agent finish a task.', 'Help me plan invitation-only signup.', 'Explain context management in plain language.'];
function activityLabel(event: Activity) {
  if (event.kind === 'validation') return 'Request interpretation did not validate';
  if (event.kind === 'route') return `Route · ${String(event.route_id ?? event.decision_kind).replace('CA2-ROUTE-', '').toLowerCase()}`;
  if (event.kind === 'context') return `Context · ${event.messages_included} messages · ${(event.preferences as string[]).length} preferences`;
  if (event.kind === 'preference') return 'Language or explanation preference retained';
  if (event.kind === 'checkpoint') return 'ARE state checkpoint saved for this conversation';
  if (event.kind === 'model') return `GLM ${event.stage} · ${event.input_tokens} input + ${event.output_tokens} output tokens`;
  return 'Reply recorded in ARE state';
}
export function LiveChat() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState('');
  const [areState, setAreState] = useState<SessionState>(freshState);
  const [resetting, setResetting] = useState(false);
  const [notice, setNotice] = useState('');
  const [boundary, setBoundary] = useState(0);
  const resetLock = useRef(false);
  const session = useRef<{id: string; token: string} | null>(null);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0), sequence = useRef(0);
  const log = useRef<HTMLDivElement>(null), composer = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const abort = new AbortController();
    fetch('/api/are/status', {signal: abort.signal}).then(r => r.json()).then(value => setConfigured(value.configured === true)).catch(() => {if (!abort.signal.aborted) setConfigured(false);});
    const release = () => {
      controller.current?.abort();
      const old = session.current;
      if (old) {
        session.current = null;
        void fetch('/api/are/session', {method: 'DELETE', keepalive: true,
          headers: {'content-type': 'application/json', 'x-are-chat': '1', 'x-are-session': old.token},
          body: JSON.stringify({conversation_id: old.id})}).catch(() => {});
      }
    };
    window.addEventListener('pagehide', release);
    return () => {abort.abort(); generation.current++; release(); window.removeEventListener('pagehide', release);};
  }, []);
  useEffect(() => {
    const scroll = () => {if (location.hash === '#are-walkthrough') requestAnimationFrame(() => document.getElementById('are-walkthrough')?.scrollIntoView());};
    scroll(); window.addEventListener('hashchange', scroll); return () => window.removeEventListener('hashchange', scroll);
  }, []);
  const update = (id: number, fn: (turn: Turn) => Turn) => setTurns(items => items.map(item => item.id === id ? fn(item) : item));
  async function send() {
    if (controller.current || resetLock.current || !draft.trim() || !configured || areState.turns_remaining === 0) return;
    const text = draft.trim(), id = ++sequence.current, current = generation.current;
    const abort = new AbortController(); controller.current = abort;
    setTurns(items => [...items, {id, user: text, answer: '', activity: []}]); setDraft(''); setBusy(true); setPhase('Connecting to ARE');
    let terminal = false;
    try {
      const response = await fetch('/api/are/chat', {method: 'POST', headers: {'content-type': 'application/json', 'x-are-chat': '1', ...(session.current ? {'x-are-session': session.current.token} : {})},
        body: JSON.stringify({text, conversation_id: session.current?.id}), signal: abort.signal});
      if (!response.ok) {
        const data = await response.json();
        const messages: Record<string, string> = {'conversation-expired': 'This session expired. Use Start fresh to begin again.', 'session-access-denied': 'This session is no longer available. Use Start fresh.', 'demo-hourly-limit': 'The shared demo has reached its hourly allowance. Please try again later.', 'demo-token-limit': 'The shared demo has reached its token allowance. Please try again later.', 'conversation-limit': 'You have reached this visit’s 20-turn allowance.', 'turn-active': 'Another turn is still finishing. Please try again shortly.', 'invalid-message': 'Please use a shorter message (up to 6,000 UTF-8 bytes).'};
        throw new Error(messages[data.error] ?? 'The chat is temporarily unavailable. Please try again.');
      }
      if (!response.body) throw new Error('No response stream.');
      const reader = response.body.getReader(), decoder = new TextDecoder(); let pending = '';
      while (true) {
        const {value, done} = await reader.read();
        pending += decoder.decode(value, {stream: !done});
        const lines = pending.split('\n'); pending = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim() || current !== generation.current || abort.signal.aborted) continue;
          const event = JSON.parse(line);
          if (event.type === 'session') {session.current = {id: event.conversation_id, token: event.session_token}; setAreState(event.state);}
          if (event.type === 'state') setAreState(event.state);
          if (event.type === 'status') setPhase(event.phase === 'interpreting' ? 'Understanding your request with GLM' : 'ARE is preparing the reply');
          if (event.type === 'activity') {update(id, turn => ({...turn, activity: [...turn.activity, event]})); if (event.kind === 'context') setPhase('GLM is writing a reply');}
          if (event.type === 'message') update(id, turn => ({...turn, answer: event.text}));
          if (event.type === 'error') {terminal = true; update(id, turn => ({...turn, error: event.message}));}
          if (event.type === 'done') terminal = true;
        }
        if (done) break;
      }
      if (!terminal && !abort.signal.aborted) throw new Error('Connection ended before the turn completed.');
    } catch (error) {
      if (current === generation.current) update(id, turn => ({...turn, error: abort.signal.aborted ? 'Stopped. No further reply will be added to this turn.' : error instanceof Error ? error.message : 'Connection failed.'}));
    } finally {
      if (current === generation.current) {controller.current = null; setBusy(false); setPhase('');}
    }
  }
  async function reset(scope: ResetScope) {
    if (resetLock.current) return;
    resetLock.current = true; setResetting(true); setNotice('');
    const old = session.current;
    generation.current++; controller.current?.abort(); controller.current = null;
    setBusy(false); setPhase('');
    try {
      let next = {...freshState, turns_remaining: areState.turns_remaining};
      if (old) {
        const response = await fetch('/api/are/reset', {method: 'POST', headers: {'content-type': 'application/json', 'x-are-chat': '1', 'x-are-session': old.token}, body: JSON.stringify({conversation_id: old.id, scope})});
        const data = await response.json();
        if (response.status === 404 && scope === 'all') session.current = null;
        else {
          if (!response.ok) throw new Error('The server could not reset this session. Nothing has been marked as forgotten. Please retry.');
          session.current = {id: data.conversation_id, token: data.session_token}; next = data.state;
        }
      }
      setAreState(next); setBoundary(sequence.current);
      if (scope === 'all') {setTurns([]); setDraft('');}
      setNotice(scope === 'all' ? 'Fresh ARE state. Your conversation, preferences, and route history have been cleared.' : scope === 'language' ? 'Language preferences forgotten. Earlier messages remain visible but are no longer sent to the model.' : 'Routing history and prior intent cleared. Language preferences are kept; earlier messages are no longer sent to the model.');
      composer.current?.focus();
    } catch (error) {setNotice(error instanceof Error ? error.message : 'Reset failed. Please retry.');}
    finally {resetLock.current = false; setResetting(false);}
  }
  return <section className="are-live-chat" id="are-walkthrough" aria-labelledby="live-chat-title">
    <div className="live-chat-surface">
      <header className="live-chat-header"><h2 id="live-chat-title">Try A.R.E.</h2><div className="live-chat-meta"><span><i aria-hidden="true"/> A.R.E. + GLM 5.3 Flash</span><span className="live-session-count">{areState.turns_remaining} turns left</span></div></header>
      <p className="live-chat-scope">Messages go to GLM. Replies only; no file changes or tool execution.</p>
      <details className="live-session-panel"><summary>Session controls <span>{areState.preferences.length ? `${areState.preferences.length} preferences retained` : 'Fresh preferences'}</span></summary><div className="live-state-controls" aria-label="Your ARE session">
        <div><span>Language</span><strong>{areState.preferences.length ? `${areState.preferences.length} preferences` : 'Nothing learned yet'}</strong><button disabled={resetting || !areState.preferences.length} onClick={() => void reset('language')}>Forget language</button></div>
        <div><span>Routing</span><strong>{areState.routes.length ? `${areState.routes.length} decisions · automatic` : 'Automatic · fresh'}</strong><button disabled={resetting || !areState.routes.length} onClick={() => void reset('routing')}>Reset routing history</button></div>
        <div><span>Context</span><strong>{areState.context_messages} messages in this session</strong><small>{areState.turns_remaining} turns left this visit</small></div>
      </div>
      <div className="live-state-detail">
        {areState.preferences.length ? <ul>{areState.preferences.map((quote, i) => <li key={i}>{quote}</li>)}</ul> : <p>No language or explanation preferences retained.</p>}
        <p>Routing is chosen from each request. This demo does not learn new routing rules; resetting routing clears its decision history and prior intent.</p>
        <p>Forgetting also clears the model context. Usage allowances stay the same. Temporary state expires after 30 minutes of inactivity.</p><button className="live-start-fresh" onClick={() => void reset('all')} disabled={resetting}>Start fresh</button>
      </div></details>
      {notice && <p className="live-reset-notice" role="status">{notice}</p>}
      <div className="live-chat-log" role="log" aria-label="Live agent conversation" aria-live="polite" ref={log}>
        {!turns.length && <div className="live-chat-empty"><h3>What are you working on?</h3><p>Write a message or choose a starting point.</p></div>}
        {turns.map(turn => <article className={`live-chat-turn${turn.id <= boundary ? ' archived-turn' : ''}`} key={turn.id}>
          {turn.id <= boundary && <p className="live-archived-label">Earlier conversation · excluded from current model context</p>}
          <div className="live-user"><span>You</span><p>{turn.user}</p></div>
          <div className="live-agent"><span>Agent</span>{turn.answer && <p className="live-answer">{turn.answer}</p>}
            {turn.activity.length > 0 && <details className="live-activity"><summary>ARE at work · {turn.activity.filter(event => event.kind === 'model').reduce((sum, event) => sum + Number(event.input_tokens) + Number(event.output_tokens), 0).toLocaleString()} tokens this turn</summary>
              <ol>{turn.activity.map((event, index) => <li key={index}><details><summary>{activityLabel(event)}</summary><pre>{JSON.stringify(event, null, 2)}</pre></details></li>)}</ol>
            </details>}
            {turn.error && <p className="live-error" role="alert">{turn.error}</p>}
          </div>
        </article>)}
      </div>
      <div className="live-chat-status" role="status">{resetting ? 'Clearing your ARE state…' : busy ? phase : configured === false ? 'The chat connection is unavailable. Please try again later.' : configured === null ? 'Checking the connection…' : 'Ready · Preferences apply only to this session'}</div>
      {turns.length === 0 && <details className="live-prompt-options" open><summary>Suggested prompts</summary><div className="live-suggestions">{initialSuggestions.map(text => <button key={text} disabled={busy || resetting} onClick={() => {setDraft(text); composer.current?.focus();}}>{text === initialSuggestions[0] ? 'Explain ARE' : text === initialSuggestions[1] ? 'Plan a signup' : text === initialSuggestions[2] ? 'Context basics' : text}</button>)}</div></details>}
      <form className="live-composer" onSubmit={event => {event.preventDefault(); void send();}}>
        <textarea ref={composer} aria-label="Message the agent" placeholder="Message the agent…" rows={2} maxLength={3000} value={draft} onChange={event => setDraft(event.target.value)}
          onKeyDown={event => {if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {event.preventDefault(); void send();}}}/>
        {busy ? <button type="button" onClick={() => controller.current?.abort()}>Stop</button> : <button type="submit" disabled={resetting || !configured || !draft.trim() || areState.turns_remaining === 0}>Send ↑</button>}
      </form>
      <p className="live-chat-footnote">Enter to send · Shift + Enter for a new line · 20 turns per visit · Shared demo usage limits apply</p>
    </div>
  </section>;
}
