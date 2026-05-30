# Email management workspace plan

- [x] Review current `/admin/email-management` structure and shared table component.
- [x] Choose approved tabs-first information architecture.
- [x] Refactor `EmailManagementPage` into overview plus three tabs.
- [x] Keep existing send/retry/history behavior intact.
- [x] Run focused Biome and build verification.

Verification notes:

- `pnpm exec biome check src/pages/EmailManagementPage.tsx src/components/EmailHistoryTable.tsx src/api/admin-system.ts` passed.
- `pnpm exec vite build` passed.
- `pnpm run build` is blocked before Vite by an unrelated untracked test import: `src/lib/__tests__/onboarding-flows.test.ts` imports missing `@/lib/onboarding-flows`.
