// File: src/components/PresentationUI.jsx
import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, Line as ReLine,
} from "recharts";
import { THEMES, DISPLAY_FONT, TEXT_FONT, formatNum } from "../utils/dataAnalysis"; // Import utilities and themes

/* ================= Utilities (for UI) ================= */
const colorNumbers = (txt, color) =>
  String(txt).replace(
    /(\$?\b\d[\d,]*(?:\.\d+)?%?\b)/g,
    `<span style="color:${color};font-weight:700">$1</span>`
  );

/* ================= Charts ================= */
export const CorrelationMatrix = ({ correlations, theme }) => {
  const data = correlations.map((c) => ({
    relationship: `${c.a} vs ${c.b}`,
    correlation: c.r,
    color: c.r > 0.7 ? theme.accent : c.r > 0.4 ? theme.accent2 : theme.accent3,
  }));
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 20, right: 30, left: 120, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={[-1, 1]} />
        <YAxis type="category" dataKey="relationship" />
        <Tooltip formatter={(v) => Number(v).toFixed(3)} />
        <Bar dataKey="correlation" fill="#8884d8">
          {data.map((e, i) => (
            <cell key={i} fill={e.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export const CategoryPerformanceChart = ({ data, theme }) => (
  <ResponsiveContainer width="100%" height={320}>
    <BarChart
      data={data.slice(0, 8)}
      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
      <YAxis yAxisId="left" />
      <YAxis yAxisId="right" orientation="right" />
      <Tooltip />
      <Bar yAxisId="left" dataKey="sum" fill={theme.accent} name="Total" />
      <Bar yAxisId="right" dataKey="avg" fill={theme.accent2} name="Average" />
    </BarChart>
  </ResponsiveContainer>
);

export const DistributionChart = ({ data, theme }) => (
  <ResponsiveContainer width="100%" height={320}>
    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="range" />
      <YAxis />
      <Tooltip formatter={(v) => `${v}%`} />
      <Bar dataKey="percentage" fill={theme.accent} name="Percentage" />
    </BarChart>
  </ResponsiveContainer>
);

/* ================= UI Primitives ================= */
export const SlideFrame = ({ children, bg, theme, first = false, id }) => (
  <div
    id={id}
    data-first-slide={first ? "1" : undefined}
    className="rounded-2xl shadow-lg overflow-hidden"
    style={{
      width: "960px",
      height: "540px",
      background: bg || theme.pageBg,
      border: "1px solid rgba(255,255,255,0.08)",
    }}
  >
    {children}
  </div>
);

export const HeroSlide = ({ title, subtitle, theme }) => (
  <SlideFrame bg={theme.heroGradient} first theme={theme}>
    <div
      style={{
        padding: 40,
        color: theme.pageText,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      <div
        style={{
          fontSize: 46,
          fontWeight: 800,
          letterSpacing: -0.5,
          marginBottom: 12,
          fontFamily: DISPLAY_FONT,
          lineHeight: 1.1,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 16, opacity: 0.85, fontFamily: TEXT_FONT }}>
        {subtitle}
      </div>
    </div>
  </SlideFrame>
);

export const Bullets = ({ items, theme, highlightNumbers = false }) => (
  <ul
    style={{
      paddingLeft: 24,
      listStyle: "disc",
      lineHeight: "28px",
      fontSize: 18,
      color: theme.pageText,
      fontFamily: TEXT_FONT,
    }}
  >
    {items.map((p, i) => (
      <li
        key={i}
        style={{ marginBottom: 8 }}
        {...(highlightNumbers
          ? {
              dangerouslySetInnerHTML: {
                __html: colorNumbers(p, theme.accent),
              },
            }
          : { children: p })}
      />
    ))}
  </ul>
);

export const ChartPanel = ({ children, insight, theme }) => (
  <div
    style={{
      width: "100%",
      height: 360,
      background: theme.chartPanelBg,
      borderRadius: 14,
      padding: 16,
      position: "relative",
    }}
  >
    {insight && (
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          padding: "4px 8px",
          borderRadius: 4,
          fontSize: 12,
          zIndex: 10,
        }}
      >
        {insight}
      </div>
    )}
    {children}
  </div>
);


// Component for the Top Segments Bar Chart
export const SegmentBarChart = ({ data, topCatCol, theme, nRows }) => {
    const top3 = data.slice(0, 3).reduce((s, c) => s + c.value, 0);
    const insight = `Top ${Math.min(3, data.length)} = ${Math.round((top3 / nRows) * 100)}%`;

    return (
        <ChartPanel insight={insight} theme={theme} id="chart-segments">
            <ResponsiveContainer>
                <BarChart
                    data={data}
                    margin={{ top: 8, right: 24, left: 0, bottom: 24 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="name"
                        angle={-25}
                        textAnchor="end"
                        height={60}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill={theme.accent} />
                </BarChart>
            </ResponsiveContainer>
        </ChartPanel>
    );
};

// Component for the Time Series Line Chart
export const TimeSeriesChart = ({ data, dateCol, theme }) => {
    const isGrowing = data[data.length - 1].value > data[0].value;
    const insight = `Trend: ${isGrowing ? "↗ Growing" : "↘ Declining"}`;

    return (
        <ChartPanel insight={insight} theme={theme} id="chart-trend">
            <ResponsiveContainer>
                <LineChart
                    data={data}
                    margin={{ top: 8, right: 24, left: 0, bottom: 24 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="period"
                        angle={-25}
                        textAnchor="end"
                        height={60}
                    />
                    <YAxis />
                    <Tooltip />
                    <ReLine
                        type="monotone"
                        dataKey="value"
                        stroke={theme.accent}
                        dot={false}
                        strokeWidth={3}
                    />
                </LineChart>
            </ResponsiveContainer>
        </ChartPanel>
    );
};