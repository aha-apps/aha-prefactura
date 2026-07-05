// theme.js — Inyección de tema DaisyUI dinámico
(function() {
  var colores = APP_CONFIG.tema.colores;
  var root = document.documentElement;
  root.style.setProperty('--p', colores.primary);
  root.style.setProperty('--s', colores.secondary);
  root.style.setProperty('--a', colores.accent);
  root.style.setProperty('--n', colores.neutral);
  root.style.setProperty('--b1', colores['base-100']);
  root.style.setProperty('--b2', colores['base-200']);
  root.style.setProperty('--b3', colores['base-300']);
  root.style.setProperty('--in', colores.info);
  root.style.setProperty('--su', colores.success);
  root.style.setProperty('--wa', colores.warning);
  root.style.setProperty('--er', colores.error);
  root.style.fontFamily = APP_CONFIG.tema.tipografia || 'Inter, system-ui, sans-serif';
  // Tema claro forzado (Lite)
  root.setAttribute('data-theme', 'light');
})();
