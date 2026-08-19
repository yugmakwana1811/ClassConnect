"""Pandas transformations for the teacher-only student progress graph."""

from __future__ import annotations

from typing import Any

import pandas as pd


def _number(value: Any) -> float | None:
    if value is None or pd.isna(value):
        return None
    return round(float(value), 1)


def aggregate_student_progress(
    students: list[dict[str, Any]], records: list[dict[str, Any]]
) -> dict[str, list[dict[str, Any]]]:
    """Return a compact, chart-ready view of the latest assessed work.

    The caller provides only students enrolled in the authenticated teacher's
    classes. pandas handles ordering, duplicate quiz attempts, score clipping,
    and per-student summaries before the payload leaves the server.
    """

    roster = pd.DataFrame(students, columns=["student_id", "student_name"])
    if roster.empty:
        return {"assessments": [], "students": []}

    roster = roster.drop_duplicates(subset=["student_id"]).sort_values(
        "student_name", kind="stable"
    )
    frame = pd.DataFrame(
        records,
        columns=[
            "student_id",
            "assessment_id",
            "assessment_title",
            "assessed_at",
            "percentage",
        ],
    )

    if frame.empty:
        return {
            "assessments": [],
            "students": [
                {
                    "id": row.student_id,
                    "name": row.student_name,
                    "average": None,
                    "latestScore": None,
                    "assessedCount": 0,
                    "trend": "Not assessed yet",
                    "points": [],
                }
                for row in roster.itertuples(index=False)
            ],
        }

    frame["assessed_at"] = pd.to_datetime(frame["assessed_at"], errors="coerce")
    frame["percentage"] = pd.to_numeric(frame["percentage"], errors="coerce").clip(
        lower=0, upper=100
    )
    frame = frame.dropna(
        subset=["student_id", "assessment_id", "assessment_title", "assessed_at", "percentage"]
    ).sort_values(["assessed_at", "assessment_title"], kind="stable")
    frame = frame.drop_duplicates(
        subset=["student_id", "assessment_id"], keep="last"
    )

    latest_assessments = (
        frame[["assessment_id", "assessment_title", "assessed_at"]]
        .drop_duplicates(subset=["assessment_id"], keep="last")
        .sort_values(["assessed_at", "assessment_title"], kind="stable")
        .tail(12)
    )
    visible_ids = set(latest_assessments["assessment_id"].tolist())
    frame = frame[frame["assessment_id"].isin(visible_ids)].copy()
    frame = frame.sort_values(["assessed_at", "assessment_title"], kind="stable")

    assessments = [
        {
            "id": row.assessment_id,
            "label": row.assessment_title,
            "date": row.assessed_at.date().isoformat(),
        }
        for row in latest_assessments.itertuples(index=False)
    ]
    points_by_student = {
        student_id: group
        for student_id, group in frame.groupby("student_id", sort=False)
    }
    result: list[dict[str, Any]] = []

    for student in roster.itertuples(index=False):
        progress = points_by_student.get(student.student_id)
        if progress is None or progress.empty:
            result.append(
                {
                    "id": student.student_id,
                    "name": student.student_name,
                    "average": None,
                    "latestScore": None,
                    "assessedCount": 0,
                    "trend": "Not assessed yet",
                    "points": [],
                }
            )
            continue

        percentages = progress["percentage"].tolist()
        change = percentages[-1] - percentages[0] if len(percentages) > 1 else 0
        trend = "Improving" if change >= 3 else "Needs support" if change <= -3 else "Steady"
        result.append(
            {
                "id": student.student_id,
                "name": student.student_name,
                "average": _number(progress["percentage"].mean()),
                "latestScore": _number(percentages[-1]),
                "assessedCount": len(percentages),
                "trend": trend,
                "points": [
                    {
                        "assessmentId": row.assessment_id,
                        "percentage": _number(row.percentage),
                    }
                    for row in progress.itertuples(index=False)
                ],
            }
        )

    return {"assessments": assessments, "students": result}
