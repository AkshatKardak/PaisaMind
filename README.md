<p align="center">
  <img src="https://paisamind.netlify.app/Favicon.png" alt="PaisaMind Logo" width="100"/>
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

### The AI-Powered Finance OS for Indian Freelancers

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://mongodb.com)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com)
[![License](https://img.shields.io/badge/License-MIT-8B5CF6?style=flat-square)](LICENSE)

---

### The Problem

Freelancers, creators, and small businesses in India often manage their finances across multiple disconnected platforms: UPI apps, spreadsheets, freelance marketplaces, Word/Excel invoices, and raw bank statements. 

Traditional finance tools are either:
* **Too basic:** Simple trackers that only catalog past expenses.
* **Too complex:** Heavy accounting software designed for full-time corporate accountants and CAs.

This leaves independent operators struggling with fragmented cash flow data, unexpected GST compliance risks, missed manual invoice follow-ups, and stressful tax estimations.

---

### The Solution: A Financial Operating System

**PaisaMind** is not just an expense tracker. It is a comprehensive **finance operating system** engineered specifically for the Indian freelance economy. PaisaMind unifies invoicing, cash flow forecasting, automated recurring entries, category budget limits, old vs. new tax regime planning, and intelligent AI-driven decision advice into one premium workspace.

With PaisaMind, you can:
* **Track & Manage:** Log income and expenses across multiple streams.
* **Invoice & Collect:** Send GST-compliant invoices with Razorpay payment links.
* **Automate:** Use UTC-safe background cron jobs to sync recurring transactions securely.
* **Plan & Protect:** Stay below GST thresholds and set category-based budget limits.
* **Forecast & Plan:** Project cash flow 3 months ahead and estimate quarterly advance tax.
* **Optimize:** Receive AI-powered summaries to make better pricing and savings decisions.

---

### Why PaisaMind is Different

Traditional expense trackers only answer:
> *"Where did my money go?"*

PaisaMind is forward-looking and answers:
* **What is due next?** Upcoming recurring SaaS subscriptions and retainer milestones.
* **How much budget is left?** Real-time warning states before category budget limits are crossed.
* **What invoice is pending?** Professional receivables status with auto-reminder email templates.
* **What tax decisions matter?** Clear old vs. new tax regime comparisons and GST threshold alert levels.
* **How does future cash flow look?** A 3-month forecast model predicting business runway.

---

## Screenshots

### Dashboard
![Dashboard](client/src/assets/Dashboard.png)

### Income Tracker
![Income](client/src/assets/Income.png)

### Expense Manager
![Expenses](client/src/assets/Expenses.png)

### Invoice Manager
![Invoices](client/src/assets/Invoices.png)

### AI Tax Assistant
![AI Tax Assistant](client/src/assets/Ai%20Tax%20Assistant.png)

### Tax Planner
![Tax Planner](client/src/assets/Tax%20Planner.png)

### Cash Flow Forecaster
![CashFlow](client/src/assets/CashFlow.png)

### Reports
![Reports](client/src/assets/Reports.png)

---

## Features

| Feature | Description |
|---|---|
| 🏠 **Unified Dashboard** | Real-time financial health score, visual income vs. expense charts, and contextual AI insights. |
| 💰 **Income & Revenue Tracker** | Log multi-stream earnings, retainer fees, and UPI client collections with advanced filters. |
| 💸 **Smart Budget Manager** | Control expenses by category with customizable budget limits and threshold alert states. |
| 🧾 **Professional Invoicing** | Generate GST-ready professional invoices, download print-ready PDFs, and integrate Razorpay checkout links. |
| 🔄 **Recurring Sync Cron** | Secure background processing for subscriptions and retainers with UTC-safe date logic and cycle duplicate protection. |
| 🤖 **AI Tax Assistant** | Chat with a Groq LLaMA-powered intelligence agent trained on Indian tax laws and freelance business cases. |
| 📊 **Indian Tax Planner** | Estimate annual liabilities and compare Old vs. New Tax Regimes, including 80C/80D investment tracking. |
| 📈 **Cash Flow Forecaster** | Look 3 months ahead with predictions computed from historical income and expense patterns. |
| 📋 **Monthly Performance Reports** | AI-generated financial audits with a downloadable styled PDF summary. |
| 🎯 **Savings Milestones** | Set long-term financial savings goals and monitor progress bar status. |
| 🏥 **API Health Monitoring** | Highly lightweight, dependency-free `/health` endpoint for Render status check reliability. |
| 🌗 **Premium Dark/Light UI** | Gorgeous CSS glassmorphism layout with system theme auto-detection. |

---

## Tech Stack

### Frontend
- **React + Vite** (Vite-fast compilation and HMR)
- **Tailwind CSS 4.0** (Premium utility styling)
- **Lucide React** (Modern iconography)
- **Firebase Auth SDK** (Secure authentication)
- **TanStack React Query** (Performant data fetching and caching)

### Backend
- **Node.js + Express** (RESTful API architecture)
- **MongoDB Atlas + Mongoose** (NoSQL document model)
- **Firebase Admin SDK** (Token validation middleware)
- **Groq SDK (LLaMA-3.3)** (High-performance AI generation)
- **pdfkit** (Invoice and report PDF document generation)
- **Razorpay SDK** (Online invoice payment checkouts)
- **Resend SDK** (Transactional billing emails and reminders)
- **Node-Cron** (Automated job schedules)

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas database connection string
- Firebase Project with Google Sign-In activated
- Groq API Key
- Resend API Key & Verified domain
- Razorpay API credentials

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

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com

RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
```

Run the server locally:
```bash
npm run dev
```
*The API server will listen on `http://localhost:5000`.*
*Verify health check at `http://localhost:5000/health`.*

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

Run the client app:
```bash
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 📂 Project Structure

```
PaisaMind/
├── client/                   # React Frontend (Vite + Tailwind)
│   ├── src/
│   │   ├── pages/            # Landing page, Dashboard, Invoices, Recurring...
│   │   ├── components/       # Shared UI primitives, Layouts, ThemeToggle...
│   │   ├── services/         # API client layer (Axios)
│   │   ├── context/          # Global Auth & Theme Context
│   │   └── utils/            # HSL color conversions, tax engines, health calculations
│   └── netlify.toml
│
└── server/                   # Express Backend (Node.js)
    ├── controllers/          # Business logic (AI, Invoices, Recurring, Taxes)
    ├── models/               # Mongoose Schemas (User, Income, Expense, Invoice, Goal, Recurring)
    ├── routes/               # Express routing layers
    ├── middleware/           # Firebase JWT verification, rate limiters
    ├── jobs/                 # node-cron task handlers (overdue invoices, recurring runs)
    ├── utils/                # Razorpay integrations, Resend mail templates, Groq engines
    └── config/               # Database and Firebase admin configuration
```

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for details.

---

<div align="center">
Built with ❤️ for Indian freelancers who deserve a better financial OS.
</div>
