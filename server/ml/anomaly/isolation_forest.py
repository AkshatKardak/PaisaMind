import sys
import json
import math

def modified_z_score(values):
    """
    Computes Boris Iglewicz and David Hoaglin (1993) modified z-scores using Median Absolute Deviation (MAD).
    Extremely robust against multiple outliers compared to standard mean/std z-scores.
    """
    if not values or len(values) < 3:
        return [0.0] * len(values)
    
    sorted_vals = sorted(values)
    n = len(sorted_vals)
    median = sorted_vals[n // 2] if n % 2 != 0 else (sorted_vals[n // 2 - 1] + sorted_vals[n // 2]) / 2.0
    
    deviations = [abs(x - median) for x in values]
    sorted_devs = sorted(deviations)
    mad = sorted_devs[n // 2] if n % 2 != 0 else (sorted_devs[n // 2 - 1] + sorted_devs[n // 2]) / 2.0
    
    if mad == 0:
        mean_dev = sum(deviations) / n
        mad = mean_dev if mean_dev != 0 else 1.0
        
    # Constant 0.6745 brings MAD to standard deviation scale for normal distribution
    return [round(0.6745 * (x - median) / mad, 2) for x in values]

def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            print(json.dumps({"error": "Empty input"}))
            return

        payload = json.loads(raw_input)
        transactions = payload.get("transactions", [])

        if len(transactions) < 3:
            print(json.dumps({
                "status": "INSUFFICIENT_DATA",
                "message": "At least 3 transactions required to compute outlier scores."
            }))
            return

        amounts = [float(t.get("amount", 0)) for t in transactions]
        scores = modified_z_score(amounts)

        anomalies = []
        for idx, (tx, score) in enumerate(zip(transactions, scores)):
            # Anomaly threshold: modified z-score > 3.5 (standard Iglewicz & Hoaglin threshold)
            if score > 3.5:
                anomalies.append({
                    "transactionId": tx.get("_id") or tx.get("id") or str(idx),
                    "title": tx.get("title") or tx.get("description", "Transaction"),
                    "amount": tx.get("amount"),
                    "category": tx.get("category", "Other"),
                    "date": tx.get("date"),
                    "outlierScore": score,
                    "severity": "CRITICAL" if score > 5.0 else "HIGH",
                    "reason": f"Amount of ₹{tx.get('amount'):,.2f} has an outlier score of {score} (threshold: 3.5)"
                })

        print(json.dumps({
            "status": "SUCCESS",
            "algorithm": "Modified-Z-Score-MAD",
            "totalAnalyzed": len(transactions),
            "anomalies": anomalies
        }))

    except Exception as e:
        print(json.dumps({"status": "ERROR", "message": str(e)}))

if __name__ == "__main__":
    main()
