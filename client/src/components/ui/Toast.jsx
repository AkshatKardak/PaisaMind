import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  error: "border-red-500/40 bg-red-500/10 text-red-300",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  info: "border-sky-500/40 bg-sky-500/10 text-sky-300",
};

export const showToast = ({ type = "info", title, message }) => {
  window.dispatchEvent(
    new CustomEvent("paisamind-toast", {
      detail: {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        type,
        title,
        message,
      },
    })
  );
};

function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (event) => {
      const nextToast = event.detail;
      setToasts((current) => [...current, nextToast]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== nextToast.id));
      }, 3000);
    };

    window.addEventListener("paisamind-toast", handler);
    return () => window.removeEventListener("paisamind-toast", handler);
  }, []);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[90] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3">
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || icons.info;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur ${styles[toast.type] || styles.info}`}
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            }}
          >
            <Icon size={18} className="mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-[var(--text-primary)]">{toast.title}</div>
              {toast.message ? <div className="mt-1 text-sm text-[var(--text-secondary)]">{toast.message}</div> : null}
            </div>
            <button
              type="button"
              onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default Toast;
