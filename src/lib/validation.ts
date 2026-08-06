import { z } from "zod";
import { isCbseGrade } from "@/lib/education";

const requiredGradeSchema = z
  .string()
  .trim()
  .refine(isCbseGrade, "Choose a grade from Class 6 to 12");
const optionalGradeSchema = z
  .string()
  .trim()
  .refine(
    (value) => !value || isCbseGrade(value),
    "Choose a grade from Class 6 to 12",
  )
  .transform((value) => value || undefined);

const normalizedEmail = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

export const loginSchema = z.object({
  email: normalizedEmail,
  password: z.string().min(8, "Password must contain at least 8 characters"),
});
const strongPassword = z
  .string()
  .min(10, "Password must contain at least 10 characters")
  .max(128, "Password is too long")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/\d/, "Password must contain a number")
  .regex(/[^A-Za-z0-9]/, "Password must contain a special character");
export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: normalizedEmail,
    password: strongPassword,
    confirmPassword: z.string(),
    role: z.enum(["TEACHER", "STUDENT", "PARENT"]),
    school: z.string().trim().max(120).optional(),
    subject: z.string().trim().max(80).optional(),
    grade: optionalGradeSchema,
    rollNumber: z.string().trim().max(30).optional(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .superRefine((value, ctx) => {
    if (value.role === "STUDENT" && !value.grade)
      ctx.addIssue({
        code: "custom",
        message: "Choose your grade from Class 6 to 12",
        path: ["grade"],
      });
  });
export const accountSchema = z.object({
  name: z.string().trim().min(2).max(80),
  school: z.string().trim().max(120).optional(),
  subject: z.string().trim().max(80).optional(),
  grade: optionalGradeSchema,
  rollNumber: z.string().trim().max(30).optional(),
});
export const parentStudentLinkSchema = z.object({
  studentEmail: normalizedEmail,
  accessCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-HJ-NP-Z2-9]{10}$/,
      "Enter the student's 10-character parent access code",
    ),
  relationship: z.string().trim().max(50).optional(),
});
export const emailChangeSchema = z
  .object({
    newEmail: normalizedEmail,
    confirmEmail: normalizedEmail,
    currentPassword: z
      .string()
      .min(1, "Enter your current password")
      .max(128, "Password is too long"),
  })
  .refine((value) => value.newEmail === value.confirmEmail, {
    message: "Email addresses do not match",
    path: ["confirmEmail"],
  });
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: strongPassword,
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: "Choose a password different from your current password",
    path: ["newPassword"],
  });
export const classNameSchema = z
  .string()
  .trim()
  .min(3, "Class name must contain at least 3 characters")
  .max(80, "Class name must contain no more than 80 characters");
export const classSchema = z.object({
  name: classNameSchema,
  subject: z.string().trim().min(2).max(80),
  grade: requiredGradeSchema,
  description: z.string().trim().max(300).optional(),
});
export const joinClassSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6}$/, "Enter a valid 6-character class code"),
});
export const assignmentSchema = z.object({
  classId: z.string().min(1),
  title: z.string().min(4).max(120),
  description: z.string().min(10).max(2000),
  instructions: z.string().max(2000).optional(),
  topic: z.string().trim().min(2).max(120),
  type: z.enum(["Assignment", "Homework", "Test", "Worksheet", "Practice"]),
  maxMarks: z.coerce.number().int().min(1).max(500),
  dueAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Enter a valid deadline")
    .transform((value) => new Date(`${value}:00+05:30`))
    .refine(
      (deadline) => !Number.isNaN(deadline.getTime()) && deadline > new Date(),
      "Deadline must be in the future",
    ),
  publish: z.coerce.boolean().default(false),
});
const quizQuestionSchema = z
  .object({
    prompt: z.string().trim().min(5).max(500),
    options: z.array(z.string().trim().min(1).max(200)).length(4),
    correctAnswer: z.string().trim().min(1).max(200),
    explanation: z.string().trim().min(5).max(1000),
    marks: z.coerce.number().int().min(1).max(20),
  })
  .superRefine((question, ctx) => {
    if (
      new Set(question.options.map((option) => option.toLowerCase())).size !== 4
    )
      ctx.addIssue({
        code: "custom",
        message: "Each option must be unique",
        path: ["options"],
      });
    if (!question.options.includes(question.correctAnswer))
      ctx.addIssue({
        code: "custom",
        message: "The correct answer must match one option",
        path: ["correctAnswer"],
      });
  });
export const quizSchema = z.object({
  classId: z.string().min(1),
  title: z.string().trim().min(4).max(120),
  description: z.string().trim().max(1000).optional(),
  timeLimit: z.coerce.number().int().min(1).max(180).optional(),
  publish: z.boolean().default(false),
  questions: z.array(quizQuestionSchema).min(1).max(20),
});
export const reviewSchema = z
  .object({
    submissionId: z.string().min(1),
    marks: z.coerce.number().min(0),
    maxMarks: z.coerce.number().positive(),
    feedback: z.string().min(10).max(3000),
    publish: z.coerce.boolean().default(false),
  })
  .refine((v) => v.marks <= v.maxMarks, {
    message: "Marks cannot exceed the maximum",
    path: ["marks"],
  });
export const aiSchema = z.object({
  type: z.enum([
    "LESSON_PLAN",
    "EXPLANATION",
    "NOTES",
    "QUESTIONS",
    "QUIZ",
    "FEEDBACK",
    "REVISION_SHEET",
    "ANNOUNCEMENT",
    "DOUBT_HELP",
    "REVISION_HELP",
  ]),
  topic: z.string().min(3).max(160),
  subject: z.string().trim().min(2).max(80),
  grade: requiredGradeSchema,
  details: z.string().max(1000).optional(),
});
export const announcementSchema = z.object({
  classId: z.string().min(1),
  title: z.string().min(3).max(100),
  content: z.string().min(5).max(1000),
});
export const resourceSchema = z.object({
  classId: z.string().min(1),
  title: z.string().min(3).max(120),
  description: z.string().max(500).optional(),
  type: z.enum([
    "Notes",
    "Worksheet",
    "Question Paper",
    "Reference",
    "Revision",
  ]),
});
export const attendanceStatusSchema = z.enum([
  "PRESENT",
  "ABSENT",
  "LATE",
  "EXCUSED",
]);
export const attendanceDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid attendance date")
  .transform((value) => new Date(`${value}T00:00:00.000Z`))
  .refine(
    (value) => !Number.isNaN(value.getTime()),
    "Enter a valid attendance date",
  );
export const generatedContentSchema = z.object({
  id: z.string().min(1),
  output: z
    .string()
    .trim()
    .min(10, "Generated content cannot be empty")
    .max(20000, "Generated content is too long"),
  approved: z.boolean(),
});
export const submissionNoteSchema = z
  .string()
  .max(500, "The note must be 500 characters or fewer");
export const uploadedPageSchema = z.object({
  url: z.url(),
  name: z.string().min(1).max(255),
  pageNumber: z.number().int().min(1).max(20),
});
export const uploadedPagesSchema = z
  .array(uploadedPageSchema)
  .min(1, "Upload at least one answer page")
  .max(20, "Upload no more than 20 pages")
  .superRefine((pages, ctx) => {
    const numbers = new Set(pages.map((page) => page.pageNumber));
    if (
      numbers.size !== pages.length ||
      pages.some((page, index) => page.pageNumber !== index + 1)
    )
      ctx.addIssue({
        code: "custom",
        message: "Answer pages must be in order without duplicates",
      });
  });
