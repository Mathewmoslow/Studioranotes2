# Priority 3: End-to-End Data Flow Verification - Test Plan

## 🎯 Goal
Verify the complete user journey works seamlessly from sign-in to using the app

---

## Test Scenarios

### Scenario 1: Fresh User Journey (RECOMMENDED)
**Tests new encryption + full flow**

1. **Clear Local Data**
   ```bash
   # In browser console (http://localhost:3000)
   localStorage.clear()
   # Then refresh page
   ```

2. **Sign In & Onboarding**
   - Sign in with Google
   - Go through onboarding
   - Connect Canvas (will save encrypted token)
   - Select courses to import
   - Complete onboarding

3. **Verify in Prisma Studio** (http://localhost:5556)
   - Check `canvas_tokens` table has encrypted token
   - Check `courses` table has imported courses
   - Check `tasks` table has assignments

4. **Test Dashboard**
   - Verify courses display
   - Check upcoming tasks widget shows assignments
   - Verify scheduler shows study blocks

5. **Test Persistence**
   - Refresh page
   - Data should still be there (from DB, not localStorage)

---

### Scenario 2: Test Existing Data (FASTER)
**Uses data already in database**

1. **Verify Dashboard Loads From DB**
   - Open http://localhost:3000
   - Check browser console for "Loaded data from database"
   - Verify 5 courses display
   - Check 35 tasks show up

2. **Test Scheduler**
   - Navigate to scheduler/calendar view
   - Verify assignments with due dates appear
   - Check study blocks generated

3. **Test Tasks View**
   - Navigate to tasks page
   - Verify Canvas assignments display
   - Check filtering/sorting works

---

## Automated Verification

Run these checks to verify the system:

```bash
# Check database state
node check-db-data.js

# Check Canvas token
node check-canvas-token.js

# Check if courses have canvasId
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.course.findMany().then(c => console.log(c.map(x => ({ name: x.name, canvasId: x.canvasId })))).finally(() => p.\$disconnect())"
```

---

## Success Criteria

✅ **Must Pass:**
1. User can complete onboarding
2. Canvas token stored encrypted in database
3. Courses persist to database with canvasId
4. Tasks persist with correct courseId references
5. Dashboard loads data from database (not localStorage)
6. Page refresh maintains data
7. Scheduler displays Canvas assignments
8. No critical errors in console

⚠️ **Nice to Have (can defer):**
- Beautiful loading states
- Perfect UI polish
- Advanced error messages
- Sync status indicators

---

## Current State

**Database:**
- ✅ 1 User (mathewmoslow@gmail.com)
- ✅ 5 Courses (NURS320, NURS320c, NURS340, NURS340c, NURS375)
- ✅ 35 Tasks (imported assignments)
- ❌ 0 Canvas tokens (need to re-onboard to test encryption)

**Encryption:**
- ✅ AES-256-GCM implemented
- ✅ Encryption key in .env
- ✅ API endpoints ready
- ⏳ Not tested with real token yet

---

## Recommended Next Steps

### Option A: Full Test (Most Thorough)
1. Clear localStorage
2. Go through onboarding again
3. Verify token encryption works
4. Test complete flow

**Time:** ~10 minutes
**Confidence:** Highest

### Option B: Quick Verification (Faster)
1. Test dashboard with existing data
2. Verify persistence works
3. Skip re-onboarding for now

**Time:** ~3 minutes
**Confidence:** Good for core features

---

Which option would you like to do?
