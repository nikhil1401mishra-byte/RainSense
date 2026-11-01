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

## Deploy to Vercel (Frontend + FastAPI + Joblib model)

This repository is configured for a **single Vercel deployment**. The root `app.py` exports the FastAPI app from `backend/main.py`; that app serves the HTML/CSS/JS frontend and the `/api/*` ML endpoints on the same domain. The browser uses same-origin API paths, so no separate backend URL or CORS configuration is required.

### Before importing into Vercel

1. Push the **contents of this project folder** to the root of your GitHub repository (so `app.py`, `requirements.txt`, `backend/`, `frontend/`, and the `.joblib` file are at repository root level).
2. Confirm `best_rain_logistic_regression.joblib` is committed. It is a small model bundle in this project; never commit `.venv/` or `__pycache__/`.
3. Keep `.python-version` set to `3.12`. The model dependencies are pinned, including `scikit-learn==1.6.1`.

### Deploy

1. Sign in to Vercel and choose **Add New → Project**.
2. Import the RainSense GitHub repository.
3. Set **Root Directory** to `./` if the project files are at repository root. If you committed them inside a subfolder, set Root Directory to that folder instead.
4. Let Vercel detect the Python/FastAPI app. Do not set a custom Build Command or Output Directory; the root `app.py` and `requirements.txt` are used by the Python runtime.
5. Deploy.

### Verify after deployment

Replace `YOUR_DOMAIN` with the URL assigned by Vercel:

- `https://YOUR_DOMAIN/` — RainSense frontend
- `https://YOUR_DOMAIN/api/health` — model health; expect `"model_loaded": true`
- `https://YOUR_DOMAIN/api/model-info` — loaded model feature schema
- `https://YOUR_DOMAIN/docs` — FastAPI interactive API documentation

If `/` loads but `/api/health` reports `model_loaded: false`, open the Vercel deployment logs and check the model-loading error. The application deliberately reports a degraded model status rather than fabricating predictions.

### Notes

- Vercel's Python runtime is currently documented as Beta and supports Python 3.12, 3.13, and 3.14; this project pins 3.12 for a stable model dependency environment.
- FastAPI serves `frontend/` through `StaticFiles` and serves prediction endpoints through the same-origin `/api/` routes.
- The saved `.joblib` file is a pickle-based artifact. Only deploy a model file you trust.
- Local development remains available using the `start.bat` / `start.sh` scripts or the Uvicorn command documented above.
