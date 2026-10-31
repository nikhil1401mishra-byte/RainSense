import json, urllib.request, sys
base = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"
for path in ("/api/health", "/api/model-info"):
    try:
        with urllib.request.urlopen(base + path, timeout=5) as response:
            data = json.load(response)
            print(path, json.dumps(data, indent=2)[:2500])
    except Exception as exc:
        print(path, "FAILED:", exc)
