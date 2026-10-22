# UNIFIX — Campus Issue Reporting Platform

UNIFIX helps students report campus problems and enables authorized staff to track, assign, and resolve them.

Students can describe an issue, provide its location, and attach a photo or take one directly using a supported mobile device. Administrators manage reports through a dedicated dashboard.

## Features

### Student Portal

- Account registration and login using Supabase Authentication.
- Personalized welcome message.
- Submit reports with a title, category, location, and description.
- Attach a photo or capture one using a supported mobile camera.
- Preview and remove photos before submission.
- View personal reports and their current status.
- Search reports by title, location, description, or category.
- Filter by category and status.
- Sort reports by newest or oldest.
- Browse reports using pagination.

### Admin Dashboard

- Separate admin login option.
- Database-controlled admin permissions.
- View campus reports and attached photos.
- Update report status: **Pending → In Progress → Resolved**.
- Search, filter, sort, and browse reports.
- View report counts by status.
- Assign reports to staff members from a staff directory.

> Staff directory entries identify responsible personnel. Adding an entry does not create a login account or grant admin permissions.

## Report Categories

- Cleanliness
- Maintenance
- Safety
- Wi-Fi & Connectivity
- Water & Sanitation
- Accessibility
- Transport
- Other

## Technology Stack

| Technology | Purpose |
|---|---|
| React | Component-based user interface |
| JavaScript | Application logic |
| Vite | Development server and production builds |
| CSS | Styling and responsive layouts |
| Supabase Authentication | Account registration, login, and sessions |
| Supabase PostgreSQL | Reports, admin membership, and staff records |
| Supabase Storage | Private report photos |
| Vercel | Frontend hosting |

## How It Works

1. A student creates an account and signs in.
2. The student submits an issue with its category and location.
3. An optional photo is uploaded to private storage.
4. The report is saved against the student's account.
5. An authorized administrator reviews the report.
6. The administrator assigns responsibility and updates its status.
7. The student returns to My Reports to check progress.

Status changes appear after reports are refreshed. Automatic notifications and live updates are planned improvements.

## Project Structure

The main application files are organized as follows:

```text
public/
src/
├── components/
│   ├── AdminDashboard.jsx
│   ├── Categories.jsx
│   ├── Footer.jsx
│   ├── Hero.jsx
│   ├── Login.jsx
│   ├── Navbar.jsx
│   ├── ReportForm.jsx
│   ├── Reports.jsx
│   └── StaffAssignment.jsx
├── data/
│   └── Categories.js
├── lib/
│   ├── reports.js
│   └── supabase.js
├── App.css
├── App.jsx
└── main.jsx
index.html
package.json
```

The homepage also includes a How It Works component. Its import path must match the actual filename and capitalization used in the project.

## Getting Started

### Prerequisites

- A Node.js version supported by the project's Vite version.
- npm.
- A Supabase project with the required database and storage setup.

### 1. Clone the repository

Replace the placeholder with this repository's actual URL:

