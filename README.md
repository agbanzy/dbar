# DigiBar

Monorepo with frontend and backend scaffolds.

## Structure
- `docs/PROJECT_DESIGN.md` - PM project design
- `docs/USER_STORIES.md` - user stories by role and module
- `docs/API_ENDPOINTS.md` - core API endpoints
- `docs/TEST_PLAN.md` - testing checklist and smoke plan
- `backend/` - Express + TypeScript API scaffold
- `frontend/` - Next.js + TypeScript UI scaffold

## Local setup (manual)
1) Install dependencies in each app.
2) Configure `backend/.env` from `.env.example`.
3) Configure `frontend/.env` from `.env.example` (API URL).
4) Run `backend` and `frontend` dev servers.

## Smoke testing
- Run the API and database, then execute: `node backend/scripts/smoke.mjs`
# dbar
