# DigiBar Deployment Guide

**Date:** June 2, 2026
**Version:** 1.0
**Status:** Production Ready

---

## 1. Pre-Deployment Verification

Before deploying, ensure the "Manual Testing" checklist from `SESSION_SUMMARY.md` is complete:
- [ ] Login with username/passcode works
- [ ] Dashboard loads with new Payment Breakdown card
- [ ] Stock alerts display correct urgency badges (Critical/High/Medium)
- [ ] Mobile layout is responsive

## 1.5. Critical Technical Debt Patches

**⚠️ ACTION REQUIRED:** Before building, apply the code changes detailed in `docs/PRE_DEPLOYMENT_IMPLEMENTATION.md`.

1. **Security:** Install `helmet` & `express-rate-limit` and apply to `app.ts`.
2. **Validation:** Refactor `users.ts` to use Zod schema validation.
3. **Standardization:** Apply the JSON serialization fix for BigInt/Decimal types.

## 2. Backend Deployment (Firebase Functions)

The backend utilizes Firebase Cloud Functions (2nd Gen).

### Step 1: Build
Compile the TypeScript code to JavaScript.
```bash
cd backend
npm run build
```

### Step 2: Deploy
Deploy the functions to your Firebase project.
```bash
firebase deploy --only functions
```

*Note: If prompted for parameters (like `MAX_INSTANCES`), you can accept the defaults or set `1` for initial safety.*

## 3. Frontend Deployment (Next.js)

### Step 1: Production Build
Create the optimized production build.
```bash
cd frontend
npm run build
```

### Step 2: Deploy
If using Firebase Hosting:
```bash
firebase deploy --only hosting
```
*(Or use `vercel --prod` if hosted on Vercel)*

## 4. Post-Deployment Sanity Check

1. **Health Check:** Verify the backend is responding (e.g., check the `/health` endpoint).
2. **Dashboard:** Log in to the live site and verify the **Payment Breakdown** numbers match your POS data.
3. **Alerts:** Confirm that **Low Stock Alerts** are visible and accurate.