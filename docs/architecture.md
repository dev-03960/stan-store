---
stepsCompleted:
  - step-01-init
  - step-02-context
  - step-03-starter
  - step-04-decisions
  - step-05-patterns
  - step-06-structure
  - step-07-validation
  - step-08-complete
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-02-10'
inputDocuments:
  - _bmad-output/planning-artifacts/initial-brief.md
  - _bmad-output/planning-artifacts/prd.md
workflowType: 'architecture'
project_name: 'Stan-store'
user_name: 'Devansh bhargava'
date: '2026-02-10'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview
**Functional:**
- **Storefront:** Public, high-read volume, requires heavily optimized rendering (SSG/ISR or highly cached SSR).
- **Payments:** Critical path, requires idempotency and reconciliation (Worker pattern).
- **Assets:** Secure delivery via Signed URLs (Storage abstraction needed).

**Non-Functional:**
- **Performance:** <100ms API latency requires aggressive caching (Redis).
- **Compliance:** Data residency in Mumbai (Infrastructure constraint).

**Scale & Complexity:**
- **Primary Domain:** B2B SaaS (Commerce).
- **Complexity:** Medium.
- **Critical Scale Factor:** "Viral Drops" (Spiky traffic).

### Technical Constraints
- **Stack:** Golang/Fiber (Backend), React/Vite (Frontend), MongoDB (DB).
- **Region:** ap-south-1.

### Cross-Cutting Concerns
- **Tenancy Isolation:** Middleware & Data Layer enforcement.
- **Observability:** Distributed tracing for payment flows.
- **Async Processing:** Webhooks & Email delivery.

## Starter Template Evaluation

### Primary Technology Domain
**Full-Stack Web Application** (Monorepo Structure)

### Starter Options Considered
1.  **Custom Monorepo (Recommended):** Combine official `create-vite` and `go mod` setups.
    -   *Pros:* Latest versions, full control, no bloat, standard Go layout.
    -   *Cons:* ~5 minutes manual setup time.
2.  **gofiber/recipes (fiber-mongo):** Official recipe.
    -   *Pros:* Good reference code.
    *   *Cons:* Backend only, no frontend integration patterns.
3.  **Community Boilerplates:** (e.g., `create-go-app`).
    -   *Pros:* Fast start.
    *   *Cons:* Often outdated dependencies, rigid structures.

### Selected Starter: Custom Monorepo (Official CLIs)

**Rationale for Selection:**
Adopting the "Custom Monorepo" approach ensures long-term maintainability. We avoid "black box" magic and start with a clean slate using the industry-standard tools for both Frontend (Vite) and Backend (Go Modules).

**Initialization Command:**

```bash
# 1. Project Root
mkdir stan-store-monorepo && cd stan-store-monorepo
git init

# 2. Frontend (Vite + React + TS)
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 3. Backend (Go + Fiber + MongoDB)
cd ../
mkdir backend && cd backend
go mod init github.com/devanshbhargava/stan-store
go get github.com/gofiber/fiber/v2
go get go.mongodb.org/mongo-driver/mongo
```

**Architectural Decisions Provided:**
-   **Frontend:** React (TS), Vite (Build), Tailwind (Style).
-   **Backend:** Standard Go Layout (`cmd`, `internal`, `pkg`).
-   **Glue:** Root-level `docker-compose` (future) for orchestration.

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Database Schema & Validation Strategy
- Authentication Mechanism (JWT vs Sessions)
- API Structure (REST vs GraphQL)

**Important Decisions (Shape Architecture):**
- State Management (Global vs Server)
- CSS Framework Version (Tailwind v4)

**Deferred Decisions (Post-MVP):**
- Microservices decomposition (Monolith for now)
- Complex Orchestration (K8s)

### Data Architecture

- **Database:** MongoDB (v7+)
    - *Rationale:* Flexible schema for polymorphic product types (Downloads, Courses).
- **Schema Validation:** Strict Go Structs + BSON Tags (Code-Level).
    - *Rationale:* Keeps source of truth in code, but allows DB-level validation rules for critical integrity.
