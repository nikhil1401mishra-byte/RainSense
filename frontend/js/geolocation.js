/* ============================================
   RainSense — Geolocation Module
   Browser geolocation with reverse geocoding
   ============================================ */

const Geolocation = (() => {

  function init() {
    const btn = document.getElementById('locate-btn');
    if (!btn) return;

    btn.addEventListener('click', requestLocation);
  }

  async function requestLocation() {
    if (!navigator.geolocation) {
      Toast.show('Geolocation is not supported by your browser.', 'error');
      return;
    }

    const btn = document.getElementById('locate-btn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<div class="loading-spinner" style="width:18px;height:18px;border-width:2px;"></div> Locating...`;
    btn.disabled = true;

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode to get city name
      const results = await API.searchLocations(`${latitude.toFixed(2)},${longitude.toFixed(2)}`);
      let name = 'Your Location';
      let country = '';
      let admin1 = '';

      // If no results from coordinate search, try a broader approach
      if (results.length > 0) {
        name = results[0].name;
        country = results[0].country || '';
        admin1 = results[0].admin1 || '';
      }

      // Load weather for the detected location
      App.loadWeather(latitude, longitude, name, country, admin1);
      Toast.show(`Location detected: ${name}`, 'success');

    } catch (error) {
      let message = 'Unable to get your location.';
      if (error.code === 1) message = 'Location access denied. Please enable location permissions.';
      else if (error.code === 2) message = 'Location unavailable. Please try again.';
      else if (error.code === 3) message = 'Location request timed out.';
      Toast.show(message, 'error');
    } finally {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
  }

  return { init, requestLocation };
})();
