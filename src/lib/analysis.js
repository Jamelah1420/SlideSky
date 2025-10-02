// src/lib/analysis.js
/* ================= Utilities ================= */
export const DISPLAY_FONT = "'Fraunces', ui-serif";
export const TEXT_FONT = "'Inter', ui-sans-serif";

export const stripEmojis = (s) =>
  String(s || "")
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\u24C2|[\uD83C-\uDBFF][\uDC00-\uDFFF]|[\u2011-\u26FF]|\uFE0F|\u200D)/g, "")
    .trim();

export const colorNumbers = (txt, color) =>
  String(txt).replace(
    /(\$?\b\d[\d,]*(?:\.\d+)?%?\b)/g,
    `<span style="color:${color};font-weight:700">$1</span>`
  );

export const toNumber = (v) => {
  const s = String(v ?? "").replace(/[, ]/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
};

export function formatNum(n) {
  if (!Number.isFinite(n)) return "-";
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/* ================= Analysis helpers ================= */
export const detectTypes = (rows) => {
  if (!rows.length) return { numeric: [], categorical: [], dateCols: [] };
  const headers = Object.keys(rows[0]);
  const numeric = [], categorical = [], dateCols = [];
  const sampleSize = Math.min(200, rows.length);
  headers.forEach((h) => {
    const sample = rows.slice(0, sampleSize).map((r) => r[h]);
    const valid = sample.filter((x) => x !== "" && x != null && String(x).trim() !== "");
    if (valid.length < 5) return;
    const nums = valid.filter((x) => Number.isFinite(toNumber(x))).length;
    const dates = valid.filter((x) => {
      const d = new Date(x);
      return d.toString() !== "Invalid Date" && d.getFullYear() > 1900;
    }).length;
    const uniq = new Set(valid.map((x) => String(x).slice(0, 100))).size;
    const dateRatio = dates / valid.length, numRatio = nums / valid.length;
    if (dateRatio >= 0.3 && dates >= 10) dateCols.push(h);
    else if (numRatio >= 0.6 && nums >= 10) numeric.push(h);
    else if (uniq > 1 && uniq <= Math.min(50, valid.length * 0.3)) categorical.push(h);
  });
  return { numeric, categorical, dateCols };
};

export const groupCount = (rows, col) => {
  const m = new Map();
  rows.forEach((r) => {
    const k = String(r[col] ?? "").trim() || "(blank)";
    m.set(k, (m.get(k) || 0) + 1);
  });
  return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
};

export const monthlyTrend = (rows, dateCol) => {
  const m = new Map();
  rows.forEach((r) => {
    const t = Date.parse(r[dateCol]);
    if (!Number.isFinite(t)) return;
    const d = new Date(t);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    m.set(k, (m.get(k) || 0) + 1);
  });
  return Array.from(m.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1));
};

export const corr = (xs, ys) => {
  let n = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
  for (let i = 0; i < xs.length; i++) {
    const x = toNumber(xs[i]), y = toNumber(ys[i]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    n++; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y;
  }
  if (n < 3) return NaN;
  const cov = sxy / n - (sx / n) * (sy / n);
  const vx = sxx / n - (sx / n) ** 2;
  const vy = syy / n - (sy / n) ** 2;
  const den = Math.sqrt(vx * vy);
  return den > 0 ? cov / den : NaN;
};

export const bestNumericPair = (rows, nums) => {
  let best = null;
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      const a = nums[i], b = nums[j];
      const r = Math.abs(corr(rows.map((r) => r[a]), rows.map((r) => r[b])));
      if (Number.isFinite(r) && r > 0.3 && (!best || r > best.r)) best = { a, b, r };
    }
  }
  return best;
};

export const quickKPIs = (rows, nums) => {
  const out = [];
  nums.slice(0, 5).forEach((c) => {
    const values = rows.map((r) => toNumber(r[c])).filter(Number.isFinite);
    if (values.length < 3) return;
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lb = q1 - 1.5 * iqr, ub = q3 + 1.5 * iqr;
    const clean = values.filter((v) => v >= lb && v <= ub);
    const final = clean.length >= values.length * 0.7 ? clean : values;
    const sum = final.reduce((a, b) => a + b, 0);
    const avg = sum / final.length;
    const std = Math.sqrt(final.reduce((s, n) => s + (n - avg) * (n - avg), 0) / final.length);
    const min = Math.min(...final), max = Math.max(...final);
    out.push({ name: c, sum, avg, std, min, max, n: final.length, outlierRatio: (values.length - final.length) / values.length });
  });
  return out.sort((a, b) => b.sum - a.sum);
};