- **Caching:** Redis (v7+)
    - *Rationale:* Essential for sub-100ms storefront reads and session management.

### Authentication & Security

- **Authentication:** JWT (Stateless) stored in HTTP-Only Cookies.
    - *Rationale:* Prevents XSS access to tokens; statelessness aids horizontal scaling.
- **Authorization:** RBAC Middleware in Fiber.
    - *Rationale:* Centralized permission checks for Creator vs. Buyer roles.
- **Secrets Management:** Environment Variables + Field-Level Encryption for API Keys.
    - *Rationale:* Never store raw Razorpay/PhonePe keys in plain text.

### API & Communication Patterns

- **API Style:** REST (Resource Level 3).
    - *Rationale:* Simple, standard, cacheable.
- **Documentation:** OpenAPI v3 (Auto-generated).
    - *Rationale:* Single source of truth for frontend/backend contract.
- **Error Handling:** Standardized JSON Envelope.
    - *Rationale:* Consistent parsing for frontend error boundaries.

### Frontend Architecture

- **State Management:** React Context (Auth/Theme) + TanStack Query (Server State).
    - *Rationale:* Decouples UI state from Data state; handles caching/deduping out of the box.
- **Styling:** Tailwind CSS v4.
    - *Rationale:* Modern engine, zero-runtime overhead.
- **Routing:** React Router v7.
    - *Rationale:* Standard for SPA navigation.

### Infrastructure & Deployment

- **Containerization:** Docker (Multi-stage builds).
    - *Rationale:* Consistent dev/prod environments; small image sizes (Alpine).
- **Orchestration:** Docker Compose (Development).
    - *Rationale:* Simple local stack spin-up.

### Decision Impact Analysis

**Implementation Sequence:**
1.  Setup Monorepo & Docker Compose.
2.  Implement Fiber Backend Skeleton & Error Handlers.
3.  Setup MongoDB Connection & Repository Pattern.
4.  Implement Auth Module (JWT/Cookies).
5.  Setup React Frontend with Vite & Tailwind.

**Cross-Component Dependencies:**
- Frontend relies strictly on OpenAPI contract.
- Auth Middleware is a blocker for all protected routes.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
4 areas where AI agents could make different choices (Naming, Structure, Format, Communication).

### Naming Patterns

**Database Naming Conventions:**
- **Collections:** Plural, snake_case (e.g., `users`, `order_items`).
- **Fields:** snake_case (e.g., `created_at`, `user_id`).
- **Indexes:** `idx_{collection}_{fields}` (e.g., `idx_users_email`).

**API Naming Conventions:**
- **Endpoints:** Plural nouns, kebab-case (e.g., `/api/v1/users`, `/api/v1/password-reset`).
- **Actions:** HTTP Verbs (GET, POST, PUT, DELETE).
- **Query Params:** snake_case (e.g., `?page=1&sort_by=created_at`).

**Code Naming Conventions:**
- **Go:** `PascalCase` for exported, `camelCase` for internal.
- **React:** `PascalCase` for Components, `useCamelCase` for Hooks.
- **Files:** `kebab-case.ts` (utils), `PascalCase.tsx` (components).

### Structure Patterns

**Project Organization:**
- **Backend (Go):** Modular Monolith (Clean Architecture).
    - `internal/core/{domain, services}`
    - `internal/adapters/{http, storage}`
- **Frontend (React):** Feature-Sliced Design (Modified).
    - `src/features/{feature_name}` (encapsulated logic)
    - `src/shared/{ui, lib, api}` (common code)

**File Structure Patterns:**
- **Tests:** Co-located `_test.go` (Backend), `__tests__` or `.test.tsx` (Frontend).
- **Config:** Environment variables loaded via `config` package (Backend) / `vite-env.d.ts` (Frontend).

### Format Patterns

**API Response Formats:**
```json
{
  "data": { ... },     // Success payload
  "meta": { ... },     // Pagination, etc.
  "error": {           // Only present on error
    "code": "ERR_CODE",
    "message": "Human readable message",
    "details": { ... }
  }
}
```

**Data Exchange Formats:**
- **Dates:** ISO 8601 Strings (`YYYY-MM-DDTHH:mm:ssZ`).
- **IDs:** String (MongoDB ObjectID hex string).

