import sys
import json
import math

def calculate_mae_rmse(actual, predicted):
    if not actual or len(actual) != len(predicted):
        return 0.0, 0.0
    n = len(actual)
    mae = sum(abs(a - p) for a, p in zip(actual, predicted)) / n
    rmse = math.sqrt(sum((a - p) ** 2 for a, p in zip(actual, predicted)) / n)
    return round(mae, 2), round(rmse, 2)

def holt_linear_trend(series, horizon=3, alpha=0.3, beta=0.1):
    if len(series) < 2:
        return [series[-1] if series else 0] * horizon
    
    # Initialize level and trend
    level = series[0]
    trend = series[1] - series[0]
    
    for val in series[1:]:
        last_level = level
        level = alpha * val + (1 - alpha) * (last_level + trend)
        trend = beta * (level - last_level) + (1 - beta) * trend
        
    forecasts = []
    for h in range(1, horizon + 1):
        forecasts.append(max(0.0, level + h * trend))
    return forecasts

def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            print(json.dumps({"error": "Empty input"}))
            return

        payload = json.loads(raw_input)
        history = payload.get("history", [])
        horizon = payload.get("horizon", 3)
        invoice_buckets = payload.get("invoiceBuckets", [0, 0, 0])

        if len(history) < 3:
            print(json.dumps({
                "status": "INSUFFICIENT_DATA",
                "minimumRequired": 3,
                "currentCount": len(history),
                "message": "At least 3 months of historical financial data required for ML forecasting."
            }))
            return

        incomes = [float(h.get("income", 0)) for h in history]
        expenses = [float(h.get("expense", 0)) for h in history]

        # 1. Backtest Holt Linear Trend on historical data (one-step ahead)
        backtest_preds_inc = []
        backtest_actuals_inc = incomes[2:]
        for i in range(2, len(incomes)):
            pred = holt_linear_trend(incomes[:i], horizon=1)[0]
            backtest_preds_inc.append(pred)

        mae_inc, rmse_inc = calculate_mae_rmse(backtest_actuals_inc, backtest_preds_inc)

        # 2. Out-of-sample Forecast
        forecast_inc = holt_linear_trend(incomes, horizon=horizon)
        forecast_exp = holt_linear_trend(expenses, horizon=horizon)

        # Standard deviation for confidence intervals
        variance_inc = sum((x - (sum(incomes)/len(incomes)))**2 for x in incomes) / max(1, len(incomes) - 1)
        std_inc = math.sqrt(variance_inc)

        variance_exp = sum((x - (sum(expenses)/len(expenses)))**2 for x in expenses) / max(1, len(expenses) - 1)
        std_exp = math.sqrt(variance_exp)

        forecast_results = []
        cumulative_cash = 0

        for idx in range(horizon):
            pred_inc = round(forecast_inc[idx] + (invoice_buckets[idx] if idx < len(invoice_buckets) else 0))
            pred_exp = round(forecast_exp[idx])
            net = pred_inc - pred_exp
            cumulative_cash += net

            # 95% Confidence Intervals (Z = 1.96)
            err_inc = round(1.96 * max(std_inc, pred_inc * 0.1) * math.sqrt(1 + 0.15 * (idx + 1)))
            err_exp = round(1.96 * max(std_exp, pred_exp * 0.1) * math.sqrt(1 + 0.1 * (idx + 1)))

            forecast_results.append({
                "periodIndex": idx + 1,
                "predictedIncome": pred_inc,
                "predictedExpense": pred_exp,
                "netCashFlow": net,
                "cumulativeCashFlow": cumulative_cash,
                "lowerBoundIncome": max(0, pred_inc - err_inc),
                "upperBoundIncome": pred_inc + err_inc,
                "lowerBoundNet": net - (err_inc + err_exp),
                "upperBoundNet": net + (err_inc + err_exp),
                "invoiceContribution": round(invoice_buckets[idx] if idx < len(invoice_buckets) else 0)
            })

        output = {
            "status": "SUCCESS",
            "modelName": "Holt-Linear-Trend-v1",
            "backtestMetrics": {
                "mae": mae_inc,
                "rmse": rmse_inc,
                "dataPointsUsed": len(history)
            },
            "forecast": forecast_results
        }
        print(json.dumps(output))

    except Exception as e:
        print(json.dumps({"status": "ERROR", "message": str(e)}))

if __name__ == "__main__":
    main()
