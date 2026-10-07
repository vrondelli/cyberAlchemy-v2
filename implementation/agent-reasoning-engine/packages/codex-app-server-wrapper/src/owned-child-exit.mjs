// A child may terminate during readiness checks, before the owner starts waiting.
export function waitForOwnedChildExit(child, reason) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(reason);
  return new Promise(resolveExit => {
    const finished = () => {
      child.off("exit", finished);
      child.off("error", finished);
      resolveExit(reason);
    };
    child.once("exit", finished);
    child.once("error", finished);
  });
}
