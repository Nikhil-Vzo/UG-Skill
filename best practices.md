# Antigravity Best Practices for Upcoming Chunks

This file is a working guide for Antigravity IDE while completing the remaining UGSkill chunks. It is based on what worked well during the I1-I3 completion pass and on the main failure patterns already seen in the repo.

## 1. Start Every Chunk with Contract Verification

Before changing UI behavior, confirm three things:

1. The frontend route exists and is mounted in `ugskill-web/src/App.tsx`.
2. The frontend API call matches the real backend path in `ugskill-api/src/app.ts` and the relevant module routes.
3. The backend response shape matches what the frontend expects:
   - Prefer `response.data.data`
   - Avoid building UI against guessed fields

If the frontend and backend disagree, fix the contract first before polishing UI.

## 2. Prefer Compatibility Aliases Over Large Rewrites

When the frontend and backend are mostly aligned but differ by a route shape, add a small backend alias if it reduces churn.

Examples that worked well:
- `/lms/enrollments/mine`
- `/lms/streaks/me`
- `/lms/courses/:courseId/lectures/:lectureId`
- `/lms/quizzes/:quizId/attempt`

This is usually safer than rewriting multiple frontend screens at once.

## 3. Do Not Leave Mock-to-Live Work Halfway

For each page, finish the full path:

1. Remove or bypass mock data.
2. Add the real query or mutation.
3. Handle loading and empty state.
4. Handle error state.
5. Confirm navigation still works.
6. Smoke-test the page in the browser.

Partial wiring creates misleading "looks done but fails on click" behavior.

## 4. Treat Buttons as Deliverables

Every visible CTA should be tested after changes.

Minimum checks:
- Does it navigate to the correct route?
- Does it call the intended API?
- Does it handle empty or missing data without crashing?
- Does it return somewhere sensible on cancel, back, or close?

Several project issues were not layout issues; they were broken button targets.

## 5. Keep Frontend State Simple

Use the existing patterns already present in the repo:
- React Query for server data
- Zustand only where already established
- Shared auth state from `auth.store.ts`

Do not create a new store if a page already works fine with React Query and local component state.

## 6. Normalize Backend Data Close to the Page

If the backend returns mixed shapes or optional fields, normalize once near the query result rather than scattering null checks everywhere.

Examples:
- `res.data.data ?? res.data ?? []`
- map instructor objects and strings into one display value
- tolerate empty object payloads from legacy stub routes

This keeps pages readable and makes later cleanup easier.

## 7. Use Browser QA for Final Truth

Build success is not enough.

For any chunk touching UI, verify:
- login flow
- route navigation
- at least one real happy path click
- browser console errors

The in-app browser caught issues that builds did not, especially wrong runtime env wiring and dead navigation.

## 8. Be Careful with Existing Running Servers

If behavior does not match the code, check whether an older server process is still running.

Recommended checks:
- confirm the API port actually serves the new routes
- confirm Vite is using the intended `VITE_API_URL`
- if necessary, run a temporary verification server on another port and document it

Do not assume port 4000 or 5173 automatically reflects the latest source.

## 9. Update Documentation During the Same Pass

Whenever a chunk is genuinely completed, update:
- `TODO.md`
- `donebycodex.txt`
- `changelog-nontech.txt`
- `non-tech log.txt` when a plain-English checkpoint helps handoff

This prevents the next person from re-auditing already-finished work.

## 10. Recommended Completion Checklist for Each Remaining Chunk

Use this exact order:

1. Read the target chunk in `TODO.md`.
2. Inspect current frontend page and current backend route/module.
3. Identify contract gaps.
4. Patch the smallest stable fix.
5. Build backend if backend changed.
6. Build frontend if frontend changed.
7. Browser smoke-test the changed flow.
8. Update docs and mark the chunk status clearly.

## 11. When in Doubt, Optimize for Real Working Paths

Prefer:
- fewer but fully working flows
- live data over polished fake states
- exact route correctness over speculative abstraction
- small compatibility fixes over broad refactors

The project is now at the stage where reliability matters more than adding another incomplete surface.