### Communication Patterns

**Event System Patterns:**
- **Naming:** `Domain.Action` (e.g., `User.Registered`, `Order.PaymentFailed`).
- **Payload:** `{ "id": "event_id", "timestamp": "...", "data": { ... } }`

**State Management Patterns:**
- **Server State:** TanStack Query (Keys: `['entity', 'id']`).
- **UI State:** React Context/Local State.

### Enforcement Guidelines

**All AI Agents MUST:**
- Use **Named Exports** for React components.
- Add `bson:"..."` and `json:"..."` tags to all Go structs.
- Use the central `logger` package, never `fmt.Println`.

**Pattern Examples:**

**Good (Go):**
```go
type User struct {
    ID        string `bson:"_id" json:"id"`
    Email     string `bson:"email" json:"email"`
}
```

**Anti-Pattern (Go):**
```go
type User struct {
    Id string // Missing tags, Wrong casing
}
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
stan-store-monorepo/
├── docker-compose.yml       # Local dev orchestration
├── Makefile                 # Unified commands (make dev, make test)
├── README.md                # Project documentation
├── .env.example             # Template for environment variables
├── backend/                 # Golang + Fiber
│   ├── cmd/
│   │   └── api/             # Application Entrypoint
│   │       └── main.go
│   ├── internal/
│   │   ├── core/            # Core Domain Logic (Hexagonal/Clean)
│   │   │   ├── domain/      # Entities & Interfaces
│   │   │   └── services/    # Business Logic
│   │   ├── adapters/        # Driven Adapters
│   │   │   ├── http/        # Fiber Handlers & Middleware
│   │   │   └── storage/     # MongoDB Repositories
│   │   └── config/          # Configuration Logic
│   ├── pkg/                 # Shared Public Utilities
│   │   ├── logger/          # Structured Logging
│   │   └── validator/       # Data Validation
│   ├── go.mod
│   └── go.sum
└── frontend/                # React + Vite
    ├── src/
    │   ├── features/        # Feature-Based Modules
    │   │   ├── auth/        # Login/Signup/Profile
    │   │   ├── store/       # Storefront Logic
    │   │   └── dashboard/   # Creator Admin
    │   ├── components/
    │   │   └── ui/          # Shared Atomic Components (Buttons, Inputs)
    │   ├── lib/             # Shared Utilities
    │   │   ├── api.ts       # Axios/Fetch Wrapper
    │   │   └── utils.ts     # Helper functions
    │   ├── App.tsx          # Root Component & Providers
    │   └── main.tsx         # Entrypoint
    ├── vite.config.ts
    ├── tailwind.config.js
    └── package.json
```

### Architectural Boundaries

**API Boundaries (Contract-First):**
- **External:** `backend/internal/adapters/http` serves REST endpoints.
- **Consumption:** `frontend/src/lib/api` consumes these endpoints.
- **Contract:** OpenAPI Specification (generated from Backend) defines the interface.

**Component Boundaries (Feature-First):**
- **Frontend:** Features (`src/features/*`) contain their own State, API calls, and Sub-components.
- **Shared UI:** `src/components/ui` contains *dumb* components only (no business logic/API calls).

**Service Boundaries (Modular Monolith):**
- **Core Services:** `internal/core/services` contains pure business logic, decoupled from HTTP/DB specifics.
- **Repositories:** `internal/adapters/storage` handles all DB interactions. Services interface with Repositories via Interfaces.

**Data Boundaries:**
- **Database:** Only accessed by `backend` via the Repository layer.
- **Frontend State:** Manages UI state and caches Server state (via TanStack Query).

### Requirements to Structure Mapping

**Feature/Epic Mapping:**
- **Storefront Display:**
    - Backend: `internal/core/services/store`, `internal/adapters/http/store_handler.go`
    - Frontend: `src/features/store/`
    - DB: `collections/products`, `collections/creators`
- **Payment Processing:**
    - Backend: `internal/core/services/payment`, `internal/adapters/http/webhook_handler.go`
    - Frontend: `src/features/checkout/`
    - DB: `collections/orders`, `collections/transactions`

