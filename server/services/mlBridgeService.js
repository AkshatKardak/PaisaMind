const { spawn } = require("child_process");
const path = require("path");

/**
 * Executes a Python script with JSON input via stdin and captures JSON output
 */
const runPythonWorker = (scriptRelativePath, inputPayload, timeoutMs = 4000) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "..", "ml", scriptRelativePath);
    let resolved = false;

    try {
      const py = spawn("python", [scriptPath], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdoutData = "";
      let stderrData = "";

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          py.kill();
          reject(new Error(`Python worker timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      py.stdout.on("data", (chunk) => {
        stdoutData += chunk.toString();
      });

      py.stderr.on("data", (chunk) => {
        stderrData += chunk.toString();
      });

      py.on("close", (code) => {
        clearTimeout(timer);
        if (resolved) return;
        resolved = true;

        if (code !== 0) {
          return reject(new Error(`Python worker exited with code ${code}: ${stderrData}`));
        }

        try {
          const parsed = JSON.parse(stdoutData.trim());
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Failed to parse Python worker JSON: ${stdoutData}`));
        }
      });

      py.on("error", (err) => {
        clearTimeout(timer);
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      });

      // Write payload to stdin and close
      py.stdin.write(JSON.stringify(inputPayload));
      py.stdin.end();
    } catch (err) {
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    }
  });
};

// ─── PURE NODE.JS STATISTICAL FALLBACKS ────────────────────────────────────────

/**
 * Holt's Linear Trend (Double Exponential Smoothing) in Node.js
 */
const holtLinearTrendNode = (series = [], horizon = 3, alpha = 0.3, beta = 0.1) => {
  if (series.length < 2) return Array(horizon).fill(series[series.length - 1] || 0);

  let level = series[0];
  let trend = series[1] - series[0];

  for (let i = 1; i < series.length; i++) {
    const val = series[i];
    const lastLevel = level;
    level = alpha * val + (1 - alpha) * (lastLevel + trend);
    trend = beta * (level - lastLevel) + (1 - beta) * trend;
  }

  const forecasts = [];
  for (let h = 1; h <= horizon; h++) {
    forecasts.push(Math.max(0, level + h * trend));
  }
  return forecasts;
};

/**
 * Computes MAE, RMSE, and MAPE on rolling backtest
 */
const calculateMetrics = (actuals = [], preds = []) => {
  if (actuals.length === 0 || actuals.length !== preds.length) return { mae: 0, rmse: 0, mape: 0 };
  const n = actuals.length;
  const mae = actuals.reduce((sum, a, i) => sum + Math.abs(a - preds[i]), 0) / n;
  const rmse = Math.sqrt(actuals.reduce((sum, a, i) => sum + Math.pow(a - preds[i], 2), 0) / n);
  const nonZeroActuals = actuals.filter((a) => a > 0);
  const mape = nonZeroActuals.length > 0
    ? (actuals.reduce((sum, a, i) => (a > 0 ? sum + (Math.abs(a - preds[i]) / a) : sum), 0) / nonZeroActuals.length) * 100
    : 0;

  return {
    mae: Math.round(mae * 100) / 100,
    rmse: Math.round(rmse * 100) / 100,
    mape: Math.round(mape * 100) / 100,
  };
};

/**
 * Median Absolute Deviation (MAD) Modified Z-Score in Node.js
 */
const modifiedZScoreNode = (values = []) => {
  if (!values || values.length < 3) return Array(values.length).fill(0);
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const median = n % 2 !== 0 ? sorted[Math.floor(n / 2)] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;

  const deviations = values.map((x) => Math.abs(x - median));
  const sortedDevs = [...deviations].sort((a, b) => a - b);
  let mad = n % 2 !== 0 ? sortedDevs[Math.floor(n / 2)] : (sortedDevs[n / 2 - 1] + sortedDevs[n / 2]) / 2;

  if (mad === 0) {
    const meanDev = deviations.reduce((s, d) => s + d, 0) / n;
    mad = meanDev !== 0 ? meanDev : 1.0;
  }

  return values.map((x) => Number(((0.6745 * (x - median)) / mad).toFixed(2)));
};

// ─── PUBLIC ML BRIDGE API ─────────────────────────────────────────────────────

/**
 * Forecast cash flow with rolling backtest evaluation
 */
