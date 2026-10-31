/* ============================================
   RainSense — Search Module
   Location search with autocomplete
   ============================================ */

const Search = (() => {
  let debounceTimer = null;
  let currentSuggestions = [];
  let highlightedIndex = -1;

  function init() {
    const input = document.getElementById('search-input');
    const btn = document.getElementById('search-btn');
    const suggestions = document.getElementById('search-suggestions');

    if (!input || !btn) return;

    // Search on button click
    btn.addEventListener('click', () => {
      performSearch(input.value);
    });

    // Search on Enter
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0 && currentSuggestions[highlightedIndex]) {
          selectSuggestion(currentSuggestions[highlightedIndex]);
        } else {
          performSearch(input.value);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        highlightedIndex = Math.min(highlightedIndex + 1, currentSuggestions.length - 1);
        updateHighlight();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        highlightedIndex = Math.max(highlightedIndex - 1, -1);
        updateHighlight();
      } else if (e.key === 'Escape') {
        hideSuggestions();
      }
    });

    // Autocomplete on typing
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const query = input.value.trim();
      if (query.length < 2) {
        hideSuggestions();
        return;
      }
      debounceTimer = setTimeout(() => fetchSuggestions(query), 300);
    });

    // Hide suggestions on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-input-wrapper')) {
        hideSuggestions();
      }
    });

    // Focus shows suggestions
    input.addEventListener('focus', () => {
      if (currentSuggestions.length > 0) {
        showSuggestions();
      }
    });
  }

  async function fetchSuggestions(query) {
    try {
      const results = await API.searchLocations(query);
      currentSuggestions = results;
      highlightedIndex = -1;
      if (results.length > 0) {
        renderSuggestions(results);
        showSuggestions();
      } else {
        hideSuggestions();
      }
    } catch (error) {
      console.error('Suggestion fetch error:', error);
      hideSuggestions();
    }
  }

  function renderSuggestions(results) {
    const container = document.getElementById('search-suggestions');
    if (!container) return;

    container.innerHTML = results.map((r, i) => {
      const region = [r.admin1, r.country].filter(Boolean).join(', ');
      return `
        <div class="suggestion-item" data-index="${i}" role="option">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <div class="suggestion-text">
            <span class="city">${r.name}</span>
            <span class="region">${region}</span>
          </div>
        </div>
      `;
    }).join('');

    // Click handlers
    container.querySelectorAll('.suggestion-item').forEach((item) => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.index);
        selectSuggestion(results[idx]);
      });
    });
  }

  function selectSuggestion(location) {
    if (!location) return;
    const input = document.getElementById('search-input');
    const region = [location.admin1, location.country].filter(Boolean).join(', ');
    input.value = `${location.name}, ${region}`;
    hideSuggestions();
    App.loadWeather(location.latitude, location.longitude, location.name, location.country, location.admin1);
  }

  async function performSearch(query) {
    if (!query || query.trim().length < 2) {
      Toast.show('Please enter a location name', 'warning');
      return;
    }

    try {
      App.showLoading();
      const results = await API.searchLocations(query);
      if (results.length > 0) {
        const loc = results[0];
        selectSuggestion(loc);
      } else {
        Toast.show('Location not found. Try another search.', 'error');
        App.hideLoading();
      }
    } catch (error) {
      Toast.show(error.message, 'error');
      App.hideLoading();
    }
  }

  function showSuggestions() {
    const container = document.getElementById('search-suggestions');
    if (container) container.classList.add('active');
  }

  function hideSuggestions() {
    const container = document.getElementById('search-suggestions');
    if (container) container.classList.remove('active');
    highlightedIndex = -1;
  }

  function updateHighlight() {
    const container = document.getElementById('search-suggestions');
    if (!container) return;
    const items = container.querySelectorAll('.suggestion-item');
    items.forEach((item, i) => {
      item.classList.toggle('highlighted', i === highlightedIndex);
    });
  }

  return { init, performSearch };
})();
