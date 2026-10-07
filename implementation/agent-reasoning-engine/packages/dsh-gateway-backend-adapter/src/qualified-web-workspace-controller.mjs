import {createRequire} from "node:module";
import {pathToFileURL} from "node:url";

import {DSH_WEB_HOST_OWNER_SYMBOL} from "./web-host-owner.mjs";

const require = createRequire(import.meta.url);
const dshRequire = createRequire(require.resolve("@deepseek-ai/dsh/package.json"));
const {WorkspaceController} = await import(pathToFileURL(
  dshRequire.resolve("@deepseek-ai/dsh-api-workspace-controller")).href);

function unsupported() {
  throw new Error("dsh-web.workspace-mutation-not-qualified");
}

/** Only the fixed Host Workspace and owned Session identities reach Web. */
export default class QualifiedDshWebWorkspaceController extends WorkspaceController {
  constructor(ctx) {
    super(ctx);
    this.owner = ctx[DSH_WEB_HOST_OWNER_SYMBOL];
    if (!this.owner) throw new Error("dsh-web.host-owner-missing");
    this.owner.registerWorkspaceController(this);
    const registered = this;
    this.follow = (signal) => this.owner.workspaceFollow(registered, signal);
  }

  create(request) { return unsupported(request); }
  rename(request) { return unsupported(request); }
  delete(request) { return unsupported(request); }
  insertBefore(request) { return unsupported(request); }
  insertSessionBefore(request) { return unsupported(request); }
  archiveSession(request) { return unsupported(request); }
  follow(signal) { return this.owner.workspaceFollow(this, signal); }
}
