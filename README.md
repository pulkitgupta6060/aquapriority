# AquaPriority — Municipal Water-Repair Prioritization Platform

> **Mayurpur Mahanagar Jal Sansthan (MMJS) — Division IV Operations**  
> An enterprise-grade, deterministic decision-support platform for municipal water engineers to prioritize, schedule, and optimize urban pipeline leak repairs under strict capital budget and crew-hour constraints.

---

> [!IMPORTANT]
> **Data & Operational Disclaimer:**  
> All geographical entities, ward boundaries, infrastructure names, and pipeline incidents in this application belong to the **fictional city of Mayurpur** (MMJS Division IV). All calculated metrics—including daily water loss, household protection figures, and financial impacts—are **operational model estimates**, not audited municipal savings or actual sensor telemetry.

---

## Table of Contents
- [Executive Overview](#executive-overview)
- [Key Features](#key-features)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [The Multi-Dimensional Greedy Pipeline](#the-multi-dimensional-greedy-pipeline)
- [Exhaustive Knapsack Benchmark & Suboptimality Proof](#exhaustive-knapsack-benchmark--suboptimality-proof)
- [Project Directory Structure](#project-directory-structure)
- [Getting Started & Setup](#getting-started--setup)
- [Automated Test Suite](#automated-test-suite)
- [Known Limitations & Operational Boundaries](#known-limitations--operational-boundaries)
- [Safe GitHub Deployment Instructions](#safe-github-deployment-instructions)

---

## Executive Overview

Municipal water distribution networks frequently lose millions of liters per day through Non-Revenue Water (NRW) caused by pipe bursts, aging cast iron conduits, and joint shears. Municipal utility managers face two simultaneous real-world bottlenecks:
1. **Fiscal Constraints:** Fixed municipal repair budgets per dispatch cycle (INR ₹).
2. **Labor Constraints:** Limited field engineering squads and working hours per shift (Hours).

**AquaPriority** solves this multi-dimensional constrained scheduling challenge using a transparent, deterministic greedy 0/1 knapsack algorithm paired with an operational emergency override policy. It ensures that critical facilities (hospitals, dialysis centers, oxygen plants) are addressed immediately, while remaining capital and labor hours are allocated to maximize total municipal benefit and water conservation.

---

## Key Features

- **Executive SCADA Telemetry & Overview:**
  - Real-time KPI summary: Active leaks, estimated daily water loss (in MLD), capital required (₹ Lakhs), and squad labor demand.
  - Urgent Emergency Incident Watchlist with dedicated tags for hospitals, schools, and transit hubs.
  - Ward-level water loss rankings with one-click drill-downs into the registry.
- **Repair Registry & Field Management:**
  - Complete searchable and paginated database of 90 realistic pipeline repair requests.
  - Multi-parameter filtering: Severity, repair status, pipe material (CI, DI, HDPE, MS, PVC), ward zone, and critical facility proximity.
  - Full CRUD operations with collision-free sequential ID generation and state change validation.
- **Optimization Center (Multi-Dimensional Knapsack):**
  - Interactive constraint controls for Budget (₹ Lakhs) and Labor Hours with dynamic crew-day conversions.
  - One-click operational presets: *Rapid Response*, *Standard Weekly*, *Monsoon Surge*, and *Fiscal Austerity*.
  - Configurable benefit scoring weights with immediate local storage persistence.
  - Granular results broken into **Selected Jobs**, **Deferred Jobs** (with exact INR/hour deficit explanations), and **Manual Escalations** (unserviceable emergencies).
  - One-click CSV and JSON exports for municipal shift reports.
- **Exhaustive Search Mathematical Benchmark:**
  - Built-in combinatorial solver evaluating all $2^N$ feasible candidate subsets for small batches.
  - Explicitly demonstrates and verifies greedy heuristic performance versus the global mathematical optimum.
- **Municipal Spatial Cartography (City Map):**
  - Vector SVG-based municipal grid rendering the Mayur River, primary distribution conduits, and ward centroids.
  - Pulsing emergency pins and severity indicators with an interactive slide-out inspection drawer.
- **Advanced Municipal Analytics:**
  - Interactive Recharts visualizations: Ward loss vs. repair cost dual-axis chart, water saved efficiency frontier, pipe material failure rates, severity distribution, and damage type breakdown.

---

## Architecture & Tech Stack

AquaPriority is built as an entirely client-side, zero-dependency enterprise dashboard:
- **Core Framework:** [React 18](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/)
- **Build Tooling:** [Vite 5](https://vitejs.dev/)
- **Styling System:** [Tailwind CSS 3](https://tailwindcss.com/)
- **Data Visualizations:** [Recharts 2](https://recharts.org/)
- **Iconography:** [Lucide React](https://lucide.dev/)
- **Testing Engine:** [Vitest 2](https://vitest.dev/)
- **Persistence:** Browser `localStorage` (no external APIs, databases, or paid services required)

---

## The Multi-Dimensional Greedy Pipeline

The core scheduling engine resides in a pure TypeScript module (`src/algorithm/greedy.ts`), completely decoupled from UI components. It implements the following 9-stage pipeline:

```
[Raw Requests]
      │
      ▼
1. Validation & Sanitization (Reject negative costs, missing IDs, invalid coords)
      │
      ▼
2. Deduplication & Status Filter (Exclude duplicate IDs, completed & cancelled jobs)
      │
      ▼
3. Emergency Classification (Flag critical infrastructure, contamination risks, bursts)
   ├── Fits Limits ────────► Prioritized to front of queue
   └── Exceeds Limits ──────► Escalated for executive manual intervention
      │
      ▼
4. Multi-Factor Benefit Scoring (Normalized loss, households, severity, uncertainty)
      │
      ▼
5. Deterministic 5-Level Tie-Breaking (Emergency ➔ Ratio ➔ Benefit ➔ Cost ➔ ID)
      │
      ▼
6. 2D Indivisible Knapsack Packing (Fits BOTH remaining budget INR AND labor hours)
      │
      ├── YES ──► Allocate to Selected Jobs, deduct resources, accumulate impact
      └── NO ───► Log exact deficit reason code, continue checking remaining queue
      │
      ▼
7. Comprehensive Schedule Output (Selected, Deferred, Escalated, Metrics, Residuals)
```

### Deterministic Tie-Breaking Rules
To ensure strict order-independence and reproducible municipal audits:
1. **Level 1:** Active emergencies first (when emergency prioritization is enabled).
2. **Level 2:** Benefit-to-resource ratio descending ($\Delta > 10^{-5}$).
3. **Level 3:** Absolute benefit score descending ($\Delta > 10^{-4}$).
4. **Level 4:** Estimated repair cost ascending (leaner repairs preferred).
5. **Level 5:** Unique Request ID ascending (lexicographical tie-breaker).

---

## Exhaustive Knapsack Benchmark & Suboptimality Proof

Multi-dimensional 0/1 knapsack problems are NP-hard. AquaPriority's documentation and user interface explicitly acknowledge that greedy heuristics—while fast ($O(N \log N)$) and effective—can be mathematically suboptimal in specific resource distributions.

The application includes an independent combinatorial solver (`src/algorithm/exhaustive.ts`) and a verified automated benchmark test (`tests/benchmark.test.ts`) that proves greedy suboptimality:
- **Test Case:** Budget = ₹1,00,000, Hours = 100 hrs.
  - Candidate 1: Cost ₹52,000, 52 hrs, Benefit Score 72.5 (Ratio = 0.000697).
  - Candidate 2: Cost ₹50,000, 50 hrs, Benefit Score 58.6 (Ratio = 0.000586).
  - Candidate 3: Cost ₹50,000, 50 hrs, Benefit Score 58.6 (Ratio = 0.000586).
- **Greedy Outcome:** Selects Candidate 1 first based on ratio. Remaining resources (₹48,000 / 48 hrs) are insufficient for Candidate 2 or 3. Total Benefit = **72.5**.
- **Exhaustive Optimum:** Evaluates all $2^3 = 8$ subsets and selects Candidate 2 + Candidate 3 (Cost ₹1,00,000 / 100 hrs). Total Benefit = **117.2**.
- **Suboptimality Gap:** Benchmark confirms greedy achieves 61.9% of the mathematical optimum in this edge case, demonstrating transparent municipal decision support.

---

## Project Directory Structure

```text
AQUAPRIORITY 1/
├── .env.example              # Environment placeholder template (zero credentials)
├── .gitignore                # Production ignore rules (node_modules, dist, env, cache)
├── index.html                # Application HTML entry point
├── package.json              # Project scripts and dependencies
├── postcss.config.js         # PostCSS configuration
├── tailwind.config.js        # Tailwind CSS palette and typography config
├── tsconfig.json             # TypeScript project settings
├── tsconfig.node.json        # TypeScript Node tooling config
├── vite.config.ts            # Vite build configuration
├── src/
│   ├── App.tsx               # Main application shell and state orchestrator
│   ├── index.css             # Tailwind base styles and custom scrollbar rules
│   ├── main.tsx              # React DOM mounting entry point
│   ├── types/
│   │   └── index.ts          # Complete domain interfaces and types
│   ├── algorithm/
│   │   ├── emergency.ts      # Explicit emergency classification logic
│   │   ├── exhaustive.ts     # 2^N combinatorial knapsack benchmark solver
│   │   ├── greedy.ts         # Pure TypeScript multi-dimensional greedy pipeline
│   │   ├── scoring.ts        # Multi-attribute benefit score calculation
│   │   └── validator.ts      # Input schema validation & duplicate detection
│   ├── components/
│   │   ├── Analytics.tsx     # Recharts analytical views and metrics
│   │   ├── CreateRequestModal.tsx # New repair request dialog with validation
│   │   ├── MapView.tsx       # Municipal vector cartography and pin inspector
│   │   ├── Navbar.tsx        # Enterprise header and navigation bar
│   │   ├── OptimizationCenter.tsx # Constraint sliders, presets, results, export
│   │   ├── Overview.tsx      # Executive KPIs and emergency watchlist
│   │   ├── RequestDetailModal.tsx # Inspection, edit mode, and lifecycle management
│   │   └── RequestList.tsx   # Searchable, filterable, paginated data table
│   ├── data/
│   │   └── mockData.ts       # 90 realistic fictional pipeline repair incidents
│   └── storage/
│       └── storage.ts        # localStorage persistence layer and defaults
└── tests/
    ├── benchmark.test.ts     # Knapsack suboptimality proof and exhaustive search
    ├── emergency.test.ts     # Critical facility and severity classification tests
    ├── greedy.test.ts        # Greedy allocation, determinism, and budget bounds
    └── validator.test.ts     # Input validation and duplicate ID rejection tests
```

---

## Getting Started & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- `npm` v9.0.0 or higher

### Installation
Clone or download the repository, then install dependencies:
```bash
npm install
```

### Development Server
Launch the local development server with hot-module reloading:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### Production Build
Compile TypeScript and generate an optimized static bundle in `dist/`:
```bash
npm run build
```

To preview the production build locally:
```bash
npm run preview
```

---

## Automated Test Suite

AquaPriority includes 25 automated unit tests implemented with Vitest:

```bash
npm test
```

### Test Coverage Highlights
- **`tests/validator.test.ts` (9 tests):** Validates schema rules, rejects negative costs/labor hours, catches invalid coordinates, identifies missing required fields, and detects duplicate IDs.
- **`tests/emergency.test.ts` (5 tests):** Verifies critical facility classifications (hospitals, schools, dialysis centers), severe pipe bursts, contamination risk triggers, and manual escalation flags.
- **`tests/greedy.test.ts` (8 tests):** Confirms strict budget adherence, labor hour limits, deterministic ranking, input-order invariance (shuffled arrays produce identical output), and exact deferral reason codes.
- **`tests/benchmark.test.ts` (3 tests):** Validates the $2^N$ combinatorial solver, proves the greedy suboptimality gap on counterexamples, and confirms boundary handling.

---

## Known Limitations & Operational Boundaries

1. **Client-Side Storage:** All edits, added repair jobs, and scenario weights persist inside the user's browser via `localStorage`. Clearing browser data resets the state to the initial 90 demo records.
2. **Indivisible Jobs:** The scheduling engine solves the 0/1 (integer) knapsack problem; repairs cannot be partially funded or fractionalized across squads.
3. **Operational Disclaimers:** Water loss estimates use standardized pipe pressure and hole diameter flow formulas. They provide relative prioritization ranking, not billed municipal volume.

---

## Safe GitHub Deployment Instructions

To push this project to a new GitHub repository without exposing secrets, follow these terminal commands:

### 1. Initialize Git and Verify Status
```bash
# Initialize git repository
git init

# Check that untracked files are recognized
git status
```

### 2. Stage and Create the Initial Commit
```bash
# Stage all tracked files (.gitignore ensures node_modules, dist, etc. are excluded)
git add .

# Verify staged files (ensure node_modules and dist are NOT staged)
git status

# Create the initial commit
git commit -m "feat: initial commit of AquaPriority enterprise municipal platform"
```

### 3. Link Remote and Push
```bash
# Rename branch to main
git branch -M main

# Link your personal GitHub repository (replace with your actual repo URL)
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git

# Push the main branch to GitHub
git push -u origin main
```
