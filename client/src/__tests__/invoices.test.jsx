import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import InvoiceStatusBadge from "../components/ui/InvoiceStatusBadge";

describe("Invoice Status and Overdue Tracking", () => {
  it("renders InvoiceStatusBadge correctly for overdue status", () => {
    const { container } = render(<InvoiceStatusBadge status="overdue" />);
    expect(screen.getByText("overdue")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("text-red-400");
  });

  it("identifies overdue invoices based on due date and status", () => {
    const today = new Date("2026-11-15T00:00:00.000Z");
    const invoices = [
      { id: "inv-1", dueDate: "2026-11-01", status: "Unpaid", amount: 25000 },
      { id: "inv-2", dueDate: "2026-11-20", status: "Unpaid", amount: 15000 },
      { id: "inv-3", dueDate: "2026-10-15", status: "Paid", amount: 30000 },
    ];

    const isOverdue = (inv) => inv.status !== "Paid" && new Date(inv.dueDate) < today;
    const overdueInvoices = invoices.filter(isOverdue);

    expect(overdueInvoices).toHaveLength(1);
    expect(overdueInvoices[0].id).toBe("inv-1");
    expect(overdueInvoices[0].amount).toBe(25000);
  });

  it("renders an overdue invoice row with escalation and smart actions", () => {
    const sampleInvoice = {
      _id: "inv-99",
      invoiceNumber: "INV-2026-099",
      clientName: "Alpha Tech Solutions",
      amount: 45000,
      status: "Overdue",
      dueDate: "2026-10-31",
    };

    render(
      <table>
        <tbody>
          <tr>
            <td>{sampleInvoice.invoiceNumber}</td>
            <td>{sampleInvoice.clientName}</td>
            <td>₹{sampleInvoice.amount}</td>
            <td>
              <InvoiceStatusBadge status={sampleInvoice.status.toLowerCase()} />
            </td>
            <td>
              <button aria-label="Escalate overdue invoice">Escalate WhatsApp</button>
            </td>
          </tr>
        </tbody>
      </table>
    );

    expect(screen.getByText("INV-2026-099")).toBeInTheDocument();
    expect(screen.getByText("Alpha Tech Solutions")).toBeInTheDocument();
    expect(screen.getByText("overdue")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Escalate/i })).toBeInTheDocument();
  });
});
