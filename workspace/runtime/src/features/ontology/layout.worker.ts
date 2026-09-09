/// <reference lib="webworker" />

import { computeLayout, type LayoutInput } from "./layout";

interface LayoutRequest {
  requestId: number;
  input: LayoutInput;
}

self.onmessage = (event: MessageEvent<LayoutRequest>) => {
  self.postMessage({ requestId: event.data.requestId, result: computeLayout(event.data.input) });
};

export {};
