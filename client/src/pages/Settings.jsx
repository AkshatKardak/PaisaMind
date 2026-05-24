import { useState } from "react";
import useAuth from "../hooks/useAuth";
import { showToast } from "../components/ui/Toast";
import { useTheme } from "../context/ThemeContext";

function Settings() {
  const { user, setUser } = useAuth();
  const { isDark, setTheme } = useTheme();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    avatar: user?.avatar || "",
    panNumber: user?.panNumber || "",
    gstNumber: user?.gstNumber || "",
    taxRegime: user?.taxRegime || "new",
    taxReminders: true,
    invoiceAlerts: true,
    monthlyReports: true,
  });

  const handleSave = () => {
    const nextUser = {
      ...user,
      name: form.name,
      email: form.email,
      avatar: form.avatar,
      panNumber: form.panNumber,
      gstNumber: form.gstNumber,
      taxRegime: form.taxRegime,
    };
    setUser(nextUser);
    localStorage.setItem("paisamind_user", JSON.stringify(nextUser));
    showToast({ type: "success", title: "Settings saved", message: "Profile preferences were updated locally." });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-sm text-[var(--text-secondary)]">Manage your profile, tax preferences, and alerts.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="pm-card space-y-4">
          <h3 className="text-xl font-semibold">Profile</h3>
          <input className="pm-input" placeholder="Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <input className="pm-input" placeholder="Email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          <input className="pm-input" placeholder="Avatar URL" value={form.avatar} onChange={(event) => setForm((current) => ({ ...current, avatar: event.target.value }))} />
        </section>

        <section className="pm-card space-y-4">
          <h3 className="text-xl font-semibold">Tax Preferences</h3>
          <input className="pm-input" placeholder="PAN" value={form.panNumber} onChange={(event) => setForm((current) => ({ ...current, panNumber: event.target.value.toUpperCase() }))} />
          <input className="pm-input" placeholder="GST Number" value={form.gstNumber} onChange={(event) => setForm((current) => ({ ...current, gstNumber: event.target.value.toUpperCase() }))} />
          <select className="pm-select" value={form.taxRegime} onChange={(event) => setForm((current) => ({ ...current, taxRegime: event.target.value }))}>
            <option value="new">New Regime</option>
            <option value="old">Old Regime</option>
          </select>
        </section>
      </div>

      <section className="pm-card space-y-4">
        <h3 className="text-xl font-semibold">Notifications</h3>
        {[
          ["taxReminders", "Tax reminders"],
          ["invoiceAlerts", "Invoice alerts"],
          ["monthlyReports", "Monthly reports"],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3">
            <span>{label}</span>
            <input type="checkbox" checked={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.checked }))} />
          </label>
        ))}
      </section>

      <section className="pm-card space-y-4">
        <h3 className="text-xl font-semibold">Theme Preference</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`rounded-xl border p-4 text-left transition ${
              isDark ? "border-[var(--primary)] bg-sky-500/10" : "border-[var(--border)] bg-[var(--bg-elevated)]"
            }`}
          >
            <div className="text-lg font-semibold">Dark Mode</div>
            <div className="mt-1 text-sm text-[var(--text-secondary)]">Best for low-light focus and reduced eye strain.</div>
          </button>
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`rounded-xl border p-4 text-left transition ${
              !isDark ? "border-[var(--primary)] bg-sky-500/10" : "border-[var(--border)] bg-[var(--bg-elevated)]"
            }`}
          >
            <div className="text-lg font-semibold">Light Mode</div>
            <div className="mt-1 text-sm text-[var(--text-secondary)]">Clean high-contrast layout for daytime work.</div>
          </button>
        </div>
      </section>

      <button className="pm-button pm-button-primary" onClick={handleSave}>
        Save Changes
      </button>
    </div>
  );
}

export default Settings;
