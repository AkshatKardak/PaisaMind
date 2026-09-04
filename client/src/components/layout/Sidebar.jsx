import {
  Activity,
  BarChart2,
  Calculator,
  FileText,
  LayoutDashboard,
  Settings2,
  Sliders,
  Target,
  TrendingDown,
  TrendingUp,
  Waves,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const navItems = [
  { to: "/dashboard",     label: "Dashboard",           icon: LayoutDashboard },
  { to: "/health",        label: "Financial Health",    icon: Activity },
  { to: "/profitability", label: "Profitability & ROI", icon: Target },
  { to: "/income",        label: "Income",              icon: TrendingUp },
  { to: "/expenses",      label: "Expenses",            icon: TrendingDown },
  { to: "/invoices",      label: "Invoices",            icon: FileText },
  { to: "/cash-flow",     label: "Cash Flow & Runway",  icon: Waves },
  { to: "/tax",           label: "Tax Planner (44ADA)", icon: Calculator },
  { to: "/simulator",     label: "Scenario Simulator",  icon: Sliders },
  { to: "/reports",       label: "Reports",             icon: BarChart2 },
  { to: "/settings",      label: "Settings",            icon: Settings2 },
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
      <aside
        className="sidebar hidden min-h-screen w-72 flex-col px-5 py-6 md:flex"
        style={{ color: "var(--text-primary)" }}
      >
        {/* Logo */}
        <div
          className="mb-8 rounded-2xl px-4 py-4"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="pm-logo h-9 w-auto object-contain" />
            <div>
              <div className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                Finance OS for Freelancers
              </div>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200"
                style={({ isActive }) => ({
                  color: isActive ? "var(--primary)" : "var(--text-secondary)",
                  background: isActive ? "var(--primary-soft)" : "transparent",
                  border: isActive
                    ? "1px solid var(--border-accent)"
                    : "1px solid transparent",
                  boxShadow: isActive ? "var(--card-glow)" : "none",
                })}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-xl transition-all"
                      style={{
                        background: isActive
                          ? "var(--primary-soft)"
                          : "var(--bg-elevated)",
                        color: isActive ? "var(--primary)" : "var(--text-secondary)",
                      }}
                    >
                      <Icon size={16} />
                    </span>
                    <span className="tracking-tight">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User card */}
        <div
          className="mt-8 rounded-2xl p-4"
          style={{
            border: "1px solid var(--border)",
            background: "var(--bg-elevated)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <div className="mb-3 flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl font-bold"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary-soft), var(--secondary-soft))",
                color: "var(--primary)",
                boxShadow: "0 8px 24px var(--primary-soft)",
              }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div
                className="truncate font-semibold text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                {user?.name || "Workspace User"}
              </div>
              <div
                className="truncate text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                {user?.email}
              </div>
            </div>
          </div>
          <div className="pm-badge">Synced securely</div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t px-2 py-2 backdrop-blur md:hidden"
        style={{
          background: "var(--nav-bg)",
          borderColor: "var(--border)",
        }}
      >
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-all"
              style={({ isActive }) => ({
                color: isActive ? "var(--primary)" : "var(--text-secondary)",
              })}
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