export const findTopCorrelations = (rows, numericCols, topN = 5) => {
  const correlations = [];
  for (let i = 0; i < numericCols.length; i++) {
    for (let j = i + 1; j < numericCols.length; j++) {
      const a = numericCols[i], b = numericCols[j];
      const rVal = corr(rows.map((r) => r[a]), rows.map((r) => r[b]));
      if (Number.isFinite(rVal) && Math.abs(rVal) > 0.3)
        correlations.push({ a, b, r: rVal, absR: Math.abs(rVal) });
    }
  }
  return correlations.sort((x, y) => y.absR - x.absR).slice(0, topN);
};

export const calculateCategoryKPIs = (rows, categoryCol, valueCol) => {
  const m = new Map();
  rows.forEach((r) => {
    const cat = String(r[categoryCol] || "Unknown");
    const val = toNumber(r[valueCol]);
    if (!Number.isFinite(val)) return;
    if (!m.has(cat)) m.set(cat, { sum: 0, count: 0, values: [] });
    const g = m.get(cat);
    g.sum += val; g.count++; g.values.push(val);
  });
  return Array.from(m.entries())
    .map(([category, data]) => ({
      category,
      sum: data.sum,
      avg: data.sum / data.count,
      count: data.count,
      min: Math.min(...data.values),
      max: Math.max(...data.values),
    }))
    .sort((a, b) => b.sum - a.sum);
};

export const detectSeasonality = (trendData) => {
  if (trendData.length < 6) return null;
  const monthly = {};
  trendData.forEach((t) => {
    const month = t.period.split("-")[1];
    (monthly[month] ||= []).push(t.value);
  });
  const seasonality = Object.entries(monthly)
    .map(([m, vals]) => ({ month: parseInt(m), average: vals.reduce((a, b) => a + b, 0) / vals.length }))
    .sort((a, b) => a.month - b.month);
  return seasonality.length >= 3 ? seasonality : null;
};

export const findDataDistribution = (rows, numericCol) => {
  const values = rows.map((r) => toNumber(r[numericCol])).filter(Number.isFinite);
  if (values.length < 10) return null;
  const bins = 5;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min, binSize = range / bins || 1;
  return Array(bins).fill(0).map((_, i) => {
    const lower = min + i * binSize;
    const upper = i === bins - 1 ? max : lower + binSize;
    const count = values.filter((v) => (i === bins - 1 ? v >= lower && v <= upper : v >= lower && v < upper)).length;
    return { range: `${formatNum(lower)}-${formatNum(upper)}`, count, percentage: (count / values.length) * 100 };
  });
};

export const variance = (vals) => {
  const v = vals.filter(Number.isFinite);
  if (v.length < 3) return 0;
  const m = v.reduce((a, b) => a + b, 0) / v.length;
  return v.reduce((s, x) => s + (x - m) * (x - m), 0) / v.length;
};

export const rankRelationships = (rows, numericCols) => {
  const rels = [];
  for (let i = 0; i < numericCols.length; i++) {
    for (let j = i + 1; j < numericCols.length; j++) {
      const a = numericCols[i], b = numericCols[j];
      const xs = rows.map((r) => toNumber(r[a]));
      const ys = rows.map((r) => toNumber(r[b]));
      const rVal = corr(xs, ys);
      if (!Number.isFinite(rVal) || Math.abs(rVal) < 0.3) continue;
      const vA = variance(xs), vB = variance(ys);
      const covg = Math.min(xs.filter(Number.isFinite).length, ys.filter(Number.isFinite).length) / rows.length;
      const score = Math.abs(rVal) * Math.sqrt(vA * vB) * Math.sqrt(covg);
      rels.push({ a, b, r: rVal, score });
    }
  }
  return rels.sort((x, y) => y.score - x.score).slice(0, 8);
};

