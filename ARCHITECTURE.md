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
  localStorage: vw_token (JWT), vw_user
  lib/api.js: attaches Authorization: Bearer <token>
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
  Per-route: validate() checks body fields
  Route groups: /endeavors /leads /traces /marks
                /promote /bin /admin

        ↓

MONGODB ATLAS (M0)
  Collections: users, endeavors, leads, traces, marks
  All queries scoped to userId: req.user._id
  deletedAt field on content collections:
    null  = active
    Date  = stashed (30-day TTL index auto-purges)
```

---

## 2. Data Model

```
USER  ← root owner, no userId needed
  _id        ObjectId  (auto)
  email      String    required, unique, lowercase
  password   String    required, bcrypt-hashed
  name       String    required
  role       String    enum[user, admin]  default: user
  createdAt  Date      (auto)
  updatedAt  Date      (auto)

ENDEAVOR  (also serves as Deployment when status=deployed)
  _id           ObjectId  (auto)
  userId        ObjectId  ref→User  required  ← owner
  title         String    required
  description   String    default ''
  status        String    enum[active,completed,paused,deployed]
  framework     String
  repoUrl       String
  liveUrl       String    (deployment fields)
  demoUrl       String
  version       String
  platform      String
  launchDate    Date
  collaborators [String]
  tags          [String]
  imageUrl      String
  origin        String    enum[trace,lead,endeavor]  default null
  deletedAt     Date      default null  ← soft delete / 30d TTL
  createdAt     Date      (auto)
  updatedAt     Date      (auto)

LEAD
  _id          ObjectId  (auto)
  userId       ObjectId  ref→User  required  ← owner
  title        String    required
  description  String    default ''
  category     String
  status       String    enum[active,parked,promoted]
  priority     String    enum[none,low,medium,high]
  origin       String    enum[trace,lead,endeavor]  default null
  deletedAt    Date      default null  ← soft delete / 30d TTL
  createdAt    Date      (auto)
  updatedAt    Date      (auto)

TRACE
  _id        ObjectId  (auto)
  userId     ObjectId  ref→User  required  ← owner
  title      String    required
  category   String
  ideaId     ObjectId  ref→Lead      default null
  projectId  ObjectId  ref→Endeavor  default null
  origin     String    enum[trace,lead,endeavor]  default null
  deletedAt  Date      default null  ← soft delete / 30d TTL
  createdAt  Date      (auto)
  updatedAt  Date      (auto)

MARK
  _id        ObjectId  (auto)
  userId     ObjectId  ref→User  required  ← owner
  title      String    required
  notes      String    default ''
  dueBy      Date      default null
  done       Boolean   default false
  category   String
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
── AUTH (public) ──────────────────────────────────────
POST /auth/signup
  body: name, email, password
  201: { token, user }   400: { error }

POST /auth/login
  body: email, password
  200: { token, user }   401: { error }

GET /health
  200: { status: 'ok' }

── ENDEAVORS (auth required, scoped to userId) ────────
GET    /endeavors
  200: [Endeavor]

POST   /endeavors
  body: title*, description*, framework*, repoUrl*,
        status, liveUrl, demoUrl, version, platform,
        launchDate, collaborators, tags
  201: Endeavor

GET    /endeavors/:id
  200: Endeavor   404: { error }

PUT    /endeavors/:id
  body: any subset of POST fields
  200: Endeavor   404: { error }

PATCH  /endeavors/:id/stash
  200: { message }   404: { error }

DELETE /endeavors/:id
  200: { message }   404: { error }

POST   /endeavors/:id/image
  body: multipart, field 'image' (max 5MB, JPEG/PNG/WebP/GIF)
  200: Endeavor   400: { error }

── LEADS (auth required, scoped to userId) ────────────
GET    /leads              200: [Lead]
POST   /leads              body: title*, description,
                                 category, status, priority
                           201: Lead
GET    /leads/:id          200: Lead    404: { error }
PUT    /leads/:id          body: any subset   200: Lead
PATCH  /leads/:id/stash    200: { message }
DELETE /leads/:id          200: { message }

── TRACES (auth required, scoped to userId) ───────────
GET    /traces             200: [Trace]
POST   /traces             body: title*, category,
                                 ideaId, projectId
                           201: Trace
