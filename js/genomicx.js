/**
 * GenomicX Shared JavaScript
 * https://github.com/genomicx/front-end-template
 */

const GenomicX = (() => {

  /* =========================================================================
     NAV TOGGLE
     ========================================================================= */

  function initNav() {
    const toggle = document.querySelector('.gx-nav-toggle');
    const links = document.querySelector('.gx-nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        links.classList.toggle('open');
        const expanded = links.classList.contains('open');
        toggle.setAttribute('aria-expanded', expanded);
      });
    }
  }

  /* =========================================================================
     THEME
     ========================================================================= */

  const THEME_KEY = 'gx-theme';

  function getTheme() {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr) return attr;
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    document.querySelectorAll('.gx-theme-toggle-option').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
    });
    document.querySelectorAll('.gx-nav-logo svg').forEach(svg => {
      svg.setAttribute('stroke', theme === 'light' ? '#0D9488' : '#14B8A6');
    });
  }

  function toggleTheme() {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    setTheme(next);
    return next;
  }

  function initTheme() {
    const theme = getTheme();
    setTheme(theme);

    document.querySelectorAll('.gx-theme-toggle-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.getAttribute('data-theme');
        if (t === 'system') {
          localStorage.removeItem(THEME_KEY);
          document.documentElement.removeAttribute('data-theme');
          const sys = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
          document.querySelectorAll('.gx-theme-toggle-option').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-theme') === 'system');
          });
          document.querySelectorAll('.gx-nav-logo svg').forEach(svg => {
            svg.setAttribute('stroke', sys === 'light' ? '#0D9488' : '#14B8A6');
          });
        } else {
          setTheme(t);
        }
      });
    });

    document.querySelectorAll('.gx-theme-switch').forEach(btn => {
      btn.addEventListener('click', toggleTheme);
    });

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
        if (!localStorage.getItem(THEME_KEY)) {
          document.documentElement.removeAttribute('data-theme');
        }
      });
    }
  }

  /* =========================================================================
     INIT
     ========================================================================= */

  function init() {
    initNav();
    initTheme();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    initNav,
    initTheme,
    getTheme,
    setTheme,
    toggleTheme,
  };

})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GenomicX;
}
