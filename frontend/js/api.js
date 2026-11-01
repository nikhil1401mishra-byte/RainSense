/* ============================================
   RainSense — API Module
   Handles all API calls to Open-Meteo
   ============================================ */

const API = (() => {
  const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
  const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
  const CACHE_KEY = 'rainsense_cache';
  const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  /**
   * Get cached data if still fresh
   */
  function getCache(key) {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      const entry = cache[key];
      if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
        return entry.data;
      }
      // Clean expired
      if (entry) {
        delete cache[key];
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  /**
   * Set cache
   */
  function setCache(key, data) {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      // Limit cache entries
      const keys = Object.keys(cache);
      if (keys.length > 30) {
        // Remove oldest
        const sorted = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
        for (let i = 0; i < 10; i++) delete cache[sorted[i]];
      }
      cache[key] = { data, timestamp: Date.now() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) { /* ignore */ }
  }

  /**
   * Fetch with timeout
   */
  async function fetchWithTimeout(url, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your internet connection.');
      }
      throw error;
    }
  }

  /**
   * Search for locations
   */
  async function searchLocations(query) {
    if (!query || query.trim().length < 2) return [];

    const cacheKey = `geo_${query.toLowerCase().trim()}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    try {
      const url = `${GEO_URL}?name=${encodeURIComponent(query.trim())}&count=8&language=en&format=json`;
      const data = await fetchWithTimeout(url);
      const results = data.results || [];
      setCache(cacheKey, results);
      return results;
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error('Failed to search locations. Please try again.');
    }
  }

  /**
   * Fetch weather for coordinates
   */
  async function fetchWeather(lat, lon) {
    const cacheKey = `weather_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    try {
      const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: [
          'temperature_2m',
          'relative_humidity_2m',
          'apparent_temperature',
          'weather_code',
          'wind_speed_10m',
          'wind_direction_10m',
          'surface_pressure',
          'is_day'
        ].join(','),
        hourly: [
          'temperature_2m',
          'precipitation_probability',
          'precipitation',
          'weather_code'
        ].join(','),
        daily: [
          'temperature_2m_max',
          'temperature_2m_min',
          'precipitation_probability_max',
          'precipitation_sum',
          'sunrise',
          'sunset',
          'weather_code'
        ].join(','),
        timezone: 'auto',
        forecast_days: 7
      });

      const url = `${WEATHER_URL}?${params.toString()}`;
      const data = await fetchWithTimeout(url);
      setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Weather API error:', error);
      throw new Error('Failed to fetch weather data. Please try again.');
    }
  }

  /**
   * Fetch weather for a single location (used for saved locations)
   */
  async function fetchCurrentWeather(lat, lon) {
    const cacheKey = `current_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    try {
      const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,weather_code,is_day',
        timezone: 'auto'
      });

      const url = `${WEATHER_URL}?${params.toString()}`;
      const data = await fetchWithTimeout(url, 8000);
      setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Current weather error:', error);
      return null;
    }
  }

  /**
   * Clear entire cache
   */
  function clearCache() {
    localStorage.removeItem(CACHE_KEY);
  }

  return {
    searchLocations,
    fetchWeather,
    fetchCurrentWeather,
    clearCache
  };
})();