GET    /traces/:id         200: Trace   404: { error }
PUT    /traces/:id         body: any subset   200: Trace
PATCH  /traces/:id/stash   200: { message }
DELETE /traces/:id         200: { message }

── MARKS (auth required, always scoped to userId) ─────
GET    /marks              query: ?projectId= or ?ideaId=
                           200: [Mark]
POST   /marks              body: title*, notes, dueBy,
                                 done, projectId, ideaId
                           201: Mark
GET    /marks/:id          200: Mark   404: { error }
PUT    /marks/:id          body: any subset   200: Mark
PATCH  /marks/:id/stash    200: { message }
DELETE /marks/:id          200: { message }

── PROMOTE (auth required, scoped to userId) ──────────
POST /promote
  body: fromCollection, fromId, toCollection,
        ...fields for new document
  201: new document
  Finds source → copies origin → creates in target
  → hard-deletes source

── BIN / STASH (auth required, scoped to userId) ──────
GET    /bin
  200: all 4 collections where deletedAt != null,
       each item tagged with _type, sorted by deletedAt

POST   /bin/:collection/:id/restore
  sets deletedAt: null   200: item

POST   /bin/:collection/:id/resurface
  resets deletedAt: new Date()  (restarts 30d timer)
  200: item

DELETE /bin/:collection/:id
  permanent delete   200: { message }

── ADMIN (auth + admin role required) ─────────────────
GET /admin/users
  200: [User] (password excluded)
```

---

## 4. Component Tree

```
RootLayout
  AuthProvider  [state: user, loading]
    API: signup, login on form submit; reads localStorage on mount
    Nav  — reads useAuth()
    <page>

/  →  DeploymentList
  [state: endeavors[], error]
  API: getEndeavors() on mount, filters status=deployed
  DeploymentCard (per endeavor)
    no state, no API
    Chevron — pure render, type from endeavor.origin

/leads  →  VentureList
  [state: tab, leads[], traces[], endeavors[],
          marks[], searchQuery, activeId, error]
  API: getLeads + getTraces + getEndeavors + getMarks
       on mount (Promise.all)
  SearchResults (when searchQuery set)
    no state — pure computation on props
  TracesTab
    AddTraceForm  [state: title, open]
      API: createTrace on submit
    TracePanel (standalone traces)
      [state: editing, confirming, title, highlighted]
      API: updateTrace, deleteTrace, stashTrace
      routes to /leads/new on promote click
      ConfirmModal — no state, no API
  LeadsTab
    AddLeadForm (inline quick-add)  [state: title, open]
      API: createLead on submit
    LeadPanel
      [state: open, editing, confirming, title,
              priority, addingTrace, newTrace]
      API: updateLead, deleteLead, stashLead, createTrace
      routes to /endeavors/new on promote click
      TracePanel (nested)
      MarkList  [state: marks[], editId, confirmId]
        API: getMarks on mount, createMark,
             updateMark, deleteMark, stashMark
        ConfirmModal
      ConfirmModal
  EndeavorTab
    routes to /endeavors/new on button click
    EndeavorPanel
      [state: open, editingTitle, editingDetails,
              confirming, addingTrace, details{}]
      API: updateEndeavor, deleteEndeavor,
           stashEndeavor, createTrace
      routes to /deployments/new on promote click
      TracePanel (nested)
      MarkList
      ConfirmModal

/leads/new  →  AddLeadForm (Suspense wrapper)
  [state: form{}, invalid{}, error, submitting]
  reads URL params for pre-fill (promotion flow)
  API: promote() or createLead() on submit

/endeavors/new  →  AddEndeavorForm (Suspense wrapper)
  [state: form{}, invalid{}, error, submitting]
  reads URL params for pre-fill
  API: promote() or createEndeavor() on submit

/deployments/new  →  AddDeploymentForm (Suspense wrapper)
  [state: form{}, invalid{}, error, submitting]
  reads URL params for pre-fill
  API: promote() or createEndeavor() on submit

/deployments/[id]  →  EditDeploymentForm
  [state: form{}, loading, error, confirming]
  API: getEndeavor on mount, updateEndeavor on save,
       deleteEndeavor, stashEndeavor
  ConfirmModal

/settings  →  Settings
  [state: section]
  StashSection
    [state: bin[], binLoading, confirmItem, error]
    API: getBin on mount, restoreItem,
         resurfaceItem, permanentDelete
    ConfirmModal (no onStash)
```
