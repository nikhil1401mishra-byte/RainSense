# Vercel dependency fix

This project declares its dependencies in both `pyproject.toml` and `requirements.txt` and pins Python 3.12 via `.python-version`.

`joblib` is required to load `best_rain_logistic_regression.joblib`. `scikit-learn` is pinned to 1.6.1 to match the training environment of the saved model.

## Apply
1. Put all three files (`pyproject.toml`, `.python-version`, `requirements.txt`) in the GitHub repository root beside `backend/`, `frontend/`, and `best_rain_logistic_regression.joblib`.
2. Commit and push to the branch connected to Vercel.
3. In Vercel, trigger a new deployment and choose **Redeploy without Build Cache** if that option is available.
4. Check the new build logs for dependency installation; then test `/api/health`.
