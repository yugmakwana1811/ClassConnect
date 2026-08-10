"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, LoaderCircle, Users } from "lucide-react";

type Assessment = { id: string; label: string; date: string };
type Student = {
  id: string;
  name: string;
  average: number | null;
  latestScore: number | null;
  assessedCount: number;
  trend: "Improving" | "Needs support" | "Steady" | "Not assessed yet";
  points: Array<{ assessmentId: string; percentage: number | null }>;
};
type ProgressPayload = { assessments: Assessment[]; students: Student[] };

const SERIES_COLORS = [
  "#0f766e",
  "#5557d9",
  "#d06f62",
  "#ba8a21",
  "#2774a8",
  "#9059a3",
  "#4b8f49",
  "#72544b",
];

function trendColor(trend: Student["trend"]) {
  if (trend === "Improving") return "var(--teal)";
  if (trend === "Needs support") return "var(--coral)";
  return "var(--muted)";
}

export function StudentProgressGraph() {
  const [data, setData] = useState<ProgressPayload | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProgress() {
      try {
        const response = await fetch("/api/student-progress", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Progress request failed");
        setData((await response.json()) as ProgressPayload);
      } catch (loadError) {
        if (!(loadError instanceof DOMException && loadError.name === "AbortError")) {
          setError(true);
        }
      }
    }

    void loadProgress();
    return () => controller.abort();
  }, []);

  const chart = useMemo(() => {
    if (!data?.assessments.length) return null;
    const width = 760;
    const height = 350;
    const left = 52;
    const right = 18;
    const top = 20;
    const bottom = 66;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const xFor = (index: number) =>
      left +
      (data.assessments.length === 1
        ? plotWidth / 2
        : (index / (data.assessments.length - 1)) * plotWidth);
    const yFor = (score: number) => top + ((100 - score) / 100) * plotHeight;
    const positions = new Map(
      data.assessments.map((assessment, index) => [assessment.id, xFor(index)]),
    );

    return { width, height, left, right, top, bottom, plotHeight, xFor, yFor, positions };
  }, [data]);

  return (
    <section className="card card-pad" style={{ marginTop: "1rem" }}>
      <div className="panel-head">
        <div>
          <div className="eyebrow">Pandas progress analysis</div>
          <h2 style={{ margin: ".3rem 0 0" }}>Every student, across assessed work</h2>
        </div>
        <BarChart3 color="var(--teal)" />
      </div>
      <p className="hint" style={{ marginTop: ".35rem" }}>
        The chart combines published assignment results and completed quizzes. It shows up to the 12 latest scored activities and keeps students with no marked work visible.
      </p>

      {!data && !error ? (
        <div className="hint" aria-live="polite" style={{ display: "flex", gap: ".55rem", alignItems: "center", minHeight: 240 }}>
          <LoaderCircle size={18} style={{ animation: "loading-spin .9s linear infinite" }} /> Analysing classroom progress…
        </div>
      ) : null}

      {error ? (
        <div className="hint" role="status" style={{ minHeight: 120, display: "grid", placeItems: "center" }}>
          Student progress is temporarily unavailable. Refresh to try again.
        </div>
      ) : null}

      {data && !data.students.length ? (
        <div className="empty-state" style={{ marginTop: "1rem" }}>
          <Users size={24} color="var(--teal)" />
          <strong>No enrolled students yet</strong>
          <span>Enroll learners in a class to begin tracking progress.</span>
        </div>
      ) : null}

      {data && data.students.length && !data.assessments.length ? (
        <div className="empty-state" style={{ marginTop: "1rem" }}>
          <BarChart3 size={24} color="var(--teal)" />
          <strong>Waiting for scored work</strong>
          <span>Every enrolled student is ready to appear here after a published result or quiz attempt.</span>
        </div>
      ) : null}

      {data && chart && data.assessments.length ? (
        <>
          <div style={{ overflowX: "auto", paddingBottom: ".5rem" }}>
            <svg
              viewBox={`0 0 ${chart.width} ${chart.height}`}
              role="img"
              aria-label="Student progress graph showing percentage scores across recent assessed work"
              style={{ display: "block", minWidth: 640, width: "100%", height: "auto" }}
            >
              {[0, 25, 50, 75, 100].map((score) => {
                const y = chart.yFor(score);
                return (
                  <g key={score}>
                    <line x1={chart.left} x2={chart.width - chart.right} y1={y} y2={y} stroke="var(--line)" strokeDasharray={score === 0 ? "0" : "3 4"} />
                    <text x={chart.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{score}%</text>
                  </g>
                );
              })}
              {data.assessments.map((assessment, index) => {
                const x = chart.xFor(index);
                const showLabel = data.assessments.length <= 6 || index === 0 || index === data.assessments.length - 1 || index % 2 === 0;
                return (
                  <g key={assessment.id}>
                    <line x1={x} x2={x} y1={chart.top} y2={chart.top + chart.plotHeight} stroke="rgba(191, 208, 220, .48)" />
                    {showLabel ? <text x={x} y={chart.height - 43} textAnchor="end" transform={`rotate(-35 ${x} ${chart.height - 43})`} fontSize="10" fill="var(--muted)">{assessment.label}</text> : null}
                  </g>
                );
              })}
              {data.students.map((student, index) => {
                const color = SERIES_COLORS[index % SERIES_COLORS.length];
                const points = student.points
                  .filter((point): point is { assessmentId: string; percentage: number } => point.percentage !== null && chart.positions.has(point.assessmentId))
                  .map((point) => `${chart.positions.get(point.assessmentId)},${chart.yFor(point.percentage)}`)
                  .join(" ");
                return (
                  <g key={student.id}>
                    {points ? <polyline points={points} fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" /> : null}
                    {student.points.map((point) => {
                      if (point.percentage === null || !chart.positions.has(point.assessmentId)) return null;
                      return <circle key={point.assessmentId} cx={chart.positions.get(point.assessmentId)} cy={chart.yFor(point.percentage)} r="3.7" fill={color} stroke="white" strokeWidth="1.2" />;
                    })}
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="grid-auto" style={{ marginTop: "1rem" }}>
            {data.students.map((student, index) => (
              <article key={student.id} style={{ borderLeft: `3px solid ${SERIES_COLORS[index % SERIES_COLORS.length]}`, padding: ".55rem .7rem", background: "var(--surface-subtle)", borderRadius: 8 }}>
                <Link href={`/teacher/students/${student.id}`} prefetch={false} style={{ fontWeight: 850 }}>{student.name}</Link>
                <div className="hint" style={{ display: "flex", justifyContent: "space-between", gap: ".5rem", marginTop: ".2rem" }}>
                  <span>{student.average === null ? "Not assessed" : `${student.average}% average`}</span>
                  <span style={{ color: trendColor(student.trend), fontWeight: 750 }}>{student.trend}</span>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