export const topBottomSegments = (categoryKPIs) => {
  const bySum = [...categoryKPIs].sort((a, b) => b.sum - a.sum);
  const byAvg = [...categoryKPIs].sort((a, b) => b.avg - a.avg);
  return {
    topSum: bySum.slice(0, 5),
    bottomSum: bySum.slice(-5).reverse(),
    topAvg: byAvg.slice(0, 5),
    bottomAvg: byAvg.slice(-5).reverse(),
  };
};

export const detectAnomalies = (trend) => {
  if (!trend || trend.length < 8) return [];
  const vals = trend.map((t) => t.value);
  const m = vals.reduce((a, b) => a + b, 0) / vals.length;
  const sd = Math.sqrt(vals.reduce((s, x) => s + (x - m) * (x - m), 0) / vals.length);
  if (sd === 0) return [];
  return trend.map((t) => ({ ...t, z: (t.value - m) / sd }))
              .filter((x) => Math.abs(x.z) >= 2)
              .sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
};

/* ================= Data Validation ================= */
export const validateData = (rows) => {
  if (!rows || !Array.isArray(rows) || rows.length === 0) return ["No valid data found"];
  const issues = [];
  const headers = Object.keys(rows[0]);
  if (rows.length < 5) issues.push("Dataset too small for meaningful analysis (minimum 5 records required)");
  headers.forEach((h) => {
    const nonEmpty = rows.filter((r) => r[h] !== "" && r[h] != null).length;
    if (nonEmpty < rows.length * 0.1) issues.push(`Column "${h}" has >90% empty values`);
  });
  return issues;
};

/* ================= Profile ================= */
export const buildProfile = (rows) => {
  const { numeric, categorical, dateCols } = detectTypes(rows);
  const kpis = quickKPIs(rows, numeric);
  const topCatCol = categorical[0];
  const topCats = topCatCol ? groupCount(rows, topCatCol).slice(0, 6).map(([k, v]) => ({ name: k, value: v })) : [];
  const dateCol = dateCols[0];
  const trend = dateCol ? monthlyTrend(rows, dateCol).map(([k, v]) => ({ period: k, value: v })) : [];
  const pair = bestNumericPair(rows, numeric);
  const cols = rows[0] ? Object.keys(rows[0]) : [];

  const topCorrelations = findTopCorrelations(rows, numeric, 5);
  const seasonality = dateCol ? detectSeasonality(trend) : null;
  const categoryKPIs = categorical.length && numeric.length ? calculateCategoryKPIs(rows, categorical[0], numeric[0]) : [];
  const distribution = numeric.length ? findDataDistribution(rows, numeric[0]) : null;
  const rankedRelationships = rankRelationships(rows, numeric);
  const extremes = categoryKPIs.length ? topBottomSegments(categoryKPIs) : null;
  const anomalies = detectAnomalies(trend);

  return {
    numeric, categorical, dateCols, dateCol,
    kpis, topCatCol, topCats, trend, pair,
    nRows: rows.length, nCols: cols.length, cols,
    topCorrelations, seasonality, categoryKPIs, distribution,
    rankedRelationships, extremes, anomalies,
  };
};

export const fallbackOutline = (title, p, rows) => ({
  title: title || `Comprehensive Analysis of ${p.nRows.toLocaleString()} Records`,
  slides: [
    {
      slideTitle: "Executive Summary",
      points: [
        `Scope: ${p.nRows.toLocaleString()} rows × ${p.nCols} columns`,
        p.kpis.length ? `Key metrics: ${p.kpis.map((k) => `${k.name} (${formatNum(k.avg)})`).join(", ")}` : "Quant analysis limited",
        p.topCatCol ? `Top segment: ${p.topCats[0]?.name} (${Math.round((p.topCats[0]?.value / p.nRows) * 100)}% share)` : "Segmentation available",
        p.topCorrelations.length ? `Strongest: ${p.topCorrelations[0]?.a} vs ${p.topCorrelations[0]?.b} (r=${p.topCorrelations[0]?.r.toFixed(3)})` : "Relationships pending",
      ],
    },
  ],
});
