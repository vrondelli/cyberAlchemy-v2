// Route focus is also the route announcement; avoid a duplicate live message.
// Open questions: README.md#navigation-and-focus.
export function focusRouteHeading(root: ParentNode): boolean {
 const heading = [...root.querySelectorAll<HTMLElement>('h1')].find(node => node.getClientRects().length > 0);
 if (!heading) return false;
 heading.tabIndex = -1;
 heading.focus({preventScroll: true});
 heading.scrollIntoView({block: 'start', behavior: 'instant'});
 return true;
}
export function waitForRouteHeading(root: HTMLElement | ShadowRoot): () => void {
 if (focusRouteHeading(root)) return () => {};
 const observer = new MutationObserver(() => {
  if (focusRouteHeading(root)) observer.disconnect();
 });
 observer.observe(root, {childList: true, subtree: true});
 return () => observer.disconnect();
}