```bash
git clone YOUR_REPOSITORY_URL
cd YOUR_REPOSITORY_FOLDER
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create `.env.local` in the project root, alongside `package.json`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Use your Supabase project's URL and publishable key.

These `VITE_` values are included in the browser build. Never place a Supabase secret key, `service_role` key, or database password in them.

Keep `.env.local` out of Git. You can commit an `.env.example` containing placeholder values for other developers.

### 4. Configure Supabase

The frontend requires database tables, permissions, and storage policies. Adding environment variables alone does not create them.

Apply the project's SQL setup in this order:

1. Reports table and student access policies.
2. Admin membership table and admin report policies.
3. Photo storage bucket, photo path column, and storage policies.
4. Staff directory and report assignment column.

If SQL migration files have not yet been added to this repository, obtain the setup scripts from the maintainer.

### 5. Start the development server

```bash
npm run dev
```

Open the local address displayed in the terminal.

Restart the server after changing environment variables.

## Supabase Data Model

### `reports`

Stores submitted campus issues.

| Column | Purpose |
|---|---|
| `id` | Unique report identifier |
| `user_id` | Student who submitted the report |
| `title` | Short issue summary |
| `category` | Issue category |
| `location` | Campus location |
| `description` | Detailed problem description |
| `status` | Pending, In Progress, or Resolved |
| `created_at` | Submission timestamp |
| `photo_path` | Optional private image path |
| `assigned_to` | Optional staff directory reference |

### `admin_users`

Stores the user IDs authorized to access administrative functions.

### `staff_members`

Stores staff names and departments for assignment.

### Storage: `report-photos`

- Private bucket.
- Maximum image size: **5 MB**.
- Accepted formats: **JPEG, PNG, and WebP**.
- Images are organized in user-specific folders.
- Temporary signed URLs provide image viewing access.

## Access Control

Supabase Row Level Security and database privileges enforce access:

- Students can create and read their own reports.
- Students cannot update report status or staff assignments.
- Authorized admins can read reports and update permitted fields.
- Admin membership is assigned through trusted database administration.
- Private photos are accessible according to storage policies.

Selecting Admin Login does not grant admin permissions.

Signed photo URLs remain usable by anyone holding the link until they expire. Avoid sharing them.

## Creating an Admin Account

1. Register a normal account through UNIFIX.
2. Confirm the email if confirmation is enabled.
3. Open the Supabase SQL Editor.
4. Replace the placeholder below with that account's email and run:

```sql
insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) = lower('ADMIN_EMAIL_ADDRESS')
on conflict (user_id) do nothing;
```

5. Sign in through the Admin Login option.

Admin membership must not be assigned through the public registration form.

## Production Build

Build the frontend:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

For the standard Vite configuration, the generated output is in `dist`.

## Deploying to Vercel

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Select the directory containing the application's `package.json` as the Root Directory.
4. Use the Vite framework preset.
5. Set the Build Command to `npm run build`.
6. Set the Output Directory to `dist`, unless your Vite configuration uses a different directory.
7. Add these environment variables for Production:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

8. Deploy the application.
9. Configure the deployed website URL in Supabase Authentication's URL settings.

Redeploy after changing Vercel environment variables because Vite reads them during the build.

## Testing Checklist

- [ ] Students can register and log in.
- [ ] The greeting displays the student's name.
- [ ] Reports remain available after refreshing.
- [ ] Different students cannot read each other's reports.
- [ ] Photos upload and display after refreshing.
- [ ] Unsupported images and files over 5 MB are rejected.
- [ ] Camera capture works on supported mobile devices.
- [ ] Regular students cannot access admin report data.
- [ ] Admin status changes persist.
- [ ] Staff assignments persist.
- [ ] Search, filters, sorting, and pagination work.
- [ ] The deployed website loads and supports authentication.

## Troubleshooting

### Blank page or `Cannot read properties of null (reading 'auth')`

Check Supabase client initialization and environment variable names. Confirm the variables exist in the hosting environment, then rebuild and redeploy.

### Supabase is not configured

Ensure `.env.local` is beside `package.json`, contains the expected `VITE_` variables, and the development server has been restarted.

### Report category constraint error

The category submitted by the form must exactly match a value permitted by the database constraint, including punctuation and capitalization.

### Staff access required

The signed-in account is not listed in `admin_users`.

### Photo unavailable

Refresh reports to generate a new viewing link. If the issue continues, check the photo path and storage access policies.

### Output directory not found during deployment

Check the Vercel Root Directory, build command, and Vite output configuration. The output directory must be relative to the configured project root.

## Current Limitations

- Search and pagination operate on reports already loaded into the browser.
- The current list queries need database pagination as report volume grows.
- Report updates require refreshing.
- Camera behavior depends on the device and browser.
- Uploading a photo and inserting a report are separate operations; cleanup is attempted if report creation fails.

## Roadmap

- Comments and progress updates.
- In-app notifications.
- Similar issue suggestions to reduce duplicate reports.
- Student confirmation of completed repairs.
- Requests to reopen unresolved issues.
- Resolution-time analytics.
- Database pagination and more efficient photo loading.

## Author

**Johnstone Oroni**

GitHub: [@jessejohnstone](https://github.com/jessejohnstone)

## License

No license has been specified yet. Add a `LICENSE` file before granting permission to reuse or distribute the project.
