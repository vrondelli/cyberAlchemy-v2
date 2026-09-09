// Success feedback expires without re-rendering the user's active form.
export function createSuccessDismissal({read, dismiss, schedule = setTimeout, cancel = clearTimeout}) {
  let timer, generation = 0;
  function stop() { generation++; if (timer !== undefined) cancel(timer); timer = undefined; }
  return {
    cancel: stop,
    start(expected = 'Done.') {
      stop();
      const current = generation;
      timer = schedule(() => {
        if (current !== generation) return;
        timer = undefined;
        const state = read();
        if (!state.busy && !state.error && state.notice === expected) dismiss();
      }, 3500);
    }
  };
}
