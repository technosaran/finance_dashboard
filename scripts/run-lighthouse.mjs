import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { chromium } from '@playwright/test';

const baseUrl = process.argv[2] || process.env.LIGHTHOUSE_BASE_URL || 'http://localhost:3000';

const targets = [
  { path: '/login', label: 'Login' },
  { path: '/qa/smoke', label: 'QA Smoke Harness' },
];

const thresholds = {
  lcp: 3500,
  cls: 0.1,
  inp: 200,
  performanceScore: 0.7,
  accessibilityScore: 0.9,
};
const attemptsPerTarget = 3;

function formatMetric(value, digits = 2) {
  return Number(value).toFixed(digits);
}

async function warmTarget(target) {
  const response = await fetch(`${baseUrl}${target.path}`, {
    redirect: 'follow',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Warmup request failed for ${target.label}: ${response.status}`);
  }

  await response.text();
}

async function runAudit(target) {
  const chrome = await launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-insecure-localhost'],
  });

  try {
    const runnerResult = await lighthouse(`${baseUrl}${target.path}`, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices'],
    });

    const lhr = runnerResult.lhr;
    const metrics = {
      lcp: lhr.audits['largest-contentful-paint']?.numericValue ?? null,
      cls: lhr.audits['cumulative-layout-shift']?.numericValue ?? null,
      inp: lhr.audits['interaction-to-next-paint']?.numericValue ?? 0,
      performanceScore: lhr.categories.performance?.score ?? null,
      accessibilityScore: lhr.categories.accessibility?.score ?? null,
    };

    return { label: target.label, metrics, runtimeError: lhr.runtimeError ?? null };
  } finally {
    try {
      await chrome.kill();
    } catch (error) {
      console.warn(`Chrome cleanup warning for ${target.label}: ${error.message}`);
    }
  }
}

function hasCompleteMetrics(result) {
  return (
    !result.runtimeError &&
    result.metrics.lcp !== null &&
    result.metrics.cls !== null &&
    result.metrics.performanceScore !== null &&
    result.metrics.accessibilityScore !== null &&
    Object.values(result.metrics).every(
      (value) => typeof value === 'number' && Number.isFinite(value)
    )
  );
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function aggregateMetrics(label, samples) {
  return {
    label,
    sampleCount: samples.length,
    metrics: {
      lcp: median(samples.map((sample) => sample.lcp)),
      cls: median(samples.map((sample) => sample.cls)),
      inp: median(samples.map((sample) => sample.inp)),
      performanceScore: median(samples.map((sample) => sample.performanceScore)),
      accessibilityScore: median(samples.map((sample) => sample.accessibilityScore)),
    },
  };
}

function evaluateResult(result) {
  const failures = [];

  if (result.metrics.lcp > thresholds.lcp) {
    failures.push(`LCP ${formatMetric(result.metrics.lcp, 0)}ms > ${thresholds.lcp}ms`);
  }

  if (result.metrics.cls > thresholds.cls) {
    failures.push(`CLS ${formatMetric(result.metrics.cls, 3)} > ${thresholds.cls}`);
  }

  if (result.metrics.inp > thresholds.inp) {
    failures.push(`INP ${formatMetric(result.metrics.inp, 0)}ms > ${thresholds.inp}ms`);
  }

  if (result.metrics.performanceScore < thresholds.performanceScore) {
    failures.push(
      `Performance score ${formatMetric(result.metrics.performanceScore)} < ${thresholds.performanceScore}`
    );
  }

  if (result.metrics.accessibilityScore < thresholds.accessibilityScore) {
    failures.push(
      `Accessibility score ${formatMetric(result.metrics.accessibilityScore)} < ${thresholds.accessibilityScore}`
    );
  }

  return failures;
}

const results = [];
for (const target of targets) {
  const samples = [];
  const errors = [];

  for (let attempt = 1; attempt <= attemptsPerTarget; attempt += 1) {
    await warmTarget(target);
    const auditResult = await runAudit(target);

    if (hasCompleteMetrics(auditResult)) {
      samples.push(auditResult.metrics);
      continue;
    }

    errors.push(
      auditResult.runtimeError?.message ||
        `Attempt ${attempt} did not return a complete Lighthouse sample.`
    );
  }

  if (samples.length === 0) {
    console.error(`\n${target.label}`);
    for (const error of errors) {
      console.error(`  Audit error: ${error}`);
    }
    process.exitCode = 1;
    continue;
  }

  if (errors.length > 0) {
    console.warn(`\n${target.label}`);
    console.warn(
      `  Using median of ${samples.length} successful sample(s); ${errors.length} sample(s) were discarded.`
    );
  }

  results.push(aggregateMetrics(target.label, samples));
}

let hasFailures = false;

for (const result of results) {
  console.log(`\n${result.label}`);
  console.log(`  LCP: ${formatMetric(result.metrics.lcp, 0)}ms`);
  console.log(`  CLS: ${formatMetric(result.metrics.cls, 3)}`);
  console.log(`  INP: ${formatMetric(result.metrics.inp, 0)}ms`);
  console.log(`  Performance: ${formatMetric(result.metrics.performanceScore)}`);
  console.log(`  Accessibility: ${formatMetric(result.metrics.accessibilityScore)}`);

  const failures = evaluateResult(result);
  if (failures.length > 0) {
    hasFailures = true;
    for (const failure of failures) {
      console.error(`  FAIL: ${failure}`);
    }
  }
}

if (hasFailures || process.exitCode === 1) {
  process.exitCode = 1;
} else {
  console.log('\nLighthouse thresholds passed.');
}
