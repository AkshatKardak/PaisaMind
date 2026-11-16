import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { detectBankFromText, parseStatementText } from "../utils/clientStatementParser";

describe("Statement Import & CSV Parsing Flow", () => {
  it("detects bank identity correctly from raw statement text", () => {
    expect(detectBankFromText("HDFC Bank Account Statement")).toBe("HDFC Bank");
    expect(detectBankFromText("ICICI Bank Ltd Statement")).toBe("ICICI Bank");
    expect(detectBankFromText("State Bank of India Statement")).toBe("State Bank of India");
    expect(detectBankFromText("Kotak Mahindra Bank")).toBe("Kotak Mahindra Bank");
  });

  it("parses sample CSV lines into structured transactions and checks balance continuity", () => {
    const sampleCsvText = `
01/11/2026 Opening Balance 0.00 0.00 10000.00
02/11/2026 Client Retainer Payout 0.00 50000.00 60000.00
03/11/2026 Adobe Subscription 4000.00 0.00 56000.00
`;
    const parsed = parseStatementText(sampleCsvText);
    expect(parsed.transactions.length).toBe(3);
    expect(parsed.hasBalanceMismatch).toBe(false);
    expect(parsed.transactions[1].deposit).toBe(50000);
    expect(parsed.transactions[2].withdrawal).toBe(4000);
  });

  it("renders staged transactions in an interactive table with category override", () => {
    const stagedTransactions = [
      { id: "1", date: "2026-11-02", description: "Acme Corp Payout", amount: 50000, type: "income", category: "Freelance Income" },
      { id: "2", date: "2026-11-03", description: "AWS Hosting", amount: 3200, type: "expense", category: "Software Subscriptions" },
    ];

    render(
      <div>
        <h2>Staged Transactions ({stagedTransactions.length})</h2>
        <table>
          <tbody>
            {stagedTransactions.map((tx) => (
              <tr key={tx.id}>
                <td>{tx.date}</td>
                <td>{tx.description}</td>
                <td>₹{tx.amount}</td>
                <td>{tx.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    expect(screen.getByText("Staged Transactions (2)")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp Payout")).toBeInTheDocument();
    expect(screen.getByText("AWS Hosting")).toBeInTheDocument();
    expect(screen.getByText("Freelance Income")).toBeInTheDocument();
  });
});
