/* ============================================
   RainSense — Weather Module
   WMO codes, icons, and data formatting
   ============================================ */

const Weather = (() => {
  /**
   * WMO Weather Code mapping
   */
  const WMO_CODES = {
    0: { condition: 'Clear Sky', icon: 'clear' },
    1: { condition: 'Mainly Clear', icon: 'clear' },
    2: { condition: 'Partly Cloudy', icon: 'partly-cloudy' },
    3: { condition: 'Overcast', icon: 'cloudy' },
    45: { condition: 'Foggy', icon: 'fog' },
    48: { condition: 'Rime Fog', icon: 'fog' },
    51: { condition: 'Light Drizzle', icon: 'drizzle' },
    53: { condition: 'Moderate Drizzle', icon: 'drizzle' },
    55: { condition: 'Dense Drizzle', icon: 'drizzle' },
    56: { condition: 'Freezing Drizzle', icon: 'drizzle' },
    57: { condition: 'Heavy Freezing Drizzle', icon: 'drizzle' },
    61: { condition: 'Slight Rain', icon: 'rain' },
    63: { condition: 'Moderate Rain', icon: 'rain' },
    65: { condition: 'Heavy Rain', icon: 'heavy-rain' },
    66: { condition: 'Freezing Rain', icon: 'rain' },
    67: { condition: 'Heavy Freezing Rain', icon: 'heavy-rain' },
    71: { condition: 'Slight Snow', icon: 'snow' },
    73: { condition: 'Moderate Snow', icon: 'snow' },
    75: { condition: 'Heavy Snow', icon: 'snow' },
    77: { condition: 'Snow Grains', icon: 'snow' },
    80: { condition: 'Slight Showers', icon: 'rain' },
    81: { condition: 'Moderate Showers', icon: 'rain' },
    82: { condition: 'Heavy Showers', icon: 'heavy-rain' },
    85: { condition: 'Slight Snow Showers', icon: 'snow' },
    86: { condition: 'Heavy Snow Showers', icon: 'snow' },
    95: { condition: 'Thunderstorm', icon: 'thunderstorm' },
    96: { condition: 'Thunderstorm with Hail', icon: 'thunderstorm' },
    99: { condition: 'Thunderstorm with Heavy Hail', icon: 'thunderstorm' }
  };

  /**
   * SVG Weather Icons
   */
  function getWeatherIcon(code, isDay = true) {
    const info = WMO_CODES[code] || WMO_CODES[0];
    const iconType = info.icon;

    const icons = {
      'clear': isDay ? `
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="14" fill="#fbbf24" opacity="0.9"/>
          <circle cx="32" cy="32" r="11" fill="#fcd34d"/>
          <g stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" opacity="0.7">
            <line x1="32" y1="4" x2="32" y2="12"/>
            <line x1="32" y1="52" x2="32" y2="60"/>
            <line x1="4" y1="32" x2="12" y2="32"/>
            <line x1="52" y1="32" x2="60" y2="32"/>
            <line x1="12.2" y1="12.2" x2="17.9" y2="17.9"/>
            <line x1="46.1" y1="46.1" x2="51.8" y2="51.8"/>
            <line x1="12.2" y1="51.8" x2="17.9" y2="46.1"/>
            <line x1="46.1" y1="17.9" x2="51.8" y2="12.2"/>
          </g>
        </svg>` : `
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M38 14C28 14 20 22 20 32s8 18 18 18c4 0 7.5-1.3 10.5-3.5C46 48 43 49 40 49c-9.4 0-17-7.6-17-17s7.6-17 17-17c3 0 6 1 8.5 2.5C45.5 15.3 42 14 38 14z" fill="#94a3b8" opacity="0.9"/>
          <circle cx="46" cy="12" r="1.5" fill="#94a3b8" opacity="0.5"/>
          <circle cx="52" cy="20" r="1" fill="#94a3b8" opacity="0.4"/>
          <circle cx="16" cy="16" r="1" fill="#94a3b8" opacity="0.3"/>
        </svg>`,

      'partly-cloudy': isDay ? `
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="26" cy="22" r="10" fill="#fbbf24" opacity="0.8"/>
          <g stroke="#fbbf24" stroke-width="2" stroke-linecap="round" opacity="0.5">
            <line x1="26" y1="6" x2="26" y2="10"/>
            <line x1="26" y1="34" x2="26" y2="38"/>
            <line x1="10" y1="22" x2="14" y2="22"/>
            <line x1="38" y1="22" x2="42" y2="22"/>
          </g>
          <path d="M22 44h28a10 10 0 10-5-19 14 14 0 00-27 9 8 8 0 004 10z" fill="#cbd5e1" opacity="0.9"/>
          <path d="M22 44h28a10 10 0 10-5-19 14 14 0 00-27 9 8 8 0 004 10z" fill="none" stroke="white" stroke-width="0.5" opacity="0.3"/>
        </svg>` : `
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M30 12c-5 0-9.5 3-11.5 7.5C20 17 22 16 24 16c6.6 0 12 5.4 12 12 0 2-0.5 4-1.5 5.5A12 12 0 0030 12z" fill="#94a3b8" opacity="0.6"/>
          <path d="M22 44h28a10 10 0 10-5-19 14 14 0 00-27 9 8 8 0 004 10z" fill="#cbd5e1" opacity="0.85"/>
        </svg>`,

      'cloudy': `
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 46h34a12 12 0 10-6-22.5 16 16 0 00-31 10A10 10 0 0016 46z" fill="#94a3b8" opacity="0.85"/>
          <path d="M16 46h34a12 12 0 10-6-22.5 16 16 0 00-31 10A10 10 0 0016 46z" fill="none" stroke="white" stroke-width="0.5" opacity="0.2"/>
          <path d="M26 40h20a8 8 0 10-4-15 12 12 0 00-22 7 6 6 0 006 8z" fill="#cbd5e1" opacity="0.5" transform="translate(-4,-6)"/>
        </svg>`,

      'fog': `
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 32h34a12 12 0 10-6-22.5 16 16 0 00-31 10A10 10 0 0016 32z" fill="#94a3b8" opacity="0.6"/>
          <line x1="12" y1="40" x2="52" y2="40" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>
          <line x1="16" y1="46" x2="48" y2="46" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" opacity="0.4"/>
          <line x1="20" y1="52" x2="44" y2="52" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" opacity="0.3"/>
        </svg>`,

      'drizzle': `
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 36h34a12 12 0 10-6-22.5 16 16 0 00-31 10A10 10 0 0016 36z" fill="#94a3b8" opacity="0.8"/>
          <line x1="22" y1="42" x2="20" y2="48" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
          <line x1="34" y1="42" x2="32" y2="48" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
          <line x1="46" y1="42" x2="44" y2="48" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
        </svg>`,

      'rain': `
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 34h34a12 12 0 10-6-22.5 16 16 0 00-31 10A10 10 0 0016 34z" fill="#64748b" opacity="0.9"/>
          <line x1="20" y1="40" x2="16" y2="50" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/>
          <line x1="30" y1="40" x2="26" y2="50" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/>
          <line x1="40" y1="40" x2="36" y2="50" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/>
          <line x1="25" y1="50" x2="22" y2="58" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
          <line x1="35" y1="50" x2="32" y2="58" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
        </svg>`,

      'heavy-rain': `
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 32h34a12 12 0 10-6-22.5 16 16 0 00-31 10A10 10 0 0016 32z" fill="#475569" opacity="0.95"/>
          <line x1="18" y1="38" x2="12" y2="52" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="28" y1="38" x2="22" y2="52" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="38" y1="38" x2="32" y2="52" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="48" y1="38" x2="42" y2="52" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="23" y1="52" x2="19" y2="60" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
          <line x1="33" y1="52" x2="29" y2="60" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
          <line x1="43" y1="52" x2="39" y2="60" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
        </svg>`,

      'snow': `
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 34h34a12 12 0 10-6-22.5 16 16 0 00-31 10A10 10 0 0016 34z" fill="#94a3b8" opacity="0.8"/>
          <circle cx="22" cy="44" r="2.5" fill="#e2e8f0" opacity="0.9"/>
          <circle cx="34" cy="42" r="2.5" fill="#e2e8f0" opacity="0.9"/>
          <circle cx="46" cy="44" r="2.5" fill="#e2e8f0" opacity="0.9"/>
          <circle cx="28" cy="52" r="2" fill="#e2e8f0" opacity="0.7"/>
          <circle cx="40" cy="54" r="2" fill="#e2e8f0" opacity="0.7"/>
        </svg>`,

      'thunderstorm': `
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 30h34a12 12 0 10-6-22.5 16 16 0 00-31 10A10 10 0 0016 30z" fill="#475569" opacity="0.95"/>
          <polygon points="34,32 28,46 33,46 29,58 42,42 36,42 40,32" fill="#fbbf24" opacity="0.95"/>
          <line x1="18" y1="36" x2="14" y2="46" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
          <line x1="50" y1="36" x2="46" y2="46" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
        </svg>`
    };

    return icons[iconType] || icons['clear'];
  }

  /**
   * Small weather icon for forecast cards
   */
  function getWeatherIconSmall(code, isDay = true) {
    return getWeatherIcon(code, isDay);
  }

  /**
   * Get weather condition text from WMO code
   */
  function getCondition(code) {
    return (WMO_CODES[code] || WMO_CODES[0]).condition;
  }

  /**
   * Format temperature
   */
  function formatTemp(temp) {
    return `${Math.round(temp)}°`;
  }

  /**
   * Format time from ISO string
   */
  function formatTime(isoString) {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '--:--';
    }
  }

  /**
   * Format date
   */
  function formatDate(dateString) {
    try {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }

  /**
   * Get day name
   */
  function getDayName(dateString, short = false) {
    try {
      const date = new Date(dateString + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(date);
      target.setHours(0, 0, 0, 0);

      const diff = (target - today) / (1000 * 60 * 60 * 24);
      if (diff === 0) return 'Today';
      if (diff === 1) return 'Tomorrow';

      return date.toLocaleDateString('en-US', { weekday: short ? 'short' : 'long' });
    } catch {
      return '';
    }
  }

  /**
   * Get wind direction string
   */
  function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                         'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  /**
   * Parse complete weather data
   */
  function parseWeatherData(data) {
    const current = {
      temp: data.current.temperature_2m,
      feelsLike: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      windDirection: getWindDirection(data.current.wind_direction_10m),
      pressure: data.current.surface_pressure,
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day,
      condition: getCondition(data.current.weather_code)
    };

    // Compute visibility from hourly if available; Open-Meteo doesn't include in current by default
    // We'll display pressure instead
    current.visibility = null;

    const daily = data.daily.time.map((date, i) => ({
      date,
      dayName: getDayName(date, true),
      dateFormatted: formatDate(date),
      tempMax: data.daily.temperature_2m_max[i],
      tempMin: data.daily.temperature_2m_min[i],
      rainProbability: data.daily.precipitation_probability_max[i],
      precipSum: data.daily.precipitation_sum[i],
      sunrise: data.daily.sunrise[i],
      sunset: data.daily.sunset[i],
      weatherCode: data.daily.weather_code[i],
      condition: getCondition(data.daily.weather_code[i])
    }));

    // Current sunrise/sunset from first day
    current.sunrise = data.daily.sunrise[0];
    current.sunset = data.daily.sunset[0];

    const hourly = data.hourly.time.map((time, i) => ({
      time,
      temp: data.hourly.temperature_2m[i],
      rainProbability: data.hourly.precipitation_probability[i],
      precipitation: data.hourly.precipitation[i],
      weatherCode: data.hourly.weather_code[i]
    }));

    return { current, daily, hourly, timezone: data.timezone };
  }

  return {
    getWeatherIcon,
    getWeatherIconSmall,
    getCondition,
    formatTemp,
    formatTime,
    formatDate,
    getDayName,
    getWindDirection,
    parseWeatherData,
    WMO_CODES
  };
})();
