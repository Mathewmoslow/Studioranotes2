# Manual Migration Steps - Course Status

Since Prisma CLI is having connection issues, please run this migration manually via Supabase SQL Editor.

## Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/oxzgpjektowmrtkmxaye
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

## Step 2: Run This SQL

Copy and paste the following SQL into the editor and click "Run":

```sql
-- Step 1: Create the CourseStatus enum
CREATE TYPE "CourseStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED', 'UPCOMING');

-- Step 2: Add status column to courses table with default ACTIVE
ALTER TABLE "courses"
ADD COLUMN "status" "CourseStatus" NOT NULL DEFAULT 'ACTIVE';

-- Step 3: Create index for better query performance
CREATE INDEX "courses_status_userId_idx" ON "courses" ("status", "userId");

-- Step 4: Verify the changes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'courses' AND column_name = 'status';
```

## Step 3: Verify Success

You should see output showing:
```
column_name | data_type     | column_default
status      | USER-DEFINED  | 'ACTIVE'::CourseStatus
```

## Step 4: View Your Courses

Run this query to see all your courses and their current status:

```sql
SELECT id, code, name, semester, year, status
FROM courses
ORDER BY year DESC, semester;
```

You should see 10 courses, all with status = 'ACTIVE'.

## Step 5: Mark Courses for Archival

Identify which 5 courses are from old semesters (the duplicates), then run:

```sql
-- Example: Archive specific courses by ID
-- Replace these IDs with the actual IDs from Step 4

UPDATE courses
SET status = 'ARCHIVED'
WHERE id IN (
  'course_id_1',
  'course_id_2',
  'course_id_3',
  'course_id_4',
  'course_id_5'
);

-- Verify the update
SELECT status, COUNT(*) as count
FROM courses
GROUP BY status;
```

You should now see:
- 5 courses with status = 'ACTIVE'
- 5 courses with status = 'ARCHIVED'

## Step 6: Generate Prisma Client

Back in your terminal, run:

```bash
cd apps/web
npx prisma generate --schema=./prisma/schema.prisma
```

## Step 7: Test the App

```bash
npm run dev
```

Navigate to `/courses` and you should see:
- Only 5 ACTIVE courses by default
- Status filter dropdown to view all courses
- Status badges on each course card

---

## Alternative: Use Bulk Update Script After Manual Migration

After completing Steps 1-3 above, you can use the bulk update script:

1. Get your course IDs from Step 4
2. Edit `apps/web/scripts/bulk-update-course-status.ts`
3. Add your course IDs and statuses
4. Run: `npx tsx apps/web/scripts/bulk-update-course-status.ts`

---

## Troubleshooting

If the enum already exists, you'll see an error. That's OK - skip to Step 2.

If you get permission errors, make sure you're logged into the correct Supabase project.

---

**Next**: After this migration, test the scheduler to ensure it only uses ACTIVE courses!