const runForecasting = async (history = [], horizon = 3, invoiceBuckets = [0, 0, 0]) => {
  // Validate minimum data requirement (Zero fake data)
  if (!history || history.length < 3) {
    return {
      status: "INSUFFICIENT_DATA",
      minimumRequired: 3,
      currentCount: history ? history.length : 0,
      message: "At least 3 months of historical financial data required for statistical forecasting.",
      forecast: [],
    };
  }

  // 1. Attempt execution via Python ML worker
  try {
    const pyResult = await runPythonWorker(
      path.join("forecasting", "cash_flow_forecast.py"),
      { history, horizon, invoiceBuckets }
    );
    if (pyResult && pyResult.status === "SUCCESS") {
      return pyResult;
    }
  } catch (err) {
    // Graceful fallback to pure Node.js statistical engine
  }

  // 2. Pure Node.js Holt's Linear Trend Fallback
  const incomes = history.map((h) => Number(h.income || 0));
  const expenses = history.map((h) => Number(h.expense || 0));

  // Rolling backtest on income
  const backtestPreds = [];
  const backtestActuals = incomes.slice(2);
  for (let i = 2; i < incomes.length; i++) {
    const pred = holtLinearTrendNode(incomes.slice(0, i), 1)[0];
    backtestPreds.push(pred);
  }
  const { mae, rmse } = calculateMetrics(backtestActuals, backtestPreds);

  // Out-of-sample projections
  const forecastInc = holtLinearTrendNode(incomes, horizon);
  const forecastExp = holtLinearTrendNode(expenses, horizon);

  const meanInc = incomes.reduce((s, x) => s + x, 0) / incomes.length;
  const varianceInc = incomes.reduce((s, x) => s + Math.pow(x - meanInc, 2), 0) / Math.max(1, incomes.length - 1);
  const stdInc = Math.sqrt(varianceInc);

  const meanExp = expenses.reduce((s, x) => s + x, 0) / expenses.length;
  const varianceExp = expenses.reduce((s, x) => s + Math.pow(x - meanExp, 2), 0) / Math.max(1, expenses.length - 1);
  const stdExp = Math.sqrt(varianceExp);

  const forecastResults = [];
  let cumulativeCash = 0;

  for (let idx = 0; idx < horizon; idx++) {
    const bucket = invoiceBuckets[idx] || 0;
    const predInc = Math.round(forecastInc[idx] + bucket);
    const predExp = Math.round(forecastExp[idx]);
    const net = predInc - predExp;
    cumulativeCash += net;

    const errInc = Math.round(1.96 * Math.max(stdInc, predInc * 0.1) * Math.sqrt(1 + 0.15 * (idx + 1)));
    const errExp = Math.round(1.96 * Math.max(stdExp, predExp * 0.1) * Math.sqrt(1 + 0.1 * (idx + 1)));

    forecastResults.push({
      periodIndex: idx + 1,
      predictedIncome: predInc,
      predictedExpense: predExp,
      netCashFlow: net,
      cumulativeCashFlow: cumulativeCash,
      lowerBoundIncome: Math.max(0, predInc - errInc),
      upperBoundIncome: predInc + errInc,
      lowerBoundNet: net - (errInc + errExp),
      upperBoundNet: net + (errInc + errExp),
      invoiceContribution: Math.round(bucket),
    });
  }

  return {
    status: "SUCCESS",
    modelName: "Node-Holt-Linear-Trend-v1",
    backtestMetrics: {
      mae,
      rmse,
      mape,
      dataPointsUsed: history.length,
    },
    forecast: forecastResults,
  };
};

/**
 * Detect spending anomalies using Modified Z-Score / MAD
 */
const detectAnomalies = async (transactions = []) => {
  if (!transactions || transactions.length < 3) {
    return {
      status: "INSUFFICIENT_DATA",
      message: "At least 3 transactions required to compute outlier scores.",
      anomalies: [],
    };
  }

  // 1. Attempt execution via Python worker
  try {
    const pyResult = await runPythonWorker(
      path.join("anomaly", "isolation_forest.py"),
      { transactions }
    );
    if (pyResult && pyResult.status === "SUCCESS") {
      return pyResult;
    }
  } catch (err) {
    // Fallback to pure Node.js MAD
  }

  // 2. Pure Node.js Modified Z-Score Fallback
  const amounts = transactions.map((t) => Number(t.amount || 0));
  const scores = modifiedZScoreNode(amounts);

  const anomalies = [];
  transactions.forEach((tx, idx) => {
    const score = scores[idx];
    if (score > 3.5) {
      anomalies.append || anomalies.push({
        transactionId: tx._id || tx.id || String(idx),
        title: tx.title || tx.description || "Transaction",
        amount: tx.amount,
        category: tx.category || "Other",
        date: tx.date,
        outlierScore: score,
        severity: score > 5.0 ? "CRITICAL" : "HIGH",
        reason: `Amount of ₹${Number(tx.amount).toLocaleString("en-IN")} has a modified z-score of ${score} (MAD threshold: 3.5)`,
      });
    }
  });

  return {
    status: "SUCCESS",
    algorithm: "Node-Modified-Z-Score-MAD",
    totalAnalyzed: transactions.length,
    anomalies,
  };
};

module.exports = {
  runForecasting,
  detectAnomalies,
  holtLinearTrendNode,
  modifiedZScoreNode,
};
