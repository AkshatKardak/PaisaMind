import { LogOut, MoonStar, SunMedium } from "lucide-react";
import { useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";

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
  const { isDark, toggleTheme } = useTheme();

  const pageTitle = titleMap[location.pathname] || "PaisaMind";

  return (
    <header className="navbar sticky top-0 z-30 mb-6 flex items-center justify-between rounded-2xl px-5 py-4 shadow-[0_8px_28px_rgba(0,0,0,0.18)]">
      <div>
        <div className="pm-kicker">Workspace</div>
        <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-white">
          {pageTitle}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}. Your finance cockpit is
          live.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-[var(--text-secondary)] transition hover:bg-white/[0.07] hover:text-white"
          aria-label="Toggle theme"
        >
          {isDark ? <SunMedium size={18} /> : <MoonStar size={18} />}
        </button>

        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-white/[0.07] hover:text-white"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;