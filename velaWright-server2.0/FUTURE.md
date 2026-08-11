## Mobile App

-Finish the mobile app and tie it into the database and server
- Add a homescreen widget for quick on the go trace      documentaion without having to open the app
 
---

## Email Notifications

- Add forgot password, reset password or username, email verification, and security notifications via email for launching with an owned domain

---

## Security hardening (called out as known risk in SECURITY_REVIEW.md)

- Rate limiting on `POST /auth/login` — currently unlimited login attempts allow brute-force/credential-stuffing attacks. Would need `express-rate-limit` or Cloudflare in front of the API.
- Move JWT from `localStorage` to `httpOnly` cookies — removes XSS exposure. Requires changes to CORS config and auth flow on both frontend and backend.
- Token revocation before 7-day expiry — currently a stolen token stays valid until expiry (or until the user is deleted). A proper fix requires a Redis blocklist checked on every `requireAuth` call.

---

## CI/CD + deployment maturity

- Auto-deploy on push to main — wire GitHub → Render/Vercel so every push deploys automatically without a manual trigger.
- Staging environment — a separate `staging` branch + separate Render/Vercel project for testing before hitting production.
- Monitoring and alerting — something like Sentry for error tracking, or Render's built-in metrics, so production errors surface without checking logs manually.

---

## Features that were deferred or removed

- Image upload for Endeavors — removed because local disk storage on Render is ephemeral. The proper implementation would use a cloud store (Cloudinary or S3) with a signed upload URL. Backend already had the validation logic; it just needs a real storage target.
- Admin panel UI — the `admin` role and `GET /admin/users` route exist on the backend, but there is no frontend page for admin features. A future `/admin` page could show user list, usage stats, etc.
- Third-party API integration — e.g. auto-populate Endeavor repo data from the GitHub API when a repo URL is entered (stars, last commit, language).

---

## Polish and accessibility

- Accessibility audit — keyboard navigation, focus rings, ARIA labels, and color contrast pass. Currently untested.
- Responsive layout audit for very small screens — the panel system is usable on tablet but was not tested below ~400px.

---

## Remove Demo URL

---

## Add start date to Endeavor Form separate from Deploy Date

---

## Add Marks to embeded Traces

---

## Make Appearance settings last through reload