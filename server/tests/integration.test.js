import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
const request = require("supertest");
const mongoose = require("mongoose");
let app = null;
const admin = require("../config/firebaseAdmin");
const User = require("../models/User");
const StatementImport = require("../models/StatementImport");
const Income = require("../models/Income");
const Expense = require("../models/Expense");

describe("Integration Flow: Register -> Statement Import -> Dashboard Summary", () => {
  let isDbConnected = false;
  let testUserId = null;
  let testImportId = null;
  const testFirebaseUid = "integration-test-user-uid-" + Date.now();
  const testEmail = `integration-${Date.now()}@paisamind.com`;

  beforeAll(async () => {
    const mongoUri = process.env.TEST_MONGO_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.warn("[Integration Test] Skipped: No MONGO_URI configured.");
      return;
    }
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
      isDbConnected = true;
      process.env.NODE_ENV = "test";
      app = require("../index");
    } catch (err) {
      console.warn(`[Integration Test] Skipped: MongoDB connection failed (${err.message}).`);
      try {
        await mongoose.disconnect();
      } catch (_) {}
      return;
    }

    if (admin && admin.auth) {
      vi.spyOn(admin.auth(), "verifyIdToken").mockImplementation(async (token) => {
        if (token === "valid-integration-token") {
          return {
            uid: testFirebaseUid,
            email: testEmail,
            name: "Integration Test User",
            picture: "",
          };
        }
        throw new Error("Invalid mock token");
      });
    }
  });

  afterAll(async () => {
    if (isDbConnected) {
      try {
        if (testUserId) {
          await Promise.all([
            User.deleteOne({ _id: testUserId }),
            StatementImport.deleteMany({ userId: testUserId }),
            Income.deleteMany({ userId: testUserId }),
            Expense.deleteMany({ userId: testUserId }),
          ]);
        }
        await mongoose.disconnect();
      } catch (_) {}
    }
    vi.restoreAllMocks();
  });

  it("1. registers or syncs a new user via POST /api/auth/firebase-sync", async (ctx) => {
    if (!isDbConnected) {
      ctx.skip();
      return;
    }

    const res = await request(app)
      .post("/api/auth/firebase-sync")
      .set("Authorization", "Bearer valid-integration-token")
      .send({
        uid: testFirebaseUid,
        email: testEmail,
        name: "Integration Test User",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.email).toBe(testEmail);
    testUserId = res.body.data._id;
  });

  it("2. uploads and parses a statement via POST /api/statements/upload, then commits transactions", async (ctx) => {
    if (!isDbConnected) {
      ctx.skip();
      return;
    }

    const sampleCsvContent = `Date,Description,Debit,Credit,Balance
2026-11-05,Client Web Development Payment,0,75000,75000
2026-11-08,Adobe Creative Cloud Subscription,5000,0,70000`;

    const uploadRes = await request(app)
      .post("/api/statements/upload")
      .set("Authorization", "Bearer valid-integration-token")
      .attach("statement", Buffer.from(sampleCsvContent, "utf-8"), "sample-statement.csv");

    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body.success).toBe(true);
    expect(uploadRes.body.data.transactions).toHaveLength(2);
    testImportId = uploadRes.body.data.importId;

    const commitRes = await request(app)
      .post("/api/statements/commit")
      .set("Authorization", "Bearer valid-integration-token")
      .send({
        importId: testImportId,
        selectedIndices: [0, 1],
      });

    expect(commitRes.status).toBe(200);
    expect(commitRes.body.success).toBe(true);
    expect(commitRes.body.data.incomesCreated).toBe(1);
    expect(commitRes.body.data.expensesCreated).toBe(1);
  });

  it("3. retrieves updated financial dashboard summary via GET /api/analytics/financial-summary", async (ctx) => {
    if (!isDbConnected) {
      ctx.skip();
      return;
    }

    const summaryRes = await request(app)
      .get("/api/analytics/financial-summary?month=11&year=2026")
      .set("Authorization", "Bearer valid-integration-token");

    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.success).toBe(true);
    expect(summaryRes.body.data.totalIncome).toBe(75000);
    expect(summaryRes.body.data.totalExpense).toBe(5000);
    expect(summaryRes.body.data.netSavings).toBe(70000);
  });
});
