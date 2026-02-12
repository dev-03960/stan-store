# EPIC-01: Project Foundation & Dev Environment

## Epic Goal

Developers can clone the repo, run `docker-compose up`, and have a fully working local development environment with Backend, Frontend, Database, and Cache running.

## In Scope

- Monorepo initialization (Go/Fiber backend + React/Vite frontend)
- Docker Compose orchestration for MongoDB and Redis
- Backend API skeleton with health check, structured logging, and error handling
- MongoDB connection with Repository pattern base
- Redis connection with caching abstraction
- Frontend app shell with design system tokens, routing, and API client

## Out of Scope

- Business logic (authentication, products, payments)
- Production deployment (CI/CD, Kubernetes)
- Database collections for business entities (created in their respective epics)

## Dependencies

- None — this is the foundational epic

## User Stories

### STORY-1.1: Monorepo Initialization & Project Scaffolding

As a developer,
I want a properly structured monorepo with Go backend and React frontend scaffolding,
So that I can start developing features against a clean, standard project structure.

**Acceptance Criteria:**

- **Given** the repository is freshly cloned
- **When** I inspect the project structure
- **Then** it matches the architecture document: `backend/` (Go module with `cmd/api`, `internal/core`, `internal/adapters`, `pkg/`) and `frontend/` (Vite + React + TypeScript with `src/features/`, `src/components/ui/`, `src/lib/`)
- **And** `go mod tidy` succeeds with Fiber v2 and MongoDB driver installed
- **And** `npm install` in `frontend/` succeeds with React 19, Vite, Tailwind CSS v4, React Router v7, and TanStack Query installed
- **And** a root `Makefile` exists with targets: `dev`, `test`, `build`, `lint`
- **And** `.env.example` exists with all required environment variable placeholders

### STORY-1.2: Docker Compose Local Development Stack

As a developer,
I want a single command to spin up all infrastructure dependencies locally,
So that I can develop and test without installing MongoDB or Redis manually.

**Acceptance Criteria:**

- **Given** Docker and Docker Compose are installed
- **When** I run `docker-compose up -d`
- **Then** MongoDB (v7+) starts on port 27017 with a `stanstore` database
- **And** Redis (v7+) starts on port 6379
- **And** health checks pass for both services within 30 seconds
- **And** persistent volumes are configured so data survives container restarts
- **And** a `.dockerignore` file excludes `node_modules/`, `vendor/`, and build artifacts

### STORY-1.3: Backend API Skeleton with Health Check

As a developer,
I want a running Go/Fiber HTTP server with structured error handling and a health endpoint,
So that I can verify the backend is operational and start adding route handlers.

**Acceptance Criteria:**

- **Given** the backend is started with `go run ./cmd/api`
- **When** I send `GET /api/v1/health`
- **Then** I receive a 200 response with `{"data": {"status": "ok", "version": "0.1.0"}, "meta": null, "error": null}`
- **And** the response follows the standardized JSON envelope format
- **And** the `config` package loads environment variables (PORT, MONGO_URI, REDIS_URL, JWT_SECRET)
- **And** the `logger` package outputs structured JSON logs (not `fmt.Println`)
- **And** unhandled routes return 404 with a proper error envelope
- **And** panic recovery middleware is active and logs stack traces

### STORY-1.4: MongoDB Connection & Repository Pattern Base

As a developer,
I want a reusable MongoDB connection layer with the Repository pattern,
So that all future data access follows a consistent, testable interface.

**Acceptance Criteria:**

- **Given** the backend API starts and `MONGO_URI` is configured
- **When** the application initializes
- **Then** a MongoDB client connects to the configured URI with connection pooling
- **And** a `Repository` interface is defined in `internal/core/domain/` with standard CRUD method signatures
- **And** a base MongoDB repository implementation exists in `internal/adapters/storage/`
- **And** the connection is gracefully closed on application shutdown (SIGTERM/SIGINT)
- **And** connection failure logs an error and exits with a non-zero code
- **And** all Go structs that interact with MongoDB use `bson:"..."` and `json:"..."` tags

### STORY-1.5: Redis Connection & Caching Layer Base

As a developer,
I want a Redis client connection with a caching abstraction,
So that I can cache storefront data for sub-100ms reads.

**Acceptance Criteria:**

- **Given** the backend API starts and `REDIS_URL` is configured
- **When** the application initializes
- **Then** a Redis client connects with connection pooling
- **And** a `Cache` interface is defined in `internal/core/domain/` with `Get`, `Set`, `Delete`, and `SetWithTTL` methods
- **And** a Redis implementation of the `Cache` interface exists in `internal/adapters/storage/`
- **And** the connection is gracefully closed on application shutdown
- **And** connection failure logs a warning but does NOT crash the app (graceful degradation)

### STORY-1.6: Frontend App Shell with Design System Tokens

As a developer,
I want a running React app with routing, design system tokens, and base layout,
So that I can start building feature pages with consistent styling.

**Acceptance Criteria:**

- **Given** the frontend is started with `npm run dev`
- **When** I open `http://localhost:5173` in a browser
- **Then** the app renders a root layout with React Router v7 configured
- **And** Tailwind CSS v4 is configured with custom design tokens: Creator Purple (`#6C5CE7`), semantic colors, spacing scale (4px base unit)
- **And** Google Fonts (Outfit for headings, Inter for body) are loaded
- **And** an API client wrapper exists in `src/lib/api.ts` with base URL configuration and the standardized response envelope type
- **And** TanStack Query Provider is configured at the app root
- **And** a placeholder route exists for `/` (storefront) and `/dashboard` (creator)

## UX References

- **Design Tokens:** Creator Purple `#6C5CE7`, spacing scale (4px base unit), semantic colors — see `ux-design-specification.md` § Visual Design Foundation
- **Typography:** Outfit (headings) + Inter (body) from Google Fonts — see `ux-design-specification.md` § Typography System
- **Component Library:** Radix UI primitives + Tailwind CSS — see `ux-design-specification.md` § Design System Foundation

## API / Data Notes

- **API Envelope:** All responses use `{"data": {...}, "meta": {...}, "error": {...}}` format
- **Backend Structure:** Clean Architecture — `internal/core/{domain,services}`, `internal/adapters/{http,storage}`
- **Frontend Structure:** Feature-Sliced — `src/features/{name}`, `src/components/ui/`, `src/lib/`
- **Config:** Environment variables loaded via `config` package (backend) / `vite-env.d.ts` (frontend)

## Definition of Done

- [ ] `git clone` + `docker-compose up -d` + `make dev` results in a running stack
- [ ] `GET /api/v1/health` returns 200 with correct JSON envelope
- [ ] Frontend renders at `http://localhost:5173` with placeholder routes
- [ ] MongoDB and Redis connections verified with health checks
- [ ] Structured JSON logging active (no `fmt.Println`)
- [ ] All Go structs use `bson` and `json` tags
- [ ] `.env.example` documents all required variables
