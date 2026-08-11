# velaWright — Architecture

---

## 0. Value Statement

**What it does:** velaWright is a full-stack developer productivity app for tracking projects across their entire lifecycle — from a raw idea to a deployed product. Users capture fleeting thoughts as Traces, develop them into Leads, promote them into Endeavors, and mark them Deployed. Marks (tasks) and a soft-delete Stash layer live across all three stages.

**Who it's for:** Developers who want a single, personal space to keep their work alive — not just during a course, but across a career.

**The problem:** Projects and ideas get abandoned when there's no system to hold them. Notes apps are too generic, GitHub is too code-centric, and Notion requires too much setup. Nothing is designed for the developer-specific workflow of idea → project → deployment.

**The value:** velaWright is opinionated around that exact workflow. A Trace logged on mobile at 2am becomes a Lead becomes an Endeavor becomes a live deployment — all within one account, with full history and no dead ends. The companion React Native app means the capture step has no friction: ideas go in immediately, wherever they happen.

---

## 1. System Diagram

```
BROWSER (Vercel / Next.js)
  localStorage: vw_token (JWT), vw_user, vw_accent, vw_font
  ThemeContext: reads/writes CSS variables + localStorage
  AuthContext:  reads/writes vw_token + vw_user
  lib/api.js:   attaches Authorization: Bearer <token>
  Pages call api.js → HTTP JSON → server
        ↓

EXPRESS SERVER (Render)
  Global: CORS → express.json()
  Public routes:
    GET  /health
    POST /auth/signup  → bcrypt hash → jwt.sign → {token, user}
    POST /auth/login   → comparePassword → jwt.sign → {token, user}
  requireAuth middleware (all other routes):
    reads Bearer token → jwt.verify → User.findById → req.user
  Per-route: validate() checks body fields before any DB write
  Route groups: /endeavors /leads /traces /marks
                /promote /bin /admin /auth (protected)

        ↓

MONGODB ATLAS (M0)
  Collections:
    users
    endeavors
    leads
    traces
    marks
  All queries scoped to userId: req.user._id
  deletedAt field on content collections:
    null  = active
    Date  = stashed (30-day TTL index auto-purges)
```

---

## 2. Data Model

```
USER  ← root owner, no userId needed
  _id       ObjectId  (auto)
  email     String    required, unique, lowercase
  password  String    required, bcrypt-hashed (cost 12)
  name      String    required
  role      String    enum[user, admin]  default: user
  createdAt Date      (auto)
  updatedAt Date      (auto)

ENDEAVOR
  _id           ObjectId  (auto)
  userId        ObjectId  ref→User  required  ← owner
  title         String    required
  description   String    default ''
  status        String    enum[active,completed,paused,deployed]
  framework     String    required
  repoUrl       String    required (valid URL)
  liveUrl       String
  demoUrl       String
  version       String
  platform      String
  launchDate    Date
  collaborators [String]
  tags          [String]
  origin        String    enum[trace,lead,endeavor]  default null
  deletedAt     Date      default null  ← soft delete / 30d TTL
  createdAt     Date      (auto)
  updatedAt     Date      (auto)

LEAD
  _id          ObjectId  (auto)
  userId       ObjectId  ref→User  required  ← owner
  title        String    required
  description  String    default ''
  framework    String    required
  lane         String    required
  tags         [String]  default []
  status       String    enum[active,completed,paused,promoted]  default: active
  priority     String    enum[none,low,medium,high]  default: none
  origin       String    enum[trace,lead,endeavor]  default null
  deletedAt    Date      default null  ← soft delete / 30d TTL
  createdAt    Date      (auto)
  updatedAt    Date      (auto)

TRACE
  _id          ObjectId  (auto)
  userId       ObjectId  ref→User  required  ← owner
  title        String    required
  description  String    default ''
  lane         String    default ''
  tags         [String]  default []
  ideaId       ObjectId  ref→Lead      default null
  projectId    ObjectId  ref→Endeavor  default null
  priority     String    enum[none,low,medium,high]  default: none
  origin       String    enum[trace,lead,endeavor]  default null
  deletedAt    Date      default null  ← soft delete / 30d TTL
  createdAt    Date      (auto)
  updatedAt    Date      (auto)

MARK
  _id        ObjectId  (auto)
  userId     ObjectId  ref→User  required  ← owner
  title      String    required
  notes      String    default ''
  dueBy      Date      default null
  done       Boolean   default false
  projectId  ObjectId  ref→Endeavor  default null
  ideaId     ObjectId  ref→Lead      default null
  deletedAt  Date      default null  ← soft delete / 30d TTL
  createdAt  Date      (auto)
  updatedAt  Date      (auto)

Relationships
  User → Endeavor, Lead, Trace, Mark  (one-to-many via userId)
  Lead → Trace   (one-to-many via Trace.ideaId)
  Lead → Mark    (one-to-many via Mark.ideaId)
  Endeavor → Trace  (one-to-many via Trace.projectId)
  Endeavor → Mark   (one-to-many via Mark.projectId)
```

