# AI Fitness Coach

A training and nutrition companion: meal-photo calorie estimation, a workout
planner with real week-to-week progression, on-device camera form analysis,
and habit tracking.

See [CLAUDE.md](./CLAUDE.md) for commands, the Supabase project, and the
conventions this codebase follows.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in SUPABASE_SERVICE_ROLE_KEY and GEMINI_API_KEY
npm run dev
```

## Status

Building milestone by milestone (M0 → M6). Current: **M0 — Foundation**
(schema, RLS, auth, app shell, design tokens).
