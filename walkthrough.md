# Security Summary

**Reviewed Files**: 21
**Issues Resolved**: 10

### Issues Resolved
| Area | File | Line | What Was Happening | Impact | Status | How It Was Fixed |
|---|---|---|---|---|---|---|
| Unauthenticated Catalog Price Tampering | `server.ts` | 624 | Any unauthenticated caller could overwrite vendor prices or seeded catalog items via `/api/payments/register-listing`. | High | Fixed | Enforced verified Firebase ID token checks (`verifyRequestAuth`), verified-email validation, seeded-ID overwrite blocking (`SEEDED_CATALOG_IDS`), and owner/admin authorization. |
| Spoofed Payer Identity & Idempotency Collision | `server.ts` | 697 | `/api/payments/checkout` trusted a client-supplied `userId` and stored idempotency keys globally rather than per verified caller. | High | Fixed | Derived `effectiveUserId` strictly from the verified Firebase token (or `'guest'` for unauthenticated preview checkout), scoped idempotency keys per `${effectiveUserId}:${idemKey}`, and added HMAC-SHA256 receipt signing plus `crypto.randomInt`. |
| Unauthenticated Order Confirmation & Refund Tampering | `server.ts` | 874 | `/api/payments/confirm-pending` and `/api/payments/refund` did not verify order ownership and trusted client-supplied `fallbackAmount` values for archived orders. | High | Fixed | Enforced Firebase UID/admin ownership or constant-time `orderControlToken` (`crypto.timingSafeEqual`) for preview guest orders, locked single refunds (`409`), and recomputed archived totals from `AUTHORITATIVE_CATALOG`. |
| WebSocket Flood & Unvalidated Chat Frames | `server.ts` | 1077 | `/ws/community` accepted unbounded payloads and relayed arbitrary unvalidated message fields across connected clients. | Medium | Fixed | Capped `maxPayload` at 16 KB, added a 25-frames/10s sliding-window rate limiter, and strictly allowlisted and sanitized `CHAT_MESSAGE` fields and `authorAvatar` URLs on both server and client (`CommunityHubModal.tsx`). |
| Missing HTTP Hardening & API Rate Limiting | `server.ts` | 308 | Express exposed `X-Powered-By`, lacked protective response headers, accepted oversized JSON bodies, and had no IP throttling on AI grounding or checkout routes. | Medium | Fixed | Disabled `X-Powered-By`, added `nosniff`, `Referrer-Policy`, `Permissions-Policy`, and popup-safe `Cross-Origin-Opener-Policy` headers, capped JSON payloads at `256kb`, and added IP rate limiters on `/api` and `/api/grounding`. |
| Unsafe External Links & Grounding Bounds | `server.ts`, `src/components/GroundingPanels.tsx` | 334, 262 | Grounding endpoints lacked finite coordinate/length checks and rendered unvalidated `href` URLs returned in link metadata. | Medium | Fixed | Validated finite lat/lng ranges and bounded plain text on the server, and filtered rendered `<a href>` destinations through `sanitizeSafeHttpUrl`. |
| Active/SVG Image Upload & Media URI Injection | `src/utils/urlSecurity.ts`, `src/components/EcoChallengesSection.tsx`, `src/components/FavoritePhotosModal.tsx`, `src/components/TopThreePhotosModal.tsx` | 47, 309, 57, 72 | Photo uploaders, review/community forms, and profile/share-card image slots accepted unvalidated URLs or `image/svg+xml` uploads without MIME/size checks or inline error handling. | High | Fixed | Created `sanitizeImageUrl` / `sanitizeStoredMediaUrl`, restricted uploads to raster formats (`PNG/JPEG/WEBP/GIF` under 6 MB), sanitized all rendered/persisted media URLs across 9 UI modules and `src/firebase.ts`, and replaced `alert()` with inline validation banners. |
| Storage Cleanup Path Manipulation | `src/firebase.ts` | 834 | `deleteEcoChallengeProofPhoto` and challenge persistence accepted `proofStoragePath` strings without verifying the user-scoped prefix or traversal sequences. | Medium | Fixed | Enforced `SAFE_ECO_STORAGE_PATH_RE`, rejected `..`, and verified that the path UID segment matches the authenticated user before Storage deletion or Firestore persistence. |
| Calendar (.ics) & MIME Email Header Injection | `src/utils/calendar.ts`, `src/utils/gmailService.ts` | 72, 96 | User-controlled titles, locations, recipients, and subjects were interpolated into `.ics` lines and RFC 2822 email headers without stripping CR/LF control characters. | Medium | Fixed | Added `escapeIcsText` / `sanitizeIcsUidToken` / safe download filenames in `calendar.ts`, and `STRICT_SINGLE_EMAIL_RE` plus control-character stripping in `assertValidRecipientEmail` and `buildRawMimeMessage`. |
| Permissive Firestore Media URLs & Payment State Transitions | `firestore.rules` | 36, 467 | Firestore rules did not enforce safe URL schemes on avatars/photos, Storage prefix binding on `proofStoragePath`, or forward-only `paymentStatus` transitions on `/users/{userId}/orders/{orderId}`. | High | Fixed | Added `isSafeStoredUrl(url)` across all stored image/avatar rules, enforced UID-bound `proofStoragePath` regexes, and locked order status updates against regressing from `CONFIRMED` or mutating `REFUNDED` records. |

