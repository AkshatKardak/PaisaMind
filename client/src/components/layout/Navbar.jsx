import { Bell, ChevronDown, LogOut, Settings, User } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import ThemeToggle from "../ui/ThemeToggle";

function Navbar({ title }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const initials = useMemo(
    () =>
      user?.name
        ?.split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "PM",
    [user?.name]
  );

  return (
    <header className="navbar sticky top-0 z-30 flex h-16 items-center justify-between px-4 backdrop-blur-xl md:px-8">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="PaisaMind logo" className="pm-logo" />
        <div>
          <div className="font-display text-lg font-bold">PaisaMind</div>
          <div className="hidden text-xs text-[var(--text-secondary)] md:block">{title}</div>
        </div>
      </div>
      <div className="hidden text-lg font-semibold text-[var(--text-primary)] md:block">{title}</div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <button className="relative rounded-full border border-[var(--border)] bg-[var(--bg-card)] p-2.5 text-[var(--text-secondary)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]">
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--danger)]" />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 transition hover:border-sky-500"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/15 text-sm font-bold text-sky-300">
              {initials}
            </div>
            <div className="hidden text-left md:block">
              <div className="text-sm font-semibold text-[var(--text-primary)]">{user?.name}</div>
              <div className="text-xs text-[var(--text-secondary)]">{user?.email}</div>
            </div>
            <ChevronDown size={16} className="text-[var(--text-secondary)]" />
          </button>
          {open && (
            <div className="absolute right-0 top-14 w-56 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-2 shadow-2xl">
              <Link
                to="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              >
                <User size={16} />
                Profile
              </Link>
              <Link
                to="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              >
                <Settings size={16} />
                Settings
              </Link>
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
