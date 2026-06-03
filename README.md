# PaisaMind

### AI-Powered Finance OS for Indian Freelancers

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://mongodb.com)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com)
[![License](https://img.shields.io/badge/License-MIT-8B5CF6?style=flat-square)](LICENSE)

---

### Problem Statement

Freelancers and small businesses in India often manage their finances across multiple disconnected platforms such as UPI apps, spreadsheets, freelance marketplaces, invoices, and bank statements. This creates major challenges in tracking income, monitoring expenses, planning taxes, and maintaining healthy cash flow.

Most existing finance tools are either:
* too basic, offering only simple expense tracking
* too complex, designed for large businesses and accountants

As a result, freelancers struggle with:
* scattered financial data
* irregular cash flow visibility
* GST and tax confusion
* missed invoice payments
* poor savings planning
* lack of financial insights

Managing finances becomes stressful, manual, and time-consuming.

---

### Our Solution

**PaisaMind** is an AI-powered financial intelligence platform built specifically for Indian freelancers, creators, solopreneurs, and small businesses.

The platform transforms raw financial data into clear insights, actionable recommendations, and simplified financial planning.

PaisaMind helps users:
* track income and expenses in one place
* manage invoices and payment reminders
* monitor GST thresholds and compare tax regimes
* forecast future cash flow
* receive AI-powered financial insights
* improve financial health through smart recommendations

The goal is to simplify financial management, reduce tax confusion, improve financial awareness, and help users make smarter money decisions through intelligent automation and analytics.


[Live Demo](https://paisamind.netlify.app) · [Report Bug](https://github.com/AkshatKardak/PaisaMind/issues) · [Request Feature](https://github.com/AkshatKardak/PaisaMind/issues)

</div>

---

## 📸 Screenshots

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

---

## ✨ Features

| Feature | Description |
|---|---|
| 🏠 **Dashboard** | Real-time financial health score, income vs expense charts, AI insights |
| 💰 **Income Tracker** | Log income by source and category with date filtering |
| 💸 **Expense Manager** | Track expenses by category, tag, and date range |
| 🧾 **Invoice Manager** | Create, send, and track invoices with Razorpay payment links and Resend email reminders |
| 🤖 **AI Tax Assistant** | Groq LLaMA-3.3-powered tax Q&A for Indian freelancers |
| 📊 **Tax Planner** | 80C/80D investment tracker with old vs new regime comparison |
| 📈 **Cash Flow Forecaster** | 3-month income prediction based on historical trends |
| 📋 **Reports** | AI-generated monthly narrative reports with branded dark PDF export |
| 🎯 **Goals** | Set and track financial savings goals with progress bars |
| 🌗 **Dark / Light Mode** | Full theme switching with system preference detection |

---

## 🛠 Tech Stack

### Frontend
- **React** + Vite
- **Tailwind CSS** 
- **Lucide React** 
- **Firebase SDK**

### Backend
- **Node.js + Express**
- **MongoDB Atlas**
- **Firebase Admin SDK** 
- **Groq SDK (LLaMA 3.3 70B)**
- **Razorpay** 
- **Resend** 

### Deployment
- **Frontend** → Netlify
- **Backend** → Render
---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account
- Firebase project (Google Auth enabled)
- Groq API key
- Resend API key

### 1. Clone the repo

```bash
git clone https://github.com/AkshatKardak/PaisaMind.git
cd PaisaMind
```

### 2. Setup the Server

```bash
cd server
npm install
```

Create `server/.env`:

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

RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
```

```bash
node index.js
```

### 3. Setup the Client

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

App runs at **http://localhost:5173**

---

## 📁 Project Structure

```
PaisaMind/
├── client/                   # React frontend (Vite)
│   ├── src/
│   │   ├── pages/            # Dashboard, Income, Expenses, Invoices, Reports...
│   │   ├── components/       # Shared UI components
│   │   ├── services/         # API call functions
│   │   ├── hooks/            # Custom React hooks
│   │   ├── context/          # Auth, Theme contexts
│   │   └── utils/            # formatCurrency, healthScore, taxCalculator
│   └── netlify.toml
│
└── server/                   # Express backend
    ├── controllers/          # aiController, invoiceController, authController...
    ├── models/               # Mongoose schemas (User, Income, Expense, Invoice, Goal)
    ├── routes/               # Express route definitions
    ├── middleware/            # Firebase auth middleware
    ├── utils/                # razorpayService, emailService, groqService, taxEngine
    └── config/               # firebaseAdmin setup
```

---

## 🔐 Environment Variables Reference

### Server (Render)

| Variable | Source |
|---|---|
| `MONGO_URI` | MongoDB Atlas → Connect → Drivers |
| `CLIENT_URL` | Your Netlify URL (no trailing slash) |
| `FIREBASE_PROJECT_ID` | Firebase Console → Project Settings → General |
| `FIREBASE_CLIENT_EMAIL` | Firebase Console → Project Settings → Service Accounts |
| `FIREBASE_PRIVATE_KEY` | Firebase Console → Generate new private key |
| `GROQ_API_KEY` | https://console.groq.com → API Keys |
| `RESEND_API_KEY` | https://resend.com → API Keys |
| `EMAIL_FROM` | Verified domain in Resend |
| `RAZORPAY_KEY_ID` | Razorpay Dashboard → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → Settings → API Keys |

### Client (Netlify)

| Variable | Source |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings → Web App config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Console → Web App config |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Console → Web App config |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Console → Web App config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Web App config |
| `VITE_FIREBASE_APP_ID` | Firebase Console → Web App config |
| `VITE_API_URL` | Your Render URL + `/api` |

---

## 📄 License

MIT © [Akshat Kardak](https://github.com/AkshatKardak)

---

<div align="center">
Built with ❤️ for Indian freelancers who deserve better financial tools.
</div>
