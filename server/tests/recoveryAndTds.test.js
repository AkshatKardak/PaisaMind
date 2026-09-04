import { describe, it, expect } from "vitest";
import { generateUpiPayload, generateRecoveryDrafts } from "../services/recoveryDrafterService";

describe("Smart Invoice Recovery & TDS Engine", () => {
  describe("UPI QR Payload Generation", () => {
    it("should generate a valid UPI URL with VPA, amount, payee name, and invoice note", () => {
      const payload = generateUpiPayload({
        upiId: "akshat@okhdfcbank",
        payeeName: "Akshat Kardak",
        amount: 45000,
        invoiceNumber: "INV-042",
      });

      expect(payload).toContain("upi://pay?pa=akshat@okhdfcbank");
      expect(payload).toContain("am=45000.00");
      expect(payload).toContain("cu=INR");
      expect(payload).toContain("tn=Payment%20for%20Invoice%20INV-042");
    });

    it("should return empty string if no UPI ID is provided", () => {
      const payload = generateUpiPayload({ upiId: "" });
      expect(payload).toBe("");
    });
  });

  describe("3-Stage Contextual Recovery Drafts", () => {
    it("should generate Gentle Reminder for upcoming / freshly due invoices", () => {
      const now = new Date();
      const futureDue = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      const invoice = {
        invoiceNumber: "INV-101",
        clientName: "TechCorp India",
        clientPhone: "9876543210",
        amount: 80000,
        totalAmount: 80000,
        dueDate: futureDue,
        status: "Unpaid",
        upiId: "akshat@okhdfcbank",
      };

      const drafts = generateRecoveryDrafts({ invoice, user: { name: "Akshat Kardak" } });
      expect(drafts.activeRecommendedStage).toBe(1);
      expect(drafts.stages[0].emailSubject).toContain("Friendly Reminder");
      expect(drafts.stages[0].emailBody).toContain("₹80,000");
      expect(drafts.stages[0].whatsappUrl).toContain("wa.me/919876543210");
    });

    it("should generate Firm Overdue Notice for invoices 7 days overdue", () => {
      const now = new Date();
      const pastDue = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const invoice = {
        invoiceNumber: "INV-102",
        clientName: "Startup Hub",
        amount: 50000,
        totalAmount: 50000,
        dueDate: pastDue,
        status: "Overdue",
        upiId: "akshat@okhdfcbank",
      };

      const drafts = generateRecoveryDrafts({ invoice, user: { name: "Akshat" } });
      expect(drafts.activeRecommendedStage).toBe(2);
      expect(drafts.stages[1].emailSubject).toContain("overdue");
      expect(drafts.daysOverdue).toBeGreaterThanOrEqual(6);
    });

    it("should generate Formal Statutory Notice referencing MSMED Act for >14 days overdue", () => {
      const now = new Date();
      const longOverdue = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000);
      const invoice = {
        invoiceNumber: "INV-103",
        clientName: "Delinquent Client",
        amount: 120000,
        totalAmount: 120000,
        dueDate: longOverdue,
        status: "Overdue",
      };

      const drafts = generateRecoveryDrafts({ invoice, user: { name: "Akshat" } });
      expect(drafts.activeRecommendedStage).toBe(3);
      expect(drafts.stages[2].emailSubject).toContain("URGENT / FINAL NOTICE");
      expect(drafts.stages[2].emailBody).toContain("MSME Development Act");
    });
  });
});
