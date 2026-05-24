const statusStyles = {
  paid: "bg-emerald-500/20 text-emerald-400",
  unpaid: "bg-amber-500/20 text-amber-400",
  overdue: "bg-red-500/20 text-red-400",
};

function InvoiceStatusBadge({ status = "unpaid" }) {
  return (
    <span className={`pm-badge ${statusStyles[status] || statusStyles.unpaid}`}>
      {status}
    </span>
  );
}

export default InvoiceStatusBadge;
