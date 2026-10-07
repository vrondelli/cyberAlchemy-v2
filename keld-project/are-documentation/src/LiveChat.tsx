import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Markdown} from './Markdown';
import './live-chat.css';

const apiPath=(resource:string)=>`${import.meta.env.BASE_URL}api/are/${resource}`;

type Activity = {kind: string; [key: string]: unknown};
type Turn = {id: number; user: string; answer: string; activity: Activity[]; error?: string};
type SessionState = {preferences: string[]; routes: {route_id: string | null}[]; learned_route_rules: number; turns_remaining: number; context_messages: number};
type ResetScope = 'language' | 'routing' | 'all';
const freshState: SessionState = {preferences: [], routes: [], learned_route_rules: 0, turns_remaining: 20, context_messages: 0};
const storageKey = 'are.live-chat/v1', maximumBrowserRetentionMs = 30 * 60_000;
const tabStateKey = '__areLiveChatTabId';
function bindTabId(): string | null {
  try {
    const state = window.history.state;
    if (state && typeof state === 'object' && typeof state[tabStateKey] === 'string' && /^[a-f0-9-]{36}$/.test(state[tabStateKey])) return state[tabStateKey];
    const id = window.crypto.randomUUID();
    window.history.replaceState({...((state && typeof state === 'object' && !Array.isArray(state)) ? state : {}), [tabStateKey]: id}, '');
    return id;
  } catch {return null;}
}
const tabId = bindTabId();
type StoredChat = {savedAt:number;tabId:string;session:{id:string;token:string};turns:Turn[];draft:string;state:SessionState;boundary:number};
function restoreChat(): StoredChat | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null');
    const validState = value?.state && Array.isArray(value.state.preferences) && value.state.preferences.every((item:unknown) => typeof item === 'string') && Array.isArray(value.state.routes) && Number.isSafeInteger(value.state.learned_route_rules) && Number.isSafeInteger(value.state.turns_remaining) && Number.isSafeInteger(value.state.context_messages);
    const validTurns = Array.isArray(value?.turns) && value.turns.every((turn:unknown) => {const item=turn as Turn;return item && Number.isSafeInteger(item.id) && typeof item.user === 'string' && typeof item.answer === 'string' && Array.isArray(item.activity) && (item.error === undefined || typeof item.error === 'string');});
    if (!value || typeof value !== 'object' || !tabId || value.tabId !== tabId || !Number.isSafeInteger(value.savedAt) || Date.now() - value.savedAt < 0 || Date.now() - value.savedAt >= maximumBrowserRetentionMs || !validTurns || typeof value.draft !== 'string' || !validState || !Number.isSafeInteger(value.boundary) || !/^[a-f0-9-]{36}$/.test(value.session?.id) || !/^[a-f0-9]{64}$/.test(value.session?.token)) throw new Error();
    return value;
  } catch {try {sessionStorage.removeItem(storageKey);} catch {} return null;}
}
const initialSuggestions = ['Explain how ARE helps an agent finish a task.', 'Help me plan invitation-only signup.', 'Explain context management in plain language.'];
const failureMessages: Record<string, string> = {'conversation-expired': 'This session expired. Use Start fresh to begin again.', 'session-access-denied': 'This session is no longer available. Use Start fresh.', 'demo-hourly-limit': 'The shared demo has reached its hourly allowance. Please try again after it resets.', 'demo-token-limit': 'The shared demo has reached its token allowance. Please try again after it resets.', 'conversation-limit': 'You have reached this visit’s 20-turn allowance.', 'turn-active': 'Another turn is still finishing. Please try again shortly.', 'invalid-message': 'Please use a shorter message (up to 6,000 UTF-8 bytes).'};
const quotaFailure = (code: unknown) => code === 'demo-hourly-limit' || code === 'demo-token-limit';
function resetCopy(value: string | null) {
  if (!value) return 'The shared allowance will reset later.';
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? `Shared allowance resets at ${new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}.` : 'The shared allowance will reset later.';
}
function retentionCopy(seconds: number | null) {
  if (seconds === null || !Number.isSafeInteger(seconds) || seconds < 1) return 'Temporary state expires after the server-configured idle period.';
  const units: [number, string][] = [[86_400, 'day'], [3_600, 'hour'], [60, 'minute'], [1, 'second']];
  const [unitSeconds, unit] = units.find(([size]) => seconds % size === 0) ?? units.at(-1)!;
  const amount = seconds / unitSeconds;
  return `Temporary state expires after ${amount.toLocaleString()} ${unit}${amount === 1 ? '' : 's'} of inactivity.`;
}
function activityLabel(event: Activity) {
  if (event.kind === 'validation') return 'Request interpretation did not validate';
  if (event.kind === 'route') return event.route_id ? `Route · ${String(event.route_id).replace('CA2-ROUTE-', '').toLowerCase()}` : `Route · ${Array.isArray(event.reason_codes) && event.reason_codes.includes('selection.no-match') ? 'no match' : String(event.decision_kind)}`;
  if (event.kind === 'conversation-mode') return 'Conversation only · no ARE route selected';
  if (event.kind === 'context') return `Context · ${event.messages_included} messages · ${(event.preferences as string[]).length} preferences`;
  if (event.kind === 'preference') return 'Language or explanation preference retained';
  if (event.kind === 'checkpoint') return 'ARE state checkpoint saved for this conversation';
  if (event.kind === 'model') return `GLM ${event.stage} · ${event.input_tokens} input + ${event.output_tokens} output tokens`;
  return 'Reply recorded in ARE state';
}
export function LiveChat({active}:{active:boolean}) {
  const restored = useRef<StoredChat | null>(restoreChat());
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [availabilityReason, setAvailabilityReason] = useState<string | null>(null);
  const [allowanceResetsAt, setAllowanceResetsAt] = useState<string | null>(null);
  const [idleRetentionSeconds, setIdleRetentionSeconds] = useState<number | null>(null);
  const [turns, setTurns] = useState<Turn[]>(restored.current?.turns ?? []);
  const [draft, setDraft] = useState(restored.current?.draft ?? '');
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState('');
  const [areState, setAreState] = useState<SessionState>(restored.current?.state ?? freshState);
  const [resetting, setResetting] = useState(false);
  const [notice, setNotice] = useState('');
  const [boundary, setBoundary] = useState(restored.current?.boundary ?? 0);
  const resetLock = useRef(false);
  const session = useRef<{id: string; token: string} | null>(restored.current?.session ?? null);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0), sequence = useRef(Math.max(0, ...(restored.current?.turns ?? []).map(turn => turn.id)));
  const log = useRef<HTMLDivElement>(null), composer = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!tabId) return;
    const preserveTabBinding = () => {
      try {
        const state = window.history.state;
        if (state?.[tabStateKey] !== tabId) window.history.replaceState({...((state && typeof state === 'object' && !Array.isArray(state)) ? state : {}), [tabStateKey]: tabId}, '');
      } catch {} // Failed history binding disables restoration on a later load.
    };
    preserveTabBinding();
    window.addEventListener('hashchange', preserveTabBinding);
    window.addEventListener('popstate', preserveTabBinding);
    return () => {window.removeEventListener('hashchange', preserveTabBinding); window.removeEventListener('popstate', preserveTabBinding);};
  }, []);
  useLayoutEffect(() => {
    if (!active) {setHost(null); return;}
    const connect = () => setHost(current => {
      const target = document.getElementById('are-live-chat-host');
      return current === target ? current : target;
    });
    connect();
    const observer = new MutationObserver(connect);
    observer.observe(document.getElementById('root')!, {childList: true, subtree: true});
    return () => observer.disconnect();
  }, [active]);
  useEffect(() => {
    const abort = new AbortController();
    fetch(apiPath('status'), {signal: abort.signal}).then(r => r.json()).then(value => {
      setConfigured(value.configured === true);
      setAvailable(value.available !== false && value.configured === true);
      setAvailabilityReason(typeof value.availability_reason === 'string' ? value.availability_reason : null);
      setAllowanceResetsAt(typeof value.allowance_resets_at === 'string' ? value.allowance_resets_at : null);
      setIdleRetentionSeconds(Number.isSafeInteger(value.idle_retention_seconds) && value.idle_retention_seconds > 0 ? value.idle_retention_seconds : null);
    }).catch(() => {if (!abort.signal.aborted) {setConfigured(false); setAvailable(false); setIdleRetentionSeconds(null);}});
    const release = () => {
      controller.current?.abort();
    };
    window.addEventListener('pagehide', release);
    return () => {abort.abort(); generation.current++; release(); window.removeEventListener('pagehide', release);};
  }, []);
  useEffect(() => {
    const current = session.current;
    if (!current || !tabId) {try {sessionStorage.removeItem(storageKey);} catch {} return;}
    try {sessionStorage.setItem(storageKey, JSON.stringify({savedAt: Date.now(), tabId, session: current, turns, draft, state: areState, boundary} satisfies StoredChat));} catch {}
  }, [turns, draft, areState, boundary]);
  useEffect(() => {
    const current = session.current;
    if (!current) return;
    const abort = new AbortController();
    fetch(apiPath('state'), {method: 'POST', signal: abort.signal,
      headers: {'content-type': 'application/json', 'x-are-chat': '1', 'x-are-session': current.token},
      body: JSON.stringify({conversation_id: current.id})}).then(async response => {
        if (!response.ok) throw new Error('session-unavailable');
        const value = await response.json(); setAreState(value.state);
      }).catch(() => {if (!abort.signal.aborted) {session.current = null; setTurns([]); setDraft(''); setAreState(freshState); setBoundary(0); try {sessionStorage.removeItem(storageKey);} catch {}}});
    return () => abort.abort();
  }, []);
  useEffect(() => {
    if (available !== false || !allowanceResetsAt) return;
    const reset = Date.parse(allowanceResetsAt);
    if (!Number.isFinite(reset)) return;
    const abort = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(apiPath('status'), {signal: abort.signal}).then(response => response.json()).then(value => {
        setConfigured(value.configured === true);
        setAvailable(value.available !== false && value.configured === true);
        setAvailabilityReason(typeof value.availability_reason === 'string' ? value.availability_reason : null);
        setAllowanceResetsAt(typeof value.allowance_resets_at === 'string' ? value.allowance_resets_at : null);
      }).catch(() => {});
    }, Math.max(1000, reset - Date.now() + 1000));
    return () => {abort.abort(); window.clearTimeout(timer);};
  }, [available, allowanceResetsAt]);
  useEffect(() => {
    const scroll = () => {if (location.hash === '#are-walkthrough') requestAnimationFrame(() => document.getElementById('are-walkthrough')?.scrollIntoView());};
    scroll(); window.addEventListener('hashchange', scroll); return () => window.removeEventListener('hashchange', scroll);
  }, []);
  const update = (id: number, fn: (turn: Turn) => Turn) => setTurns(items => items.map(item => item.id === id ? fn(item) : item));
  async function send() {
    if (controller.current || resetLock.current || !draft.trim() || !configured || !available || areState.turns_remaining === 0) return;
    const text = draft.trim(), id = ++sequence.current, current = generation.current;
    const abort = new AbortController(); controller.current = abort;
    setTurns(items => [...items, {id, user: text, answer: '', activity: []}]); setDraft(''); setBusy(true); setPhase('Connecting to ARE');
    let terminal = false;
    try {
      const response = await fetch(apiPath('chat'), {method: 'POST', headers: {'content-type': 'application/json', 'x-are-chat': '1', ...(session.current ? {'x-are-session': session.current.token} : {})},
        body: JSON.stringify({text, conversation_id: session.current?.id}), signal: abort.signal});
      if (!response.ok) {
        const data = await response.json();
        if (data.error === 'conversation-expired' || data.error === 'session-access-denied') {session.current = null; try {sessionStorage.removeItem(storageKey);} catch {}}
        if (quotaFailure(data.error)) {setAvailable(false); setAvailabilityReason(data.error); setAllowanceResetsAt(typeof data.allowance_resets_at === 'string' ? data.allowance_resets_at : null);}
        throw new Error(failureMessages[data.error] ?? 'The chat is temporarily unavailable. Please try again.');
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
          if (event.type === 'error') {terminal = true; if (quotaFailure(event.error)) {setAvailable(false); setAvailabilityReason(event.error); setAllowanceResetsAt(typeof event.allowance_resets_at === 'string' ? event.allowance_resets_at : null);} update(id, turn => ({...turn, error: failureMessages[event.error] ?? event.message}));}
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
        const response = await fetch(apiPath('reset'), {method: 'POST', headers: {'content-type': 'application/json', 'x-are-chat': '1', 'x-are-session': old.token}, body: JSON.stringify({conversation_id: old.id, scope})});
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
  if (!host) return null;
  return createPortal(<section className="are-live-chat" id="are-walkthrough" aria-labelledby="live-chat-title">
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
        <p>Routing is evaluated for each request. A conversation-only reply may have no selected route. This demo does not learn new routing rules; resetting routing clears its decision history and prior intent.</p>
        <p>Forgetting also clears the model context. Usage allowances stay the same. This browser tab keeps the conversation across refreshes and revalidates it with the server. {retentionCopy(idleRetentionSeconds)}</p><button className="live-start-fresh" onClick={() => void reset('all')} disabled={resetting}>Start fresh</button>
      </div></details>
      {notice && <p className="live-reset-notice" role="status">{notice}</p>}
      <div className="live-chat-log" role="log" aria-label="Live agent conversation" aria-live="polite" ref={log}>
        {!turns.length && <div className="live-chat-empty"><h3>What are you working on?</h3><p>Write a message or choose a starting point.</p></div>}
        {turns.map(turn => <article className={`live-chat-turn${turn.id <= boundary ? ' archived-turn' : ''}`} key={turn.id}>
          {turn.id <= boundary && <p className="live-archived-label">Earlier conversation · excluded from current model context</p>}
          <div className="live-user"><span>You</span><p>{turn.user}</p></div>
          <div className="live-agent"><span>Agent</span>{turn.answer && <div className="live-answer"><Markdown text={turn.answer} doc="" allowLinks={false} skipTitle={false}/></div>}
            {turn.activity.length > 0 && <details className="live-activity"><summary>ARE at work · {turn.activity.filter(event => event.kind === 'model').reduce((sum, event) => sum + Number(event.input_tokens) + Number(event.output_tokens), 0).toLocaleString()} tokens this turn</summary>
              <ol>{turn.activity.map((event, index) => <li key={index}><details><summary>{activityLabel(event)}</summary><pre>{JSON.stringify(event, null, 2)}</pre></details></li>)}</ol>
            </details>}
            {turn.error && <div className="live-error-actions"><p className="live-error" role="alert">{turn.error}</p><button type="button" disabled={busy || resetting} onClick={()=>{setDraft(turn.user);composer.current?.focus();}}>Retry message</button></div>}
          </div>
        </article>)}
      </div>
      <div className="live-chat-status" role="status">{resetting ? 'Clearing your ARE state…' : busy ? phase : configured === false ? 'The chat connection is unavailable. Please try again later.' : configured === null || available === null ? 'Checking the connection…' : available === false ? `${failureMessages[availabilityReason ?? ''] ?? 'The shared demo is temporarily unavailable.'} ${resetCopy(allowanceResetsAt)}` : 'Ready · Preferences apply only to this session'}</div>
      {turns.length === 0 && <details className="live-prompt-options" open><summary>Suggested prompts</summary><div className="live-suggestions">{initialSuggestions.map(text => <button key={text} disabled={busy || resetting} onClick={() => {setDraft(text); composer.current?.focus();}}>{text === initialSuggestions[0] ? 'Explain ARE' : text === initialSuggestions[1] ? 'Plan a signup' : text === initialSuggestions[2] ? 'Context basics' : text}</button>)}</div></details>}
      <form className="live-composer" onSubmit={event => {event.preventDefault(); void send();}}>
        <textarea ref={composer} aria-label="Message the agent" placeholder="Message the agent…" rows={2} maxLength={3000} value={draft} onChange={event => setDraft(event.target.value)}
          onKeyDown={event => {if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {event.preventDefault(); void send();}}}/>
        {busy ? <button type="button" onClick={() => controller.current?.abort()}>Stop</button> : <button type="submit" disabled={resetting || !configured || !available || !draft.trim() || areState.turns_remaining === 0}>Send ↑</button>}
      </form>
      <p className="live-chat-footnote">Enter to send · Shift + Enter for a new line · 20 turns per visit · Shared demo usage limits apply</p>
    </div>
  </section>, host);
}
