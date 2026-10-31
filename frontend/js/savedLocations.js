/* ============================================
   RainSense — Saved Locations Module
   Manage saved cities with localStorage
   ============================================ */

const SavedLocations = (() => {
  const STORAGE_KEY = 'rainsense_saved_locations';
  const MAX_LOCATIONS = 12;

  // Default locations
  const defaults = [
    { name: 'Mumbai', country: 'India', admin1: 'Maharashtra', lat: 19.0760, lon: 72.8777 },
    { name: 'London', country: 'United Kingdom', admin1: 'England', lat: 51.5074, lon: -0.1278 },
    { name: 'New York', country: 'United States', admin1: 'New York', lat: 40.7128, lon: -74.0060 }
  ];

  function getLocations() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved) && saved.length > 0) return saved;
    } catch (e) { /* ignore */ }
    return [...defaults];
  }

  function saveLocations(locations) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
  }

  function addLocation(location) {
    const locations = getLocations();

    // Check duplicate
    const exists = locations.some(l =>
      Math.abs(l.lat - location.lat) < 0.05 && Math.abs(l.lon - location.lon) < 0.05
    );
    if (exists) {
      Toast.show(`${location.name} is already saved.`, 'warning');
      return false;
    }

    if (locations.length >= MAX_LOCATIONS) {
      Toast.show(`Maximum ${MAX_LOCATIONS} locations allowed. Remove one first.`, 'warning');
      return false;
    }

    locations.push(location);
    saveLocations(locations);
    Toast.show(`${location.name} added to saved locations.`, 'success');
    return true;
  }

  function removeLocation(index) {
    const locations = getLocations();
    const removed = locations.splice(index, 1);
    saveLocations(locations);
    if (removed[0]) {
      Toast.show(`${removed[0].name} removed.`, 'info');
    }
  }

  /**
   * Render sidebar saved locations (on forecast page)
   */
  async function renderSidebar() {
    const container = document.getElementById('saved-locations-list');
    if (!container) return;

    const locations = getLocations();
    if (locations.length === 0) {
      container.innerHTML = `
        <div class="locations-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <p>No saved locations yet.<br/>Search and add cities.</p>
        </div>`;
      return;
    }

    // Show loading placeholders
    container.innerHTML = locations.map((loc, i) => `
      <div class="location-item" data-index="${i}" data-lat="${loc.lat}" data-lon="${loc.lon}">
        <div class="location-item-icon skeleton" style="width:40px;height:40px;border-radius:8px;"></div>
        <div class="location-item-info">
          <div class="location-item-name">${loc.name}</div>
          <div class="location-item-country">${loc.country || ''}</div>
          <div class="location-item-condition skeleton-text short" style="height:12px;width:60px;"></div>
        </div>
        <div class="location-item-temp skeleton-text" style="height:24px;width:40px;"></div>
        <button class="location-item-remove" aria-label="Remove ${loc.name}" data-remove="${i}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `).join('');

    // Attach click handlers
    attachSidebarHandlers(container);

    // Fetch weather for each location
    for (const loc of locations) {
      try {
        const data = await API.fetchCurrentWeather(loc.lat, loc.lon);
        if (data && data.current) {
          const item = container.querySelector(`[data-lat="${loc.lat}"][data-lon="${loc.lon}"]`);
          if (item) {
            const iconEl = item.querySelector('.location-item-icon');
            const tempEl = item.querySelector('.location-item-temp');
            const condEl = item.querySelector('.location-item-condition');

            iconEl.classList.remove('skeleton');
            iconEl.innerHTML = Weather.getWeatherIconSmall(data.current.weather_code, data.current.is_day);

            tempEl.classList.remove('skeleton-text');
            tempEl.textContent = Weather.formatTemp(data.current.temperature_2m);

            condEl.classList.remove('skeleton-text', 'short');
            condEl.style.width = '';
            condEl.style.height = '';
            condEl.textContent = Weather.getCondition(data.current.weather_code);
          }
        }
      } catch (e) {
        // Silent fail for individual locations
      }
    }
  }

  function attachSidebarHandlers(container) {
    // Click to load weather
    container.querySelectorAll('.location-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.location-item-remove')) return;
        const lat = parseFloat(item.dataset.lat);
        const lon = parseFloat(item.dataset.lon);
        const name = item.querySelector('.location-item-name').textContent;
        const country = item.querySelector('.location-item-country').textContent;
        App.loadWeather(lat, lon, name, country);
        Navigation.navigateTo('forecast');
      });
    });

    // Remove buttons
    container.querySelectorAll('.location-item-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.remove);
        removeLocation(idx);
        renderSidebar();
      });
    });
  }

  /**
   * Render full saved locations page
   */
  async function renderFullPage() {
    const grid = document.getElementById('saved-locations-grid');
    if (!grid) return;

    const locations = getLocations();

    if (locations.length === 0) {
      grid.innerHTML = `
        <div class="locations-empty" style="grid-column: 1/-1;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <p>No saved locations. Use the form above to add cities.</p>
        </div>`;
      return;
    }

    grid.innerHTML = locations.map((loc, i) => `
      <div class="saved-location-card" data-index="${i}" data-lat="${loc.lat}" data-lon="${loc.lon}">
        <button class="remove-btn" aria-label="Remove ${loc.name}" data-remove="${i}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="saved-card-icon skeleton" style="border-radius:8px;"></div>
        <div class="saved-card-temp skeleton-text" style="height:28px;width:50px;"></div>
        <div class="saved-card-name">${loc.name}</div>
        <div class="saved-card-country">${[loc.admin1, loc.country].filter(Boolean).join(', ')}</div>
        <div class="saved-card-condition skeleton-text short" style="height:14px;"></div>
      </div>
    `).join('');

    // Attach handlers
    grid.querySelectorAll('.saved-location-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.remove-btn')) return;
        const lat = parseFloat(card.dataset.lat);
        const lon = parseFloat(card.dataset.lon);
        const name = card.querySelector('.saved-card-name').textContent;
        App.loadWeather(lat, lon, name);
        Navigation.navigateTo('forecast');
      });
    });

    grid.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.remove);
        removeLocation(idx);
        renderFullPage();
        renderSidebar();
      });
    });

    // Fetch weather
    for (const loc of locations) {
      try {
        const data = await API.fetchCurrentWeather(loc.lat, loc.lon);
        if (data && data.current) {
          const card = grid.querySelector(`[data-lat="${loc.lat}"][data-lon="${loc.lon}"]`);
          if (card) {
            const iconEl = card.querySelector('.saved-card-icon');
            const tempEl = card.querySelector('.saved-card-temp');
            const condEl = card.querySelector('.saved-card-condition');

            iconEl.classList.remove('skeleton');
            iconEl.innerHTML = Weather.getWeatherIconSmall(data.current.weather_code, data.current.is_day);

            tempEl.classList.remove('skeleton-text');
            tempEl.style.width = '';
            tempEl.style.height = '';
            tempEl.textContent = Weather.formatTemp(data.current.temperature_2m);

            condEl.classList.remove('skeleton-text', 'short');
            condEl.style.height = '';
            condEl.textContent = Weather.getCondition(data.current.weather_code);
          }
        }
      } catch (e) { /* silent */ }
    }
  }

  /**
   * Init add city form on saved page
   */
  function initAddCityForm() {
    const input = document.getElementById('add-city-input');
    const btn = document.getElementById('add-city-btn');
    if (!input || !btn) return;

    btn.addEventListener('click', () => addCityFromInput(input));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addCityFromInput(input);
    });
  }

  async function addCityFromInput(input) {
    const query = input.value.trim();
    if (query.length < 2) {
      Toast.show('Please enter a city name.', 'warning');
      return;
    }

    try {
      const results = await API.searchLocations(query);
      if (results.length === 0) {
        Toast.show('City not found. Try another name.', 'error');
        return;
      }

      const loc = results[0];
      const added = addLocation({
        name: loc.name,
        country: loc.country || '',
        admin1: loc.admin1 || '',
        lat: loc.latitude,
        lon: loc.longitude
      });

      if (added) {
        input.value = '';
        renderFullPage();
        renderSidebar();
      }
    } catch (error) {
      Toast.show(error.message, 'error');
    }
  }

  /**
   * Show add location modal (from sidebar)
   */
  function showAddModal() {
    const modal = document.getElementById('add-location-modal');
    if (!modal) return;
    modal.classList.add('active');

    const input = modal.querySelector('.modal-search-input');
    const results = modal.querySelector('.modal-results');
    const cancelBtn = modal.querySelector('.modal-cancel-btn');

    input.value = '';
    results.innerHTML = '';
    input.focus();

    let debounce = null;
    const handleInput = () => {
      clearTimeout(debounce);
      const query = input.value.trim();
      if (query.length < 2) {
        results.innerHTML = '';
        return;
      }
      debounce = setTimeout(async () => {
        try {
          const res = await API.searchLocations(query);
          results.innerHTML = res.map((r, i) => {
            const region = [r.admin1, r.country].filter(Boolean).join(', ');
            return `<div class="modal-result-item" data-index="${i}">${r.name}, ${region}</div>`;
          }).join('');

          results.querySelectorAll('.modal-result-item').forEach(item => {
            item.addEventListener('click', () => {
              const idx = parseInt(item.dataset.index);
              const loc = res[idx];
              addLocation({
                name: loc.name,
                country: loc.country || '',
                admin1: loc.admin1 || '',
                lat: loc.latitude,
                lon: loc.longitude
              });
              closeModal();
              renderSidebar();
            });
          });
        } catch (e) {
          results.innerHTML = `<div class="modal-result-item" style="color:var(--text-muted);">Error searching. Try again.</div>`;
        }
      }, 300);
    };

    input.addEventListener('input', handleInput);

    const closeModal = () => {
      modal.classList.remove('active');
      input.removeEventListener('input', handleInput);
    };

    cancelBtn.addEventListener('click', closeModal, { once: true });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    }, { once: true });
  }

  return {
    getLocations,
    addLocation,
    removeLocation,
    renderSidebar,
    renderFullPage,
    initAddCityForm,
    showAddModal
  };
})();
