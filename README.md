# CorkCount Winery 🍷

A modern, full-stack wine e-commerce platform with advanced inventory management, automated tagging, and seamless order processing.
# CorkCount (demo) 🍷

[Live demo](https://corkcount-demo.netlify.app/) — https://corkcount-demo.netlify.app/

This repository is a demo-only snapshot of a wine e-commerce UI and small demo APIs. It's intended for local evaluation, learning, and experimentation — not for production.

What this demo contains

- A lightweight React + Vite frontend (TypeScript)
- Small demo API functions (Netlify/Express style) using mock or in-memory data
- Auto-tagging utilities and sample data for UI testing

Quick start (demo)

1. Install dependencies:

```powershell
pnpm install
```

2. Start the local dev server (frontend + demo functions):

```powershell
pnpm dev
```

3. Open the app in your browser:

```text
http://localhost:8080
```

Notes & limitations

- This demo is intentionally simplified and not secure. Do not expose it to the public Internet.
- Features that previously required external services (Supabase, Resend, etc.) may be stubbed or disabled.
- You don't need real service credentials to run the demo locally. If you add real integrations, keep keys out of the repo and document them separately.

Project layout (short)

- `client/` — React app and UI components
- `netlify/functions/` — demo serverless functions used by the UI
- `server/` — small Express server used for local/demo routes
- `shared/` — shared types and API shapes
- `docs/` — supporting docs (auto-tagging guide, etc.)

Contributing

- Improvements that keep the demo self-contained are welcome (smaller dataset, clearer mocks, better UX).
- For production-ready changes (real DB, auth, email), open an issue or PR and include migration/docs and safety checks.

License

This demo is provided under the MIT License. See `LICENSE` for details.

Enjoy exploring the demo!
```
