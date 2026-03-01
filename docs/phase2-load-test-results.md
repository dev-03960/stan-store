# Phase 2 Load Test Results

> **Generated:** _pending_
> **Tool:** k6 v0.x
> **Environment:** Local development (localhost:8080)
> **Duration:** 60 seconds per scenario

## Test Configuration

| Parameter | Value |
|-----------|-------|
| MongoDB | Local (localhost:27017) |
| Redis | Local (localhost:6379) |
| Server | `go run ./cmd/api/` |
| OS | macOS |

## Results Summary

### 1. Storefront Page — `GET /api/v1/store/:username`

| Metric | Target | Actual |
|--------|--------|--------|
| VUs | 500 | — |
| p50 | — | _pending_ |
| p95 | < 100ms | _pending_ |
| p99 | — | _pending_ |
| Error Rate | < 1% | _pending_ |

**Bottlenecks identified:** _pending_

---

### 2. Analytics Event Tracking — `POST /api/v1/analytics/events`

| Metric | Target | Actual |
|--------|--------|--------|
| Rate | 1000 events/sec | — |
| p50 | — | _pending_ |
| p95 | < 50ms | _pending_ |
| p99 | — | _pending_ |
| Error Rate | < 1% | _pending_ |

**Bottlenecks identified:** _pending_

---

### 3. Coaching Slots — `GET /api/v1/products/:id/slots`

| Metric | Target | Actual |
|--------|--------|--------|
| VUs | 200 | — |
| p50 | — | _pending_ |
| p95 | < 150ms | _pending_ |
| p99 | — | _pending_ |
| Error Rate | < 1% | _pending_ |

**Bottlenecks identified:** _pending_

---

### 4. Order Creation — `POST /api/v1/orders`

| Metric | Target | Actual |
|--------|--------|--------|
| VUs | 100 | — |
| p50 | — | _pending_ |
| p95 | < 300ms | _pending_ |
| p99 | — | _pending_ |
| Error Rate | < 1% | _pending_ |

**Bottlenecks identified:** _pending_

---

### 5. Creator Analytics — `GET /api/v1/creator/analytics?period=30d`

| Metric | Target | Actual |
|--------|--------|--------|
| VUs | 50 | — |
| p50 | — | _pending_ |
| p95 | < 500ms | _pending_ |
| p99 | — | _pending_ |
| Error Rate | < 1% | _pending_ |

**Bottlenecks identified:** _pending_

---

## SLA Compliance Summary

| Endpoint | SLA Met? | Action Required |
|----------|----------|-----------------|
| Storefront | _pending_ | — |
| Analytics Events | _pending_ | — |
| Coaching Slots | _pending_ | — |
| Order Creation | _pending_ | — |
| Creator Analytics | _pending_ | — |

## Optimization Recommendations

_To be filled after running tests._
