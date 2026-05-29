import {
  BarChart2,
  Calculator,
  FileText,
  LayoutDashboard,
  Settings2,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Waves,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/income", label: "Income", icon: TrendingUp },
  { to: "/expenses", label: "Expenses", icon: TrendingDown },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/tax", label: "Tax Planner", icon: Calculator },
  { to: "/tax-assistant", label: "AI Tax Assistant", icon: Sparkles },
  { to: "/cash-flow", label: "Cash Flow", icon: Waves },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/reports", label: "Reports", icon: BarChart2 },
  { to: "/settings", label: "Settings", icon: Settings2 },
];

function Sidebar() {
  const { user } = useAuth();

  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "PM";

  return (
    <>
      <aside className="sidebar hidden min-h-screen w-72 flex-col px-5 py-6 md:flex">
        <div className="mb-8 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="PaisaMind logo" className="pm-logo" />
            <div>
              <div className="font-display text-xl font-bold text-white">PaisaMind</div>
              <div className="text-xs text-[var(--text-secondary)]">Finance OS for freelancers</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "border border-cyan-400/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(129,140,248,0.12))] text-white shadow-[0_10px_24px_rgba(34,211,238,0.08)]"
                      : "border border-transparent text-[var(--text-secondary)] hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-white"
                  }`
                }
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-inherit group-hover:bg-white/[0.06]">
                  <Icon size={17} />
                </span>
                <span className="tracking-tight">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(34,211,238,0.22),rgba(129,140,248,0.2))] font-bold text-cyan-200 shadow-[0_8px_24px_rgba(34,211,238,0.12)]">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold text-white">
                {user?.name || "PaisaMind User"}
              </div>
              <div className="truncate text-sm text-[var(--text-secondary)]">{user?.email}</div>
            </div>
          </div>
          <div className="pm-badge">Synced securely</div>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-white/[0.08] bg-[rgba(7,17,31,0.88)]/95 px-2 py-2 backdrop-blur md:hidden">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium ${
                  isActive ? "text-cyan-300" : "text-[var(--text-secondary)]"
                }`
              }
            >
              <Icon size={18} />
              {item.label.split(" ")[0]}
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}

export default Sidebar;