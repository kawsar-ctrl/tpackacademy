# Security Specification — TPACK Academy LMS

## Phase 0: Data Invariants
1. **Default-Deny Baseline**: Every unspecified path in Firestore is denied (`allow read, write: if false`).
2. **PII Isolation**: `/users/{userId}` holds teacher PII (`email`, `displayName`, `schoolName`) and is readable (`get`) and writable (`create`, `update`) strictly by the verified owner (`request.auth.uid == userId && request.auth.token.email_verified == true`). `allow list: if false` prevents any user enumeration or collection scraping.
3. **Master Gate on Subcollections**: `/users/{userId}/progress/{progressId}` requires both owner verification and `exists(/databases/$(database)/documents/users/$(userId))` on create/update/get so orphaned progress documents cannot exist.
4. **Identity & Timestamp Integrity**: `uid`, `userId`, and `createdAt` are immutable once written; `createdAt` on create and `updatedAt` on create/update must equal `request.time`.
5. **Bounded Types & Strict Keys**: Every string enforces `.size()`, every list enforces bounded `.size()` and first-element type checks, every map enforces `.size()`, and every create enforces `keys().hasAll(...) && keys().hasOnly(...)` while updates enforce `affectedKeys().hasOnly(...)`.
6. **Admin-Only Catalog Mutations & Query Safety**: `/courses/{courseId}` and `/materials/{materialId}` allow public reads (`get`, `list`) strictly when `published == true` (or when `request.auth.token.email == 'aayat6666@gmail.com' && email_verified == true` for `list` without `get()`/`exists()` calls). Create, update, and delete on `/courses` and `/materials` are strictly gated by `isAdmin()`, `isValidId()`, strict field allowlists, and `createdByUid == request.auth.uid`.

## The "Dirty Dozen" Adversarial Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Profile Read**: Anonymous `get(/users/userA)` -> `PERMISSION_DENIED`.
2. **Cross-User PII Read**: Signed-in `userB` calling `get(/users/userA)` -> `PERMISSION_DENIED`.
3. **User Enumeration List**: Signed-in `userA` calling `list(/users)` -> `PERMISSION_DENIED`.
4. **Unverified Email Write**: User with `email_verified == false` attempting `create(/users/userA)` or `create(/courses/c1)` -> `PERMISSION_DENIED`.
5. **UID Spoofing on Create**: `userA` writing `{ uid: "userB", ... }` to `/users/userA` -> `PERMISSION_DENIED`.
6. **Ghost / Shadow Field Injection**: `userA` adding `isAdmin: true` or `role: "admin"` to `/users/userA` or a shadow field to `/courses/c1` -> `PERMISSION_DENIED`.
7. **Forged Client Timestamp**: Sending `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time` -> `PERMISSION_DENIED`.
8. **Immutable Field Mutation**: Attempting to update `uid`, `createdByUid`, or `createdAt` -> `PERMISSION_DENIED`.
9. **Oversized String / Denial-of-Wallet**: Sending a 5,000-char `displayName` or >100KB `imagePath` -> `PERMISSION_DENIED`.
10. **Path Variable ID Poisoning**: Request to `/users/userA/progress/invalid$id!` or `/courses/bad$id` -> `PERMISSION_DENIED`.
11. **Non-Admin Course/Material Mutation**: Signed-in regular learner writing to `/courses/c1` or `/materials/m1` -> `PERMISSION_DENIED`.
12. **Draft Leak via Public Read**: Unauthenticated user reading a `/courses/draft1` or `/materials/draft1` document with `published: false` -> `PERMISSION_DENIED`.
