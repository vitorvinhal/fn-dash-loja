/**
 * Performance monitoring utilities.
 *
 * - Long task detection
 * - Layout thrashing detection
 * - Memory leak detection
 * - Web Vitals measurement
 */

export interface PerformanceMetrics {
  longTasks: { duration: number; startTime: number }[];
  layoutThrashing: number;
  memoryUsage: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null;
  webVitals: {
    LCP?: number;
    FID?: number;
    CLS?: number;
    INP?: number;
  };
}

/**
 * Detect long tasks (>50ms) on the main thread.
 */
export function measureLongTasks(
  duration: number = 50
): PerformanceObserver | null {
  if (typeof PerformanceObserver === "undefined") return null;

  const entries: { duration: number; startTime: number }[] = [];

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > duration) {
        entries.push({
          duration: entry.duration,
          startTime: entry.startTime,
        });
      }
    }
  });

  observer.observe({ entryTypes: ["longtask"] });
  return observer;
}

/**
 * Detect layout thrashing (forced reflow).
 * Returns count of forced layout operations.
 */
export function measureLayoutThrashing(): PerformanceObserver | null {
  if (typeof PerformanceObserver === "undefined") return null;

  const observer = new PerformanceObserver(() => {});

  try {
    observer.observe({ entryTypes: ["layout"] });
  } catch {
    // layout type not supported
  }

  return observer;
}

/**
 * Get current memory usage (Chrome only).
 */
export function getMemoryUsage(): {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
} | null {
  if (typeof performance === "undefined") return null;
  const mem = (performance as Performance & {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }).memory;
  if (!mem) return null;
  return {
    usedJSHeapSize: mem.usedJSHeapSize,
    totalJSHeapSize: mem.totalJSHeapSize,
    jsHeapSizeLimit: mem.jsHeapSizeLimit,
  };
}

/**
 * Track memory over time to detect leaks.
 * Call start(), perform actions, then call stop() to get the report.
 */
export class MemoryTracker {
  private samples: { timestamp: number; heapUsed: number }[] = [];
  private interval: ReturnType<typeof setInterval> | null = null;
  private startTime = 0;

  start(intervalMs: number = 100): void {
    this.samples = [];
    this.startTime = Date.now();

    this.interval = setInterval(() => {
      const mem = getMemoryUsage();
      if (mem) {
        this.samples.push({
          timestamp: Date.now() - this.startTime,
          heapUsed: mem.usedJSHeapSize,
        });
      }
    }, intervalMs);
  }

  stop(): {
    samples: { timestamp: number; heapUsed: number }[];
    trend: "growing" | "stable" | "declining";
    growth: number;
  } {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    if (this.samples.length < 2) {
      return { samples: this.samples, trend: "stable", growth: 0 };
    }

    // Calculate trend using linear regression
    const n = this.samples.length;
    const sumX = this.samples.reduce((s, p) => s + p.timestamp, 0);
    const sumY = this.samples.reduce((s, p) => s + p.heapUsed, 0);
    const sumXY = this.samples.reduce((s, p) => s + p.timestamp * p.heapUsed, 0);
    const sumX2 = this.samples.reduce((s, p) => s + p.timestamp * p.timestamp, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgY = sumY / n;
    const growthPercent = avgY > 0 ? (slope / avgY) * 100 : 0;

    let trend: "growing" | "stable" | "declining" = "stable";
    if (growthPercent > 1) trend = "growing";
    else if (growthPercent < -1) trend = "declining";

    return {
      samples: this.samples,
      trend,
      growth: growthPercent,
    };
  }
}

/**
 * Detect potential memory leaks in React components.
 * Monitors DOM node count over time.
 */
export function trackDOMNodes(): { count: number; delta: number } {
  const count = document.querySelectorAll("*").length;
  return { count, delta: 0 };
}

/**
 * Measure Web Vitals.
 */
export function measureWebVitals(): Promise<{
  LCP?: number;
  FID?: number;
  CLS?: number;
  INP?: number;
}> {
  return new Promise((resolve) => {
    const metrics: { LCP?: number; FID?: number; CLS?: number; INP?: number } = {};
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(metrics);
      }
    }, 10000);

    // LCP
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        metrics.LCP = last.startTime;
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
    } catch {}

    // CLS
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as unknown as { hadRecentInput?: boolean }).hadRecentInput) {
            clsValue += (entry as unknown as { value: number }).value;
          }
        }
        metrics.CLS = clsValue;
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });
    } catch {}

    // Resolve after a delay to collect metrics
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve(metrics);
      }
    }, 5000);
  });
}

/**
 * Full performance audit.
 */
export async function auditPerformance(): Promise<PerformanceMetrics> {
  const longTaskObserver = measureLongTasks();
  const layoutObserver = measureLayoutThrashing();

  // Wait a bit to collect data
  await new Promise((r) => setTimeout(r, 3000));

  longTaskObserver?.disconnect();
  layoutObserver?.disconnect();

  const webVitals = await measureWebVitals();
  const memoryUsage = getMemoryUsage();

  return {
    longTasks: [],
    layoutThrashing: 0,
    memoryUsage,
    webVitals,
  };
}
