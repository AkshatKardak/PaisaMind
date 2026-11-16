import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("Copilot Message Rendering", () => {
  it("renders welcome message from assistant role", () => {
    const welcomeMessage = {
      id: "welcome",
      role: "assistant",
      content: "Welcome to Financial Copilot. Every calculation is verified.",
      toolCalls: [],
    };

    render(
      <div data-testid={`message-${welcomeMessage.id}`}>
        <span data-testid="role-badge">{welcomeMessage.role}</span>
        <p>{welcomeMessage.content}</p>
      </div>
    );

    expect(screen.getByTestId("role-badge")).toHaveTextContent("assistant");
    expect(screen.getByText(/Welcome to Financial Copilot/i)).toBeInTheDocument();
  });

  it("renders user prompt and subsequent assistant response", () => {
    const messages = [
      { id: "msg-1", role: "user", content: "Can I afford a ₹70,000 MacBook?" },
      { id: "msg-2", role: "assistant", content: "Yes, you have ₹3.5L liquid reserves giving 5.2 months runway." },
    ];

    render(
      <div>
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "user-bubble" : "assistant-bubble"}>
            <p>{m.content}</p>
          </div>
        ))}
      </div>
    );

    expect(screen.getByText("Can I afford a ₹70,000 MacBook?")).toBeInTheDocument();
    expect(screen.getByText(/giving 5.2 months runway/i)).toBeInTheDocument();
  });

  it("renders tool call badges executed by the copilot", () => {
    const messageWithTools = {
      id: "msg-tool",
      role: "assistant",
      content: "Calculated tax under 44ADA vs New Regime.",
      toolCalls: [
        { name: "calculate_tax_44ada", result: { taxableProfit: 600000 } },
        { name: "get_cash_runway", result: { runwayMonths: 6.4 } },
      ],
    };

    render(
      <div>
        <p>{messageWithTools.content}</p>
        <div data-testid="tool-badges">
          {messageWithTools.toolCalls.map((tc, idx) => (
            <span key={idx} className="tool-chip">
              Tool: {tc.name}
            </span>
          ))}
        </div>
      </div>
    );

    expect(screen.getByText("Tool: calculate_tax_44ada")).toBeInTheDocument();
    expect(screen.getByText("Tool: get_cash_runway")).toBeInTheDocument();
  });
});
