<p align="center">
  <img src="https://paisamind.netlify.app/Favicon.png" alt="PaisaMind Logo" width="90"/>
</p>

<p align="center">
  <a href="https://paisamind.netlify.app">
    <img src="https://img.shields.io/badge/Frontend-Netlify-00C7B7?style=for-the-badge&logo=netlify" />
  </a>
  <a href="https://paisamind-backend-92ig.onrender.com/health">
    <img src="https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render" />
  </a>
</p>

# PaisaMind

### The AI-Powered Financial Intelligence Platform for Indian Freelancers

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://mongodb.com)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com)
[![License](https://img.shields.io/badge/License-MIT-8B5CF6?style=flat-square)](LICENSE)

---

## Problem Statement

Independent professionals, software developers, UI/UX designers, consultants, content creators, and solo agencies in India operate in one of the most dynamic freelance economies in the world. However, managing their day-to-day business finances remains fragmented, inaccurate, and stressful.

### 1. The Presumptive Taxation (Section 44ADA) Dilemma
Under Section 44ADA of the Indian Income-tax Act, specified professionals with annual gross receipts up to Rs. 75 Lakhs can declare 50% of their gross revenue as deemed taxable profit without having to maintain tedious books of accounts or undergo formal audits. Yet, most freelancers:
* Overpay tax under the New Tax Regime without modeling whether Section 44ADA saves them lakhs in advance.
* Miss mandatory Advance Tax deadlines (June 15, Sept 15, Dec 15, March 15), incurring penal interest under Sections 234B and 234C.

### 2. Unclaimed TDS (Section 194J & 194C) Leakage
Indian enterprise clients routinely deduct 10% or 2% TDS under Section 194J (Professional / Technical Fees) or 1% under Section 194C (Contractors). Independent operators frequently fail to reconcile deducted amounts with their Form 26AS / AIS tax credit statements, essentially leaving their own hard-earned money behind with the Income Tax Department.

### 3. Payment Gateway Fees and Cash Flow Friction
Standard payment gateways (Razorpay, Stripe, PayPal) charge between 2% and 3.5% plus GST on every domestic transaction. For an independent consultant earning Rs. 20,00,000 annually, gateway processing fees wipe out Rs. 40,000 to Rs. 70,000 every single year. Furthermore, delayed invoice payments disrupt monthly cash runways without early warning signals.

### 4. Undetected Scope Creep and Unit Economic Dilution
Freelancers quote fixed project rates based on an assumed 40-hour delivery window. Client revision rounds and unbilled maintenance silently stretch delivery into 100+ hours, dropping the effective hourly rate below minimum wage without the freelancer ever realizing their unit economics have collapsed.

### 5. The Hidden Rs. 20 Lakh GST Threshold Cliff
Service providers in India must legally register for Goods and Services Tax (GST) once turnover exceeds Rs. 20 Lakhs in a financial year (Rs. 10 Lakhs in special category states). Crossing this threshold without prior CA guidance leads to retrospective tax demands, penalties, and compliance turmoil.

---

## The Solution

**PaisaMind** is a financial intelligence operating system engineered specifically for the Indian freelance ecosystem. Rather than offering another passive spreadsheet or a generic AI chatbot, PaisaMind unifies automated ledgering, deterministic tax calculations, zero-fee payment collection, and grounded AI decision support into a single workspace.

### Core Capabilities:
* **Versioned Indian Tax Intelligence (Zero Hardcoded Logic):** Dynamic tax rule engine supporting FY 2024-25, FY 2025-26, and FY 2026-27 with official CBDT Gazette provenance, paired with a Section 44ADA legal evaluator enforcing entity compliance, specified profession codes, and digital receipt thresholds (₹75L vs ₹50L).
* **Canonical Financial Ledger & Balance Continuity:** Standardized ledger with composite extraction and categorization confidence scoring, running balance continuity verification (`balance[i] = balance[i-1] + credit - debit`), and intra-batch/DB duplicate detection.
* **Secure Streaming Document Pipeline:** Page-by-page table extraction handling 100+ page statements with zero character truncation, retaining `sourcePage` traceability, ephemeral file shredding, and automated Indian PII masking (PAN, Aadhaar, bank accounts).
* **Backend-Only Machine Learning Subsystem:** Rolling backtested cash flow forecasting (MAE/RMSE tracking against Baseline and Holt-Linear Trend models) with 95% confidence bounds, Modified Z-Score (MAD) spending outlier detection, and hybrid categorization with user feedback loops.
* **Volatility-Driven What-If Simulator & Monte Carlo:** Simulates capital purchases and revenue drops scaled by historical income volatility ($\sigma$) and 100-iteration Monte Carlo distributions (P10 stress, P50 base, P90 optimistic).
* **Deterministic Calculation Engines:** Every financial figure (runway months, project hourly yield, debt-to-income ratio, GST alerts) is computed by verified mathematical engines with zero fake demo fallbacks.
* **Grounded AI Financial Copilot:** Powered by Groq LLaMA-3.3 with 20 server-side deterministic tool engines. Every recommendation returns fact-checked numbers, model versions, confidence scores, and statutory disclaimers.
* **Zero-Fee UPI Invoicing:** Invoices generate native `upi://pay` QR codes, allowing clients to pay directly via PhonePe, Google Pay, or Paytm straight into your verified bank account with 0% processing fees.
* **Project Profitability Sentinel:** Audits revenue against logged hours and direct project tooling expenses, alerting you whenever scope creep dilutes your effective hourly earnings.
* **Contextual 3-Stage WhatsApp Recovery:** Generates professional Gentle, Firm, and Final escalation notices with 1-click WhatsApp and email delivery.

---

## Why This Project is Different

| Dimension | Generic Expense Trackers (Splitwise, Wallet) | Traditional Accounting (Zoho Books, QuickBooks) | Generic AI Chatbots (ChatGPT / Claude Wrappers) | PaisaMind (Enterprise ML Finance OS) |
|---|---|---|---|---|
| **Tax Rule Architecture** | Not supported | Hardcoded or manual yearly ledger setup | Hallucinates outdated tax slabs & rates | **Versioned Tax Rule Engine (FY 24-25, 25-26, 26-27) + Section 44ADA Legal Evaluator** |
| **Document Ingestion** | Manual CSV upload | Requires bank netbanking aggregation feed | Not supported | **Streaming Page-by-Page Extraction (Zero Truncation) + PII Masking + Vision OCR** |
| **Ledger Integrity** | Basic list view | Manual reconciliation workflow | Hallucinates transaction balances | **Canonical Ledger with Running Balance Continuity & Composite Confidence Scoring** |
| **Cash Flow Forecasting** | Historical lookback only | Static cash-flow statement | Guesses future scenarios | **Backend ML (Holt-Linear Trend, Rolling Backtest MAE/RMSE, 95% Confidence Bounds)** |
| **Spending Anomaly Detection** | Simple threshold alerts | Basic variance reports | No statistical rigor | **Modified Z-Score using Median Absolute Deviation (MAD) + Multi-Feature Outlier Scoring** |
| **Scenario Stress-Testing** | Not supported | Static manual spreadsheets | Uncalibrated subjective answers | **Historical Volatility Shocks + 100-Iteration Monte Carlo Simulation (P10, P50, P90)** |
| **Mathematical Accuracy** | Basic addition only | Accurate, but requires manual bookkeeper entry | Hallucinates financial figures | **100% Deterministic Server Computation with Zero Fake Data** |
| **Invoice Collection Fees** | Not supported | Integrated gateways cut 2% to 3% fee | Not supported | **0% Processing Fees via Native UPI QR Codes (`upi://pay`)** |
| **Project Unit Economics** | Not supported | Separate project time-tracking software required | Not supported | **Live Effective Hourly Rate & Scope Creep Sentinel** |

---

## System Architecture

PaisaMind operates on a strict 5-tier architecture:
`User → Auth → Ingestion → Validation + Normalization → Quality/Confidence → Canonical Ledger → Deterministic Engines → ML Intelligence Layer → AI Tool Layer → AI Explanation → User`

```
[ Tier 1: Multi-Source Data Ingestion & Security Pipeline ]
  ├── Bank Statement Parser (Streaming page-by-page PDF, CSV, XLSX, Zero Truncation)
  ├── Vision OCR Pipeline (Photographed passbooks & scanned receipts via Groq Vision)
  ├── Ephemeral File Manager & PII Masking Filter (Sanitizes PAN, Aadhaar, Account Numbers)
  └── Zero-Fee UPI & Razorpay Invoicing Webhooks
                        │
                        ▼
[ Tier 2: Canonical Ledger & Data Validation Engine ]
  ├── Canonical Transaction Schema (sourcePage, extractionMethod, confidence scores)
  ├── Running Balance Continuity Sentinel (balance[i] = balance[i-1] + credit - debit)
  ├── Multi-Factor Duplicate Detection (Intra-batch & DB matching via string similarity)
  └── Multi-Stage Validation Status (VALIDATED, REVIEW_REQUIRED, DUPLICATE, REJECTED)
                        │
                        ▼
[ Tier 3: Deterministic Financial Engines & Versioned Tax Rules ]
  ├── Versioned Indian Tax Rule Resolver (FY 2024-25, FY 2025-26, FY 2026-27 datasets)
  ├── Section 44ADA Legal Eligibility Evaluator (Entity check, Section 44AA professions, ₹75L cash rule)
  ├── Expense CV-Adjusted Cash Runway Engine (Conservative, Expected, Optimistic)
  ├── Volatility-Derived What-If Scenario Simulator with Monte Carlo Distributions
  └── Configurable 8-Component Financial Health Score Engine (HealthConfig)
                        │
                        ▼
[ Tier 4: Backend-Only Machine Learning Intelligence Layer (server/ml/) ]
  ├── Cash Flow Forecasting with Rolling Backtesting (MAE/RMSE model evaluation)
  ├── Modified Z-Score (MAD) Multi-Dimensional Outlier Detection
  ├── Hybrid Transaction Categorization (User Rules → ML Classifier → LLM Fallback)
  └── Node-Python IPC Bridge with Deterministic Statistical Fallbacks (Zero Fake Data)
                        │
                        ▼
[ Tier 5: AI Copilot Orchestration & Execution Layer ]
  ├── Groq LLaMA-3.3 High-Throughput Inference Engine
  ├── 20 Verified Backend Tool-Calling Contracts with Provenance & Disclaimers
  ├── Zero-Fee Dynamic UPI Payment QR Invoices (upi://pay)
  ├── 3-Stage Contextual WhatsApp & Email Recovery Escalation Drafts
  └── Print-Ready CA Compliance Reports & P&L Statement Exports
```

---

## Screenshots

### Dashboard & Cash Flow
![Dashboard](client/src/assets/Dashboard.png)

### Income & Multi-Stream Revenue
![Income](client/src/assets/Income.png)

### Expense & Spending Anomaly Manager
![Expenses](client/src/assets/Expenses.png)

### Professional Invoicing with UPI QR Code
![Invoices](client/src/assets/Invoices.png)

### AI Tax Assistant
![AI Tax Assistant](client/src/assets/Ai%20Tax%20Assistant.png)

### Section 44ADA Tax Planner
![Tax Planner](client/src/assets/Tax%20Planner.png)

### Cash Flow Forecaster & Runway Model
![CashFlow](client/src/assets/CashFlow.png)

### Print-Ready Performance Reports
![Reports](client/src/assets/Reports.png)

---

## Tech Stack

### Frontend Architecture
* **React 18 + Vite:** Fast compilation, HMR, and route-based dynamic code splitting (`React.lazy` + `Suspense`).
* **Tailwind CSS:** Utility-first responsive design supporting dark/light visual modes.
* **TanStack React Query:** Client-side cache synchronization with a 3-minute stale window for instant page navigation.
* **Recharts:** Responsive financial visualizations, bar distributions, and multi-track scenario models.
* **Firebase Auth SDK:** Secure email/password and Google Sign-In authentication.
* **Lucide React:** Consistent, enterprise-grade iconography.

### Backend Architecture
* **Node.js + Express.js:** Scalable REST API with modular controllers and custom middleware.
* **MongoDB Atlas + Mongoose:** Compound-indexed schemas optimized for high-speed multi-month financial range querying.
* **Groq SDK:** High-throughput LLaMA-3.3 inference for AI Copilot and LLaMA-3.2 Vision for passbook OCR.
* **PDFKit:** Clean, monochrome, print-friendly monthly report generation.
* **Node-Cron:** In-process background keep-alive ping and automated transaction recurrence cycles.
* **Vitest:** Full unit test coverage across tax, runway, scenario, and statement parsing engines.

---

## Project Structure

```
PaisaMind/
├── client/                               # React 18 + Vite Frontend
│   ├── public/                           # Static assets, logo.png, mascot.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── copilot/                  # FloatingCopilotWidget.jsx (Animated mascot assistant)
│   │   │   ├── layout/                   # Layout.jsx, Navbar.jsx, Sidebar.jsx
│   │   │   └── ui/                       # ThemeToggle.jsx, Toast.jsx, SkeletonLoader.jsx
│   │   ├── pages/                        # Route-split application views:
│   │   │   ├── Landing.jsx               # Hero cockpit, 4-tier architecture, interactive 44ADA preview
│   │   │   ├── Dashboard.jsx             # 5 core KPIs, rolling 6-month Income vs Expenses, GST tracker
│   │   │   ├── Copilot.jsx               # Fullscreen AI Copilot with tool inspection and mascot integration
│   │   │   ├── FinancialHealth.jsx       # 8-pillar health score & 6-month trajectory analysis
│   │   │   ├── Profitability.jsx         # Project unit economics and scope creep alerts
│   │   │   ├── ScenarioSimulator.jsx     # 3-track financial scenario simulation
│   │   │   ├── Invoices.jsx              # UPI QR invoicing & 3-stage WhatsApp recovery
│   │   │   ├── Income.jsx                # Multi-stream earnings & statement import action
│   │   │   ├── Expenses.jsx              # Expense logging & duplicate transaction scanner
│   │   │   ├── TaxPlanner.jsx            # Section 44ADA presumptive tax vs New Regime
│   │   │   ├── StatementImport.jsx       # Drag-and-drop CSV, XLSX, PDF & passbook photo OCR
│   │   │   ├── NetWorth.jsx              # Asset & liability ledger
│   │   │   ├── Reports.jsx               # Clean, print-friendly monochrome PDF export
│   │   │   ├── Login.jsx                 # Firebase authentication login
│   │   │   └── Register.jsx              # Workspace registration
│   │   ├── services/                     # Axios API service clients (copilot, invoice, scenario, statement...)
│   │   ├── context/                      # AuthContext.jsx, ThemeContext.jsx
│   │   ├── hooks/                        # Custom React hooks (useAuth, useFinancialData)
│   │   └── utils/                        # formatCurrency (INR), healthScore, taxCalculators
│   ├── index.html                        # Application entry point
│   ├── vite.config.js                    # Vite configuration
│   └── package.json
│
└── server/                               # Node.js + Express.js Backend
    ├── config/                           # db.js (MongoDB), firebase.js (Admin SDK)
    ├── controllers/                      # Request handlers:
    │   ├── aiController.js               # Groq legacy completions & report generation
    │   ├── analyticsController.js        # Health score & cash runway calculations
    │   ├── copilotController.js          # Grounded AI Copilot tool caller
    │   ├── expenseController.js          # Expense CRUD & category aggregations
    │   ├── incomeController.js           # Income CRUD & GST threshold tracker
    │   ├── invoiceController.js          # Invoices, UPI QR generator & payment links
    │   ├── netWorthController.js         # Assets, liabilities & net worth calculation
    │   ├── profitabilityController.js    # Project billing & unit economics
    │   ├── scenarioController.js         # Monte Carlo simulation engine
    │   ├── statementController.js        # Bank statement ingestion & commit handler
    │   └── taxController.js              # Section 44ADA presumptive tax engine
    ├── middleware/                       # authMiddleware, errorMiddleware, validationMiddleware
    ├── models/                           # Mongoose Schemas (Compound-indexed):
    │   ├── User.js, Income.js, Expense.js, Invoice.js, Project.js,
    │   ├── Asset.js, Liability.js, Anomaly.js, StatementImport.js,
    │   └── AIConversation.js, AIMessage.js, CategoryRule.js, RecurringTransaction.js
    ├── routes/                           # Express route routers
    ├── services/                         # Core deterministic business logic:
    │   ├── taxEngineService.js           # Section 44ADA, Old vs New Regime calculation
    │   ├── runwayEngineService.js        # Cash runway & burn rate modeling
    │   ├── healthEngineService.js        # 8-pillar health scoring & historical tracking
    │   ├── simulationEngineService.js    # 3-track scenario modeling
    │   ├── statementParserService.js     # CSV, Excel, PDF parsing & Groq Vision OCR
    │   ├── recoveryService.js            # 3-stage WhatsApp invoice recovery drafting
    │   └── categorizationService.js      # Auto-categorization rule engine
    ├── tools/                            # financialToolsRegistry.js (20 deterministic execution tools)
    ├── validations/                      # financialSchemas.js (Input validation rules)
    ├── jobs/                             # cronJobs.js (In-process keep-alive & recurring sync)
    ├── tests/                            # Vitest unit test suites (37 passing tests)
    └── package.json
```

---

## Getting Started

### Prerequisites
* Node.js >= 18
* MongoDB Atlas database cluster
* Firebase Project with Google Sign-In activated
* Groq API Key (for Copilot and Vision OCR)
* Resend API Key & Verified Sender (optional for email dispatch)
* Razorpay API Credentials (optional for payment links)

### 1. Clone the Repository
```bash
git clone https://github.com/AkshatKardak/PaisaMind.git
cd PaisaMind
```

### 2. Configure & Start Backend Server
```bash
cd server
npm install
```

Create a `server/.env` file:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/paisamind
CLIENT_URL=http://localhost:5173

# Backend keep-alive ping URL (runs every 10 minutes)
BACKEND_URL=http://localhost:5000

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com

RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
```

Start the server:
```bash
npm run dev
```
Verify health check at `http://localhost:5000/health`.

### 3. Configure & Start Frontend Client
```bash
cd ../client
npm install
```

Create a `client/.env` file:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
VITE_API_URL=http://localhost:5000/api
```

Start the client:
```bash
npm run dev
```
Navigate to `http://localhost:5173`.

---

## Running Verification Tests

To execute the complete server test suite:
```bash
cd server
npm test
```
*Current test suite: 7 test files, 37 passing unit tests.*

To verify the production client build:
```bash
cd client
npm run build
```
*Zero warnings, zero errors, optimal code splitting.*

---

## License

Distributed under the MIT License. See `LICENSE` for details.

---

<div align="center">
Built by Akshat Kardak
</div>