**Cross-Cutting Concerns:**
- **Authentication:** `internal/core/services/auth`, `middleware/auth.go`, `src/features/auth`
- **Logging:** `pkg/logger` (Backend), `src/lib/logger` (Frontend - optional)

### Integration Points

**Internal Communication:**
- **Frontend -> Backend:** HTTP/REST over JSON.
- **Service -> Service:** Direct Method Calls (within Monolith) via Interfaces.

**External Integrations:**
- **Payments:** Razorpay/PhonePe Webhooks -> `internal/adapters/http/webhooks`.
- **Assets:** Pre-signed URLs for S3/GCS.

### Development Workflow Integration

- **Orchestration:** `docker-compose up` spins up MongoDB, Redis, and optionally Backend/Frontend.
- **Build Process:**
    - Backend: `go build ./cmd/api` -> Single Binary.
    - Frontend: `vite build` -> Static Assets (served by Backend or Nginx).

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
The chosen stack (Go/Fiber + React/Vite + MongoDB) is highly compatible. The strictly typed Backend (Go) pairs well with the strictly typed Frontend (TypeScript), linked by OpenAPI contracts. The decision to use a Monorepo simplifies version management of these contracts.

**Pattern Consistency:**
Naming conventions (snake_case DB -> PascalCase Structs -> camelCase JSON) are standard for this stack and fully supported by Go's struct tags. The Feature-Sliced Design on the frontend aligns well with the Domain-Driven structure on the backend.

**Structure Alignment:**
The Project Structure clearly separates concerns. The `internal/core` directory ensures business logic interacts with interfaces, not implementation details, supporting the decision for a "Modular Monolith".

### Requirements Coverage Validation ✅

**Epic/Feature Coverage:**
- **Storefront:** Supported by High-Performance Go Backend + Redis Caching.
- **Payments:** Supported by Webhook-first architecture and reliable event processing.
- **Digital Products:** Supported by MongoDB's flexible schema for polymorphic product types.

**Functional Requirements Coverage:**
All high-priority FRs (Identity, Catalog, checkout) have clear homes in the `internal/core/services` and `src/features` directories.

**Non-Functional Requirements Coverage:**
- **Performance:** Addressed via Fiber (Zero allocation router) and Redis.
- **Security:** Addressed via HttpOnly Cookies and Pre-signed URLs.
- **Scalability:** Stateless Auth allows horizontal scaling of the Backend.

### Implementation Readiness Validation ✅

**Decision Completeness:**
Critical decisions (Auth, DB, API) are made. Technology versions (Go 1.25+, React 19) are verified stable.

**Structure Completeness:**
The directory tree is complete down to the file level for key components. Integration points (API, DB) are explicitly defined.

**Pattern Completeness:**
Naming and Structure patterns are strict and clear, minimizing friction between different AI agents or developers.

### Gap Analysis Results

**Minor Gaps (Non-Blocking):**
- **Async Worker Separation:** We have not explicitly defined a separate binary for background workers (`cmd/worker`).
    - *Resolution:* For MVP, running async tasks via Go routines within the API binary is acceptable and simpler. Separation can occur later without refactoring core logic.
- **CI/CD Pipeline:** Specific actions for GitHub Actions are not yet defined.
    - *Resolution:* Can be added during the "DevOps/Infra" setup phase.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- **Simplicity:** Boring technology (Go, React, Mongo, Monorepo) means fewer "unknown unknowns".
- **Performance:** The stack is inherently fast, minimizing the need for complex optimization early on.
- **Type Safety:** End-to-end typing (Go Structs -> OpenAPI -> TypeScript Interfaces) reduces runtime errors.

**Areas for Future Enhancement:**
- Splitting the "Monolith" into Microservices (if team/traffic creates need).
- Moving from Docker Compose to Kubernetes (if scale demands).

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented.
- Use implementation patterns consistently across all components.
- Respect project structure and boundaries.
- Refer to this document for all architectural questions.

**First Implementation Priority:**
Initialize the Monorepo and basic scaffolding using the commands defined in the "Starter Template Evaluation" section.
