import React, { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Toast from "./components/ui/Toast";
import useAuth from "./hooks/useAuth";

// Route-based Code Splitting (React.lazy) for high-performance bundle loading
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Copilot = lazy(() => import("./pages/Copilot"));
const FinancialHealth = lazy(() => import("./pages/FinancialHealth"));
const Profitability = lazy(() => import("./pages/Profitability"));
const ScenarioSimulator = lazy(() => import("./pages/ScenarioSimulator"));
const Anomalies = lazy(() => import("./pages/Anomalies"));
const StatementImport = lazy(() => import("./pages/StatementImport"));
const NetWorth = lazy(() => import("./pages/NetWorth"));
const Income = lazy(() => import("./pages/Income"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Invoices = lazy(() => import("./pages/Invoices"));
const TaxPlanner = lazy(() => import("./pages/TaxPlanner"));
const TaxAssistant = lazy(() => import("./pages/TaxAssistant"));
const CashFlowForecaster = lazy(() => import("./pages/CashFlowForecaster"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));

function RouteLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-sm font-medium text-[var(--text-secondary)] animate-pulse">
      Loading workspace...
    </div>
  );
}

function HomeRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] text-[var(--text-secondary)]">
        Loading session...
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />;
}

function PrivateRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] text-[var(--text-secondary)]">
        Waking up server...
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] text-[var(--text-secondary)]">
        Loading session...
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/copilot" element={<Copilot />} />
              <Route path="/health" element={<FinancialHealth />} />
              <Route path="/profitability" element={<Profitability />} />
              <Route path="/simulator" element={<ScenarioSimulator />} />
              <Route path="/anomalies" element={<Anomalies />} />
              <Route path="/statement-import" element={<StatementImport />} />
              <Route path="/net-worth" element={<NetWorth />} />
              <Route path="/income" element={<Income />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/tax" element={<TaxPlanner />} />
              <Route path="/tax-assistant" element={<TaxAssistant />} />
              <Route path="/cash-flow" element={<CashFlowForecaster />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toast />
    </BrowserRouter>
  );
}

export default App;
