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
   - `/users/{userId}/eco_challenges/{challengeId}` requires owner + Master Gate (`userExists(userId)`), immutable owner (`userId == userId`), `wasteBagReturned == true`, `leaveNoTracePledge == true`, bounded `ecoPoints` (`50..500`), and optional bounded Firebase Storage proof fields (`proofPhotoUrl <= 1000`, `proofStoragePath <= 300`).
   - `UserProfile` fields `ecoPoints` (`0..1000000`), `zeroWasteExpeditionsCount` (`0..10000`), and `unlockedBadgeIds` (array size `<= 30`) are strictly validated on create/update.
9. **Carnet Éco-Log Isolation & Integrity**:
   - `/users/{userId}/eco_logs/{logId}` requires owner + Master Gate (`userExists(userId)`), immutable `id`/`userId`/`createdAt`, valid category in `['FAUNE', 'FLORE', 'MARINE', 'OISEAUX']`, bounded strings (`speciesName` 2..120, `notes` 3..800), and server-enforced `createdAt`/`updatedAt == request.time`.
10. **Trusted Google Contacts PII Isolation**:
   - `/users/{userId}/trusted_contacts/{contactId}` contains sensitive PII (`phoneNumber`, `email`). Access is strictly owner-only (`request.auth.uid == userId && userExists(userId)`), `id`/`userId`/`resourceName`/`createdAt` are immutable, and string lengths are bounded.
11. **Community Activity Feed, Comments & Likes Integrity (Zero PII)**:
   - `/community_activities/{activityId}`, `/comments/{commentId}`, and `/likes/{likeUserId}` contain zero PII and require `visibility == 'PUBLIC'` plus `userExists(request.auth.uid)`.
   - Comments and likes enforce Master Gate `activityExists(activityId)` on create/get; likes restrict document ID to `request.auth.uid` so one user can never spoof or remove another user's like.
   - Deletions on activities and comments are strictly restricted to the author (`existing().userId == request.auth.uid`).
12. **Real-Time Community Chat Messages Integrity (Zero PII)**:
    - `/community_chat_messages/{messageId}` contains zero PII, enforces `roomId in ['general', 'mondah', 'ivindo', 'pongara', 'cristal']`, bounded text (`1..500`), `createdAt == request.time`, and author-only deletion.
13. **Unified Marketplace Orders Integrity & Terminal Refund Lock**:
    - `/users/{userId}/orders/{orderId}` enforces owner + Master Gate (`userExists(userId)`), immutable financial breakdown (`itemsSubtotal`, `deliveryFee`, `depositTotal`, `platformCommission`, `vendorNetAmount`, `grandTotalCharged`, `receiptHash`, `idempotencyKey`), and forbids deleting financial records (`delete: if false`).
    - Orders marked `REFUNDED` are permanently terminal and cannot transition back to `CONFIRMED`.
14. **Vendor & Provider Listings Integrity (Zero PII)**:
    - `/vendor_listings/{listingId}` enforces `visibility == 'PUBLIC'`, `userExists(request.auth.uid)` on create, immutable `ownerUserId`/`createdAt`, bounded pricing (`0..10000000`) & stock (`0..1000`), and restricts updates/deletes to the listing owner or verified admin (`stephaneakagah@gmail.com`).
15. **Public Explorer Profiles Isolation (Zero PII)**:
    - `/public_profiles/{userId}` strictly forbids `email`, `phone`, or financial fields; only `request.auth.uid == userId` with existing `/users/{userId}` may write/delete their public profile.
16. **Site Contributions & Storage Path Integrity (Zero PII)**:
    - `/site_contributions/{contributionId}` requires `userExists(request.auth.uid)`, `userId == request.auth.uid`, valid `contributionType`, `visibility == 'PUBLIC'`, `createdAt == request.time`, and strict Storage path regex (`^site-contributions/{userId}/...`). Author-only deletion.
17. **1-to-1 Private Chat Participant Containment**:
    - `/direct_chats/{chatId}` enforces exact 2 distinct participants (`participantUids.size() == 2`), and allows read/list/write ONLY when `request.auth.uid in participantUids`.
    - `/direct_chats/{chatId}/messages/{messageId}` enforces `existsAfter` / `get` Master Gate on `/direct_chats/{chatId}`, `senderId == request.auth.uid`, participant membership check on both `get`/`list`/`create`, and sender-only deletion.

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
17. **Oversized / invalid Eco-Log entry**: Creating `/users/alice/eco_logs/log-1` with invalid category or 1000-char notes.
18. **Cross-user Trusted Contact PII read**: User `bob` listing or reading `/users/alice/trusted_contacts`.
19. **Oversized / base64 proofPhotoUrl injection on EcoChallenge**: Creating `/users/alice/eco_challenges/eco-1` with a >1000-char base64 `proofPhotoUrl` payload instead of a Firebase Storage URL.
20. **Orphaned Activity Comment**: Creating `/community_activities/missing-act/comments/c1` when parent activity does not exist.
21. **Like Spoofing**: User `bob` creating `/community_activities/act-1/likes/alice` with `likeUserId != request.auth.uid`.
22. **Invalid Chat Room Injection**: Creating `/community_chat_messages/msg-1` with `roomId: 'admin_secret'`.
23. **Cross-user Chat / Activity deletion**: User `bob` deleting Alice's `/community_activities/act-alice` or `/community_chat_messages/msg-alice`.
24. **Marketplace Order Financial Tampering / Deletion**: User `alice` trying to reduce `grandTotalCharged` on an existing order or deleting `/users/alice/orders/ord-1`.
25. **Refunded Order Terminal Reversal**: Updating `/users/alice/orders/ord-1` from `REFUNDED` back to `CONFIRMED`.
26. **Cross-Vendor Listing Tampering**: User `bob` updating or deleting Alice's `/vendor_listings/lst-alice`.
27. **Public Profile PII Injection**: Creating `/public_profiles/alice` with `email` or `phone` field or cross-user spoofing by `bob`.
28. **Cross-User Site Contribution Storage Path Spoofing**: User `bob` creating `/site_contributions/sc-1` with `userId: "alice"` or `storagePath: "site-contributions/alice/hack.jpg"`.
29. **Third-Party Private Chat Eavesdropping**: User `charlie` reading or listing `/direct_chats/dm_alice__bob` or `/direct_chats/dm_alice__bob/messages`.
30. **Private Chat Sender Spoofing**: User `bob` creating `/direct_chats/dm_alice__bob/messages/m-1` with `senderId: "alice"`.
