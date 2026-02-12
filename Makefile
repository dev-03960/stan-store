# Stan-store Monorepo Makefile
# ============================

.PHONY: dev dev-backend dev-frontend test test-backend test-frontend build build-backend build-frontend lint lint-backend lint-frontend clean infra-up infra-down infra-reset

# ── Infrastructure ───────────────────────────────────────────

infra-up:
	docker compose up -d

infra-down:
	docker compose down

infra-reset:
	docker compose down -v

# ── Development ──────────────────────────────────────────────

dev: infra-up dev-backend dev-frontend

dev-backend:
	cd backend && go run ./cmd/api

dev-frontend:
	cd frontend && npm run dev

# ── Testing ──────────────────────────────────────────────────

test: test-backend test-frontend

test-backend:
	cd backend && go test ./... -v -cover

test-frontend:
	cd frontend && npm run test

# ── Build ────────────────────────────────────────────────────

build: build-backend build-frontend

build-backend:
	cd backend && go build -o ./tmp/api ./cmd/api

build-frontend:
	cd frontend && npm run build

# ── Lint ─────────────────────────────────────────────────────

lint: lint-backend lint-frontend

lint-backend:
	cd backend && go vet ./...

lint-frontend:
	cd frontend && npm run lint

# ── Clean ────────────────────────────────────────────────────

clean:
	rm -rf backend/tmp frontend/dist
