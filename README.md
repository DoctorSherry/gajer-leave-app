# The Gajer Practice — Leave & Coverage Roster

A leave management app for the whole practice — not just the doctors:
CEO/Medical Director, health counselors, the nurse practitioner, and
patient service reps all use it. Anyone applies for leave, picks a
colleague to cover for them, overlapping leave requests are flagged
automatically, and an admin gives final approval — currently Dr. Gajer
and the operations manager, who both approve/reject and see the
Approvals tab, but neither applies for their own leave through this app.
A dashboard shows a 14-day coverage timeline, KPIs, and the practice's
mandatory holidays.

**Stack:** React frontend on Netlify · Google Apps Script backend ·
Google Sheet as the database · Google Sign-In restricted to
`@thegajerpractice.com` · Email sent via Gmail (MailApp), no third-party
email service needed.

There are three setup phases. Do them in order.

---

## Phase 1 — Google Sheet + Apps Script backend

1. Go to [sheets.google.com](https://sheets.google.com) and create a new,
   blank spreadsheet. Name it e.g. **"Gajer Practice — Leave Data"**.
2. In the sheet, go to **Extensions → Apps Script**. This opens the
   script editor bound to your sheet.
3. Delete the default `Code.gs` content. Create the following files in
   the Apps Script editor (use the **+** next to "Files") and paste in
   the matching contents from the `google-apps-script/` folder in this
   project:
   - `Code.gs`
   - `Sheets.gs`
   - `Setup.gs`
   - `Auth.gs`
   - `Leaves.gs`
   - `Holidays.gs`
   - `Email.gs`
   - `Kpis.gs`
4. At the top of `Code.gs`, edit this line:
   ```js
   const APP_URL = 'https://YOUR-NETLIFY-SITE.netlify.app'; // fill in after Phase 3
   ```
   There's no separate admin-email setting to fill in — admins are
   whoever has `Role` = `admin` in the Employees sheet (see step 6), and
   all of them get approval/notification emails automatically.
5. In the function dropdown at the top of the editor, select
   **`setupSheet`** and click **Run**. The first time, Google will ask
   you to authorize the script — allow it (it's your own script acting
   on your own sheet/Gmail). This creates the `Employees`, `LeaveRequests`,
   `AuditLog`, and `Holidays` tabs, and seeds them from the team roster
   and holiday list you gave us.
6. Go back to the spreadsheet and open the **Employees** tab. It's
   pre-filled with your team:

   | Email | Name | Role | Title | LeaveBalance |
   |---|---|---|---|---|
   | drgajer@thegajerpractice.com | Dr. Gajer | admin | CEO & Medical Director | (blank) |
   | email@thegajerpractice.com | Operations Manager | admin | Operations Manager | (blank) |
   | patrick@thegajerpractice.com | Patrick Gauthier | employee | Director of Operations... | (blank) |
   | michael@thegajerpractice.com | Michael Sampson | employee | Director of Patient Services... | (blank) |
   | ... | ... | employee | ... | (blank) |

   **Important — check the emails before you deploy.** The second admin
   row (`email@thegajerpractice.com` / "Operations Manager") is a
   **deliberate placeholder** — replace it with your real name and real
   `@thegajerpractice.com` address before anyone tries to sign in with it.
   Below that, only `drgajer@thegajerpractice.com` and
   `patrick@thegajerpractice.com` are confirmed real; everyone else's
   email is a *guess* (`firstname@thegajerpractice.com`), because we
   weren't given real addresses for the rest of the team. Google Sign-In
   needs the exact real address for each person, so fix any that are
   wrong — especially:
   - **Giuliani Gaitan** vs **Gianni Gaitan** — guessed as `giuliani@`
     and `gianni@`, easy to mix up. Confirm which is which.
   - **Rachel (Vy) Nguyen** — guessed as `rachel@`; she may prefer `vy@`.

   `role` must be exactly `admin` or `employee`. Both admins see the
   Approvals tab, can approve/reject any request, and get every
   approval-related email — nobody needs to be picked out as "the" admin
   in code, it's just whoever has this role in the sheet. Add or remove
   admins later by editing this column. `Title` is just for display
   (shown under each name on the dashboard and in the proxy picker).
   `LeaveBalance` is left **blank for everyone** — leave entitlement
   isn't the same for everyone on this team, so there's no shared
   default. Fill in each person's real number of days once you
   have it; until then the app shows "—" instead of guessing.
7. Open the **Holidays** tab. It's pre-filled with this year's dates for
   the six mandatory holidays you listed (New Year's Day, Memorial Day,
   Independence Day, Labor Day, Thanksgiving Day, Christmas Day) — the
   floating ones (Memorial Day, Labor Day, Thanksgiving) were computed
   for 2026 specifically, so **update this tab every new year**. Add or
   remove rows here any time; the app re-reads it live. On these dates
   the coverage timeline shows an "office closed" tag, and any leave
   request that spans one doesn't get charged against that day.
8. Back in the Apps Script editor: **Deploy → New deployment**.
   - Click the gear icon next to "Select type" → **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, authorize again if asked.
   - Copy the **Web app URL** (ends in `/exec`). You'll need it in Phase 3.

   Whenever you edit the script later, use **Deploy → Manage deployments
   → Edit (pencil) → New version → Deploy** to push changes live — just
   saving the file is not enough.

---

## Phase 2 — Google Sign-In (OAuth Client ID)

You need an OAuth client so the app can show a Google Sign-In button
restricted to your domain.

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
   and create a new project (or use an existing one for the practice).
2. **APIs & Services → OAuth consent screen**: set User type to
   **Internal** if `thegajerpractice.com` is a Google Workspace domain
   (this alone restricts sign-in to your domain). If you're on personal
   Gmail-style accounts instead, choose External and add your team as
   test users, and rely on the app's own domain check.
3. **APIs & Services → Credentials → Create Credentials → OAuth client
   ID**.
   - Application type: **Web application**
   - Authorized JavaScript origins: add your Netlify URL once you have
     it (e.g. `https://gajer-leave.netlify.app`) — you can come back and
     add this after Phase 3.
4. Copy the generated **Client ID** (ends in `.apps.googleusercontent.com`).

---

## Phase 3 — Deploy the frontend to Netlify

1. Push this project folder to a GitHub repo (or use Netlify's manual
   drag-and-drop deploy of the `dist` folder — but Git-based deploy is
   easier for updates).
2. In [app.netlify.com](https://app.netlify.com): **Add new site → Import
   an existing project**, connect the repo. Build settings are already
   in `netlify.toml` (`npm run build`, publish `dist`), so you shouldn't
   need to change anything.
3. Before the first deploy (or right after, then redeploy), go to
   **Site configuration → Environment variables** and add:
   - `VITE_GOOGLE_CLIENT_ID` = the client ID from Phase 2
   - `VITE_GAS_URL` = the Apps Script `/exec` URL from Phase 1
4. Deploy. Once you have your live Netlify URL:
   - Go back to Google Cloud Console → your OAuth client → add the
     Netlify URL to **Authorized JavaScript origins**.
   - Go back to `Code.gs` in Apps Script and set `APP_URL` to the same
     URL, then redeploy the Apps Script (new version).
5. Open the Netlify URL, sign in with a `@thegajerpractice.com` account
   that's listed in the Employees sheet, and test the flow end to end.

---

## How the workflow behaves

- **Apply for leave** → pick a leave type (**Planned Leave**, **Sick
  Leave**, or **Emergency Leave**), a date range or a single **half
  day**, and a colleague to cover for you. They get an email with
  **Accept** / **Decline** links (no login needed to respond). The two
  admins don't use this — they approve only, they're not requesters.
- **Proxy accepts** → status moves to "Awaiting approval"; every admin
  gets an email and sees it in the **Approvals** tab.
- **Proxy declines** → the requesting employee and every admin are
  emailed; the employee needs to submit a new request with a different
  proxy.
- **Overlap detection** → if a new request's dates overlap someone
  else's pending/approved leave, every admin and the overlapping person
  get an automatic email, and the dashboard's coverage timeline
  highlights the overlapping day in red.
- **Mandatory holidays** → the dashboard lists the practice's holidays
  for the year. A leave request that spans one doesn't charge that day
  against the requester's balance, since the office is closed anyway.
- **An admin approves/rejects** → either admin can act on any pending
  request (there's no split between them); the employee
  (and proxy, if approved) get an email either way.
- **Cancel** → the employee (or any admin) can cancel a pending or
  approved future request from the "All leave requests" tab; the proxy
  and every admin are notified.
- **KPIs**: pending approvals, pending proxy responses, leave-days
  approved this month, average approval turnaround (hours from request
  to decision), number of overlapping leave-days, and total
  rejected/cancelled requests.

## Editing data directly

Because everything lives in the Google Sheet, either admin can always
open it directly to add/remove team members, fix a typo, adjust a leave
balance, update the holiday list, or export data — no code changes
needed for that.

## Extending later

Ideas that fit naturally into this same structure if you want them next:
- A weekly digest email to the whole team of who's out and who's covering
- Block leave submission outright on mandatory holidays (right now they're
  just excluded from the day count, not blocked as a date choice)
- A minimum-notice rule per leave type (e.g. planned leave needs 3 days)
- Slack/WhatsApp notification instead of/alongside email
- Leave accrual rules by employment type (full-time/part-time,
  salary/hourly) instead of a flat manually-set balance per person