---

## 3. API Design

```
── AUTH (public) ──────────────────────────────────────────────
POST /auth/signup
  body: name*, email*, password* (min 8)
  201: { token, user }   400: { error }

POST /auth/login
  body: email*, password*
  200: { token, user }   401: { error }

── AUTH (protected — requires Bearer token) ──────────────────
PATCH /auth/me
  body: name, email (any subset)
  200: { user }   400: { error }

PATCH /auth/me/password
  body: currentPassword*, newPassword* (min 8)
  200: { message }   400: { error }

── ENDEAVORS (auth required, scoped to userId) ───────────────
GET    /endeavors              200: [Endeavor]
POST   /endeavors
  body: title*, description*, framework*, repoUrl*,
        status, liveUrl, demoUrl, version, platform,
        launchDate, collaborators, tags
  201: Endeavor   400: { error }
GET    /endeavors/:id          200: Endeavor   404: { error }
PUT    /endeavors/:id
  body: any subset of POST fields
  200: Endeavor   404: { error }
PATCH  /endeavors/:id/stash    200: { message }   404: { error }
DELETE /endeavors/:id          200: { message }   404: { error }

── LEADS (auth required, scoped to userId) ───────────────────
GET    /leads                  200: [Lead]
POST   /leads
  body: title*, description*, framework*, lane*,
        tags, status, priority
  201: Lead   400: { error }
GET    /leads/:id              200: Lead   404: { error }
PUT    /leads/:id
  body: any subset of POST fields
  200: Lead   404: { error }
PATCH  /leads/:id/stash        200: { message }   404: { error }
DELETE /leads/:id              200: { message }   404: { error }

── TRACES (auth required, scoped to userId) ──────────────────
GET    /traces                 200: [Trace]
POST   /traces
  body: title*, description, lane, tags,
        ideaId, projectId, priority
  201: Trace   400: { error }
GET    /traces/:id             200: Trace   404: { error }
PUT    /traces/:id
  body: any subset of POST fields
  200: Trace   404: { error }
PATCH  /traces/:id/stash       200: { message }   404: { error }
DELETE /traces/:id             200: { message }   404: { error }

── MARKS (auth required, scoped to userId) ───────────────────
GET    /marks                  200: [Mark]
POST   /marks
  body: title*, notes, dueBy, done, projectId, ideaId
  201: Mark   400: { error }
GET    /marks/:id              200: Mark   404: { error }
PUT    /marks/:id
  body: any subset of POST fields
  200: Mark   404: { error }
PATCH  /marks/:id/stash        200: { message }   404: { error }
DELETE /marks/:id              200: { message }   404: { error }

── PROMOTE (auth required, scoped to userId) ─────────────────
POST /promote
  body: fromCollection, fromId, toCollection,
        ...fields for new document
  Finds source → copies origin → creates in target
  → hard-deletes source
  201: new document   400/404: { error }

── BIN / STASH (auth required, scoped to userId) ─────────────
GET    /bin
  200: all 4 collections where deletedAt != null,
       each item tagged with _type, sorted by deletedAt

POST   /bin/:collection/:id/restore
  sets deletedAt: null   200: item

POST   /bin/:collection/:id/resurface
  resets deletedAt: new Date()  (restarts 30d TTL timer)
  200: item

DELETE /bin/:collection/:id
  permanent delete   200: { message }

── ADMIN (auth + admin role required) ────────────────────────
GET /admin/users
  200: [User] (password field excluded)
```

---

## 4. Component Tree

