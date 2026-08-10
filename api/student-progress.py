from __future__ import annotations

import hashlib
import hmac
import json
import os
import sys
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent))

from student_progress_data import aggregate_student_progress


COOKIE_NAME = "edugrade_session"


class handler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "private, no-store")
        self.send_header("Vary", "Cookie")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _session_token(self) -> str | None:
        cookies = SimpleCookie()
        try:
            cookies.load(self.headers.get("Cookie", ""))
        except (TypeError, ValueError):
            return None
        session = cookies.get(COOKIE_NAME)
        return session.value if session else None

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Allow", "GET, OPTIONS")
        self.end_headers()

    def do_GET(self) -> None:
        database_url = os.environ.get("DATABASE_URL")
        auth_secret = os.environ.get("AUTH_SECRET")
        token = self._session_token()
        if not database_url or not auth_secret:
            self._send_json(503, {"error": "Progress analytics is temporarily unavailable."})
            return
        if not token:
            self._send_json(401, {"error": "Sign in as a teacher to view student progress."})
            return

        token_hash = hmac.new(
            auth_secret.encode("utf-8"), token.encode("utf-8"), hashlib.sha256
        ).hexdigest()

        try:
            from psycopg import connect
            from psycopg.rows import dict_row

            with connect(database_url, connect_timeout=5, row_factory=dict_row) as connection:
                with connection.cursor() as cursor:
                    cursor.execute(
                        '''
                        SELECT teacher."id" AS teacher_id
                        FROM "Session" session
                        INNER JOIN "User" user_record ON user_record."id" = session."userId"
                        INNER JOIN "TeacherProfile" teacher ON teacher."userId" = user_record."id"
                        WHERE session."tokenHash" = %s
                          AND session."expiresAt" >= CURRENT_TIMESTAMP
                          AND user_record."role" = 'TEACHER'
                        LIMIT 1
                        ''',
                        (token_hash,),
                    )
                    teacher = cursor.fetchone()
                    if not teacher:
                        self._send_json(403, {"error": "Teacher access is required."})
                        return

                    cursor.execute(
                        '''
                        SELECT DISTINCT student."id" AS student_id, student_user."name" AS student_name
                        FROM "ClassEnrollment" enrollment
                        INNER JOIN "ClassRoom" class_room ON class_room."id" = enrollment."classId"
                        INNER JOIN "StudentProfile" student ON student."id" = enrollment."studentId"
                        INNER JOIN "User" student_user ON student_user."id" = student."userId"
                        WHERE class_room."teacherId" = %s
                        ORDER BY student_user."name" ASC
                        ''',
                        (teacher["teacher_id"],),
                    )
                    students = cursor.fetchall()

                    cursor.execute(
                        '''
                        SELECT *
                        FROM (
                          SELECT
                            submission."studentId" AS student_id,
                            assignment."id" AS assessment_id,
                            assignment."title" AS assessment_title,
                            COALESCE(result."publishedAt", submission."submittedAt", assignment."updatedAt") AS assessed_at,
                            LEAST(100::numeric, GREATEST(0::numeric,
                              (result."marks" / NULLIF(assignment."maxMarks", 0)) * 100
                            )) AS percentage
                          FROM "Submission" submission
                          INNER JOIN "Result" result ON result."submissionId" = submission."id"
                          INNER JOIN "Assignment" assignment ON assignment."id" = submission."assignmentId"
                          INNER JOIN "ClassRoom" class_room ON class_room."id" = assignment."classId"
                          WHERE class_room."teacherId" = %s
                            AND result."published" = true

                          UNION ALL

                          SELECT
                            attempt."studentId" AS student_id,
                            quiz."id" AS assessment_id,
                            quiz."title" AS assessment_title,
                            attempt."submittedAt" AS assessed_at,
                            LEAST(100::numeric, GREATEST(0::numeric,
                              (attempt."score" / NULLIF(question_totals.max_marks, 0)) * 100
                            )) AS percentage
                          FROM "QuizAttempt" attempt
                          INNER JOIN "Quiz" quiz ON quiz."id" = attempt."quizId"
                          INNER JOIN "ClassRoom" class_room ON class_room."id" = quiz."classId"
                          INNER JOIN (
                            SELECT "quizId", SUM("marks")::numeric AS max_marks
                            FROM "QuizQuestion"
                            GROUP BY "quizId"
                          ) question_totals ON question_totals."quizId" = quiz."id"
                          WHERE class_room."teacherId" = %s
                            AND quiz."published" = true
                        ) scored_work
                        ORDER BY assessed_at ASC, assessment_title ASC
                        ''',
                        (teacher["teacher_id"], teacher["teacher_id"]),
                    )
                    records = cursor.fetchall()
        except Exception:
            print("[ClassConnect] Student progress aggregation failed", file=sys.stderr)
            self._send_json(500, {"error": "Student progress could not be loaded. Please try again."})
            return

        self._send_json(200, aggregate_student_progress(students, records))

    def do_POST(self) -> None:
        self.send_response(405)
        self.send_header("Allow", "GET, OPTIONS")
        self.end_headers()
