Two deploys, two homes
Your frontend — the React, Next.js, Astro, or Expo build a browser or device loads — deploys to a static or app host like Vercel or Netlify. Your backend — the Express server with your routes, models, and database connection — needs a host that runs a live Node process, like Render or Railway. (Render has a genuinely free tier — no card, with a spin-down delay on idle. Railway now asks for a card and moves to a paid plan after its trial, so Render is the default free path here.) They are separate projects with separate URLs. Your frontend will end up at something like your-app.vercel.app and your backend at something like your-api.onrender.com, and your frontend code calls the backend by that second URL.

That means your frontend needs to know the backend’s address, and it can’t be hardcoded in a string buried in your fetch calls. It’s a value that changes between your laptop (localhost:3000) and production (your-api.onrender.com). Put it in an environment variable — the same pattern you used for secrets on D4, now pointing at a URL instead of a key.

Secrets live in the platform, never in the repo
You spent this week learning to keep secrets out of your code. Deploying is where that discipline gets tested for real, because each host has its own place to set environment variables and your .env file does not get deployed — it’s in .gitignore, which means it never leaves your machine. So every secret your backend needs in production, you set again in the host’s dashboard:

Backend host (Railway/Render): your MONGODB_URI, your JWT_SECRET, and any third-party API keys — set each one in the platform’s environment-variables config.
Frontend host (Vercel/Netlify): the public backend URL your fetch calls point at, set as the environment variable your frontend reads.
If your backend boots in production and immediately can’t reach the database, the first thing to check is almost always a missing or mistyped env var in the host dashboard. The code is fine; the value just isn’t there yet. This is the single most common production surprise, and now you know where to look.

CORS points at your real frontend
One more wiring step, and it’s the one that produces the scary red console error if you skip it. On D4 you configured CORS so your backend would accept requests from your frontend’s origin. In development that origin was localhost. In production it’s your deployed frontend URL. So when you deploy, update your backend’s CORS configuration to allow your live frontend’s address — not a wildcard *, the specific origin. If your app works locally but every request fails once it’s live with a CORS message, this is why: the backend is still only trusting localhost and your real frontend is a stranger to it.

The deploy-early order that prevents 11:55 panic. Deploy the empty shells first — backend with one health route, frontend with one page — and confirm both live URLs load before you build a single feature. Set your env vars then, wire CORS then, confirm the frontend can reach the backend then. Once that round-trip works on the live URLs, every feature you add is just more of a thing that already deploys. Leave deployment for the end and you’re debugging hosting, env vars, and CORS all at once while the clock runs.

The three production surprises, in the order to check them
When your app works locally but breaks the moment it’s live, it’s almost always one of three things, and they have a fixed order worth memorizing:

A missing or mistyped environment variable. The backend boots but can’t reach the database, or token verification fails on every request. Open the host dashboard and confirm every variable from your .env is set there too — same names, same values. Your .env never deployed, so production only knows what you typed into the dashboard.
A CORS origin still pointing at localhost. The frontend loads but every request fails with a CORS message in the console. Your backend is still only trusting localhost; update its CORS config to your live frontend’s exact URL and redeploy.
The frontend calling the wrong backend URL. Requests 404 or hit nothing. The frontend is still pointed at localhost:3000 instead of your live backend. Fix the environment variable that holds the backend URL on the frontend host, and redeploy the frontend so it picks up the new value.
Run that list top to bottom and you’ll resolve the overwhelming majority of “it works on my machine but not live” problems in a couple of minutes instead of an anxious half-hour. None of these are bugs in your code — they’re wiring between two deploys that don’t yet agree on where each other lives.

This is the simple version — on purpose
What you’re doing here is a first, deliberately simple deploy: push, set your variables, confirm it loads. That’s enough to ship a real full-stack app to a real URL today. It is not the whole story, and you’ll feel the gaps — there’s no separate staging environment, no automated pipeline that tests before it ships, no one-click rollback when a deploy breaks. That’s next course. In Course 3 you’ll add real environments, automated deployment pipelines, and the rollback and monitoring that turn “it’s live” into “it stays live.” For today, getting it live and reachable is the bar — the production-grade machinery comes after you’ve felt why you need it.

Pause and map your two homes
Before you push anything, picture your own app for a second. Which host is your frontend landing on, and which one runs your backend process? Name the environment variables your backend can’t boot without — the database URI, the JWT secret, whatever keys your features call — and the one CORS origin your backend will have to trust once localhost stops being the answer. You don’t have to write any of it down. Just notice which of those you already know cold and which one you’d have to go look up. That gap is where the 11:55 surprise hides.

Architecture & Planning
15%
Mostly Day 1. Your planning deliverables and the decisions you can defend in the Viva.


1. Value statement — what it does, who it’s for, the problem, the value
Arch
›

2. System diagram — frontend, backend, database, and how they connect
Arch
›

3. Data model — every entity, field, type, and relationship
Arch
›

4. API design — every endpoint: method, URL, body, response, auth
Arch
›

5. Component tree — frontend hierarchy, where state lives, where calls happen
Arch
›
Full-Stack Implementation
35%
Days 2–3. The deployed app is the heart of the capstone. You choose your own pages and routes — these are the required minimums.


6. At least 3 frontend routes — one protected, on top of your auth pages
Build
›

7. At least 1 protected route — auth-gated
Build
›

8. Auth flow — signup + login, password hashing, JWT
Build
›

9. Full CRUD on at least 1 user-owned resource
Build
›

10. User-scoped data — users see only their own
Build
›

11. Frontend wired to backend — real data + four states on every view
Build
›

12. Feature-complete + polished — must-have features, responsive
Build
›
Security & QA
25%
Day 4. Hardening a live app and proving it refuses correctly when attacked.


13. Security audit passed — secrets, hashing, validation, CORS, npm audit
Security
›

14. Penetration test — five attacks run and documented
Security
›

15. Security Review document written
Security
›

16. Tests passing + QA pass — auth and core CRUD
Security
›

17. Deployed live — frontend + backend on public URLs
Security
›
Code Understanding
15%
Earned in your Viva. You direct AI through the build — the Viva checks you can explain what you shipped.


18. Architecture document written
Understand
›

19. Viva self-check — you can walk your codebase at a high level
Understand
›
Value & Presentation
10%
Day 5. Make the work legible — to your instructor and to yourself.


20. Presentation recorded — ~10 min, value-first, demo works
Value
›

21. Clean Git history
Value
›
Stretch — bonus, only after every required item passes

S1. Auto-deploy on push to main — CI/CD
›

S2. A second user-owned resource with full CRUD
›

S3. Roles or permissions — e.g. admin vs. member
›

S4. A third-party integration — external API or service
›

S5. Accessibility pass — keyboard + contrast
›

S6. Extra test coverage — edge cases beyond the critical paths
›