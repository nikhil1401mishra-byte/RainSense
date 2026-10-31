"""RainSense API: serves the static HTML/CSS/JS app and the saved sklearn model."""
from __future__ import annotations

import math
import os
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
import sklearn
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = ROOT / "frontend"
MODEL_PATH = Path(os.getenv("RAIN_MODEL_PATH", str(ROOT / "best_rain_logistic_regression.joblib"))).expanduser()
TRAINED_SKLEARN_VERSION = "1.6.1"

app = FastAPI(
    title="RainSense ML API",
    version="1.0.0",
    description="RainSense weather frontend and Logistic Regression prediction service.",
)

MODEL_ERROR: str | None = None
BUNDLE: dict[str, Any] | None = None
MODEL: Any = None
PREPROCESSOR: Any = None
FEATURES: list[str] = []
NUMERIC_FEATURES: set[str] = set()
CATEGORICAL_FEATURES: set[str] = set()
CATEGORIES: dict[str, list[str]] = {}
MODES: dict[str, str] = {}
THRESHOLD = 0.5
OBSERVED_ACCURACY: float | None = None


def _column_list(cols: Any) -> list[str]:
    if isinstance(cols, str):
        return [cols]
    try:
        return [str(x) for x in list(cols)]
    except TypeError:
        return []


def load_model_bundle() -> None:
    """Load only the user's trusted model bundle, preserving its fitted preprocessor."""
    global MODEL_ERROR, BUNDLE, MODEL, PREPROCESSOR, FEATURES
    global NUMERIC_FEATURES, CATEGORICAL_FEATURES, CATEGORIES, MODES
    global THRESHOLD, OBSERVED_ACCURACY

    if not MODEL_PATH.is_file():
        MODEL_ERROR = f"Model file not found: {MODEL_PATH}"
        return
    if sklearn.__version__ != TRAINED_SKLEARN_VERSION:
        MODEL_ERROR = (
            f"This model was trained with scikit-learn {TRAINED_SKLEARN_VERSION}; "
            f"the active environment has {sklearn.__version__}. Install the pinned requirements."
        )
        return

    try:
        bundle = joblib.load(MODEL_PATH)
        if not isinstance(bundle, dict) or not {"model", "preprocessor"}.issubset(bundle):
            raise ValueError("Expected a bundle containing 'model' and 'preprocessor'.")
        pre = bundle["preprocessor"]
        model = bundle["model"]
        if not hasattr(pre, "feature_names_in_"):
            raise ValueError("Saved preprocessor has no feature_names_in_; cannot safely map frontend inputs.")

        features = [str(x) for x in pre.feature_names_in_]
        numeric: set[str] = set()
        categorical: set[str] = set()
        categories: dict[str, list[str]] = {}
        modes: dict[str, str] = {}

        for _name, transformer, cols in getattr(pre, "transformers_", []):
            cols = _column_list(cols)
            if _name == "remainder" and transformer == "drop":
                continue
            if _name == "num":
                numeric.update(cols)
            elif _name == "cat":
                categorical.update(cols)
            named_steps = getattr(transformer, "named_steps", {})
            encoder = named_steps.get("encoder")
            imputer = named_steps.get("imputer")
            if encoder is not None and hasattr(encoder, "categories_"):
                for col, vals in zip(cols, encoder.categories_):
                    categories[str(col)] = [str(v) for v in vals if not pd.isna(v)]
            if imputer is not None and getattr(imputer, "strategy", None) == "most_frequent":
                for col, val in zip(cols, getattr(imputer, "statistics_", [])):
                    if val is not None and not pd.isna(val):
                        modes[str(col)] = str(val)

        if not features:
            raise ValueError("The saved model has no input feature names.")
        if not hasattr(model, "predict_proba"):
            raise ValueError("Saved classifier does not expose predict_proba().")
        classes = [int(x) for x in getattr(model, "classes_", [])]
        if 1 not in classes:
            raise ValueError(f"Expected class 1 for Rain; model classes are {classes}.")

        BUNDLE = bundle
        MODEL = model
        PREPROCESSOR = pre
        FEATURES = features
        NUMERIC_FEATURES = numeric
        CATEGORICAL_FEATURES = categorical
        CATEGORIES = categories
        MODES = modes
        THRESHOLD = float(bundle.get("threshold", 0.5))
        raw_accuracy = bundle.get("observed_accuracy")
        OBSERVED_ACCURACY = float(raw_accuracy) if raw_accuracy is not None else None
        MODEL_ERROR = None
    except Exception as exc:  # keep API alive so /api/health can explain the issue
        MODEL_ERROR = f"Could not load model bundle: {type(exc).__name__}: {exc}"
        BUNDLE = MODEL = PREPROCESSOR = None
        FEATURES = []
        NUMERIC_FEATURES = set()
        CATEGORICAL_FEATURES = set()
        CATEGORIES = {}
        MODES = {}


