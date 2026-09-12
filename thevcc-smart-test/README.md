# TheVCC Smart Test

**Online Examination & Student Performance System** for The Vision Coaching Centre.

React + Vite frontend, Supabase (PostgreSQL + Auth + Edge Functions) backend, deployed on Netlify.

---

## 1. Tech stack

- **Frontend:** React 18 + Vite, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Row Level Security, Edge Functions)
- **Hosting:** Netlify

## 2. How security is designed (read this first)

- Students and the admin sign in through **Supabase Auth** with a synthetic email
  built from their username (`vcc25@students.thevcc.local`, `vccadmin@admin.thevcc.local`).
  No plaintext passwords are ever stored — Supabase Auth hashes them.
- **Every table has Row Level Security enabled.** Students can only ever read
  their own profile/attempts; they cannot see other students, correct answers,
  or historical results. See `supabase/schema.sql`.
- **Grading never happens in the browser.** Starting a test, saving an answer,
  and submitting a test all call `SECURITY DEFINER` Postgres functions
  (`start_test_attempt`, `save_answer`, `submit_test_attempt`) that re-check the
  caller's identity and the account's ON/OFF status on every call. Students
  never get direct `SELECT` access to `question_options.is_correct`.
- The **service_role key is never used in the frontend.** It only exists in the
  `admin-actions` Supabase Edge Function (for creating student accounts,
  resetting passwords, and changing the admin's own username/password) and in
  local seed scripts you run yourself.
- Disabling a student (`User Access` → Disable) is enforced in the database
  (RLS + RPC checks), not just by hiding the menu — a disabled account is
  rejected even if it still holds a valid session token.

## 3. Supabase project setup

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → API** and copy the **Project URL** and **anon public key**.
3. Go to **SQL Editor**, paste the entire contents of `supabase/schema.sql`, and run it.
   This creates all tables, RLS policies, and the exam-engine functions.
4. Go to **Authentication → Settings** and turn **off** "Confirm email" for this
   project (or leave it on and note that the seed scripts pass `email_confirm: true`,
   which already marks accounts as confirmed).

## 4. Deploy the Edge Function

The `admin-actions` function is the only place the service_role key is used.

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy admin-actions
supabase secrets set \
  SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY \
  SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

## 5. Create the initial admin account

Run this **locally**, never in the browser or in a committed file:

```bash
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY \
node scripts/seedAdmin.mjs
```

Default credentials created:
- Username: `vccadmin`
- Password: `Admin@1947#`

**Change this password immediately after your first login**, from
Admin → Settings → Admin Account.

## 6. Create VCC1–VCC100 student accounts

```bash
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY \
node scripts/seedStudents.mjs
```

- Creates `VCC1` through `VCC100` with default password `Vcc@1234`.
- All accounts start **OFF** (locked) — enable each one from
  **Admin → User Access** as needed.
- Change the count with `STUDENT_COUNT=50 node scripts/seedStudents.mjs`, or the
  password with `STUDENT_PASSWORD=...`.

You can also add students one at a time later from **Admin → Students → Add Student**.

## 7. Environment variables

Copy `.env.example` to `.env.local` for local development:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Never put the service_role key in a `VITE_*` variable — anything prefixed
`VITE_` is bundled into the browser JavaScript.

## 8. Local development

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`.

## 9. Netlify deployment

1. Push this project to a Git repository.
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
3. Build command: `npm run build` — Publish directory: `dist` (already set in `netlify.toml`).
4. In **Site settings → Environment variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy. `netlify.toml` already includes the SPA redirect rule so client-side
   routing (`/student`, `/admin`, etc.) works on refresh.

## 10. Production configuration checklist

- [ ] `supabase/schema.sql` run successfully in the Supabase SQL editor
- [ ] `admin-actions` Edge Function deployed with its 3 secrets set
- [ ] Initial admin created via `scripts/seedAdmin.mjs`, password changed after first login
- [ ] VCC1–VCC100 created via `scripts/seedStudents.mjs`
- [ ] Netlify environment variables set (anon key only)
- [ ] Your real TheVCC logo dropped into `src/components/Logo.jsx` (see the
      comment at the top of that file — one component controls the logo
      everywhere: login pages, admin header, student header)
- [ ] At least one subject, one test, questions, and an assignment created so
      students have something to see on first login

## 11. Project structure

```
supabase/
  schema.sql              -- tables, RLS, exam-engine functions
  functions/admin-actions/ -- the only code that uses the service_role key
scripts/
  seedAdmin.mjs            -- run locally to create the admin account
  seedStudents.mjs         -- run locally to create VCC1..VCC100
src/
  lib/                     -- supabase client, auth helpers, CSV export, parser
  context/AuthContext.jsx  -- session/profile/role state
  components/              -- Logo, ConfirmDialog, States, TestCard, route guards
  pages/student/           -- Login, Dashboard, Available Tests, Instructions, Exam, Result
  pages/admin/             -- Login, Dashboard, Students, User Access, Subjects,
                              Tests, Questions (+ bulk import), Assign, Results,
                              Attempt Detail, Student Detail, Analytics, Reports, Settings
```

## 12. What students can and cannot do (by design)

Students can: log in, see currently assigned tests, take a test, and see the
result of the test they just submitted.

Students cannot: see other students, see past results once they leave the
result screen, see correct answers before submitting, modify their score, or
reach any `/admin` route — all enforced independently by RLS and the exam
functions, not just by hiding navigation links.

## 13. Bulk question import format

Paste into Admin → Tests → Questions → Bulk Import:

```
Q: What is the capital of Pakistan?
A: Karachi
B: Lahore
C: Islamabad
D: Peshawar
ANSWER: C
MARKS: 1

Q: 2 + 2 = ?
A: 3
B: 4
C: 5
D: 6
ANSWER: B
MARKS: 1
```

The preview screen validates every question before anything is saved, and
shows you exactly what will be imported.
