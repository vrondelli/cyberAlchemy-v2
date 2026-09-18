import {randomBytes, timingSafeEqual} from 'node:crypto';
import {createBrokerModel, MODEL} from './broker-client.mjs';
import {createChatSession} from './chat.mjs';

export function chatMiddleware({model, configurationError = false, port = 4193, allowedOrigins, now = Date.now, hourlyTurnLimit = 30, hourlyTokenLimit = 100000} = {}) {
  const sessions = new Map(), controllers = new Set();
  const json = (res, status, value) => {res.writeHead(status, {'content-type': 'application/json', 'cache-control': 'no-store'}); res.end(JSON.stringify(value));};
  const originValues = allowedOrigins ?? [`http://127.0.0.1:${port}`, `http://localhost:${port}`];
  if (!Array.isArray(originValues) || originValues.length < 1 || originValues.some(value => {
    try {const url = new URL(value); return url.origin !== value || !['http:', 'https:'].includes(url.protocol);} catch {return true;}
  })) throw new Error('invalid-allowed-origins');
  const origins = new Set(originValues);
  if (!Number.isSafeInteger(hourlyTurnLimit) || hourlyTurnLimit < 1 || hourlyTurnLimit > 10000) throw new Error('invalid-hourly-turn-limit');
  if (!Number.isSafeInteger(hourlyTokenLimit) || hourlyTokenLimit < 37000 || hourlyTokenLimit > 10000000) throw new Error('invalid-hourly-token-limit');
  const hosts = new Set([...origins].map(origin => new URL(origin).host));
  let windowStart = now(), dispatchedTurns = 0, tokenWindow = {used: 0, reserved: 0};
  const reservation = 37000; // Provider request bytes + chat framing margin + output cap.
  const budgetedModel = async input => {
    const accounting = tokenWindow;
    if (accounting.used + accounting.reserved + reservation > hourlyTokenLimit) throw new Error('demo-token-limit');
    accounting.reserved += reservation;
    try {
      const result = await model(input);
      const total = result.receipt.input_tokens + result.receipt.output_tokens;
      if (!Number.isSafeInteger(total) || total < 0 || total > reservation) throw new Error('provider-usage-invalid');
      accounting.used += total;
      return result;
    } catch (error) {
      // A failed/cancelled dispatch can still be billable. Charge the reservation
      // when exact provider usage is unavailable; never guess it was free.
      accounting.used += reservation; throw error;
    } finally {accounting.reserved -= reservation;}
  };
  const authorize = (entry, req) => {
    const token = req.headers['x-are-session'];
    return typeof token === 'string' && /^[a-f0-9]{64}$/.test(token) && timingSafeEqual(Buffer.from(token), Buffer.from(entry.token));
  };
  const identity = entry => ({conversation_id: entry.chat.id, session_token: entry.token, state: entry.chat.state()});
  const discard = entry => {entry.chat.close(); sessions.delete(entry.chat.id);};
  const makeEntry = chat => ({chat, token: randomBytes(32).toString('hex'), used: now(), controller: null, pending: null, resetting: false, deleted: false});
  async function middleware(req, res, next) {
    if (!req.url?.startsWith('/api/are/')) return next();
    if (!hosts.has(req.headers.host) || (req.headers.origin && !origins.has(req.headers.origin))) return json(res, 403, {error: 'allowed-origin-required'});
    if (req.method === 'GET' && req.url === '/api/are/status') return json(res, 200, {configured: !configurationError && !!model, model: MODEL, mode: 'live', scope: 'conversation-only', persistence: 'process-memory'});
    if (!origins.has(req.headers.origin) || req.headers['x-are-chat'] !== '1' || req.headers['content-type'] !== 'application/json') return json(res, 403, {error: 'same-origin-json-required'});
    for (const entry of sessions.values()) if (!entry.chat.busy && !entry.resetting && now() - entry.used > 30 * 60_000) discard(entry);
    let input;
    const bodyDeadline = setTimeout(() => req.destroy(), 10000);
    try {
      let bytes = 0; const chunks = [];
      for await (const chunk of req) {bytes += chunk.length; if (bytes > 12288) {json(res, 413, {error: 'request-too-large'}); return;} chunks.push(chunk);}
      input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error();
    } catch {if (!res.headersSent && !res.destroyed) json(res, 400, {error: 'invalid-json'}); return;}
    finally {clearTimeout(bodyDeadline);}
    if (req.aborted || res.destroyed) return;
    const resetting = req.method === 'POST' && req.url === '/api/are/reset';
    const removing = req.method === 'DELETE' && req.url === '/api/are/session';
    const reading = req.method === 'POST' && req.url === '/api/are/state';
    const chatting = req.method === 'POST' && req.url === '/api/are/chat';
    if (!resetting && !removing && !reading && !chatting) return json(res, 404, {error: 'not-found'});
    const allowed = chatting ? ['text', 'conversation_id'] : resetting ? ['scope', 'conversation_id'] : ['conversation_id'];
    if (Object.keys(input).some(key => !allowed.includes(key)) ||
        !(input.conversation_id === undefined || (typeof input.conversation_id === 'string' && /^[a-f0-9-]{36}$/.test(input.conversation_id))) ||
        (!chatting && !input.conversation_id) ||
        (resetting && !['language', 'routing', 'all'].includes(input.scope)) ||
        (chatting && (typeof input.text !== 'string' || !input.text.trim() || Buffer.byteLength(input.text) > 6000))) return json(res, 400, {error: 'invalid-message'});
    let entry = input.conversation_id ? sessions.get(input.conversation_id) : null;
    if (input.conversation_id && !entry) return json(res, 404, {error: 'conversation-expired'});
    if (entry && !authorize(entry, req)) return json(res, 403, {error: 'session-access-denied'});
    if (entry?.resetting || entry?.deleted) return json(res, 409, {error: 'session-resetting'});
    if (reading) return json(res, 200, {state: entry.chat.state()});
    if (removing || resetting) {
      entry.resetting = true; entry.controller?.abort();
      await entry.pending?.catch(() => {});
      if (removing) {discard(entry); return json(res, 200, {deleted: true});}
      let replacement;
      try {replacement = makeEntry(entry.chat.restart(input.scope));}
      catch {entry.resetting = false; return json(res, 503, {error: 'are-reset-failed'});}
      discard(entry); sessions.set(replacement.chat.id, replacement);
      return json(res, 200, {...identity(replacement), reset: input.scope, model_context_cleared: true});
    }
    if (configurationError || !model) return json(res, 503, {error: 'glm-configuration-unavailable'});
    if (entry?.chat.busy || controllers.size >= 2) return json(res, 409, {error: 'turn-active'});
    if (now() - windowStart >= 3600000 && controllers.size === 0) {windowStart = now(); dispatchedTurns = 0; tokenWindow = {used: 0, reserved: 0};}
    if (dispatchedTurns >= hourlyTurnLimit) return json(res, 429, {error: 'demo-hourly-limit'});
    if (tokenWindow.used + tokenWindow.reserved + reservation > hourlyTokenLimit) return json(res, 429, {error: 'demo-token-limit'});
    if (entry?.chat.state().turns_remaining === 0) return json(res, 429, {error: 'conversation-limit'});
    if (!entry && sessions.size >= 32) return json(res, 429, {error: 'session-limit'});
    if (!entry) {
      try {entry = makeEntry(createChatSession({model: budgetedModel})); sessions.set(entry.chat.id, entry);}
      catch {return json(res, 503, {error: 'are-runtime-unavailable'});}
    }
    dispatchedTurns++;
    const controller = new AbortController(); controllers.add(controller); entry.used = now(); entry.controller = controller;
    const deadline = setTimeout(() => controller.abort(), 150000);
    const disconnected = () => {if (!res.writableEnded) controller.abort();};
    res.on('close', disconnected);
    res.writeHead(200, {'content-type': 'application/x-ndjson', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff'});
    const emit = event => {if (!controller.signal.aborted && !res.destroyed) res.write(JSON.stringify(event) + '\n');};
    emit({type: 'session', ...identity(entry), model: MODEL});
    try {entry.pending = entry.chat.submit(input.text.trim(), {signal: controller.signal, emit}); await entry.pending;}
    catch (error) {
      const safe = /^(?:demo-token-limit|intent-output-invalid|turn-failed|provider-(?:unavailable|output-limit|response-invalid|usage-invalid|http-[0-9]{3})|deadline-exceeded|request-failed|response-interrupted|cancelled)$/.test(error?.message) ? error.message : 'turn-failed';
      emit({type: 'error', error: safe, message: `The live turn could not complete (${safe}). No prepared reply was substituted. You can retry or reset your session.`});
    }
    finally {
      clearTimeout(deadline); controllers.delete(controller); entry.used = now(); entry.controller = null; entry.pending = null;
      res.off('close', disconnected); res.end();
    }
  }
  middleware.close = () => {for (const controller of controllers) controller.abort(); for (const entry of sessions.values()) if (!entry.chat.busy) entry.chat.close(); sessions.clear();};
  return middleware;
}

export function areChatPlugin() {
  function install(server) {
    let model; let configurationError = false;
    try {model = createBrokerModel();} catch {configurationError = true;}
    const middleware = chatMiddleware({model, configurationError});
    server.middlewares.use(middleware);
    server.httpServer?.once('close', middleware.close);
  }
  return {name: 'are-local-live-chat', configureServer: install, configurePreviewServer: install};
}
