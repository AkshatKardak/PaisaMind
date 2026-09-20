import { Bell, LogOut } from "lucide-react";
import { useLocation } from "react-router-dom";
import ThemeToggle from "../ui/ThemeToggle";
import useAuth from "../../hooks/useAuth";

const titleMap = {
  "/dashboard": "Dashboard",
  "/income": "Income",
  "/expenses": "Expenses",
  "/invoices": "Invoices",
  "/tax": "Tax Planner",
  "/tax-assistant": "AI Tax Assistant",
  "/cash-flow": "Cash Flow",
  "/goals": "Goals",
  "/reports": "Reports",
  "/settings": "Settings",
};

function Navbar() {
  const location = useLocation();
  const { logout, user } = useAuth();

  const pageTitle = titleMap[location.pathname] || "Dashboard";

  return (
    <header
      className="navbar sticky top-0 z-20 mb-6 flex flex-col gap-4 rounded-2xl px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
      style={{ color: "var(--text-primary)" }}
    >
      <div className="min-w-0">
        <div className="pm-kicker">Workspace</div>
        <h1
          className="mt-2 truncate font-display text-xl font-extrabold tracking-tight sm:text-2xl"
          style={{ color: "var(--text-primary)" }}
        >
          {pageTitle}
        </h1>
        <p className="mt-1 line-clamp-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}. Your finance cockpit is live.
        </p>
      </div>

      <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
        <ThemeToggle />
        <button
          type="button"
          aria-label="Notifications"
          className="grid h-10 w-10 place-items-center rounded-[10px] border transition hover:border-[var(--primary)] hover:bg-[var(--primary-glow)] hover:text-[var(--primary)]"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <Bell size={17} />
        </button>

        <div className="hidden items-center gap-3 rounded-2xl border px-3 py-2 sm:flex" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
          <div className="grid h-8 w-8 place-items-center rounded-full bg-sky-500/15 text-xs font-bold text-sky-600 dark:text-sky-300">
            {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="max-w-[140px]">
            <div className="truncate text-sm font-bold text-[var(--text-primary)]">{user?.name || "Workspace User"}</div>
            <div className="truncate text-xs text-[var(--text-muted)]">{user?.email || "Workspace"}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-2 rounded-[10px] border px-3 py-3 text-sm font-semibold transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300 sm:px-4"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

export default Navbar;
