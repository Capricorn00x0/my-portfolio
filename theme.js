// Site theme switch — part of the terminal `color` command feature.
// Runs in <head> before the stylesheet so the saved theme is applied before the
// first paint (no flash of green when a visitor picked another colour).
// Palette lives in styles.css; this only sets data-theme on <html>.
// Allowlist only — no arbitrary values, nothing executable.
(function () {
  var THEMES = { green: 1, amber: 1, cyan: 1, red: 1, pink: 1, white: 1 };
  try {
    var saved = localStorage.getItem('termColor');
    if (saved && THEMES[saved]) document.documentElement.setAttribute('data-theme', saved);
  } catch (e) { /* private mode or storage disabled — keep the default green */ }
})();