load_model_bundle()


def require_model() -> None:
    if MODEL is None or PREPROCESSOR is None:
        raise HTTPException(status_code=503, detail=MODEL_ERROR or "ML model is not available.")


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok" if MODEL is not None else "degraded",
        "model_loaded": MODEL is not None,
        "model_name": "Logistic Regression" if MODEL is not None else None,
        "model_file": MODEL_PATH.name,
        "scikit_learn_version": sklearn.__version__,
        "expected_scikit_learn_version": TRAINED_SKLEARN_VERSION,
        "error": MODEL_ERROR,
    }


@app.get("/api/model-info")
def model_info() -> dict[str, Any]:
    require_model()
    return {
        "model_loaded": True,
        "model_name": "Logistic Regression",
        "features": FEATURES,
        "numeric_features": sorted(NUMERIC_FEATURES),
        "categorical_features": sorted(CATEGORICAL_FEATURES),
        "categories": CATEGORIES,
        "defaults": MODES,
        "threshold": THRESHOLD,
        "observed_accuracy": OBSERVED_ACCURACY,
        "scikit_learn_version": sklearn.__version__,
    }


@app.post("/api/predict")
def predict(payload: dict[str, Any]) -> dict[str, Any]:
    """Return the saved model's rain probability (class 1) and threshold decision."""
    require_model()

    # Accept the old frontend aliases as a migration convenience, but always
    # construct the dataframe using the actual names saved in preprocessor.feature_names_in_.
    incoming = dict(payload or {})
    if "air_pressure" not in incoming and "pressure" in incoming:
        incoming["air_pressure"] = incoming["pressure"]
    if "station_name" not in incoming and "station" in incoming:
        incoming["station_name"] = incoming["station"]

    if "temperature_range" in FEATURES and incoming.get("temperature_range") in (None, ""):
        try:
            incoming["temperature_range"] = float(incoming["max_temp"]) - float(incoming["min_temp"])
        except (KeyError, TypeError, ValueError):
            incoming["temperature_range"] = np.nan

    row: dict[str, Any] = {}
    for feature in FEATURES:
        value = incoming.get(feature, None)
        if value is None or (isinstance(value, str) and not value.strip()):
            row[feature] = np.nan
        elif feature in NUMERIC_FEATURES:
            try:
                number = float(value)
                if not math.isfinite(number):
                    raise ValueError
                row[feature] = number
            except (TypeError, ValueError):
                raise HTTPException(status_code=422, detail=f"'{feature}' must be a valid number.")
        else:
            row[feature] = str(value).strip()

    # Core weather values must be present for a meaningful prediction.
    for key in ("avg_temp", "min_temp", "max_temp", "wind_speed", "air_pressure"):
        if key in FEATURES and pd.isna(row.get(key, np.nan)):
            raise HTTPException(status_code=422, detail=f"Missing required input: {key}.")
    if all(k in row for k in ("min_temp", "avg_temp", "max_temp")):
        if row["min_temp"] > row["max_temp"]:
            raise HTTPException(status_code=422, detail="Minimum temperature cannot exceed maximum temperature.")
        if not row["min_temp"] <= row["avg_temp"] <= row["max_temp"]:
            raise HTTPException(status_code=422, detail="Average temperature must be between minimum and maximum temperature.")

    try:
        frame = pd.DataFrame([[row[name] for name in FEATURES]], columns=FEATURES)
        transformed = PREPROCESSOR.transform(frame)
        probabilities = MODEL.predict_proba(transformed)[0]
        classes = list(MODEL.classes_)
        rain_idx = classes.index(1)
        probability = float(probabilities[rain_idx])
        prediction = int(probability >= THRESHOLD)
        margin = ((probability - THRESHOLD) / max(1e-12, 1 - THRESHOLD)) if prediction else ((THRESHOLD - probability) / max(1e-12, THRESHOLD))
        confidence = "High" if margin >= 0.5 else "Medium" if margin >= 0.25 else "Low"
        word = "Rain" if prediction else "No Rain"
        explanation = (
            f"The saved Logistic Regression model predicts {word}. Estimated rain probability: "
            f"{probability:.1%}. Decision threshold: {THRESHOLD:.2f}. "
            "This is a machine-learning estimate, not a guaranteed weather forecast."
        )
        return {
            "prediction": prediction,
            "rain": bool(prediction),
            "probability": probability,
            "threshold": THRESHOLD,
            "confidence": confidence,
            "model_name": "Logistic Regression",
            "model_accuracy": OBSERVED_ACCURACY,
            "explanation": explanation,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {type(exc).__name__}: {exc}") from exc


# Static frontend is mounted last so /api/* remains handled by the API routes.
app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
