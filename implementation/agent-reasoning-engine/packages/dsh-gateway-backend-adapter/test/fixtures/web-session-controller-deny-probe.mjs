import {appendFileSync} from "node:fs";
import {createRequire} from "node:module";
import {pathToFileURL} from "node:url";

// Resolve beside the pinned dsh installation so the replacement Service and
// the Web Host use the same Cordis/Typert package instances. This fixture is
// denial-only: it neither forwards to ARE nor calls the model.
const require = createRequire(import.meta.url);
const dshRequire = createRequire(require.resolve("@deepseek-ai/dsh/package.json"));
const controllerUrl = pathToFileURL(dshRequire.resolve("@deepseek-ai/dsh-api-session-controller"));
const protocolUrl = pathToFileURL(dshRequire.resolve("@deepseek-ai/dsh-typert-protocol"));
const [{SessionController}, {RemoteError}] = await Promise.all([
  import(controllerUrl.href), import(protocolUrl.href),
]);

export default class AreWebSessionControllerDenyProbe extends SessionController {
  constructor(ctx, config, internals) {
    super(ctx, config, internals);
    const marker = process.env.ARE_DSH_WEB_PROBE_MARKER;
    if (marker) appendFileSync(marker, "session-controller replacement constructed\n", {encoding: "utf8"});
  }

  create(request) {
    void request;
    const marker = process.env.ARE_DSH_WEB_PROBE_MARKER;
    if (marker) appendFileSync(marker, "session/create denied before native dispatch\n", {encoding: "utf8"});
    throw new RemoteError("gateway/cancelled", "ARE Web seam probe denied create", {});
  }

  selectModel(request) {
    void request;
    const marker = process.env.ARE_DSH_WEB_PROBE_MARKER;
    if (marker) appendFileSync(marker, "session/selectModel denied before native dispatch\n", {encoding: "utf8"});
    throw new RemoteError("gateway/cancelled", "ARE Web seam probe denied selectModel", {});
  }

  rename(request) {
    void request;
    const marker = process.env.ARE_DSH_WEB_PROBE_MARKER;
    if (marker) appendFileSync(marker, "session/rename denied before native dispatch\n", {encoding: "utf8"});
    throw new RemoteError("gateway/cancelled", "ARE Web seam probe denied rename", {});
  }

  fork(request) {
    void request;
    const marker = process.env.ARE_DSH_WEB_PROBE_MARKER;
    if (marker) appendFileSync(marker, "session/fork denied before native dispatch\n", {encoding: "utf8"});
    throw new RemoteError("gateway/cancelled", "ARE Web seam probe denied fork", {});
  }

  prompt(request, signal) {
    void request;
    void signal;
    const marker = process.env.ARE_DSH_WEB_PROBE_MARKER;
    if (marker) appendFileSync(marker, "session/prompt denied before native dispatch\n", {encoding: "utf8"});
    throw new RemoteError("gateway/cancelled", "ARE Web seam probe denied prompt", {});
  }

  updateQueue(request) {
    void request;
    const marker = process.env.ARE_DSH_WEB_PROBE_MARKER;
    if (marker) appendFileSync(marker, "session/updateQueue denied before native dispatch\n", {encoding: "utf8"});
    throw new RemoteError("gateway/cancelled", "ARE Web seam probe denied updateQueue", {});
  }

  cancel(request) {
    void request;
    const marker = process.env.ARE_DSH_WEB_PROBE_MARKER;
    if (marker) appendFileSync(marker, "session/cancel denied before native dispatch\n", {encoding: "utf8"});
    throw new RemoteError("gateway/cancelled", "ARE Web seam probe denied cancel", {});
  }

  openWorkspacePath(request, signal) {
    void request;
    void signal;
    const marker = process.env.ARE_DSH_WEB_PROBE_MARKER;
    if (marker) appendFileSync(marker, "session/openWorkspacePath denied before native dispatch\n", {encoding: "utf8"});
    throw new RemoteError("gateway/cancelled", "ARE Web seam probe denied openWorkspacePath", {});
  }
}
