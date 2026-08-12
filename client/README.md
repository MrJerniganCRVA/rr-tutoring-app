# RR Tutoring Scheduler — Client

React frontend for the RR Tutoring Scheduler. See the [root README](../README.md) for the full project overview, database schema, and API reference.

## Local Development

```bash
npm install
npm start
```

The app runs at http://localhost:3000 and expects the server running at http://localhost:5000 by default — override with `REACT_APP_API_BASE_URL` if needed.

Sign-in uses Google OAuth (restricted to `@coderva.org` accounts) — there's no separate teacher-selection screen; the server must already have a matching Teacher record for login to succeed (see the root README's `admin:bootstrap` note for a brand-new database).

## Building for Production

```bash
npm run build
```

Produces a static `build/` folder. In production this is deployed on Railway as its own service, served by Caddy (see `Caddyfile`) — not manually via `serve` or a Raspberry Pi/PM2 setup. `REACT_APP_API_BASE_URL` is baked in at build time (Create React App inlines `REACT_APP_*` vars into the bundle), so it must be set correctly *before* building, not just at runtime.
