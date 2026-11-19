# MANGOREMA Firestore Security Specification

## 1. Data Invariants
1. **Default-Deny Catch-All**: Every path not explicitly matched is denied (`allow read, write: if false`).
2. **Verified Identity**: All reads and writes require `request.auth != null && request.auth.token.email_verified == true`.
3. **Strict Owner Isolation (PII Protection)**:
   - `/users/{userId}` contains PII (`email`, `phone`). Only `request.auth.uid == userId` may `get`, `create`, or `update`. `list` is permanently forbidden on `/users`.
   - `/users/{userId}/bookings/{bookingId}` and `/users/{userId}/incidents/{incidentId}` require the parent `/users/{userId}` document to exist (Master Gate), `request.auth.uid == userId`, and `resource.data.userId == request.auth.uid` on queries (`list`).
4. **Temporal & Immutable Integrity**:
   - `createdAt` must equal `request.time` on `create` and remain unchanged on `update`.
   - `updatedAt` must equal `request.time` on `create` and `update` (for UserProfile).
   - `uid` / `userId` / `id` / `refNumber` are immutable after creation.
5. **Terminal State Locking**:
   - Bookings with `status == 'USED'` cannot be modified or reverted to `'CONFIRMED'`.
6. **Bounded Strings & Arrays (Anti-DoS / Denial of Wallet)**:
   - Path variables (`userId`, `bookingId`, `incidentId`, `reviewId`) must match `^[a-zA-Z0-9_\-]+$` and length <= 128.
   - `favoritePhotoIds` size <= 20; `topThreePhotoIds` size <= 3.
7. **Expedition Reviews Integrity & PII Isolation**:
   - `/expedition_reviews/{reviewId}` contains zero PII (`email`, `phone` forbidden).
   - `rating` must be an integer `1 <= rating <= 5`; `comment` bounded to `3..400` chars; `visibility` fixed to `'PUBLIC'`.
   - `create` requires verified user (`userExists(request.auth.uid)`), `userId == request.auth.uid`, and `createdAt == request.time`.
   - `delete` restricted strictly to the review author (`existing().userId == request.auth.uid`).
8. **Eco-Challenges Zero-Waste Verification & Profile Sync**:
   - `/users/{userId}/eco_challenges/{challengeId}` requires owner + Master Gate (`userExists(userId)`), immutable owner (`userId == userId`), `wasteBagReturned == true`, `leaveNoTracePledge == true`, and bounded `ecoPoints` (`50..500`).
   - `UserProfile` fields `ecoPoints` (`0..1000000`), `zeroWasteExpeditionsCount` (`0..10000`), and `unlockedBadgeIds` (array size `<= 30`) are strictly validated on create/update.

## 2. The "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated read/write**: Reading `/users/alice` with `auth == null`.
2. **Unverified email spoofing**: Creating `/users/bob` with `email_verified: false`.
3. **Cross-user PII read**: User `bob` calling `get` on `/users/alice`.
4. **Collection scraping (`list`)**: User `bob` listing `/users` collection.
5. **Shadow / Ghost field injection on UserProfile**: Creating `/users/alice` with extra field `isAdmin: true`.
6. **Oversized Top 3 array**: Updating `topThreePhotoIds` with 4 items (`['1','2','3','4']`).
7. **ID Poisoning**: Creating `/users/alice/bookings/bad..id!` with illegal characters or >128 chars.
8. **Orphaned Booking without Master Gate**: Creating `/users/alice/bookings/b1` when `/users/alice` does not exist.
9. **Identity Spoofing in subcollection**: User `bob` creating `/users/alice/bookings/b1` with `userId: "alice"`.
10. **Client-forged timestamp**: Creating `/users/alice` with `createdAt` different from `request.time`.
11. **Terminal State Reversal**: Updating a booking whose existing `status` is `'USED'` back to `'CONFIRMED'`.
12. **Immutable field tampering**: Updating `totalAmount` or `paymentMethod` on an existing booking.
13. **Out-of-bounds review rating / comment**: Creating `/expedition_reviews/rev-1` with `rating: 6` or `comment: "ok"` (<3 chars).
14. **Cross-user review deletion**: User `bob` deleting Alice's review on `/expedition_reviews/rev-alice`.
15. **Unpledged Eco-Challenge claim**: Creating `/users/alice/eco_challenges/eco-1` with `wasteBagReturned: false` or `ecoPoints: 99999`.
16. **Cross-user Eco-Challenge spoofing**: User `bob` creating `/users/alice/eco_challenges/eco-1`.
