import { ArrowRight, Globe } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { showToast } from "../components/ui/Toast";

const FloatingCard = ({ title, value, className }) => (
  <div className={`pm-card ${className}`}>
    <div className="text-sm text-[var(--text-secondary)]">{title}</div>
    <div className="mt-2 text-2xl font-bold">{value}</div>
  </div>
);

function Login() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await auth.login(form);
      showToast({ type: "success", title: "Welcome back", message: "Your PaisaMind workspace is ready." });
      navigate("/dashboard");
    } catch (error) {
      showToast({
        type: "error",
        title: "Login failed",
        message: error.response?.data?.message || "Please check your credentials and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[var(--bg-primary)] md:grid-cols-2">
      <section className="relative hidden overflow-hidden px-10 py-14 md:flex md:flex-col md:justify-between">
        <div>
          <div className="font-display text-4xl font-bold">PaisaMind</div>
          <p className="mt-4 max-w-lg text-lg leading-8 text-[var(--text-secondary)]">
            Stay on top of cash flow, taxes, subscriptions, and client payments with one calm financial dashboard.
          </p>
        </div>
        <div className="relative h-[360px]">
          <FloatingCard title="Monthly Cash In" value="Rs. 1,82,000" className="float-slow absolute left-4 top-8 w-64" />
          <FloatingCard title="Tax Cushion" value="Rs. 28,400" className="float-mid absolute right-8 top-24 w-56" />
          <FloatingCard title="Health Score" value="84 / A" className="float-fast absolute bottom-10 left-24 w-60" />
        </div>
        <div className="text-sm text-[var(--text-muted)]">Built for freelancers, consultants, and solo founders in India.</div>
      </section>

      <section className="flex items-center justify-center px-4 py-10">
        <div className="pm-card w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="font-display text-3xl font-bold">PaisaMind</div>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">Sign in to your finance cockpit</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input className="pm-input" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
            <input className="pm-input" type="password" placeholder="Password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
            <button className="pm-button pm-button-primary flex w-full items-center justify-center gap-2" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">
            <div className="h-px flex-1 bg-[var(--border)]" />
            or
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <button
            type="button"
            className="pm-button pm-button-ghost flex w-full items-center justify-center gap-2"
            onClick={() =>
              showToast({
                type: "info",
                title: "Google OAuth placeholder",
                message: "UI is ready. Connect your Google auth flow when you add the provider.",
              })
            }
          >
            <Globe size={18} />
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            New here?{" "}
            <Link to="/register" className="font-semibold text-sky-400">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default Login;
