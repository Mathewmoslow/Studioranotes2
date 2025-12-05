-- Migration: Add CourseStatus enum and status field to Course table
-- Run this when database is accessible

-- Step 1: Create the CourseStatus enum
CREATE TYPE "CourseStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED', 'UPCOMING');

-- Step 2: Add status column to courses table with default ACTIVE
ALTER TABLE "courses"
ADD COLUMN "status" "CourseStatus" NOT NULL DEFAULT 'ACTIVE';

-- Step 3: (Optional) Update existing courses based on your preferences
-- Example: Mark old semester courses as COMPLETED or ARCHIVED
-- UPDATE "courses" SET "status" = 'COMPLETED' WHERE "semester" = 'Fall' AND "year" < 2025;
-- UPDATE "courses" SET "status" = 'ARCHIVED' WHERE "year" < 2024;

-- Step 4: Create index for better query performance
CREATE INDEX "courses_status_userId_idx" ON "courses" ("status", "userId");

-- Verification queries:
-- SELECT id, code, name, semester, year, status FROM courses ORDER BY year DESC, semester;
-- SELECT status, COUNT(*) FROM courses GROUP BY status;
