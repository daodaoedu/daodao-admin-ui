# Onboarding Flows Debug - 2026-05-30

## Question

Why does `/admin/onboarding-flows` show no real data?

## Findings

- Frontend endpoint: `/daodao-server/api/v1/admin/onboarding/flows`.
- Vite proxy rewrites `/daodao-server` to `http://localhost:4000`.
- Backend route exists at `/api/v1/admin/onboarding/flows` and requires admin auth.
- Backend response shape uses `isEnabled`, `questionText`, and `questionType`.
- Frontend types/page currently expect `isActive`, `question`, and `type`.

## Next Checks

- Query local backend database table counts for `onboarding_flows`, `onboarding_steps`, and `onboarding_responses`.
- Decide whether the frontend should adapt the backend shape or the backend contract should be changed.
