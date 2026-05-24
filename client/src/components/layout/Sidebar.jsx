import {
  BarChart2,
  Calculator,
  FileText,
  LayoutDashboard,
  Settings2,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/income", label: "Income", icon: TrendingUp },
  { to: "/expenses", label: "Expenses", icon: TrendingDown },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/tax", label: "Tax Planner", icon: Calculator },
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
      <aside className="sidebar hidden min-h-screen w-60 flex-col px-4 py-6 md:flex">
        <div className="mb-8 flex items-center gap-3 px-2">
          <img src="/logo.png" alt="PaisaMind logo" className="pm-logo" />
          <div>
            <div className="font-display text-xl font-bold">PaisaMind</div>
            <div className="text-xs text-[var(--text-secondary)]">Finance OS</div>
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
                  `group flex items-center gap-3 rounded-xl border-l-[3px] px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "border-l-sky-500 bg-sky-500/10 text-sky-400"
                      : "border-l-transparent text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/15 font-bold text-sky-300">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="truncate font-medium text-[var(--text-primary)]">{user?.name}</div>
              <div className="truncate text-sm text-[var(--text-secondary)]">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-[var(--border)] bg-[var(--bg-card)]/95 px-2 py-2 backdrop-blur md:hidden">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] ${
                  isActive ? "text-sky-400" : "text-[var(--text-secondary)]"
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
