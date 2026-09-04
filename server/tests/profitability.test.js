import { describe, it, expect } from "vitest";

describe("Client & Project Profitability Sentinel", () => {
  it("should calculate effective hourly rate and margin accurately", () => {
    const totalBilled = 120000;
    const directExpenses = 20000;
    const loggedHours = 40;
    const targetHourlyRate = 2500;

    const netProfit = totalBilled - directExpenses; // 100,000
    const margin = (netProfit / totalBilled) * 100; // 83.33%
    const realHourlyRate = netProfit / loggedHours; // 2500

    expect(netProfit).toBe(100000);
    expect(margin).toBeCloseTo(83.33, 1);
    expect(realHourlyRate).toBe(2500);
    expect(realHourlyRate >= targetHourlyRate).toBe(true);
  });

  it("should detect scope creep when logged hours drive hourly rate >30% below target", () => {
    const totalBilled = 50000;
    const directExpenses = 5000;
    const loggedHours = 45; // 45 hours on 50k project
    const targetHourlyRate = 2500;

    const netProfit = totalBilled - directExpenses; // 45,000
    const realHourlyRate = netProfit / loggedHours; // 1000/hr
    const rateRealization = (realHourlyRate / targetHourlyRate) * 100; // 40%

    const isScopeCreep = loggedHours >= 10 && realHourlyRate < targetHourlyRate * 0.70;
    expect(isScopeCreep).toBe(true);
    expect(rateRealization).toBe(40);
  });

  it("should classify high margin + fast paying clients as Tier A Star Clients", () => {
    const profitMargin = 85;
    const avgDelay = 3; // paid 3 days before/after due date
    const effectiveRate = 3200;
    const targetRate = 2500;

    const isTierA = profitMargin >= 70 && avgDelay <= 10 && effectiveRate >= targetRate * 0.9;
    expect(isTierA).toBe(true);
  });

  it("should classify clients with <40% margin or >30 day delays as Tier D Toxic", () => {
    const profitMargin = 28; // high subcontractor costs
    const avgDelay = 35; // chronic late payer

    const isTierD = profitMargin < 40 || avgDelay > 30;
    expect(isTierD).toBe(true);
  });
});
