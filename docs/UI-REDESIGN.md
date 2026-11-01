# UI refresh notes

## Visual direction

The frontend now uses a light, editorial product interface rather than a heavy dashboard theme:

- Warm off-white canvas with crisp white work surfaces
- Evergreen primary navigation and primary actions
- Soft citrus/mint accent for positive states and attendance progress
- DM Sans for interface copy and Manrope for headings and key values
- Thin neutral borders, restrained shadows, rounded forms and clear hover/focus states
- Responsive collapse from fixed desktop navigation to a mobile slide-over menu
- Consistent skeleton/loading, toast, empty-state, table, filter and modal patterns

## Shared shell

`components/Shell/Shell.jsx` owns the fixed sidebar, sticky topbar, route title, user context, footer and `<Outlet />`. Page content is rendered inside the shell; navigation and footer are not placed inside individual feature pages.

## Routes

Public routes are `/login`, `/register` and `/policies`.

Intern routes are `/intern/dashboard`, `/intern/attendance`, `/intern/wallet`, `/intern/promos`, `/intern/notification` and `/intern/account`.

Admin routes are `/admin`, `/admin/groups`, `/admin/approvals`, `/admin/interns`, `/admin/attendance`, `/admin/wallet`, `/admin/promos`, `/admin/notifications` and `/admin/settings`.

Legacy intern paths redirect to the canonical `/intern/...` routes. Frontend guards improve navigation UX; backend authorization remains authoritative.

## Styling

`styles/global.css` imports Tailwind CSS v4 and defines design tokens. Feature and reusable components continue to use CSS Modules to keep styles scoped and easy to maintain.

## Validation status

Source parsing, CSS parsing and relative import checks passed. The dependency installer timed out in the current build environment, so a production Vite build and browser end-to-end test could not be completed in this session. Run `npm install` and `npm run build` under `client/` before deployment.
