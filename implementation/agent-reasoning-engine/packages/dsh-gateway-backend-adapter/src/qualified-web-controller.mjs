import {createRequire} from "node:module";
import {pathToFileURL} from "node:url";

import {DSH_WEB_HOST_OWNER_SYMBOL} from "./web-host-owner.mjs";

const require = createRequire(import.meta.url);
const dshRequire = createRequire(require.resolve("@deepseek-ai/dsh/package.json"));
const {SessionController} = await import(pathToFileURL(
  dshRequire.resolve("@deepseek-ai/dsh-api-session-controller")).href);

function unsupported() {
  throw new Error("dsh-web.method-not-qualified");
}

/** Restricted first Web controller; only the Host owner may create or prompt. */
export default class QualifiedDshWebController extends SessionController {
  constructor(ctx, config, internals) {
    super(ctx, config, internals);
    this.owner = ctx[DSH_WEB_HOST_OWNER_SYMBOL];
    if (!this.owner) throw new Error("dsh-web.host-owner-missing");
    this.owner.registerController(this);
    // Cordis exposes a service proxy to callers; retain the registered native
    // instance in closures instead of trusting the proxy's dynamic `this`.
    const registered = this;
    this.create = (request) => this.owner.create(registered, request);
    this.prompt = (request, signal) => this.owner.prompt(registered, request, signal);
    this.updateQueue = (request) => this.owner.updateQueue(registered, request);
    this.cancel = (request) => this.owner.cancel(registered, request);
    this.list = (_request) => this.owner.list(registered, _request);
    this.modelCatalog = () => this.owner.modelCatalog(registered);
    this.search = (request, signal) => this.owner.search(registered, request, signal);
    this.page = (request, signal) => this.owner.page(registered, request, signal);
    this.follow = (request, signal) => this.owner.follow(registered, request, signal);
    this.control = (signal) => this.owner.control(registered, signal);
  }

  create(request) { return this.owner.create(this, request); }
  prompt(request, signal) { return this.owner.prompt(this, request, signal); }
  selectModel() { return unsupported(); }
  rename() { return unsupported(); }
  fork() { return unsupported(); }
  updateQueue(request) { return this.owner.updateQueue(this, request); }
  attachment() { return unsupported(); }
  openWorkspacePath() { return unsupported(); }
  canOpenWorkspacePath() { return unsupported(); }
  cancel(request) { return this.owner.cancel(this, request); }
  list(_request) { return this.owner.list(this, _request); }
  search(request, signal) { return this.owner.search(this, request, signal); }
  page(request, signal) { return this.owner.page(this, request, signal); }
  follow(request, signal) { return this.owner.follow(this, request, signal); }
  control(signal) { return this.owner.control(this, signal); }
  modelCatalog() { return this.owner.modelCatalog(this); }
}
