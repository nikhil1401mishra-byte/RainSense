/* ============================================
   RainSense — Navigation Module
   Page navigation and theme switching
   ============================================ */

const Navigation = (() => {
  const THEME_KEY = 'rainsense_theme';
  let currentPage = 'forecast';

  function init() {
    setupDesktopNav();
    setupBottomNav();
    setupThemeToggle();
    setupMobileMenu();

    // Load saved theme
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    applyTheme(savedTheme);

    // Set initial page
    navigateTo('forecast');
  }

  function setupDesktopNav() {
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(link.dataset.page);
      });
    });
  }

  function setupBottomNav() {
    document.querySelectorAll('.bottom-nav-link[data-page]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(link.dataset.page);
      });
    });
  }

  function setupMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        // On mobile, clicking hamburger just scrolls to top or opens nav
        // For simplicity, we use bottom nav on mobile
        const sections = document.querySelectorAll('.page-section');
        sections.forEach(s => {
          if (s.classList.contains('active')) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
      });
    }
  }

  function navigateTo(page) {
    currentPage = page;

    // Update page sections
    document.querySelectorAll('.page-section').forEach(section => {
      section.classList.remove('active');
    });
    const targetSection = document.getElementById(`page-${page}`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    // Update desktop nav
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
      link.classList.toggle('active', link.dataset.page === page);
    });

    // Update bottom nav
    document.querySelectorAll('.bottom-nav-link[data-page]').forEach(link => {
      link.classList.toggle('active', link.dataset.page === page);
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Trigger page-specific init
    if (page === 'saved') {
      SavedLocations.renderFullPage();
    } else if (page === 'ml-lab') {
      MLLab.init();
    }
  }

  function setupThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = current === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
      localStorage.setItem(THEME_KEY, newTheme);
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);

    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.innerHTML = theme === 'dark'
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
      toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    }
  }

  function getCurrentPage() {
    return currentPage;
  }

  return { init, navigateTo, getCurrentPage };
})();
