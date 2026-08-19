-- Extend role-based access with a dedicated parent workspace.
ALTER TYPE "Role" ADD VALUE 'PARENT';

-- Students control who can connect by sharing a revocable access code.
ALTER TABLE "StudentProfile" ADD COLUMN "parentAccessCode" TEXT;

UPDATE "StudentProfile"
SET "parentAccessCode" = TRANSLATE(
    UPPER(SUBSTRING(MD5("id" || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 10)),
    '01',
    '23'
);

ALTER TABLE "StudentProfile" ALTER COLUMN "parentAccessCode" SET NOT NULL;

CREATE UNIQUE INDEX "StudentProfile_parentAccessCode_key"
ON "StudentProfile"("parentAccessCode");

CREATE TABLE "ParentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "school" TEXT,

    CONSTRAINT "ParentProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ParentStudent" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "relationship" TEXT,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentStudent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ParentProfile_userId_key" ON "ParentProfile"("userId");
CREATE UNIQUE INDEX "ParentStudent_parentId_studentId_key"
ON "ParentStudent"("parentId", "studentId");
CREATE INDEX "ParentStudent_studentId_idx" ON "ParentStudent"("studentId");

ALTER TABLE "ParentProfile"
ADD CONSTRAINT "ParentProfile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ParentStudent"
ADD CONSTRAINT "ParentStudent_parentId_fkey"
FOREIGN KEY ("parentId") REFERENCES "ParentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ParentStudent"
ADD CONSTRAINT "ParentStudent_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
