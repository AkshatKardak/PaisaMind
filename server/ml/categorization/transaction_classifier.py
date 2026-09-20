import sys
import json
import re

def tokenize(text):
    clean = re.sub(r'[^a-zA-Z0-9\s]', ' ', (text or '').lower())
    return [w for w in clean.split() if len(w) > 2]

def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            print(json.dumps({"error": "Empty input"}))
            return

        payload = json.loads(raw_input)
        description = payload.get("description", "")
        dictionary = payload.get("dictionary", [])

        tokens = set(tokenize(description))
        best_match = None
        highest_score = 0.0

        for item in dictionary:
            cat = item.get("category")
            keywords = item.get("keywords", [])
            matches = sum(1 for kw in keywords if any(kw in token or token in kw for token in tokens))
            if matches > 0:
                score = matches / (len(tokens) + 1)
                if score > highest_score:
                    highest_score = score
                    best_match = cat

        if best_match and highest_score >= 0.2:
            print(json.dumps({
                "status": "SUCCESS",
                "category": best_match,
                "confidence": min(0.98, round(0.70 + highest_score * 0.3, 2)),
                "source": "ml_token_classifier"
            }))
        else:
            print(json.dumps({
                "status": "FALLBACK",
                "category": "Other",
                "confidence": 0.40,
                "source": "ml_fallback"
            }))

    except Exception as e:
        print(json.dumps({"status": "ERROR", "message": str(e)}))

if __name__ == "__main__":
    main()
