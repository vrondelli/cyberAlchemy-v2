import { resolve } from "node:path";
import {appBinaryPath} from "./preflight.mjs";

export const config = {
  runner: "local",
  specs: [resolve("wdio/specs/unified-workspace.e2e.mjs")],
  maxInstances: 1,
  capabilities: [
    {
      browserName: "tauri",
      "tauri:options": {
        application: appBinaryPath,
      },
    },
  ],
  logLevel: "warn",
  bail: 1,
  waitforTimeout: 15_000,
  connectionRetryTimeout: 120_000,
  connectionRetryCount: 1,
  framework: "mocha",
  reporters: ["spec"],
  mochaOpts: {
    timeout: 180_000,
  },
  services: [
    [
      "tauri",
      {
        appBinaryPath,
        driverProvider: "embedded",
        embeddedPort: 4445,
        captureBackendLogs: true,
      },
    ],
  ],
};
