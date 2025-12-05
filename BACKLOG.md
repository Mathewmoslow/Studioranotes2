# StudioRa Notes - Development Backlog

## 🔥 High Priority

### Course Lifecycle - Option B (Smart Auto-Detection)
**Status**: Planned for after scheduler testing
**Effort**: 2-3 hours
**Dependencies**: Option A must be tested and working

**Features**:
1. **Smart Auto-Detection from Canvas**
   - Parse Canvas API course `start_at` and `end_at` dates
   - Auto-set status: UPCOMING → ACTIVE → COMPLETED
   - Background job to check and update statuses daily

2. **Semester Management UI**
   - Visual semester timeline component
   - Show courses grouped by semester
   - Drag-and-drop courses between semesters
   - Bulk operations: "Archive all Fall 2024 courses"

3. **Automatic Archival Prompts**
   - Detect when current semester ends
   - Show notification: "Fall 2024 ended. Archive these 5 courses?"
   - One-click bulk archival
   - Option to mark as COMPLETED or ARCHIVED

4. **Enhanced Analytics**
   - Per-semester GPA and study hours
   - Multi-semester trend charts
   - Course status transition history

**Files to Create/Modify**:
- `apps/web/src/lib/canvas/courseStatusDetection.ts` (new)
- `apps/web/src/app/api/courses/auto-update-status/route.ts` (new)
- `apps/web/src/components/SemesterTimeline.tsx` (new)
- `apps/web/src/app/settings/semesters/page.tsx` (new)
- Add cron job for status updates

**Reference**: See `COURSE_LIFECYCLE_PROPOSAL.md` for full details

---

## 🎯 Medium Priority

### Scheduler Enhancements
- [ ] Add "preferred study times" per course
- [ ] Smart break insertion between study blocks
- [ ] Conflict detection for overlapping blocks
- [ ] Weekly schedule template save/load

### Canvas Integration Improvements
- [ ] Real-time sync (webhooks if available)
- [ ] Two-way sync: push completed tasks back to Canvas
- [ ] Grade syncing and tracking
- [ ] Discussion board integration

### Note-Taking Features
- [ ] Rich text editor upgrade (TipTap or similar)
- [ ] Image upload and inline display
- [ ] Math equation support (KaTeX)
- [ ] Voice-to-text note dictation
- [ ] Auto-save with conflict resolution

---

## 🔮 Low Priority / Nice-to-Have

### Mobile App
- [ ] React Native app for iOS/Android
- [ ] Offline-first architecture
- [ ] Push notifications for due tasks

### Collaboration
- [ ] Share notes with classmates
- [ ] Study group scheduling
- [ ] Collaborative note editing

### AI Enhancements
- [ ] Smart study schedule optimization
- [ ] Personalized study recommendations
- [ ] Auto-generate quiz questions from notes
- [ ] Concept prerequisite mapping

---

## 🐛 Known Issues

### Database Connection
- **Issue**: Supabase unreachable (11/12/2025)
- **Status**: Waiting for service to come back online
- **Impact**: Cannot run migrations
- **Action**: Retry migration when resolved

---

## ✅ Recently Completed

### Course Lifecycle - Option A (2025-11-12)
- ✅ Added CourseStatus enum (ACTIVE, COMPLETED, ARCHIVED, UPCOMING)
- ✅ Updated API to filter by status (default: ACTIVE)
- ✅ Built UI controls for status management
- ✅ Created migration and bulk update scripts
- ⏸️ Pending: Database migration (blocked)

---

**Last Updated**: 2025-11-12
