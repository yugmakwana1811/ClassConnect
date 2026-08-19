import { Save } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Alert, EmptyState, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { markAttendanceAction } from "@/app/actions";
export default async function Attendance({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; error?: string; success?: string }>;
}) {
  const [{ classId, error, success }, user] = await Promise.all([
    searchParams,
    requireUser("TEACHER"),
  ]);
  const classes = await db.classRoom.findMany({
    where: { teacherId: user.teacherProfile!.id },
    include: {
      enrollments: { include: { student: { include: { user: true } } } },
    },
  });
  const selected = classes.find((c) => c.id === (classId ?? classes[0]?.id));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existing = selected
    ? await db.attendanceRecord.findMany({
        where: { classId: selected.id, date: today },
      })
    : [];
  return (
    <div className="page">
      <PageHeader
        eyebrow="Attendance and participation"
        title="Keep a simple learning record"
        description="Record presence, late arrival, or an excused absence. Updates are saved per class and date."
      />
      <Alert error={error} success={success} />
      <form
        method="get"
        className="card card-pad"
        style={{
          display: "flex",
          gap: ".8rem",
          alignItems: "end",
          marginBottom: "1rem",
        }}
      >
        <label style={{ flex: 1 }}>
          <span className="label">Class</span>
          <select className="field" name="classId" defaultValue={selected?.id}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.subject}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-secondary">View class</button>
      </form>
      {selected ? (
        <form action={markAttendanceAction} className="card card-pad">
          <input type="hidden" name="classId" value={selected.id} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <div className="eyebrow">{selected.name}</div>
              <h2
                className="display"
                style={{ fontSize: "1.8rem", margin: ".3rem 0" }}
              >
                Today’s attendance
              </h2>
            </div>
            <input
              className="field"
              style={{ width: "auto" }}
              type="date"
              name="date"
              defaultValue={today.toISOString().slice(0, 10)}
              required
            />
          </div>
          {selected.enrollments.length ? (
            <>
              <div
                className="table-wrap"
                role="region"
                aria-label="Attendance roster"
                tabIndex={0}
              >
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Roll number</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.enrollments.map((e) => {
                      const value =
                        existing.find((x) => x.studentId === e.studentId)
                          ?.status ?? "PRESENT";
                      return (
                        <tr key={e.id}>
                          <td>
                            <strong>{e.student.user.name}</strong>
                          </td>
                          <td>{e.student.rollNumber ?? "—"}</td>
                          <td>
                            <select
                              className="field"
                              style={{ minHeight: 38, padding: ".45rem .6rem" }}
                              name={`status-${e.studentId}`}
                              defaultValue={value}
                            >
                              <option value="PRESENT">Present</option>
                              <option value="ABSENT">Absent</option>
                              <option value="LATE">Late</option>
                              <option value="EXCUSED">Excused</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <SubmitButton>
                <Save size={16} /> Save attendance
              </SubmitButton>
            </>
          ) : (
            <EmptyState
              title="No enrolled students"
              description={`Share class code ${selected.code} before recording attendance.`}
            />
          )}
        </form>
      ) : (
        <EmptyState
          title="Create a class first"
          description="Attendance is recorded within a class."
        />
      )}
    </div>
  );
}