### Safeguards Verified
| Area | File | How It's Protected |
|---|---|---|
| Firebase Token & Ownership Verification | `server.ts`, `src/firebase.ts`, `src/App.tsx`, `src/components/UnifiedCartModal.tsx` | Backend routes verify RS256 Firebase ID tokens against Google's cached x509 public certificates (`iss`, `aud`, `exp`, `iat`, `auth_time`, `sub`, `email_verified`) and enforce strict owner/admin checks or in-memory guest HMAC control tokens (`src/utils/guestOrderTokens.ts`). |
| Payment Integrity & Non-Trusted Client Totals | `server.ts`, `src/App.tsx`, `src/components/UnifiedCartModal.tsx` | Checkout and refund computations rely exclusively on `AUTHORITATIVE_CATALOG` (`calculateAuthoritativeTotals`) with `crypto.randomInt` IDs and HMAC-SHA256 receipt signatures; `PAYMENT_HMAC_SECRET` is never exposed to clients or `.env.example`. |
| Safe URL & Media Rendering | `src/utils/urlSecurity.ts`, `src/components/AdventureLogbookSection.tsx`, `src/components/ContactsSyncSection.tsx`, `src/components/ExpeditionReviewsSection.tsx`, `src/components/views/ProfileView.tsx`, `src/utils/expeditionShareCard.ts` | No `innerHTML` or `dangerouslySetInnerHTML` sinks exist; every image and external anchor passes through `sanitizeImageUrl`, `sanitizeStoredMediaUrl`, or `sanitizeSafeHttpUrl`. |
| Firestore Rules & Schema Validation | `firestore.rules` | Default-deny fallback with strict allowlisted keys (`hasAll`/`hasOnly`), validated IDs, verified email requirement, immutable financial totals, and deployed rules (`npx eslint firestore.rules` clean, `DeployRules` succeeded). |
| Package & Build Verification | `package.json`, `bun.lock` | `compile_applet` and `lint_applet` (`tsc --noEmit`) passed with zero errors; `bun audit` reported 0 direct runtime vulnerabilities and only 2 transitive advisories inside unused Firebase Node `@grpc/grpc-js@1.9.16` transport internals (no active runtime path in Vite client or Express routes). |

## PoC Verification

### 1. Catalog Price Tampering via Unauthenticated Listing Registration

#### Summary
| Field | Value |
|---|---|
| Issue Type | Missing Authentication & Overwrite Guard |
| Impact | High |
| Affected File | `server.ts:624` |
| Test Scenario | `POST /api/payments/register-listing` with `{"id":"evt-2","price":1,"title":"Gratuite"}` and no `Authorization` header |

#### How It Was Fixed
The endpoint verifies a Firebase RS256 Bearer token and verified email address, rejects modifications to any ID present in `SEEDED_CATALOG_IDS`, and checks that updates to existing partner entries come from the original `ownerUserId` or verified admin.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Unauthenticated `POST /api/payments/register-listing` reaches `server.ts:624` | Enters route handler |
| 2 | `verifyRequestAuth(req)` at `server.ts:625` returns `{ status: 'missing' }` | Fails auth check |
| 3 | Guard at `server.ts:626-628` returns HTTP `401`; even for a signed-in user, `SEEDED_CATALOG_IDS.has('evt-2')` at `server.ts:656-658` returns HTTP `403` | **Handled Safely** |

