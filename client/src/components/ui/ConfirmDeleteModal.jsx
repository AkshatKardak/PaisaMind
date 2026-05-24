import { AlertTriangle } from "lucide-react";

function ConfirmDeleteModal({ open, itemName, onClose, onConfirm }) {
  if (!open) return null;

  return (
    <div className="pm-modal-overlay flex items-end justify-center md:items-center">
      <div className="pm-modal-card">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
          <AlertTriangle size={26} />
        </div>
        <h3 className="mb-2 text-2xl font-bold">Delete {itemName}?</h3>
        <p className="mb-8 text-sm leading-6 text-[var(--text-secondary)]">
          This action cannot be undone. PaisaMind will permanently remove this record from your workspace.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="pm-button pm-button-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="pm-button pm-button-danger" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteModal;
