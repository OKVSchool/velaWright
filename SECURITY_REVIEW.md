# velaWright — Security Review

---

## 1. What I Checked

The audit was run line-by-line against the live codebase, not from memory.

| Item | Checked against |
|------|-----------------|
| No hardcoded secrets | Searched all source files for `JWT_SECRET`, `MONGODB_URI`, API keys — none found outside `.env` |
| `.env` gitignored | Confirmed in `.gitignore`; never appears in `git log` |
| JWT secret in env var with expiry | `process.env.JWT_SECRET`, `expiresIn: '7d'` — confirmed in `routes/auth.js` |
| Passwords bcrypt-hashed | `pre('save')` hook in `models/User.js` with cost factor 12; plaintext never written |
| All POST/PUT routes validate input | `validate(rules)` middleware applied to every write route across `auth`, `endeavors`, `leads`, `traces`, `marks` |
| Auth middleware on every protected route | `router.use(requireAuth)` at the top of every route file except `auth.js` |
| `requireAuth` calls `jwt.verify()` every request | `jwt.verify(token, process.env.JWT_SECRET)` — then confirms user still exists in DB |
| CORS locked to specific origin | `origin: process.env.CLIENT_URL` — no wildcard, exact Vercel URL in production |
| Errors don't leak stack traces | `httpError.js` `clientError()` translates DB errors to clean messages; all 500s return a generic string |
| No sensitive data logged | `console.log` statements reviewed — none print request bodies, passwords, or tokens |
| File upload type allowlist | `fileFilter` in `routes/endeavors.js` rejects anything outside `['image/jpeg', 'image/png', 'image/webp', 'image/gif']` |
| `npm audit` — no critical vulnerabilities | Server: `0 vulnerabilities`. Client: `3 high` in Next.js dependencies (see Remaining Risk) |

---

## 2. What I Tried to Break

Five attacks were run against the live deployed API using the `/dev` test suite built into the app.

**Attack 1 — No token**
`DELETE /marks/:id` with no `Authorization` header.

**Attack 2 — Tampered token**
`GET /endeavors` with `Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.dGFtcGVyZWQ.invalidsignature` — a JWT signed with a different secret.

**Attack 3 — Another user's data**
User B attempts `GET /endeavors/:id`, `PUT /endeavors/:id`, and `DELETE /endeavors/:id` where `:id` belongs to User A.

**Attack 4 — Bad and injection input**
- `POST /endeavors` with no `title` field
- `POST /endeavors` with `status: "invalid-enum"`
- `POST /auth/login` with `{ "email": { "$gt": "" } }` (NoSQL injection attempt)

**Attack 5 — Oversized upload**
`POST /endeavors/:id/image` with a file exceeding 5 MB.

---

## 3. What I Found

**Before hardening, two gaps existed:**

**Gap 1 — Raw MongoDB errors reached the client.**
Error responses from duplicate key violations and Mongoose validation failures were passed directly to `res.json(err)`. A response like:
```
MongoServerError: E11000 duplicate key error collection: projecthub.users index: email_1 dup key: { email: "user@example.com" }
```
...was sent to the browser, exposing the database name, collection name, and index structure.

**Gap 2 — File upload accepted any file type.**
The multer configuration had no `fileFilter`. Any MIME type — including `.php`, `.exe`, or `.html` — could be uploaded and stored in `/uploads`.

**All five attacks met clean refusals from the start:**
No attack caused a 500 or resulted in an unintended database write. The ownership enforcement (DB-filter-level scoping) and JWT verification were correct from the initial build.

**npm audit result:**
- Server dependencies: 0 vulnerabilities
- Next.js client dependencies: 3 high-severity in `postcss` and `sharp` (both are transitive dependencies of Next.js itself, not code we wrote — see Remaining Risk)

---

## 4. What I Fixed

**Fix 1 — Error sanitization (`middleware/httpError.js`)**

Added `clientError(err)` to translate known MongoDB errors into safe messages:
- `err.code === 11000` (duplicate key) → `"email is already in use"`
- `err.name === 'ValidationError'` → joined Mongoose validation messages
- All other errors in 400 paths → `"Invalid request"`
- All 500 handlers → `{ error: 'Something went wrong' }` (no internal detail)

Every `catch` block in every route was updated to use this function. Stack traces and database internals no longer reach the browser.

**Fix 2 — File type allowlist (`routes/endeavors.js`)**

Added a `fileFilter` to the multer configuration:
```js
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
fileFilter: (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) cb(null, true)
  else cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'))
}
```
The 5 MB size limit was also added at the same time. Disallowed types now return `400` with the reason before the file is written to disk.

---

## 5. Remaining Risk

Every application has residual risk. The following are named honestly.

**High-severity npm vulnerabilities in Next.js dependencies**
`npm audit` shows 3 high-severity issues in `postcss` and `sharp`, both transitive dependencies of Next.js 15. The fix (`npm audit fix --force`) would upgrade to Next.js 16, which is a pre-release version with breaking changes. Accepted as known risk for this project. Not exploitable through user-facing functionality given the attack surface.

**JWT stored in localStorage (XSS exposure)**
The auth token is stored in `localStorage` and read by `AuthContext`. If an XSS vulnerability existed in the app, a malicious script could read the token. The alternative — `httpOnly` cookies — would require changes to the CORS and authentication flow. This is the standard trade-off in token-based SPAs. Mitigated by: no `dangerouslySetInnerHTML` usage, all user content rendered as text (not HTML), Next.js's default output escaping.

**No rate limiting on `/auth/login`**
A client can make unlimited login attempts. An attacker can run a credential-stuffing or brute-force attack against known email addresses. Mitigation would require a rate-limiting middleware (e.g., `express-rate-limit`) or a service like Cloudflare. Not implemented in this project scope.

**Tokens are not revocable before 7-day expiry**
If a token is compromised, it remains valid until expiry unless the user's account is deleted from the database. `requireAuth` does confirm the user still exists in the DB on every request, so deleting an account immediately revokes access. A full revocation mechanism would require a token blocklist (Redis or DB table), which is outside this project's scope.

**Uploaded files are served without re-validation**
Files are served statically from `/uploads`. The file type is checked on upload (by MIME type), but the stored file is served by content path. A file with a `.jpg` extension containing non-image content would still be served. In production, file storage should move to an object store (S3, Cloudinary) with its own content-type enforcement.

**React Native transitive vulnerabilities in Expo SDK 54**
`npm audit` reports 14 vulnerabilities (13 moderate, 1 high) in `postcss` and `uuid`, both transitive dependencies of `expo ~54`. Neither is exploitable through the app's attack surface — the `postcss` XSS requires browser-side CSS stringification (React Native has no browser), and the `uuid` buffer bounds issue requires manually passing a `buf` argument that the app never uses. The fix (`npm audit fix --force`) would upgrade to Expo SDK 57, a breaking change requiring a full SDK migration. Accepted as known risk for this project scope.
