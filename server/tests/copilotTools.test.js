import { describe, it, expect } from "vitest";
const { FINANCIAL_TOOLS } = require("../tools/financialToolsRegistry");

describe("Copilot Financial Tools Registry", () => {
  it("should define exactly 20 deterministic financial tools", () => {
    expect(FINANCIAL_TOOLS).toHaveLength(20);
  });

  it("every tool should have a valid function definition, name, description, and execute handler", () => {
    FINANCIAL_TOOLS.forEach((tool) => {
      expect(tool.type).toBe("function");
      expect(tool.function.name).toBeDefined();
      expect(tool.function.description).toBeDefined();
      expect(typeof tool.execute).toBe("function");
      expect(tool.function.parameters.type).toBe("object");
    });
  });

  it("should contain essential required tools", () => {
    const names = FINANCIAL_TOOLS.map((t) => t.function.name);
    expect(names).toContain("get_financial_summary");
    expect(names).toContain("get_cashflow_forecast");
    expect(names).toContain("get_tax_estimate");
    expect(names).toContain("get_tax_reserve");
    expect(names).toContain("get_financial_health");
    expect(names).toContain("get_net_worth");
    expect(names).toContain("get_debt_summary");
    expect(names).toContain("detect_anomalies");
    expect(names).toContain("get_subscription_summary");
    expect(names).toContain("get_client_payment_reliability");
    expect(names).toContain("simulate_financial_scenario");
    expect(names).toContain("get_client_profitability");
  });
});
