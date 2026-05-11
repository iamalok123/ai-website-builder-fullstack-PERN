# Zephyr Frontend

React 19, Vite, TypeScript, Tailwind CSS 4 frontend for the Zephyr AI Website Builder.

## Runtime

The app talks to the backend through the shared Axios client in `src/configs/axios.ts`.

Required local `.env` value:

```env
VITE_BASEURL="http://localhost:3000"
```

Optional value used by some auth/deployment setups:

```env
VITE_APP_URL="http://localhost:5173"
```

## Routes

- `/`: landing page and AI prompt entry.
- `/pricing`: Stripe credit package UI.
- `/projects`: authenticated project dashboard.
- `/projects/:projectId`: builder/editor workspace.
- `/preview/:projectId`: authenticated preview for current code.
- `/preview/:projectId/:versionId`: authenticated preview for a saved version.
- `/view/:projectId`: public published project view.
- `/community`: public published project gallery.
- `/auth/:pathname`: Better Auth UI.
- `/account/settings`: account settings.
- `/loading`: post-payment redirect screen.

## Local Development

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

Run the backend separately from `../backend`.

## Verification

Last verified locally on May 11, 2026:

```bash
npm run lint
npx tsc -b --noEmit
npm run build
```

The production build succeeds. Vite currently warns that the main JavaScript bundle is larger than 500 kB after minification; this is a performance warning, not a failed build.

## Notes

- API calls use `withCredentials: true`, so backend CORS and Better Auth trusted origins must include the frontend origin.
- Public and preview pages render generated HTML inside sandboxed iframes through `ProjectPreview`.
- The builder/editor flow depends on authenticated backend APIs and cannot be fully exercised without a configured backend, database, AI provider, and Inngest/Stripe services for those flows.
