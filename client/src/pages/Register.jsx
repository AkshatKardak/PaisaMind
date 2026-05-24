import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { showToast } from "../components/ui/Toast";

function Register() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      showToast({ type: "warning", title: "Passwords do not match" });
      return;
    }

    setLoading(true);

    try {
      await auth.register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      showToast({ type: "success", title: "Account created", message: "Welcome to PaisaMind." });
      navigate("/dashboard");
    } catch (error) {
      showToast({
        type: "error",
        title: "Could not create account",
        message: error.response?.data?.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[var(--bg-primary)] md:grid-cols-2">
      <section className="hidden overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.2),_transparent_32%),linear-gradient(180deg,#0b0f1a,#081220)] px-10 py-14 md:flex md:flex-col md:justify-between">
        <div>
          <div className="font-display text-4xl font-bold">Build financial calm</div>
          <p className="mt-4 max-w-lg text-lg leading-8 text-[var(--text-secondary)]">
            Track income, plug expense leaks, compare tax regimes, and collect payments faster.
          </p>
        </div>
        <div className="grid gap-4">
          <div className="pm-card float-slow max-w-xs">Overdue invoices now trigger reminders automatically.</div>
          <div className="pm-card float-mid ml-20 max-w-sm">AI summaries surface the next best action instead of just dumping numbers.</div>
          <div className="pm-card float-fast ml-10 max-w-xs">Goal planning shows exactly how much to save per month.</div>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10">
        <div className="pm-card w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="font-display text-3xl font-bold">Create Account</div>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">Set up your PaisaMind workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input className="pm-input" placeholder="Full Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
            <input className="pm-input" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
            <input className="pm-input" type="password" placeholder="Password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
            <input className="pm-input" type="password" placeholder="Confirm Password" value={form.confirmPassword} onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))} required />
            <button className="pm-button pm-button-primary flex w-full items-center justify-center gap-2" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-sky-400">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default Register;