#### Conclusion
**Fix Verified** - Neither unauthenticated callers nor non-owner accounts can tamper with seeded or partner catalog prices.

---

### 2. Forged Payer Identity & Archived Refund Amount Manipulation

#### Summary
| Field | Value |
|---|---|
| Issue Type | Broken Access Control & Client-Trusted Refund Amount |
| Impact | High |
| Affected File | `server.ts:697` / `server.ts:922` / `src/App.tsx:994` |
| Test Scenario | `POST /api/payments/refund` with `{"orderId":"ord-archived-1","fallbackAmount":9999999}` or cross-user refund without ownership/control token |

#### How It Was Fixed
Checkout ignores client-supplied user IDs and binds the order to the verified Firebase `uid` (or `'guest'` with an in-memory HMAC `orderControlToken`). Confirming pending orders and processing refunds require verified owner/admin credentials or constant-time `orderControlToken` matching, lock repeated refunds (`409`), and recompute archived order totals solely from `AUTHORITATIVE_CATALOG`.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Attacker sends `POST /api/payments/refund` targeting an archived or third-party `orderId` at `server.ts:922` | Enters refund handler |
| 2 | For in-memory orders (`server.ts:956-976`), missing owner `uid` or invalid `orderControlToken` fails `verifyGuestOrderControlToken` (`crypto.timingSafeEqual`) with HTTP `403`/`401` | Ownership check enforced |
| 3 | For archived orders (`server.ts:998-1018`), unauthenticated calls get HTTP `401`, and client `fallbackAmount` is ignored because `calculateAuthoritativeTotals(items)` recomputes `recomputedGrandTotal` from `AUTHORITATIVE_CATALOG` | **Handled Safely** |

#### Conclusion
**Fix Verified** - Attackers cannot refund other users' orders, bypass guest ownership tokens, double-refund, or inflate refund amounts.

---

### 3. Malicious Image URIs, SVG File Uploads & Unvalidated External Links

#### Summary
| Field | Value |
|---|---|
| Issue Type | Unsafe URI Scheme & Active Image Upload |
| Impact | High |
| Affected File | `src/utils/urlSecurity.ts:47` / `src/components/EcoChallengesSection.tsx:309` / `src/components/FavoritePhotosModal.tsx:57` |
| Test Scenario | Submitting `javascript:alert(1)` or uploading a disguised `.svg` (`image/svg+xml`) containing `<script>` into photo modals, review forms, eco-challenges, or grounding links |

#### How It Was Fixed
File uploaders restrict MIME types to raster formats (`^image/(png|jpe?g|webp|gif)$`) under 6 MB, `sanitizeImageUrl` / `sanitizeStoredMediaUrl` block `javascript:`, `vbscript:`, `data:image/svg+xml`, and `data:text/html` before state storage or rendering, and `GroundingPanels.tsx` validates external `<a href>` links with `sanitizeSafeHttpUrl`.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Disguised `image/svg+xml` file or `javascript:alert(1)` string enters `handleFileUpload` (`FavoritePhotosModal.tsx:51`, `EcoChallengesSection.tsx:304`) or form submission | Enters input handler |
| 2 | Regex `/^image\/(png\|jpe?g\|webp\|gif)$/i` rejects SVG MIME; `sanitizeImageUrl` / `sanitizeStoredMediaUrl` (`src/utils/urlSecurity.ts:47-107`) rejects non-HTTP(S) / non-raster schemes | Validation fails and shows inline error banner |
| 3 | Even on direct render or share-card canvas load (`expeditionShareCard.ts:235`, `ProfileView.tsx:574`), `sanitizeImageUrl` returns `''` or safe fallback asset path | **Handled Safely** |

#### Conclusion
**Fix Verified** - Scriptable URI schemes and SVG active uploads are blocked prior to persistence, upload, and DOM/canvas rendering.

---

### 4. WebSocket Room Flooding & Unsanitized Chat Broadcasts

#### Summary
| Field | Value |
|---|---|
| Issue Type | Missing Payload/Rate Limits & Unvalidated Real-Time Message Relay |
| Impact | Medium |
| Affected File | `server.ts:1077` / `src/components/CommunityHubModal.tsx:509` |
| Test Scenario | Sending a >16 KB frame, >25 frames in 10 seconds, or a `CHAT_MESSAGE` with `authorAvatar: "javascript:alert(1)"` to `/ws/community` |

