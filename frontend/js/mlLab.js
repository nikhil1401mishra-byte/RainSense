/* ============================================
   RainSense — ML Prediction Lab Module
   Frontend interface for ML rain prediction
   ============================================ */

const MLLab = (() => {
  let initialized = false;
  let modelInfo = null;
  const API_BASE = ''; // Same-origin: FastAPI serves both the frontend and /api routes.

  const SEASONS = ['Winter', 'Spring', 'Summer', 'Monsoon', 'Autumn'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];

  const INDIA_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
  ];

  function init() {
    if (!initialized) {
      initialized = true;
      populateDropdowns();
      setupAutoFill();
      setupPrediction();
      setupValidation();
    }
    // Re-check when the user opens the ML page, so starting the API later is detected.
    checkModelConnection();
  }

  function populateDropdowns() {
    const monthSelect = document.getElementById('ml-month');
    const seasonSelect = document.getElementById('ml-season');
    const stateSelect = document.getElementById('ml-state');

    if (monthSelect) {
      monthSelect.innerHTML = MONTHS.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('');
      monthSelect.value = String(new Date().getMonth() + 1);
    }

    if (seasonSelect) {
      seasonSelect.innerHTML = '<option value="">Select Season</option>' +
        SEASONS.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    setFieldValue('ml-year', new Date().getFullYear());

    if (stateSelect) {
      stateSelect.innerHTML = '<option value="">Select State</option>' +
        INDIA_STATES.map(s => `<option value="${s}">${s}</option>`).join('');
    }
  }

  function setupAutoFill() {
    const btn = document.getElementById('ml-autofill-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      // Auto-fill from current weather data
      const state = App.getCurrentState();
      if (!state || !state.weatherData) {
        Toast.show('Load a location first to auto-fill weather data.', 'warning');
        return;
      }

      const wd = state.weatherData;
      const loc = state.location;

      setFieldValue('ml-avg-temp', wd.current.temp);
      setFieldValue('ml-min-temp', wd.daily[0]?.tempMin);
      setFieldValue('ml-max-temp', wd.daily[0]?.tempMax);
      setFieldValue('ml-wind-speed', wd.current.windSpeed);
      setFieldValue('ml-pressure', wd.current.pressure);
      setFieldValue('ml-latitude', loc?.lat);
      setFieldValue('ml-longitude', loc?.lon);
      setFieldValue('ml-year', new Date().getFullYear());
      setFieldValue('ml-district', loc?.name || '');

      // Set month
      const monthSelect = document.getElementById('ml-month');
      if (monthSelect) {
        const currentMonth = new Date().getMonth() + 1;
        monthSelect.value = currentMonth;
      }

      // Match season/state/district/station values to categories from the trained encoder.
      const month = new Date().getMonth() + 1;
      const seasonSelect = document.getElementById('ml-season');
      const expectedSeason = month >= 6 && month <= 9 ? 'Monsoon'
        : month >= 10 && month <= 11 ? 'Post-monsoon'
        : month >= 3 && month <= 5 ? 'Summer' : 'Winter';
      if (seasonSelect) {
        const seasonChoices = Array.from(seasonSelect.options).map(option => option.value);
        const match = seasonChoices.find(value => value.toLowerCase() === expectedSeason.toLowerCase());
        if (match) seasonSelect.value = match;
      }

      const stateSelect = document.getElementById('ml-state');
      if (stateSelect && modelInfo?.categories?.state) {
        const stateCodes = {
          'andaman and nicobar islands': 'AN', 'andhra pradesh': 'AP', 'arunachal pradesh': 'AR',
          'assam': 'AS', 'bihar': 'BR', 'chandigarh': 'CH', 'chhattisgarh': 'CT', 'delhi': 'DL',
          'goa': 'GA', 'gujarat': 'GJ', 'himachal pradesh': 'HP', 'haryana': 'HR',
          'jammu and kashmir': 'JK', 'karnataka': 'KA', 'kerala': 'KL', 'lakshadweep': 'LD',
          'maharashtra': 'MH', 'meghalaya': 'ML', 'manipur': 'MN', 'madhya pradesh': 'MP',
          'mizoram': 'MZ', 'nagaland': 'NL', 'odisha': 'OR', 'punjab': 'PB', 'puducherry': 'PY',
          'rajasthan': 'RJ', 'sikkim': 'SK', 'tamil nadu': 'TN', 'tripura': 'TR',
          'uttar pradesh': 'UP', 'west bengal': 'WB'
        };
        const stateCode = stateCodes[String(loc?.admin1 || '').toLowerCase()];
        if (stateCode && modelInfo.categories.state.includes(stateCode)) stateSelect.value = stateCode;
        else if (modelInfo.defaults?.state) stateSelect.value = modelInfo.defaults.state;
      }

      const choosePlaceCategory = (feature, locationName) => {
        const options = modelInfo?.categories?.[feature] || [];
        const wanted = String(locationName || '').trim().toLowerCase();
        return options.find(value => String(value).trim().toLowerCase() === wanted)
          || options.find(value => String(value).trim().toLowerCase().startsWith(`${wanted} `))
          || modelInfo?.defaults?.[feature] || options[0] || '';
      };
      setFieldValue('ml-district', choosePlaceCategory('district', loc?.name));
      setFieldValue('ml-station', choosePlaceCategory('station_name', loc?.name));

      Toast.show('Weather and model-compatible location fields auto-filled.', 'success');
    });
  }

  function setFieldValue(id, value) {
    const field = document.getElementById(id);
    if (field && value !== undefined && value !== null) {
      field.value = typeof value === 'number' ? value.toFixed(1) : value;
      // Remove invalid state
      const parent = field.closest('.ml-field');
      if (parent) parent.classList.remove('invalid');
    }
  }

  function setupValidation() {
    const numericFields = [
      'ml-avg-temp', 'ml-min-temp', 'ml-max-temp',
      'ml-wind-speed', 'ml-pressure', 'ml-elevation',
      'ml-latitude', 'ml-longitude'
    ];

    numericFields.forEach(id => {
      const field = document.getElementById(id);
      if (field) {
        field.addEventListener('input', () => {
          const parent = field.closest('.ml-field');
          if (parent) parent.classList.remove('invalid');
        });
      }
    });
  }

  function validateInputs() {
    const required = {
      'ml-avg-temp': 'Average Temperature',
      'ml-min-temp': 'Minimum Temperature',
      'ml-max-temp': 'Maximum Temperature',
      'ml-wind-speed': 'Wind Speed',
      'ml-pressure': 'Air Pressure',
      'ml-year': 'Year'
    };

    let valid = true;
    const values = {};

    for (const [id, label] of Object.entries(required)) {
      const field = document.getElementById(id);
      const parent = field?.closest('.ml-field');
      const val = field?.value?.trim();

      if (!val || isNaN(Number(val))) {
        if (parent) parent.classList.add('invalid');
        valid = false;
      } else {
        if (parent) parent.classList.remove('invalid');
        values[id] = Number(val);
      }
    }

    // Optional fields
    ['ml-elevation', 'ml-latitude', 'ml-longitude', 'ml-month', 'ml-season',
     'ml-state', 'ml-district', 'ml-station'].forEach(id => {
      const field = document.getElementById(id);
      if (field) {
        values[id] = field.value?.trim() || '';
      }
    });

    if (!valid) {
      Toast.show('Please fill in all required fields with valid numbers.', 'warning');
    }

    return valid ? values : null;
  }

  function setupPrediction() {
    const btn = document.getElementById('predict-btn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      const values = validateInputs();
      if (!values) return;

      btn.disabled = true;
      btn.innerHTML = `<div class="loading-spinner" style="width:20px;height:20px;border-width:2px;"></div> Predicting...`;

      try {
        // Attempt to call backend
        const result = await callPredictionAPI(values);
        showResult(result, values);
      } catch (error) {
        showBackendUnavailable(values, error);
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg> Predict Rain`;
      }
    });
  }

  async function callPredictionAPI(values) {
    const payload = {
      month: Number(values['ml-month'] || new Date().getMonth() + 1),
      year: Number(values['ml-year'] || new Date().getFullYear()),
      season: values['ml-season'] || null,
      state: values['ml-state'] || null,
      district: values['ml-district'] || null,
      station_name: values['ml-station'] || null,
      avg_temp: Number(values['ml-avg-temp']),
      min_temp: Number(values['ml-min-temp']),
      max_temp: Number(values['ml-max-temp']),
      wind_speed: Number(values['ml-wind-speed']),
      air_pressure: Number(values['ml-pressure']),
      elevation: values['ml-elevation'] === '' ? null : Number(values['ml-elevation']),
      latitude: values['ml-latitude'] === '' ? null : Number(values['ml-latitude']),
      longitude: values['ml-longitude'] === '' ? null : Number(values['ml-longitude'])
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    let response;
    try {
      response = await fetch(`${API_BASE}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.detail || data.error || `Prediction API returned HTTP ${response.status}`;
      throw new Error(message);
    }
    return data;
  }

  async function checkModelConnection() {
    const banner = document.getElementById('ml-status-banner');
    if (!banner) return;
    const message = banner.querySelector('span');
    try {
      const response = await fetch(`${API_BASE}/api/model-info`, { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.model_loaded) {
        throw new Error(data.detail || data.error || 'Saved model is unavailable.');
      }
      modelInfo = data;
      populateModelCategories(data);
      banner.classList.remove('checking', 'disconnected');
      banner.classList.add('connected');
      if (message) {
        const acc = Number.isFinite(data.observed_accuracy)
          ? ` · stored test accuracy ${(data.observed_accuracy * 100).toFixed(1)}%`
          : '';
        message.textContent = `Connected to your saved ${data.model_name} model · ${data.features.length} trained features · threshold ${Number(data.threshold).toFixed(2)}${acc}.`;
      }
    } catch (error) {
      banner.classList.remove('checking', 'connected');
      banner.classList.add('disconnected');
      if (message) message.textContent = `ML backend not connected: ${error.message}. Start the RainSense server using the README instructions.`;
    }
  }

  function populateModelCategories(info) {
    const categories = info.categories || {};
    const defaults = info.defaults || {};

    const fillSelect = (id, feature, fallback) => {
      const select = document.getElementById(id);
      if (!select) return;
      const choices = categories[feature] || [];
      if (!choices.length) return;
      const month = new Date().getMonth() + 1;
      const currentSeason = month >= 6 && month <= 9 ? 'Monsoon'
        : month >= 10 && month <= 11 ? 'Post-monsoon'
        : month >= 3 && month <= 5 ? 'Summer' : 'Winter';
      const seasonalDefault = feature === 'season'
        ? choices.find(value => value.toLowerCase() === currentSeason.toLowerCase())
        : null;
      const preferred = seasonalDefault || defaults[feature] || choices[0];
      select.innerHTML = choices.map(value =>
        `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`
      ).join('');
      select.value = choices.includes(preferred) ? preferred : choices[0];
    };

    const fillDatalist = (inputId, listId, feature) => {
      const list = document.getElementById(listId);
      const input = document.getElementById(inputId);
      if (!list || !input) return;
      const choices = categories[feature] || [];
      list.innerHTML = choices.map(value => `<option value="${escapeHtml(value)}"></option>`).join('');
      if (!input.value && defaults[feature]) input.value = defaults[feature];
    };

    fillSelect('ml-season', 'season');
    fillSelect('ml-state', 'state');
    fillDatalist('ml-district', 'ml-district-options', 'district');
    fillDatalist('ml-station', 'ml-station-options', 'station_name');
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function showResult(result, values) {
    const placeholder = document.getElementById('ml-result-placeholder');
    const content = document.getElementById('ml-result-content');
    if (!placeholder || !content) return;

    placeholder.style.display = 'none';
    content.classList.add('active');

    // Probability circle
    const probability = Math.round((result.probability || 0) * 100);
    const circumference = 2 * Math.PI * 56;
    const offset = circumference - (probability / 100) * circumference;

    document.getElementById('probability-value').textContent = `${probability}%`;
    const progressCircle = document.getElementById('probability-progress');
    if (progressCircle) {
      progressCircle.style.strokeDasharray = circumference;
      progressCircle.style.strokeDashoffset = circumference;
      setTimeout(() => {
        progressCircle.style.strokeDashoffset = offset;
      }, 100);
    }

    // Label
    const label = document.getElementById('ml-prediction-label');
    if (label) {
      const isRain = Number(result.prediction) === 1;
      label.textContent = isRain ? 'Rain Predicted' : 'No Rain Predicted';
      label.className = `ml-prediction-label ${isRain ? 'rain' : 'no-rain'}`;
      label.style.color = ''; 
    }

    // Input summary
    renderInputSummary(values);

    // Explanation
    const explEl = document.getElementById('ml-explanation-text');
    if (explEl) {
      const confidence = result.confidence ? ` Model confidence: ${result.confidence}.` : '';
      explEl.textContent = (result.explanation || `The saved model estimates a ${probability}% probability of rain.`) + confidence;
    }
  }

  function showBackendUnavailable(values, error) {
    const placeholder = document.getElementById('ml-result-placeholder');
    const content = document.getElementById('ml-result-content');
    if (!placeholder || !content) return;

    placeholder.style.display = 'none';
    content.classList.add('active');

    // Show 0% with note
    const circumference = 2 * Math.PI * 56;

    document.getElementById('probability-value').textContent = '—';
    const progressCircle = document.getElementById('probability-progress');
    if (progressCircle) {
      progressCircle.style.strokeDasharray = circumference;
      progressCircle.style.strokeDashoffset = circumference;
    }

    const label = document.getElementById('ml-prediction-label');
    if (label) {
      label.textContent = 'ML Backend Not Connected';
      label.className = 'ml-prediction-label';
      label.style.color = 'var(--accent-warning)';
    }

    renderInputSummary(values);

    const explEl = document.getElementById('ml-explanation-text');
    if (explEl) {
      explEl.textContent = `No prediction was produced. ${error?.message || 'The FastAPI model backend is unavailable.'} Start the RainSense server and confirm that the saved joblib model is loaded.`;
    }

    Toast.show('ML backend not connected. Start the FastAPI server for predictions.', 'warning');
  }

  function renderInputSummary(values) {
    const grid = document.getElementById('ml-summary-grid');
    if (!grid) return;

    const labels = {
      'ml-avg-temp': 'Avg Temp (°C)',
      'ml-min-temp': 'Min Temp (°C)',
      'ml-max-temp': 'Max Temp (°C)',
      'ml-wind-speed': 'Wind (km/h)',
      'ml-pressure': 'Pressure (hPa)',
      'ml-elevation': 'Elevation (m)',
      'ml-latitude': 'Latitude',
      'ml-longitude': 'Longitude',
      'ml-month': 'Month',
      'ml-year': 'Year',
      'ml-season': 'Season',
      'ml-state': 'State',
      'ml-district': 'District',
      'ml-station': 'Weather station'
    };

    grid.innerHTML = Object.entries(labels)
      .filter(([key]) => values[key])
      .map(([key, label]) => {
        let val = values[key];
        if (key === 'ml-month') {
          val = MONTHS[parseInt(val) - 1] || val;
        }
        return `
          <div class="ml-summary-item">
            <span class="label">${label}</span>
            <span class="value">${val}</span>
          </div>`;
      }).join('');
  }

  return { init };
})();
