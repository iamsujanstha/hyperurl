# HyperCur API TestLab & Stream Orchestrator

An advanced, real-time API performance, resilience, and security test-suite platform. Engineered using a high-throughput multi-threaded client model in React 18, Vite, and Express, designed with a focus on visual feedback, aesthetic typography, and responsive controls.

---

## 🎨 Core Platform Features

- **STREAM_ORCHESTRATOR Telemetry**: High-frequency streaming analytics tracking latencies, thread scaling, request/data sizing, and TCP-level packet metrics in real time.
- **Rich Data Visualizations**: Real-time line charts built using Recharts & D3 to capture latencies, status distributions, and execution trends.
- **Unified Telemetry Logs Explorer**: Polished, row-by-row live execution log list with instant multi-tab `RESPONSE`, `PREVIEW`, and `HEADERS` inspection panels.
- **High Contrast Adaptive Styling**: Designed with a sleek, eye-safe Cosmic Slate dark interface and fully optimized high-contrast light mode overrides.
- **Modular Architecture**: Clean TypeScript codebase separating API execution, state layers, telemetry charts, and UI viewports.

---

## 🛠️ Available Test Suites

The TestLab houses nine purpose-configured test modules grouped into three critical categories: Performance, Resilience, and Security.

### 1. Performance Tests (`perf`)
* **CONCURRENT_BLAST**: Floods target endpoints with concurrent request bursts to identify thread pool exhaustion and socket saturation thresholds.
* **RACE_DETECTOR**: Explores database concurrency control using sub-millisecond overlapping writes to verify atomic locking or locate race conditions.
* **LOAD_CANNON**: Subjects target endpoints to continuous queue loops over extended periods to probe memory leaks, garbage collection heaps, and overall performance decay.
* **DISTRIBUTED_LOAD**: Simulates global routes and CDN rules by spoofing geographical IP locations, ISP latencies, and origin target variables.

### 2. Resilience Tests (`resilience`)
* **SINGLE_REQUEST**: One-shot probe to inspect response times, header properties, content types, and assert JSON schema compliance.
* **REPLAY_GUARD**: Sequential replay of transactional API calls utilizing static, mutated, or locked authentication tokens to evaluate idempotency and request deduplication safeguards.
* **CHAOS_MODE**: Randomly introduces artificial network jitter, drops headers, and triggers socket timeouts to evaluate upstream fault-tolerance algorithms (such as circuit breakers).

### 3. Security Tests (`security`)
* **PAYLOAD_FUZZER**: Mutates payload structures, eliminates required schema elements, and feeds massive buffers/irregular types to analyze web parser robustness.
* **SECURITY_AUDITOR**: Sweeps parameters against SQL Injection (`SQLi`), Reflected Cross-Site Scripting (`XSS`), and system file traversal arrays to secure entry forms.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation
```bash
# Install dependencies
npm install
```

### Run Development Server
```bash
# Re-boots the development environment with active HMR overrides
npm run dev
```

### Production Build & Launch
```bash
# Compiles the production React client assets and server bundle
npm run build

# Runs the self-contained server binary on production port 3000
npm run start
```

---

*For operations, automated CI/CD configurations, or staging on AWS EC2 behind a Cloudflare proxy, please refer to the comprehensive [DevOps Operations Manual (DEPLOYMENT_GUIDE.md)](./DEPLOYMENT_GUIDE.md).*
