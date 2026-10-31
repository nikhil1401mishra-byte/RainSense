# RainSense — HTML/CSS/JavaScript + Your Saved ML Model

This project uses the frontend you uploaded and integrates the existing `best_rain_logistic_regression.joblib` bundle through FastAPI.

## Architecture

- `frontend/`: the original HTML, CSS and Vanilla JavaScript dashboard.
- `backend/main.py`: FastAPI service that loads your fitted model and preprocessor.
- `best_rain_logistic_regression.joblib`: saved Logistic Regression bundle.
- `/api/model-info`: reads the actual trained feature names and category options from the fitted preprocessor.
- `/api/predict`: validates inputs, builds the model DataFrame in the exact saved feature order, applies the saved preprocessor and calls `predict_proba()`.
- The FastAPI server also serves the frontend, so browser requests use same-origin `/api/...` paths (no hardcoded `localhost` in browser JavaScript and no CORS setup needed).

## Important model compatibility

The bundled model was saved with scikit-learn **1.6.1**. The requirements pin that exact version. Do not upgrade scikit-learn without re-saving/revalidating the model bundle. Only load joblib files you trust because pickle-based model files can execute code when loaded.

## Run on Windows

1. Extract the ZIP.
2. Install Python 3.11 (recommended). The saved model uses scikit-learn 1.6.1; use the pinned dependency environment rather than a newer scikit-learn release.
3. Double-click `start.bat`, or run:

```powershell
py -3.11 -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Or double-click `start.bat` to create/use the Python 3.11 environment automatically.

Open **http://127.0.0.1:8000**. Do not open `frontend/index.html` directly with `file://`; the ML API needs the FastAPI server.

## Run on macOS / Linux

```bash
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Or run `./start.sh`.

Open **http://127.0.0.1:8000**.

## Verify model integration

- Health: http://127.0.0.1:8000/api/health
- Model schema/categories: http://127.0.0.1:8000/api/model-info
- API docs: http://127.0.0.1:8000/docs

A successful `/api/health` response includes `"model_loaded": true`. The ML Prediction Lab will show a green connected status when it successfully reads `/api/model-info`.

## Actual prediction request schema

The frontend maps the form into the original trained feature names:

```json
{
  "month": 10,
  "year": 2026,
  "season": "Post-monsoon",
  "state": "Rajasthan",
  "district": "Jaipur",
  "station_name": "Sanganer",
  "avg_temp": 25.0,
  "min_temp": 20.0,
  "max_temp": 30.0,
  "wind_speed": 9.0,
  "air_pressure": 1009.0,
  "elevation": 431,
  "latitude": 26.9124,
  "longitude": 75.7873
}
```

Model-specific category values are read from the fitted OneHotEncoder and populated into the frontend selects/suggestions. Missing optional feature values are passed as missing values so the saved fitted imputer can handle them. Required weather measurements are validated server-side.

## Notes

- RainSense's Open-Meteo weather dashboard remains a weather forecast feature. The joblib model output is a separate ML classification estimate; it is not the same thing as Open-Meteo's forecast probability.
- Prediction response includes the saved model threshold, class-1 rain probability, class decision, confidence band, and stored test accuracy when that metadata is available.
- No predictions are fabricated in the browser. If the backend or model is unavailable, the UI displays the actual error and no fake result.
