import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const CANVAS_URL = process.env.CANVAS_URL;
const CANVAS_TOKEN = process.env.CANVAS_TOKEN;
const DAY_MS = 24 * 60 * 60 * 1000;

if (!CANVAS_URL || !CANVAS_TOKEN) {
  console.error('Missing CANVAS_URL or CANVAS_TOKEN');
  process.exit(1);
}

function shiftDate(dateStr, days = 30) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getTime() + days * DAY_MS).toISOString();
}

function curlJson(url) {
  const cmd = `curl -s -H "Authorization: Bearer ${CANVAS_TOKEN}" "${url}"`;
  const out = execSync(cmd, { encoding: 'utf8' });
  return JSON.parse(out);
}

function fetchAll(url) {
  const results = [];
  for (let page = 1; page <= 5; page++) {
    const pagedUrl = `${url}${url.includes('?') ? '&' : '?'}page=${page}&per_page=100`;
    const data = curlJson(pagedUrl);
    if (!Array.isArray(data) || data.length === 0) break;
    results.push(...data);
    if (data.length < 100) break;
  }
  return results;
}

const courses = fetchAll(`${CANVAS_URL}/api/v1/courses`);
const courseSummaries = [];

for (const course of courses) {
  if (!course.id) continue;
  const assignments = fetchAll(`${CANVAS_URL}/api/v1/courses/${course.id}/assignments`);

  const mappedAssignments = assignments.map(a => ({
    id: a.id,
    name: a.name,
    description: a.description,
    due_at: shiftDate(a.due_at),
    unlock_at: shiftDate(a.unlock_at),
    lock_at: shiftDate(a.lock_at),
    points_possible: a.points_possible,
    course_id: course.id,
    submission_types: a.submission_types,
    html_url: a.html_url,
  }));

  courseSummaries.push({
    id: course.id,
    name: course.name,
    course_code: course.course_code,
    sis_course_id: course.sis_course_id,
    start_at: shiftDate(course.start_at),
    end_at: shiftDate(course.end_at),
    workflow_state: course.workflow_state,
    assignments: mappedAssignments,
    events: [],
  });
}

const outputPath = path.join(process.cwd(), 'apps/web/src/lib/fixtures/canvas-shifted.json');
fs.writeFileSync(outputPath, JSON.stringify({ fetchedAt: new Date().toISOString(), courses: courseSummaries }, null, 2));
console.log(`Saved ${courseSummaries.length} courses to ${outputPath}`);
