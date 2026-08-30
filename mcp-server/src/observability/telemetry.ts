type MetricLabels = Record<string, string | number>;

const counters = new Map<string, number>();
const histograms = new Map<string, number[]>();

function key(name: string, labels: MetricLabels): string {
  const parts = Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`);
  return `${name}{${parts.join(",")}}`;
}

export function incrementCounter(
  name: string,
  labels: MetricLabels = {},
  delta = 1,
): void {
  const k = key(name, labels);
  counters.set(k, (counters.get(k) ?? 0) + delta);
}

export function recordHistogram(
  name: string,
  valueMs: number,
  labels: MetricLabels = {},
): void {
  const k = key(name, labels);
  const arr = histograms.get(k) ?? [];
  arr.push(valueMs);
  histograms.set(k, arr);
}

export function getMetricsSnapshot(): {
  counters: Record<string, number>;
  histograms: Record<string, { count: number; avgMs: number }>;
} {
  const histOut: Record<string, { count: number; avgMs: number }> = {};
  for (const [k, values] of histograms) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    histOut[k] = { count: values.length, avgMs: Math.round(avg) };
  }
  return {
    counters: Object.fromEntries(counters),
    histograms: histOut,
  };
}

let otelEnabled = false;

export async function initTelemetry(): Promise<void> {
  otelEnabled = process.env.OTEL_ENABLED === "true";
  if (otelEnabled) {
    console.log(
      JSON.stringify({
        level: "info",
        msg: "OpenTelemetry enabled — export via OTEL_EXPORTER_OTLP_ENDPOINT",
      }),
    );
  }
}

export function isOtelEnabled(): boolean {
  return otelEnabled;
}
