import { NodeSDK } from "@opentelemetry/sdk-node";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";

let sdk: NodeSDK | undefined;

/**
 * Initialize the OpenTelemetry SDK with Prometheus exporter.
 * Call once at application startup, before any instrument usage.
 * Exposes metrics at :9464/metrics by default.
 */
export const initTelemetry = (): void => {
  if (sdk) return;

  const prometheusExporter = new PrometheusExporter({
    port: 9464,
    preventServerStart: false,
  });

  sdk = new NodeSDK({
    metricReader: prometheusExporter,
  });

  sdk.start();
};

export const shutdownTelemetry = async (): Promise<void> => {
  if (sdk) {
    await sdk.shutdown();
    sdk = undefined;
  }
};
