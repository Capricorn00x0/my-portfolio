// Site theme switch — part of the terminal `color` command feature.
// Runs in <head> before the stylesheet so the saved theme is applied before the
// first paint (no flash of green when a visitor picked another colour).
// The colour is temporary: it expires TTL_MS after the visitor's LAST visit,
// then the site drops back to the default green. An active visitor keeps it,
// because every page they open pushes the expiry forward (sliding window).
// Palette lives in styles.css; this only sets data-theme on <html>.
// Allowlist only — no arbitrary values, nothing executable.
(function () {
  var THEMES = { green: 1, amber: 1, yellow: 1, mint: 1, cyan: 1, red: 1, pink: 1, white: 1 };
  var TTL_MS = 10 * 60 * 1000; // how long a chosen colour survives after the last visit
  try {
    var name = localStorage.getItem('termColor');
    var until = parseInt(localStorage.getItem('termColorUntil') || '0', 10);
    if (name && name !== 'green' && THEMES[name] && Date.now() < until) {
      document.documentElement.setAttribute('data-theme', name);
      // Sliding window: each visit extends the colour's life.
      localStorage.setItem('termColorUntil', String(Date.now() + TTL_MS));
    } else if (name) {
      // Expired, legacy (no expiry stamp), or unknown name — clean up and go green.
      localStorage.removeItem('termColor');
      localStorage.removeItem('termColorUntil');
    }
  } catch (e) { /* private mode or storage disabled — keep the default green */ }
})();
