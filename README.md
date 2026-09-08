# Ubulimi — V1 Starter

This is Sprint 0: a working Next.js + Supabase project with two-role authentication
(Owner / Worker) already wired up, matching the architecture in
`Ubulimi_Survey_Findings_and_Architecture.docx`. It doesn't do much yet — that's
correct. Health event logging, medicine matching, vaccinations, feed, and sales
are the next sprints.

## What's already working

- Login (email + password via Supabase Auth)
- Role-based redirect: Owner → `/dashboard`, Worker → `/today`
- Owner dashboard reading real counts (animals, open health events, low stock)
- Worker "today" view reading recent activity
- Full database schema with Row-Level Security, scoped per farm and per role
- An audit log that fills in automatically on every write

## Prerequisites

Everything in `Ubulimi_Developer_Setup_Checklist.docx` should be done first:
Node.js 20+, a GitHub account, a Supabase account, and a Vercel account.

## Setup

**1. Install dependencies**

```
npm install
```

**2. Create your Supabase project**

At [supabase.com](https://supabase.com), create a new project called `ubulimi`.

**3. Run the database schema**

In your Supabase project: **SQL Editor → New query**, paste the entire contents
of `supabase/migrations/0001_init.sql`, and click **Run**. This creates every
table, the audit log trigger, and all Row-Level Security policies in one go.

**4. Connect your environment**

Copy the example env file:

```
cp .env.local.example .env.local
```

In Supabase: **Project Settings → API**, copy the **Project URL** and the
**anon public** key into `.env.local`.

**5. Create your first pilot farm**

In Supabase: **Authentication → Users → Add user**, create one login for
yourself (owner) and one for a worker (email + password each).

Then back in the **SQL Editor**, run (with your real values):

```sql
insert into public.farms (name) values ('Your Farm Name') returning id;

insert into public.profiles (id, farm_id, full_name, role) values
  ('<owner-user-uuid-from-auth>', '<farm-id-from-above>', 'Your Name', 'owner'),
  ('<worker-user-uuid-from-auth>', '<farm-id-from-above>', 'Worker Name', 'worker');
```

(User UUIDs are visible next to each user in Authentication → Users.)

**6. Run it locally**

```
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on `/login`.
Log in with the owner account and you should see the dashboard; log in with
the worker account (in a private/incognito window, so both sessions can exist
at once) and you should see the simplified "today" view.

**7. Deploy**

Push this repository to GitHub, then import it in Vercel. Add the same two
environment variables from `.env.local` in the Vercel project settings
(Settings → Environment Variables). Vercel will deploy automatically on every
push after that.

## What's next (in build order)

1. Animal registry screen (add/view/edit animals and camps)
2. Health event logging form + medicine-stock symptom matching
3. Offline queue (elevated priority per the survey findings — patchy
   connectivity showed up in nearly half of responses)
4. Vaccination scheduling and due-date prompts
5. Feed inventory and camp-based feeding log
6. Sales and full animal history
7. Dashboard/worker view polish

Bring this project into Claude Code and work through that list one sprint at
a time — the schema and auth are already in place to build on top of.
