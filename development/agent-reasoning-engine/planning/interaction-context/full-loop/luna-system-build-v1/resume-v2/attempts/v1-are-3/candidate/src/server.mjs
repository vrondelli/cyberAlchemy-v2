import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { AppError, errorBody, isObject } from './core.mjs';
import { openStore } from './store.mjs';

const MAX_BODY = 65536;

function parseOptions(argv) {
  const result = { store: null, port: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--store' || arg === '--port') {
      const value = argv[++i];
      if (value === undefined) throw new AppError('validation_error', `${arg} requires a value`);
      if (arg === '--store') result.store = value;
      else result.port = Number(value);
    } else if (arg === '--help') {
      return { help: true };
    } else {
      throw new AppError('validation_error', `Unknown option: ${arg}`);
    }
  }

  if (!result.store) throw new AppError('validation_error', '--store is required');
  if (!Number.isInteger(result.port) || result.port < 0 || result.port > 65535) {
    throw new AppError('validation_error', '--port must be an integer from 0 to 65535');
  }
  return result;
}

function send(response, status, value) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body)
  });
  response.end(body);
}

function readBody(request) {
  const length = request.headers['content-length'];
  if (length !== undefined && (!/^[0-9]+$/.test(length) || Number(length) > MAX_BODY)) {
    request.resume();
    return Promise.reject(new AppError('payload_too_large', 'Request body must be at most 65536 bytes', 413));
  }

  return new Promise((resolveBody, reject) => {
    const chunks = [];
    let size = 0;
    let settled = false;

    request.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY && !settled) {
        settled = true;
        request.resume();
        reject(new AppError('payload_too_large', 'Request body must be at most 65536 bytes', 413));
      } else if (!settled) {
        chunks.push(chunk);
      }
    });
    request.on('end', () => {
      if (!settled) resolveBody(Buffer.concat(chunks).toString('utf8'));
    });
    request.on('error', error => {
      if (!settled) reject(error);
    });
  });
}

async function jsonBody(request) {
  const text = await readBody(request);
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new AppError('malformed_json', 'Request body is not valid JSON');
  }
  if (!isObject(value)) throw new AppError('validation_error', 'JSON body must be an object');
  return value;
}

function queryScope(url) {
  return {
    product_id: url.searchParams.get('product_id'),
    participant_id: url.searchParams.get('participant_id')
  };
}

function pathParts(pathname) {
  return pathname.split('/').filter(Boolean).map(part => {
    try {
      return decodeURIComponent(part);
    } catch {
      throw new AppError('validation_error', 'Invalid URL encoding');
    }
  });
}

function isLessonMutation(parts) {
  return parts.length === 3 && parts[0] === 'lessons' &&
    (parts[2] === 'revise' || parts[2] === 'disable');
}

async function route(request, response, store) {
  const url = new URL(request.url, 'http://127.0.0.1');
  const parts = pathParts(url.pathname);

  if (request.method === 'GET' && url.pathname === '/health') {
    return send(response, 200, { ok: true, schema_version: 1 });
  }
  if (request.method === 'GET' && url.pathname === '/lessons') {
    return send(response, 200, { lessons: await store.list(queryScope(url)) });
  }
  if (request.method === 'GET' && url.pathname === '/history') {
    const query = queryScope(url);
    query.lesson_id = url.searchParams.get('lesson_id');
    return send(response, 200, { events: await store.history(query) });
  }
  if (request.method === 'GET' && url.pathname === '/export') {
    return send(response, 200, await store.export(queryScope(url)));
  }

  if (request.method === 'POST') {
    const recognized = url.pathname === '/lessons' || url.pathname === '/explain' || isLessonMutation(parts);
    if (!recognized) {
      request.resume();
      throw new AppError('not_found', 'Route was not found', 404);
    }
    const body = await jsonBody(request);
    if (url.pathname === '/lessons') {
      return send(response, 201, { lesson: await store.create(body) });
    }
    if (url.pathname === '/explain') {
      return send(response, 200, await store.explain(body));
    }
    if (parts[2] === 'revise') {
      return send(response, 200, {
        lesson: await store.revise({ ...body, lesson_id: parts[1] })
      });
    }
    return send(response, 200, {
      lesson: await store.disable({ ...body, lesson_id: parts[1] })
    });
  }

  throw new AppError('not_found', 'Route was not found', 404);
}

export async function startServer(argv = process.argv.slice(2)) {
  const config = parseOptions(argv);
  if (config.help) {
    process.stdout.write('Usage: node src/server.mjs --store FILE --port PORT\n');
    return null;
  }

  const store = await openStore(config.store);
  const server = createServer((request, response) => {
    route(request, response, store).catch(error => {
      const status = error instanceof AppError ? error.status : 500;
      if (!response.headersSent) send(response, status, errorBody(error));
      else response.destroy();
    });
  });

  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(config.port, '127.0.0.1', () => {
      server.removeListener('error', rejectListen);
      resolveListen();
    });
  });

  const address = server.address();
  process.stdout.write(JSON.stringify({ port: address.port }) + '\n');
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  startServer().catch(error => {
    process.stderr.write(JSON.stringify(errorBody(error)) + '\n');
    process.exitCode = 1;
  });
}