```
RootLayout (app/layout.jsx)
  ThemeProvider  [state: accent, fontMode]
    reads/writes localStorage (vw_accent, vw_font)
    applies CSS variables to document.documentElement
    AuthProvider  [state: user, loading]
      API: signup, login on form submit; reads localStorage on mount
      Nav  — reads useAuth() + useTheme()
      <page>

/ (app/page.jsx)  →  DeploymentList
  [state: endeavors[], error, loading]
  API: getEndeavors() on mount, filters status=deployed
  DeploymentCard (per endeavor)
    no state, no API calls
    Chevron — pure render

/leads (app/leads/page.jsx)  →  VentureList
  [state: tab, leads[], traces[], endeavors[],
          marks[], searchQuery, activeId, error, dataLoading]
  API: getLeads + getTraces + getEndeavors + getMarks
       on mount (Promise.all)
  SearchResults (when searchQuery set)
    no state — pure computation on props, highlights matches
  TracesTab
    → button routes to /traces/new
    TracePanel (per standalone trace)
      [state: open, editing, confirming, highlighted,
              title, priority, saveError]
      API: updateTrace, deleteTrace, stashTrace
      → routes to /leads/new on promote
      expanded section: description, lane, tag chips
      ConfirmModal
  LeadsTab
    → button routes to /leads/new
    LeadPanel (per lead)
      [state: open, editing, confirming, highlighted,
              title, priority, status, addingTrace, newTrace,
              saveError, traceError]
      API: updateLead, deleteLead, stashLead, createTrace
      → routes to /endeavors/new on promote
      expanded section:
        framework + lane chips, tag chips, status select
        description paragraph
        TracePanel (nested, per child trace)
        MarkList  [state: marks[], editId, confirmId, adding, newTitle]
          API: getMarks on mount, createMark,
               updateMark, deleteMark, stashMark
          ConfirmModal
      ConfirmModal
  EndeavorTab
    → button routes to /endeavors/new
    EndeavorPanel (per endeavor)
      [state: open, editingTitle, editingDetails,
              confirming, highlighted, addingTrace,
              title, priority, details{}, saveError, traceError]
      API: updateEndeavor, deleteEndeavor,
           stashEndeavor, createTrace
      → routes to /deployments/new on promote
      TracePanel (nested)
      MarkList
      ConfirmModal

/leads/new (app/leads/new/page.jsx)  →  AddLeadForm
  [state: form{title,description,framework,lane,tags,status},
          fieldErrors{}, error, submitting]
  reads URL params: promoteFrom, sourceId, title, description
  API: promote() (if sourceId) or createLead() on submit

/traces/new (app/traces/new/page.jsx)  →  AddTraceForm
  [state: form{title,description,lane,tags},
          titleError, error, submitting]
  API: createTrace() on submit

/endeavors/new (app/endeavors/new/page.jsx)  →  AddEndeavorForm
  [state: form{}, invalid{}, error, submitting]
  reads URL params for pre-fill (promotion flow)
  API: promote() or createEndeavor() on submit

/deployments/new (app/deployments/new/page.jsx)  →  AddDeploymentForm
  [state: form{}, invalid{}, error, submitting]
  reads URL params for pre-fill
  API: promote() or createEndeavor() on submit

/deployments/[id] (app/deployments/[id]/page.jsx)  →  EditDeploymentForm
  [state: form{}, loading, error, saving, confirming]
  API: getEndeavor on mount, updateEndeavor on save,
       deleteEndeavor, stashEndeavor
  ConfirmModal

/settings (app/settings/page.jsx)  →  Settings
  [state: section ∈ {stash, account, appearance}]
  StashSection
    [state: bin[], binLoading, confirmItem, error]
    API: getBin on mount, restoreItem,
         resurfaceItem, permanentDelete
    ConfirmModal (no onStash — permanent only)
  AccountSection
    [state: profileForm{}, passwordForm{}, profileMsg, passwordMsg,
            profileError, passwordError, profileSaving, passwordSaving]
    API: PATCH /auth/me, PATCH /auth/me/password
  AppearanceSection
    reads/writes useTheme() → accent, setAccent, resetAccent,
                              fontMode, setFontMode
    color picker: native input[type=color] + 8 presets
    font picker: Default (Cinzel/Lora/Oldenburg/IM Fell) vs Basic

/login, /signup  →  auth forms
  [state: form{}, error, submitting]
  API: respective auth endpoints
```