#### How It Was Fixed
`WebSocketServer` caps incoming frames at 16 KB (`maxPayload`), enforces a 25-frames/10s sliding window per socket, reconstructs outbound `CHAT_MESSAGE` objects field-by-field while filtering `authorAvatar` through `isSafeStoredMediaUrl`, and `CommunityHubModal.tsx` independently re-validates incoming frames.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Oversized (>16 KB) or high-frequency frames hit `/ws/community` at `server.ts:1080` and `server.ts:1130-1138` | >16 KB dropped by `ws`; bursts >25/10s dropped by limiter |
| 2 | `CHAT_MESSAGE` with spoofed `authorAvatar: "javascript:alert(1)"` reaches `server.ts:1196` | `isSafeStoredMediaUrl` returns `undefined` so `authorAvatar` is omitted |
| 3 | Receiving client at `CommunityHubModal.tsx:511-537` validates `id`, `roomId`, bounded `text`, and `sanitizeStoredMediaUrl(incomingMsg.authorAvatar)` | **Handled Safely** |

#### Conclusion
**Fix Verified** - Real-time community chat resists payload/frame flooding and strips unsafe avatar URLs on both relay and receipt.

---

### 5. Calendar (.ics) & Email (MIME) Control-Character Injection

#### Summary
| Field | Value |
|---|---|
| Issue Type | Delimiter & Header Injection |
| Impact | Medium |
| Affected File | `src/utils/calendar.ts:72` / `src/utils/gmailService.ts:96` |
| Test Scenario | Event title `"Trek\r\nVALARM:..."` in `.ics` export or recipient `"user@example.com\r\nBcc: attacker@evil.test"` in Gmail draft/send |

#### How It Was Fixed
`calendar.ts` strips ASCII control chars (`[\u0000-\u001F\u007F]`), escapes `\`, `;`, and `,` via `escapeIcsText`, and restricts UIDs and filenames. `gmailService.ts` rejects any recipient failing `STRICT_SINGLE_EMAIL_RE` and strips CR/LF/NUL characters before MIME encoding.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Crafted event title enters `generateEventICS` (`src/utils/calendar.ts:245`) or injected `to` header enters `buildRawMimeMessage` (`src/utils/gmailService.ts:275`) | Enters formatter |
| 2 | `escapeIcsText` (`calendar.ts:72-80`) collapses `\r\n` to space and escapes delimiters; `assertValidRecipientEmail` (`gmailService.ts:99-105`) rejects injected `Bcc:` headers | Injected syntax neutralized or rejected |
| 3 | Output `.ics` stays inside its single `SUMMARY:` property and invalid email throws before reaching Gmail API | **Handled Safely** |

#### Conclusion
**Fix Verified** - Calendar exports and Gmail MIME messages cannot break out of property or header boundaries via CR/LF payloads.

---

### 6. Storage Path Prefix Escape & Firestore Order State Regression

#### Summary
| Field | Value |
|---|---|
| Issue Type | Cross-User Storage Path Reference & Permissive Status Update |
| Impact | High |
| Affected File | `src/firebase.ts:834` / `firestore.rules:182` / `firestore.rules:467` |
| Test Scenario | Submitting `proofStoragePath: "eco-challenge-proofs/victimUid/proof.jpg"` or downgrading a `REFUNDED` order back to `CONFIRMED` in Firestore |

#### How It Was Fixed
Client helpers and `firestore.rules` enforce strict regex prefix matching (`^eco-challenge-proofs/<userId>/...`) without `..`, validate stored URLs with `isSafeStoredUrl`, and constrain order updates to monotonic forward `paymentStatus` transitions while keeping `REFUNDED` terminal.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Cross-user `proofStoragePath` reaches `deleteEcoChallengeProofPhoto` (`src/firebase.ts:836`) or `firestore.rules:182` | Path prefix mismatch detected |
| 2 | `match[1] !== currentUid` skips client deletion and `firestore.rules:182` denies document write; order updates with `existing().paymentStatus == 'REFUNDED'` fail `firestore.rules:471` & `489-492` | Rejected by client check & Firestore Rules |
| 3 | Updated rules linted cleanly with `npx eslint firestore.rules` and deployed via `DeployRules` | **Handled Safely** |

#### Conclusion
**Fix Verified** - Storage proof paths remain confined to the authenticated owner's folder and order payment states cannot regress or reopen after refund.
