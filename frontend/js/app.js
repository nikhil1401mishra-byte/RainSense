/* ============================================
   RainSense — Main Application Module
   Initialization, state management, UI updates
   ============================================ */

/* ---------- Toast Notification Utility ---------- */
const Toast = (() => {
  function show(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const iconSVGs = {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${iconSVGs[type] || iconSVGs.info}</div>
      <div class="toast-message">${message}</div>
      <button class="toast-close" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    container.appendChild(toast);

    const close = () => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 250);
    };

    toast.querySelector('.toast-close').addEventListener('click', close);
    setTimeout(close, duration);
  }

  return { show };
})();

/* ---------- Main App ---------- */
const App = (() => {
  let currentLocation = null;
  let currentWeatherData = null;
  let weatherMap = null;
  let mapMarker = null;
  let isLoading = false;

  const DEFAULT_LOCATION = {
    lat: 26.9124,
    lon: 75.7873,
    name: 'Jaipur',
    country: 'India',
    admin1: 'Rajasthan'
  };

  /**
   * Initialize the entire application
   */
  function init() {
    // Init modules
    Navigation.init();
    Search.init();
    Geolocation.init();
    Charts.init();
    SavedLocations.initAddCityForm();

    // Setup add location button in sidebar
    const addBtn = document.getElementById('sidebar-add-location');
    if (addBtn) {
      addBtn.addEventListener('click', () => SavedLocations.showAddModal());
    }

    // Load default location
    loadWeather(
      DEFAULT_LOCATION.lat,
      DEFAULT_LOCATION.lon,
      DEFAULT_LOCATION.name,
      DEFAULT_LOCATION.country,
      DEFAULT_LOCATION.admin1
    );

    // Init map
    initMap();
  }

  /**
   * Load weather for a location
   */
  async function loadWeather(lat, lon, name, country = '', admin1 = '') {
    if (isLoading) return;
    isLoading = true;

    currentLocation = { lat, lon, name, country, admin1 };

    showLoading();
    updateSearchInput(name, admin1, country);
    updateHeaderLocation(name);

    try {
      const rawData = await API.fetchWeather(lat, lon);
      currentWeatherData = Weather.parseWeatherData(rawData);
      updateUI(currentWeatherData);
      updateMap(lat, lon, name);
      SavedLocations.renderSidebar();
      Toast.show(`Weather loaded for ${name}`, 'success');
    } catch (error) {
      showError(error.message);
      Toast.show(error.message, 'error');
    } finally {
      isLoading = false;
      hideLoading();
    }
  }

  /**
   * Update all UI components
   */
  function updateUI(data) {
    updateCurrentWeather(data.current);
    updateForecast(data.daily);
    Charts.renderChart(data);
    updateDateTime(data.timezone);
  }

  /**
   * Update current weather section
   */
  function updateCurrentWeather(current) {
    const loc = currentLocation;

    // Location
    const locEl = document.getElementById('weather-location');
    if (locEl) locEl.textContent = [loc.name, loc.admin1, loc.country].filter(Boolean).join(', ');

    // Icon
    const iconEl = document.getElementById('current-weather-icon');
    if (iconEl) iconEl.innerHTML = Weather.getWeatherIcon(current.weatherCode, current.isDay);

    // Temperature
    const tempEl = document.getElementById('current-temp');
    if (tempEl) tempEl.innerHTML = `${Math.round(current.temp)}<span class="temp-unit">°C</span>`;

    // Condition
    const condEl = document.getElementById('current-condition');
    if (condEl) condEl.textContent = current.condition;

    // Feels like
    const feelsEl = document.getElementById('current-feels');
    if (feelsEl) feelsEl.textContent = `Feels like ${Weather.formatTemp(current.feelsLike)}`;

    // Metrics
    setMetric('metric-humidity', `${current.humidity}%`);
    setMetric('metric-wind', `${current.windSpeed} km/h ${current.windDirection}`);
    setMetric('metric-pressure', `${Math.round(current.pressure)} hPa`);
    setMetric('metric-visibility', current.visibility ? `${(current.visibility / 1000).toFixed(1)} km` : '10+ km');
    setMetric('metric-sunrise', Weather.formatTime(current.sunrise));
    setMetric('metric-sunset', Weather.formatTime(current.sunset));
  }

  function setMetric(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  /**
   * Update 7-day forecast
   */
  function updateForecast(daily) {
    const strip = document.getElementById('forecast-strip');
    if (!strip) return;

    strip.innerHTML = daily.map((day, i) => `
      <div class="forecast-card ${i === 0 ? 'active' : ''}" data-index="${i}">
        <div class="forecast-day">${day.dayName}</div>
        <div class="forecast-date">${day.dateFormatted}</div>
        <div class="forecast-icon">${Weather.getWeatherIconSmall(day.weatherCode, true)}</div>
        <div class="forecast-temps">
          <span class="forecast-high">${Weather.formatTemp(day.tempMax)}</span>
          <span class="forecast-low">${Weather.formatTemp(day.tempMin)}</span>
        </div>
        <div class="forecast-rain">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>
          ${day.rainProbability}%
        </div>
      </div>
    `).join('');

    // Click handlers
    strip.querySelectorAll('.forecast-card').forEach(card => {
      card.addEventListener('click', () => {
        strip.querySelectorAll('.forecast-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
      });
    });
  }

  /**
   * Update date/time display
   */
  function updateDateTime(timezone) {
    const el = document.getElementById('weather-datetime');
    if (!el) return;

    try {
      const now = new Date();
      const formatted = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: timezone
      });
      const time = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone
      });
      el.textContent = `${formatted} · ${time}`;
    } catch {
      const now = new Date();
      el.textContent = now.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    }
  }

  /**
   * Initialize Leaflet map
   */
  function initMap() {
    const mapEl = document.getElementById('weather-map');
    if (!mapEl || typeof L === 'undefined') return;

    weatherMap = L.map('weather-map', {
      center: [DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon],
      zoom: 8,
      zoomControl: true,
      attributionControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(weatherMap);

    mapMarker = L.marker([DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon]).addTo(weatherMap);
    mapMarker.bindPopup(`<strong>${DEFAULT_LOCATION.name}</strong>`).openPopup();

    // Fix map rendering in hidden tabs
    setTimeout(() => {
      if (weatherMap) weatherMap.invalidateSize();
    }, 500);
  }

  /**
   * Update map position
   */
  function updateMap(lat, lon, name) {
    if (!weatherMap) {
      initMap();
      return;
    }

    try {
      weatherMap.setView([lat, lon], 8, { animate: true });
      if (mapMarker) {
        mapMarker.setLatLng([lat, lon]);
        mapMarker.setPopupContent(`<strong>${name}</strong>`).openPopup();
      }
      weatherMap.invalidateSize();
    } catch (e) {
      console.error('Map update error:', e);
    }
  }

  /**
   * Update search input text
   */
  function updateSearchInput(name, admin1, country) {
    const input = document.getElementById('search-input');
    if (input) {
      input.value = [name, admin1, country].filter(Boolean).join(', ');
    }
  }

  /**
   * Update header location badge
   */
  function updateHeaderLocation(name) {
    const el = document.getElementById('header-location-name');
    if (el) el.textContent = name;
  }

  /**
   * Show loading state
   */
  function showLoading() {
    const overlay = document.getElementById('weather-loading');
    if (overlay) overlay.style.display = 'flex';
  }

  /**
   * Hide loading state
   */
  function hideLoading() {
    const overlay = document.getElementById('weather-loading');
    if (overlay) overlay.style.display = 'none';
  }

  /**
   * Show error state
   */
  function showError(message) {
    const container = document.getElementById('weather-error');
    if (container) {
      container.style.display = 'block';
      const msgEl = container.querySelector('p');
      if (msgEl) msgEl.textContent = message;
    }
  }

  /**
   * Get current state (for ML Lab auto-fill)
   */
  function getCurrentState() {
    return {
      location: currentLocation,
      weatherData: currentWeatherData
    };
  }

  return {
    init,
    loadWeather,
    showLoading,
    hideLoading,
    getCurrentState
  };
})();

/* ---------- Bootstrap ---------- */
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
