// k6 Load Test Script for Stan-Store Phase 2
// Run: k6 run tests/load/phase2_load_test.js
// Override base URL: k6 run -e BASE_URL=https://staging.example.com tests/load/phase2_load_test.js

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ── Configuration ───────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Custom metrics
const errorRate = new Rate('errors');
const storefrontLatency = new Trend('storefront_latency', true);
const analyticsLatency = new Trend('analytics_latency', true);
const slotsLatency = new Trend('slots_latency', true);
const ordersLatency = new Trend('orders_latency', true);
const creatorAnalyticsLatency = new Trend('creator_analytics_latency', true);

// ── Test Scenarios ──────────────────────────────────────────
// Each scenario targets a specific endpoint with its own concurrency profile.
export const options = {
    scenarios: {
        // Scenario 1: Storefront page (highest traffic)
        storefront: {
            executor: 'constant-vus',
            vus: 500,
            duration: '60s',
            exec: 'testStorefront',
            tags: { test_type: 'storefront' },
        },

        // Scenario 2: Analytics event tracking (highest throughput)
        analytics_events: {
            executor: 'constant-arrival-rate',
            rate: 1000,          // 1000 iterations/sec
            timeUnit: '1s',
            duration: '60s',
            preAllocatedVUs: 200,
            maxVUs: 500,
            exec: 'testAnalyticsEvent',
            tags: { test_type: 'analytics' },
        },

        // Scenario 3: Coaching slot queries
        coaching_slots: {
            executor: 'constant-vus',
            vus: 200,
            duration: '60s',
            exec: 'testCoachingSlots',
            tags: { test_type: 'slots' },
        },

        // Scenario 4: Order creation (authenticated, complex)
        order_creation: {
            executor: 'constant-vus',
            vus: 100,
            duration: '60s',
            exec: 'testOrderCreation',
            tags: { test_type: 'orders' },
        },

        // Scenario 5: Creator analytics dashboard
        creator_analytics: {
            executor: 'constant-vus',
            vus: 50,
            duration: '60s',
            exec: 'testCreatorAnalytics',
            tags: { test_type: 'creator_analytics' },
        },
    },

    thresholds: {
        // Global
        'http_req_failed': ['rate<0.01'],             // <1% error rate

        // Per-endpoint SLAs (p95)
        'storefront_latency': ['p(95)<100'],  // <100ms
        'analytics_latency': ['p(95)<50'],   // <50ms
        'slots_latency': ['p(95)<150'],  // <150ms
        'orders_latency': ['p(95)<300'],  // <300ms
        'creator_analytics_latency': ['p(95)<500'],  // <500ms
    },
};

// ── Configurable Test Data ──────────────────────────────────
// Set these via environment variables or edit defaults.
// These should point to real seeded data in your test environment.
const TEST_USERNAME = __ENV.TEST_USERNAME || 'testcreator';
const TEST_PRODUCT_ID = __ENV.TEST_PRODUCT_ID || '000000000000000000000001';
const TEST_CREATOR_ID = __ENV.TEST_CREATOR_ID || '000000000000000000000002';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

// ── Helper ──────────────────────────────────────────────────
function authHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (AUTH_TOKEN) {
        headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    }
    return headers;
}

// ── Scenario Functions ──────────────────────────────────────

// 1. GET /api/v1/store/:username — Public storefront with theme
export function testStorefront() {
    const res = http.get(`${BASE_URL}/api/v1/store/${TEST_USERNAME}`);
    storefrontLatency.add(res.timings.duration);
    errorRate.add(res.status !== 200);

    check(res, {
        'storefront: status 200': (r) => r.status === 200,
        'storefront: has data': (r) => r.json('data') !== null,
    });

    sleep(0.1); // Short think time
}

// 2. POST /api/v1/analytics/events — Fire-and-forget event tracking
export function testAnalyticsEvent() {
    const payload = JSON.stringify({
        event_type: 'page_view',
        creator_id: TEST_CREATOR_ID,
        metadata: { source: 'k6_load_test' },
    });

    const res = http.post(`${BASE_URL}/api/v1/analytics/events`, payload, {
        headers: { 'Content-Type': 'application/json' },
    });

    analyticsLatency.add(res.timings.duration);
    errorRate.add(res.status !== 204 && res.status !== 200);

    check(res, {
        'analytics: status 2xx': (r) => r.status >= 200 && r.status < 300,
    });
}

// 3. GET /api/v1/products/:id/slots — Coaching slot availability
export function testCoachingSlots() {
    const res = http.get(`${BASE_URL}/api/v1/products/${TEST_PRODUCT_ID}/slots`);
    slotsLatency.add(res.timings.duration);
    errorRate.add(res.status !== 200);

    check(res, {
        'slots: status 200': (r) => r.status === 200,
    });

    sleep(0.1);
}

// 4. POST /api/v1/orders — Authenticated order creation with coupon + bump
export function testOrderCreation() {
    if (!AUTH_TOKEN) {
        // Skip if no auth token available — cannot create orders without auth
        sleep(1);
        return;
    }

    const payload = JSON.stringify({
        product_id: TEST_PRODUCT_ID,
        coupon_code: 'LOADTEST10',
        bumps: [],
    });

    const res = http.post(`${BASE_URL}/api/v1/orders`, payload, {
        headers: authHeaders(),
    });

    ordersLatency.add(res.timings.duration);
    // 201 Created or 400 (e.g., coupon not found) are acceptable — we measure latency
    errorRate.add(res.status >= 500);

    check(res, {
        'orders: no 5xx': (r) => r.status < 500,
    });

    sleep(0.5); // Longer think time for order flow
}

// 5. GET /api/v1/creator/analytics?period=30d — Creator dashboard (authenticated)
export function testCreatorAnalytics() {
    if (!AUTH_TOKEN) {
        sleep(1);
        return;
    }

    const res = http.get(`${BASE_URL}/api/v1/creator/analytics?period=30d`, {
        headers: authHeaders(),
    });

    creatorAnalyticsLatency.add(res.timings.duration);
    errorRate.add(res.status !== 200);

    check(res, {
        'creator analytics: status 200': (r) => r.status === 200,
    });

    sleep(0.5);
}
