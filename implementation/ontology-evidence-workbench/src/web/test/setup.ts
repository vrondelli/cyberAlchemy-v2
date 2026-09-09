Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }),
});
class ResizeObserverMock { observe() {} unobserve() {} disconnect() {} }
Object.defineProperty(window, "ResizeObserver", { writable: true, value: ResizeObserverMock });
Object.defineProperty(globalThis, "ResizeObserver", { writable: true, value: ResizeObserverMock });
